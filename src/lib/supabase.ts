import { createClient } from "@supabase/supabase-js";

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

export async function loadRoadmapDocument<T>(slug: string): Promise<T | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("roadmap_documents")
    .select("document")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn("Hosted roadmap is unavailable; using the bundled roadmap.", error.message);
    return null;
  }

  return (data?.document as T | undefined) ?? null;
}
