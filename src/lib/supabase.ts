import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export type HostedRoadmap<T> = {
  document: T;
  version: number;
  updatedAt: string;
};

export async function loadRoadmapDocument<T>(slug: string): Promise<HostedRoadmap<T> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("roadmap_documents")
    .select("document, version, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn("Hosted roadmap is unavailable; using the bundled roadmap.", error.message);
    return null;
  }

  if (!data?.document) return null;
  return {
    document: data.document as T,
    version: data.version,
    updatedAt: data.updated_at,
  };
}

export async function getRoadmapSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function subscribeToRoadmapSession(onSession: (session: Session | null) => void) {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => onSession(session));
  return () => data.subscription.unsubscribe();
}

export async function signInRoadmapOwner(email: string, password: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOutRoadmapOwner() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveRoadmapDocument<T>(document: T, expectedVersion: number, accessToken: string) {
  const response = await fetch("/api/roadmap", {
    method: "PUT",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ document, expectedVersion }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Roadmap update failed.");
  return payload.roadmap as { version: number; updated_at: string };
}

export async function loadOnlineManagerRuns<T>(accessToken: string): Promise<T[]> {
  const response = await fetch("/api/manager", { headers: { authorization: `Bearer ${accessToken}` } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Manager runs could not be loaded.");
  return payload.runs as T[];
}

export async function createOnlineManagerRun<T>(request: string, accessToken: string): Promise<T> {
  const response = await fetch("/api/manager", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ request }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Manager run could not be created.");
  return payload.run as T;
}

export async function createRealtimeClientSecret(accessToken: string) {
  const response = await fetch("/api/realtime", { method: "POST", headers: { authorization: `Bearer ${accessToken}` } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Realtime voice session could not be created.");
  return payload as { value: string; expires_at: number };
}
