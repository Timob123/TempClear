# Cragleigh Inventory

Deployed on Vercel from [Timob123/TempClear](https://github.com/Timob123/TempClear).

Supabase URL and publishable key are in `.env.production` (safe for client-side use). Push to `main` to deploy.

**Supabase Auth** → add your Vercel URL under Site URL and Redirect URLs.

### Local dev

```bash
npm ci
cp .env.example .env   # optional if you use different keys locally
npm run dev
```

Open http://localhost:5174
