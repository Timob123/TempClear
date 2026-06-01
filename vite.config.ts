import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolveSupabaseEnv } from "./scripts/resolve-env.mjs";

export default defineConfig(({ mode }) => {
  const { url, key } = resolveSupabaseEnv(mode);

  return {
    base: "/",
    plugins: [react()],
    server: { port: 5174 },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(url),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(key),
    },
  };
});
