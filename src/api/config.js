/**
 * @file config.js
 * @description Centralized network and service configuration.
 * Resolves URLs from Vite environment variables with production fallbacks.
 */

import { BACKEND_URL as DEFAULT_BACKEND_URL, DGTW_URL as DEFAULT_DGTW_URL } from "@/Services/BackendConfige";

export const API_CONFIG = {
  /** Main Backend URL (LLM, Quiz, Admin, Documents) */
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_URL || "http://172.20.13.39:8506",

  /** Digital Twin Service URL (Audio TTS streaming and user static media) */
  DGTW_URL: import.meta.env.VITE_DGTW_URL || DEFAULT_DGTW_URL || "https://dgtw.um.ac.ir",

  /** Real-time STT WebSocket server */
  STT_WS_URL: import.meta.env.VITE_STT_WS_URL || "wss://172.20.13.39:8881/ws",

  /** New Backend URL for future migration of courses, students, and notifications */
  NEW_BACKEND_URL: import.meta.env.VITE_NEW_BACKEND_URL || "http://localhost:8000/api/v2",

  /** Flag to toggle between local mock data and live requests to the new backend */
  USE_NEW_BACKEND: import.meta.env.VITE_USE_NEW_BACKEND === "true" || false,

  /** Standard timeout in milliseconds */
  REQUEST_TIMEOUT_MS: 15000,
};

export default API_CONFIG;
