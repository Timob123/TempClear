import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, "..");
const projectRoot = resolve(webRoot, "..");

function fromProcessEnv() {
  const url =
    process.env.VITE_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";
  return { url, key };
}

function fromEnvFiles(mode) {
  const dirs = [webRoot];
  if (existsSync(resolve(projectRoot, ".env"))) dirs.push(projectRoot);

  let url = "";
  let key = "";
  for (const dir of dirs) {
    const env = loadEnv(mode, dir, "");
    url =
      url ||
      env.VITE_SUPABASE_URL?.trim() ||
      env.SUPABASE_URL?.trim() ||
      "";
    key =
      key ||
      env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
      "";
  }
  return { url, key };
}

/** @param {string} [mode] */
export function resolveSupabaseEnv(mode = process.env.NODE_ENV === "production" ? "production" : "development") {
  const files = fromEnvFiles(mode);
  const proc = fromProcessEnv();
  return {
    url: proc.url || files.url,
    key: proc.key || files.key,
  };
}
