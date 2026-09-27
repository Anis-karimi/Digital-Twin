import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), svgr()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api/v1": {
        target: process.env.BACKEND_PROXY_URL || "http://host.docker.internal:7000",
        changeOrigin: true,
      },
      "/bot/v1": {
        target: process.env.BACKEND_PROXY_URL || "http://host.docker.internal:7000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.BACKEND_PROXY_URL || "http://host.docker.internal:7000",
        changeOrigin: true,
      },
      "/api": {
        target: process.env.LEGACY_BACKEND_PROXY_URL || "http://172.20.13.39:8506",
        changeOrigin: true,
      },
    },
  },
});
