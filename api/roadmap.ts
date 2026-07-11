import { createClient } from "@supabase/supabase-js";

type RoadmapDocument = {
  meta: Record<string, unknown>;
  stats: unknown[];
  agents: unknown[];
  phases: unknown[];
  stack: unknown[];
};

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

function getConfiguration() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const adminEmails = new Set(
    (process.env.ROADMAP_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!url || !publishableKey || !secretKey || adminEmails.size === 0) return null;
  return { url, publishableKey, secretKey, adminEmails };
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

async function authorize(request: Request) {
  const configuration = getConfiguration();
  const token = getBearerToken(request);

  if (!configuration) return { error: json({ error: "Roadmap API is not configured." }, 503) };
  if (!token) return { error: json({ error: "Authentication is required." }, 401) };

  const authClient = createClient(configuration.url, configuration.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();

  if (error || !email) return { error: json({ error: "Invalid authentication token." }, 401) };
  if (!configuration.adminEmails.has(email)) {
    return { error: json({ error: "This user cannot update the roadmap." }, 403) };
  }

  const adminClient = createClient(configuration.url, configuration.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { adminClient, email };
}

function isRoadmapDocument(value: unknown): value is RoadmapDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Partial<RoadmapDocument>;
  return Boolean(
    document.meta &&
      Array.isArray(document.stats) &&
      Array.isArray(document.agents) &&
      Array.isArray(document.phases) &&
      Array.isArray(document.stack),
  );
}

export async function GET(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;

  const { data, error } = await authorization.adminClient
    .from("roadmap_documents")
    .select("slug, document, version, updated_at")
    .eq("slug", "aims-roadmap")
    .single();

  if (error) return json({ error: "Hosted roadmap could not be loaded." }, 500);
  return json(data);
}

export async function PUT(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1_000_000) return json({ error: "Roadmap payload is too large." }, 413);

  let body: { document?: unknown; expectedVersion?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }

  if (!isRoadmapDocument(body.document) || !Number.isInteger(body.expectedVersion)) {
    return json({ error: "A valid roadmap document and expectedVersion are required." }, 400);
  }

  const { data, error } = await authorization.adminClient.rpc("update_roadmap_document", {
    p_slug: "aims-roadmap",
    p_document: body.document,
    p_expected_version: body.expectedVersion,
  });

  if (error?.code === "40001") {
    return json({ error: "Roadmap changed since it was loaded. Refresh and retry." }, 409);
  }
  if (error) return json({ error: "Roadmap update failed." }, 500);

  return json({ roadmap: data?.[0] ?? null, updatedBy: authorization.email });
}

export function POST() {
  return json({ error: "Use PUT to update the roadmap." }, 405);
}
