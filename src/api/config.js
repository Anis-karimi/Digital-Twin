/**
 * @file config.js
 * @description Centralized network and service configuration.
 * Resolves URLs from Vite environment variables with production fallbacks.
 */

import { BACKEND_URL as DEFAULT_BACKEND_URL, DGTW_URL as DEFAULT_DGTW_URL } from "@/Services/BackendConfige";

const isBrowser = typeof window !== "undefined";

// When accessed directly via Vite dev server (:5173) or reverse proxy,
// relative /api/v1 routes through Vite/Traefik proxy cleanly without CORS or firewall port issues.
const defaultNewBackendUrl = (() => {
  if (!isBrowser) return "/api/v1";
  const { port, hostname, protocol } = window.location;
  if (port === "5173") return "/api/v1";
  if (port === "8080" || port === "80" || port === "443" || !port) return "/api/v1";
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `${protocol}//${hostname}:8080/api/v1`;
  }
  return "/api/v1";
})();

const defaultBackendUrl =
  isBrowser &&
  (window.location.port === "5173" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? ""
    : DEFAULT_BACKEND_URL || "http://172.20.13.39:8506";

export const API_CONFIG = {
  /** Main Backend URL (LLM, Quiz, Admin, Documents) */
  BACKEND_URL:
    import.meta.env.VITE_BACKEND_URL !== undefined && import.meta.env.VITE_BACKEND_URL !== ""
      ? import.meta.env.VITE_BACKEND_URL
      : defaultBackendUrl,

  /** Digital Twin Service URL (Audio TTS streaming and user static media) */
  DGTW_URL: import.meta.env.VITE_DGTW_URL || DEFAULT_DGTW_URL || "https://dgtw.um.ac.ir",

  /** Digital Twin TTS stream endpoint URL */
  TTS_STREAM_URL:
    import.meta.env.VITE_TTS_STREAM_URL ||
    `${import.meta.env.VITE_DGTW_URL || DEFAULT_DGTW_URL || "https://dgtw.um.ac.ir"}/tts_router_stream`,

  /** Real-time STT WebSocket server for Persian (fa - Port 8881) */
  STT_WS_URL_FA: import.meta.env.VITE_STT_WS_URL_FA || "wss://172.20.13.39:8881/ws",

  /** Real-time STT WebSocket server for English (en - Port 8882) */
  STT_WS_URL_EN: import.meta.env.VITE_STT_WS_URL_EN || "wss://172.20.13.39:8882/ws",

  /** Real-time STT WebSocket server (default fallback) */
  STT_WS_URL: import.meta.env.VITE_STT_WS_URL || "wss://172.20.13.39:8881/ws",

  /** New Backend URL for courses, students, auth, chat history, and navigation */
  NEW_BACKEND_URL:
    import.meta.env.VITE_NEW_BACKEND_URL !== undefined && import.meta.env.VITE_NEW_BACKEND_URL !== ""
      ? import.meta.env.VITE_NEW_BACKEND_URL
      : defaultNewBackendUrl,

  /** Flag to toggle live requests to the new backend */
  USE_NEW_BACKEND: import.meta.env.VITE_USE_NEW_BACKEND !== "false",

  /** LLM Base URL for Qwen / Exam / Quiz Explanations */
  LLM_BASE_URL:
    import.meta.env.VITE_LLM_BASE_URL || "http://94.184.177.171:8000/v1",

  /** LLM Model name */
  LLM_MODEL:
    import.meta.env.VITE_LLM_MODEL || "Qwen/Qwen2.5-7B-Instruct-AWQ",

  /** Standard timeout in milliseconds (60s for AI inference / file analysis) */
  REQUEST_TIMEOUT_MS: 60000,
};

export default API_CONFIG;
