import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ?? "https://crulqsufbijcfdskggkz.supabase.co";
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_8YqNcsCXXmXJ1_h_99UvPg_1j5L3lMK";

export const supabase = createClient(url, key);

export function photoPublicUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;
  return `${url}/storage/v1/object/public/inventory-photos/${storagePath}`;
}
