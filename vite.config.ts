import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/medquiz/",   // 👈 IMPORTANT: must match your GitHub repo name
});
