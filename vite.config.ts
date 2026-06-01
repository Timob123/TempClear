import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://timob123.github.io/TempClear/
export default defineConfig({
  base: "/TempClear/",
  plugins: [react()],
  server: { port: 5174 },
});
