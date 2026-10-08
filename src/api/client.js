/**
 * @file client.js
 * @description Standardized HTTP request client and error handlers.
 */

import { API_CONFIG } from "./config";

/**
 * Standard API error structure.
 */
export class ApiError extends Error {
  constructor(service, action, status, data, originalError) {
    super(`[${service}:${action}] Request failed with status ${status}`);
    this.name = "ApiError";
    this.service = service;
    this.action = action;
    this.status = status;
    this.data = data;
    this.originalError = originalError;
    this.response = originalError?.response || (data ? { status, data } : undefined);
  }
}

/**
 * Logs and throws a standardized ApiError.
 */
export function handleApiError(service, action, error) {
  const status = error.response?.status || error.status || "NETWORK_ERROR";
  const data = error.response?.data || error.message || error;
  console.error(`API Error [${service} -> ${action}] (Status: ${status}):`, data);
  throw new ApiError(service, action, status, data, error);
}

/**
 * Executes a fetch request with timeout and JSON/Blob parsing.
 * @param {string} url Full target URL
 * @param {RequestInit} [options={}] Fetch options
 * @param {'json'|'blob'|'text'|'raw'} [responseType='json'] Expected return format
 */
export async function httpRequest(url, options = {}, responseType = "json") {
  const timeoutMs =
    Number(options.timeout) || API_CONFIG.REQUEST_TIMEOUT_MS || 60000;

  // Upload progress برای FormData با XMLHttpRequest
  if (
    typeof options.onUploadProgress === "function" &&
    typeof XMLHttpRequest !== "undefined" &&
    typeof FormData !== "undefined" &&
    options.body instanceof FormData
  ) {
    const {
      timeout: _customTimeout,
      onUploadProgress,
      ...xhrOptions
    } = options;

    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(xhrOptions.method || "GET", url, true);
      xhr.timeout = timeoutMs;

      if (responseType === "blob") {
        xhr.responseType = "blob";
      }

      // Headers
      Object.entries(xhrOptions.headers || {}).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);

          onUploadProgress({
            loaded: event.loaded,
            total: event.total,
            percent,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          let errorData = null;

          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            errorData = xhr.responseText;
          }

          const error = new Error(`HTTP Error: ${xhr.status}`);
          error.status = xhr.status;
          error.data = errorData;

          reject(error);
          return;
        }

        if (responseType === "blob") {
          resolve(xhr.response);
          return;
        }

        if (responseType === "text") {
          resolve(xhr.responseText);
          return;
        }

        if (responseType === "raw") {
          resolve(xhr);
          return;
        }

        try {
          resolve(
            xhr.responseText ? JSON.parse(xhr.responseText) : { success: true },
          );
        } catch {
          resolve({ success: true });
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error"));
      };

      xhr.ontimeout = () => {
        reject(new Error(`Request timed out after ${timeoutMs}ms`));
      };

      xhr.onabort = () => {
        reject(new Error("Request aborted"));
      };

      xhr.send(xhrOptions.body);
    });
  }

  // رفتار قبلی fetch برای تمام درخواست‌های دیگر
  const {
    timeout: _customTimeout,
    onUploadProgress: _onUploadProgress,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = null;

      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      const error = new Error(`HTTP Error: ${response.status}`);
      error.status = response.status;
      error.data = errorData;

      throw error;
    }

    if (responseType === "blob") return await response.blob();
    if (responseType === "text") return await response.text();
    if (responseType === "raw") return response;

    return await response.json().catch(() => ({ success: true }));
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }

    throw error;
  }
}

/**
 * Dispatches a request to the new backend or gracefully falls back to local data.
 * @param {string} endpoint API endpoint relative to NEW_BACKEND_URL (e.g. '/courses')
 * @param {RequestInit} [options={}] Request options
 * @param {Function|*} [fallbackData=null] Static fallback supplier
 */
export async function requestWithFallback(endpoint, options = {}, fallbackData = null) {
  if (!API_CONFIG.USE_NEW_BACKEND) {
    return typeof fallbackData === "function" ? fallbackData() : fallbackData;
  }

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const clientTimezone = (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) || "Asia/Tehran";
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Timezone": clientTimezone,
    ...(options.headers || {}),
  };

  try {
    const url = `${API_CONFIG.NEW_BACKEND_URL}${endpoint}`;
    return await httpRequest(url, { ...options, headers });
  } catch (err) {
    // If the server explicitly returned a 4xx error (e.g. 400 Bad Request, 403 Forbidden),
    // NEVER swallow it with fallback mock data! Propagate the real error to the caller.
    if (err.status && err.status >= 400 && err.status < 500) {
      const detail = err.data?.detail || err.data?.message || err.message;
      const apiErr = new Error(detail);
      apiErr.status = err.status;
      apiErr.data = err.data;
      throw apiErr;
    }
    console.warn(`[NewBackend] ${endpoint} request failed. Using local fallback:`, err.message);
    return typeof fallbackData === "function" ? fallbackData(err) : fallbackData;
  }
}

export default {
  httpRequest,
  requestWithFallback,
  handleApiError,
  ApiError,
};
