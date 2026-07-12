import { createClient } from "@supabase/supabase-js";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

async function authorize(request: Request) {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const allowed = new Set((process.env.ROADMAP_ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!url || !publishableKey || !openaiKey || allowed.size === 0) return { error: json({ error: "Realtime voice API is not configured." }, 503) };
  if (!token) return { error: json({ error: "Authentication is required." }, 401) };
  const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await auth.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return { error: json({ error: "Invalid authentication token." }, 401) };
  if (!allowed.has(email)) return { error: json({ error: "This user cannot create voice sessions." }, 403) };
  return { openaiKey };
}

export async function POST(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;
  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: { authorization: `Bearer ${authorization.openaiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ session: { type: "realtime", model: "gpt-realtime", instructions: "You are the concise voice interface for the private AiM roadmap. Confirm what you heard and never claim a consequential action completed without explicit owner confirmation.", audio: { input: { transcription: { model: "gpt-4o-mini-transcribe", language: "en" }, turn_detection: null }, output: { voice: "marin" } }, output_modalities: ["audio"], max_output_tokens: 200 } }),
  });
  const payload = await response.json();
  if (!response.ok) return json({ error: payload.error?.message ?? "OpenAI Realtime session could not be created." }, response.status);
  return json(payload, 201);
}

export function GET() {
  return json({ error: "Use POST to create a short-lived Realtime client secret." }, 405);
}
