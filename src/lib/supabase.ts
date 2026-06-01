import { createClient } from "@supabase/supabase-js";

const url =
  import.meta.env.VITE_SUPABASE_URL ?? "https://crulqsufbijcfdskggkz.supabase.co";
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_8YqNcsCXXmXJ1_h_99UvPg_1j5L3lMK";

export const supabase = createClient(url, key);

export type PhotoImageSize = "thumb" | "preview" | "full";

const RENDER: Record<Exclude<PhotoImageSize, "full">, { width: number; height: number; quality: number }> = {
  thumb: { width: 88, height: 88, quality: 75 },
  preview: { width: 480, height: 480, quality: 80 },
};

/** Public storage URL; use thumb/preview in lists — full originals are ~1–3MB each. */
export function photoPublicUrl(
  storagePath: string | null,
  size: PhotoImageSize = "full"
): string | null {
  if (!storagePath) return null;
  const encoded = storagePath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");

  if (size === "full") {
    return `${url}/storage/v1/object/public/inventory-photos/${encoded}`;
  }

  const { width, height, quality } = RENDER[size];
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    resize: "cover",
    quality: String(quality),
  });
  return `${url}/storage/v1/render/image/public/inventory-photos/${encoded}?${params}`;
}
