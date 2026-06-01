# Cragleigh Inventory (TempClear)

## GitHub Pages deploy

The site is **not live until you turn on Pages once** in GitHub settings. The workflow pushes built files to the `gh-pages` branch.

### One-time setup (do this in order)

1. **Add Actions secret**  
   [Secrets → Actions](https://github.com/Timob123/TempClear/settings/secrets/actions) → **New repository secret**  
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`  
   - Value: Supabase **publishable** key (from Dashboard → API keys)

2. **Run the deploy workflow**  
   [Actions → Deploy to GitHub Pages](https://github.com/Timob123/TempClear/actions/workflows/deploy-pages.yml) → **Run workflow** (or push to `main`).  
   Wait until the job is green. You should see a new **`gh-pages`** branch.

3. **Enable Pages** (this fixes the “There isn’t a GitHub Pages site here” 404)  
   [Settings → Pages](https://github.com/Timob123/TempClear/settings/pages)  
   - **Source:** Deploy from a branch  
   - **Branch:** `gh-pages`  
   - **Folder:** `/ (root)`  
   - Save. After 1–2 minutes the site should load.

4. **Supabase Auth** → URL configuration  
   - Site URL: `https://timob123.github.io/TempClear/`  
   - Redirect URLs: `https://timob123.github.io/TempClear/**`

**Live URL:** https://timob123.github.io/TempClear/

If you still see 404, confirm step 3 is saved and the latest Actions run succeeded.

### Local dev

```bash
npm ci
cp .env.example .env   # add your publishable key
npm run dev
```

Open http://localhost:5174
