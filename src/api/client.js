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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
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
      throw new Error(`Request timed out after ${API_CONFIG.REQUEST_TIMEOUT_MS}ms`);
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
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const url = `${API_CONFIG.NEW_BACKEND_URL}${endpoint}`;
    return await httpRequest(url, { ...options, headers });
  } catch (err) {
    console.warn(`[NewBackend] ${endpoint} request failed. Using local fallback:`, err.message);
    return typeof fallbackData === "function" ? fallbackData() : fallbackData;
  }
}

export default {
  httpRequest,
  requestWithFallback,
  handleApiError,
  ApiError,
};
