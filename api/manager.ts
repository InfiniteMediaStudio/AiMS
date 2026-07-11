import { createClient } from "@supabase/supabase-js";

const ROUTES = [
  { agent: "Google", keywords: ["seo", "google", "ads", "keyword", "search console", "ga4"] },
  { agent: "Social", keywords: ["post", "content", "social", "caption", "instagram", "facebook", "linkedin"] },
  { agent: "Sales", keywords: ["lead", "proposal", "outreach", "sales", "crm", "pipeline"] },
  { agent: "Develop", keywords: ["code", "website", "app", "deploy", "bug", "github"] },
  { agent: "Design", keywords: ["design", "brand", "logo", "figma", "ui", "creative"] },
  { agent: "Video", keywords: ["video", "reel", "script", "storyboard", "edit"] },
  { agent: "Support", keywords: ["client", "support", "follow-up", "meeting", "summary", "email", "data"] },
  { agent: "QA", keywords: ["review", "check", "audit", "quality", "approve"] },
  { agent: "Accounts", keywords: ["invoice", "payment", "retainer", "subscription", "finance"] },
];

const APPROVAL_RULES = [
  { match: ["send", "email", "client"], reason: "Client-facing messages require human approval." },
  { match: ["publish", "post"], reason: "Publishing content requires human approval." },
  { match: ["budget", "ads", "spend"], reason: "Ad budget changes require owner approval." },
  { match: ["deploy", "production"], reason: "Production deploys require technical and business approval." },
  { match: ["edit", "production", "data"], reason: "Production client data edits require owner approval." },
];

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

async function authorize(request: Request) {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const allowed = new Set((process.env.ROADMAP_ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!url || !publishableKey || !secretKey || allowed.size === 0) return { error: json({ error: "Manager API is not configured." }, 503) };
  if (!token) return { error: json({ error: "Authentication is required." }, 401) };

  const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return { error: json({ error: "Invalid authentication token." }, 401) };
  if (!allowed.has(email)) return { error: json({ error: "This user cannot run the Manager Agent." }, 403) };

  return { admin: createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } }), email };
}

function selectRoute(request: string) {
  const lower = request.toLowerCase();
  const words = new Set(lower.match(/[a-z0-9]+/g) ?? []);
  return ROUTES.map((entry, index) => ({
    entry,
    index,
    score: entry.keywords.reduce((score, keyword) => score + ((keyword.includes(" ") ? lower.includes(keyword) : words.has(keyword)) ? 1 : 0), 0),
  })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.index - b.index)[0]?.entry ?? { agent: "Manager" };
}

function toClientRun(run: Record<string, unknown>) {
  return {
    run_id: run.run_id,
    request: run.request,
    agent: run.agent,
    status: run.status,
    approval_required: run.approval_required,
    decision: run.decision,
    next_action: run.next_action,
    timestamp: run.created_at,
    mode: run.mode,
  };
}

export async function GET(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;
  const { data, error } = await authorization.admin.from("manager_runs").select("*").order("created_at", { ascending: false }).limit(20);
  if (error) return json({ error: "Manager runs could not be loaded." }, 500);
  return json({ runs: (data ?? []).map(toClientRun) });
}

export async function POST(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;

  let body: { request?: unknown };
  try { body = await request.json(); } catch { return json({ error: "Request body must be valid JSON." }, 400); }
  const managerRequest = typeof body.request === "string" ? body.request.trim() : "";
  if (!managerRequest || managerRequest.length > 4000) return json({ error: "A request between 1 and 4000 characters is required." }, 400);

  const lower = managerRequest.toLowerCase();
  const route = selectRoute(managerRequest);
  const approval = APPROVAL_RULES.find((rule) => rule.match.every((word) => lower.includes(word)));
  const run = {
    run_id: `run_${crypto.randomUUID()}`,
    request: managerRequest,
    agent: route.agent,
    status: approval ? "approval_required" : "triage",
    approval_required: Boolean(approval),
    decision: approval ? "approval_required" : "logged",
    next_action: approval
      ? "Create a draft and wait for owner approval before any external action."
      : "Create the internal task draft and route it for review.",
    mode: "dry-run",
    tools_used: ["Online dry-run router", "Approval rules"],
  };

  const { data, error } = await authorization.admin.from("manager_runs").insert(run).select("*").single();
  if (error) return json({ error: "Manager run could not be saved." }, 500);
  return json({ run: toClientRun(data), approvalReason: approval?.reason ?? "Internal draft work can proceed with logging." }, 201);
}
