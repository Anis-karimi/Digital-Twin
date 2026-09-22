import { API_CONFIG } from "@/api/config";

/**
 * Resolves relative or full media URLs to absolute URLs pointing to the backend.
 * Handles /bot/v1/uploads/..., /uploads/..., or absolute URLs.
 * Dynamically resolves current hostname to prevent localhost breakdown on LAN.
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export const resolveMediaUrl = (url) => {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  let base = (API_CONFIG.NEW_BACKEND_URL || "http://localhost:8080/api/v1").replace(
    /\/api\/v1\/?$/,
    ""
  );

  // If accessing from another machine/IP on LAN, align hostname
  if (typeof window !== "undefined" && window.location.hostname) {
    try {
      const urlObj = new URL(base);
      if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
        urlObj.hostname = window.location.hostname;
        base = urlObj.origin;
      }
    } catch {
      // Keep base unchanged if URL parsing fails
    }
  }

  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${base}${cleanPath}`;
};

export default resolveMediaUrl;
