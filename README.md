# Cragleigh Inventory

## Deploy on Vercel

1. Import [Timob123/TempClear](https://github.com/Timob123/TempClear) in [Vercel](https://vercel.com/new) (root directory is the repo root — this app lives at the repo root).

2. **Environment variables** (required — without these you get blank pages or 404s in the console):

   Vercel → **Settings → Environment Variables** → add for **Production** (and Preview if you use it):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://crulqsufbijcfdskggkz.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase **publishable** key (Dashboard → API keys) |

3. **Redeploy** after saving env vars (Deployments → ⋯ → Redeploy). Vite bakes these in at build time.

4. Use your production URL (e.g. `https://temp-clear.vercel.app`), not the old GitHub Pages link.

5. **Supabase** → Authentication → URL configuration:
   - **Site URL:** your Vercel URL (with trailing slash)
   - **Redirect URLs:** `https://your-app.vercel.app/**`

GitHub Pages is no longer used; you can disable Pages under repo Settings if you like.

### Local dev

```bash
npm ci
cp .env.example .env   # add publishable key
npm run dev
```

Open http://localhost:5174
