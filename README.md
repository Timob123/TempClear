# Cragleigh Inventory

## Deploy on Vercel

1. Import [Timob123/TempClear](https://github.com/Timob123/TempClear) in [Vercel](https://vercel.com/new) (root directory is the repo root — this app lives at the repo root).

2. **Environment variables** (Project → Settings → Environment Variables):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://crulqsufbijcfdskggkz.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

3. Deploy. Copy your production URL (e.g. `https://temp-clear.vercel.app`).

4. **Supabase** → Authentication → URL configuration:
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
