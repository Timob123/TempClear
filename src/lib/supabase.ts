import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const supabaseConfigured = Boolean(url && key);

export const configError = supabaseConfigured
  ? null
  : "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel (or web/.env locally), then redeploy.";

/** Placeholder client when env is missing — avoids crashing the bundle on import. */
const placeholderUrl = "https://placeholder.supabase.co";
const placeholderKey = "placeholder-key";

export const supabase: SupabaseClient = createClient(
  supabaseConfigured ? url : placeholderUrl,
  supabaseConfigured ? key : placeholderKey
);

export function photoPublicUrl(storagePath: string | null): string | null {
  if (!storagePath || !supabaseConfigured) return null;
  return `${url}/storage/v1/object/public/inventory-photos/${storagePath}`;
}
