import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in web/.env");
}

export const supabase = createClient(url, key);

export function photoPublicUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  return `${url}/storage/v1/object/public/inventory-photos/${storagePath}`;
}
