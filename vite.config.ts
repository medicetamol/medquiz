import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/medquiz/", // repo name
  build: {
    outDir: "dist",
  },
});
