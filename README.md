# Cragleigh Inventory (TempClear)

## GitHub Pages deploy

GitHub’s Pages screen now asks you to pick a **workflow** (not a branch). Use ours.

### One-time setup

1. **Actions secret:** [Secrets → Actions](https://github.com/Timob123/TempClear/settings/secrets/actions) → `VITE_SUPABASE_PUBLISHABLE_KEY` = Supabase publishable key.

2. **Link Pages to the workflow** — [Settings → Pages](https://github.com/Timob123/TempClear/settings/pages)  
   - Under **Build and deployment**, click **Browse all workflows** (not Jekyll / Static HTML).  
   - Choose **Deploy to GitHub Pages** → **Configure** (or enable if shown).  
   - Or: [Actions](https://github.com/Timob123/TempClear/actions/workflows/deploy-pages.yml) → **Run workflow** on `main`.

3. Wait for a green run (build + deploy). The Pages settings page should then show your site URL.

4. **Supabase Auth** URLs: `https://timob123.github.io/TempClear/` and `https://timob123.github.io/TempClear/**`

**Live URL:** https://timob123.github.io/TempClear/

### Local dev

```bash
npm ci
cp .env.example .env   # add your publishable key
npm run dev
```

Open http://localhost:5174
