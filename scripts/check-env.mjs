import { resolveSupabaseEnv } from "./resolve-env.mjs";

const onVercel = process.env.VERCEL === "1";
const { url, key } = resolveSupabaseEnv("production");

if (onVercel && (!url || !key)) {
  console.error(`
[build] Missing Supabase environment variables.

Add in Vercel → Settings → Environment Variables (Production):

  VITE_SUPABASE_URL=https://crulqsufbijcfdskggkz.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>

(Also accepted: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY)

Then Redeploy — Vite embeds these at build time.
`);
  process.exit(1);
}
