import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget =
    env.BACKEND_PROXY_URL ||
    process.env.BACKEND_PROXY_URL ||
    "http://localhost:7000";
  const legacyBackendTarget =
    env.LEGACY_BACKEND_PROXY_URL ||
    process.env.LEGACY_BACKEND_PROXY_URL ||
    "http://172.20.13.39:8506";

  return {
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
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, req) => {
              console.error(`[Vite Proxy Error -> ${req.url}]:`, err.message);
            });
          },
        },
        "/bot/v1": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, req) => {
              console.error(`[Vite Proxy Error -> ${req.url}]:`, err.message);
            });
          },
        },
        "/uploads": {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, req) => {
              console.error(`[Vite Proxy Error -> ${req.url}]:`, err.message);
            });
          },
        },
        "/api": {
          target: legacyBackendTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("error", (err, req) => {
              console.error(`[Vite Proxy Error -> ${req.url}]:`, err.message);
            });
          },
        },
      },
    },
  };
});
