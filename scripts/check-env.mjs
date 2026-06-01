/** Fail Vercel builds when Supabase env vars were not set in project settings. */
const onVercel = process.env.VERCEL === "1";
const url = process.env.VITE_SUPABASE_URL?.trim();
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (onVercel && (!url || !key)) {
  console.error(
    "\n[build] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY.\n" +
      "Add them in Vercel → Project → Settings → Environment Variables, then redeploy.\n"
  );
  process.exit(1);
}
