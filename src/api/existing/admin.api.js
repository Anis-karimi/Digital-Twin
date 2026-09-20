/**
 * @file admin.api.js
 * @description Admin and system settings endpoints.
 */

import { API_CONFIG } from "../config";
import { httpRequest, handleApiError } from "../client";

/**
 * Fetches admin settings including default and available LLM models.
 * @endpoint GET /api/admin/settings
 * @returns {Promise<import("../types").AdminSettings>}
 */
export async function getAdminSettings() {
  try {
    const url = `${API_CONFIG.BACKEND_URL}/api/admin/settings`;
    return await httpRequest(url, { method: "GET" });
  } catch (error) {
    handleApiError("AdminApi", "getAdminSettings", error);
  }
}

export const adminApi = {
  getSettings: getAdminSettings,
};

export default adminApi;
