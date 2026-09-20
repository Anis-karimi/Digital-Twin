/**
 * @file user.api.js
 * @description User assets and profile media endpoints.
 */

import { API_CONFIG } from "../config";
import { httpRequest, handleApiError } from "../client";

/**
 * Retrieves the user's stored photo and audio resource paths.
 * Automatically resolves paths against DGTW_URL with cache-busting timestamps.
 * 
 * @endpoint GET /api/get-user-files/
 * @returns {Promise<import("../types").UserFilesResponse>}
 */
export async function getUserFiles() {
  try {
    const url = `${API_CONFIG.BACKEND_URL}/api/get-user-files/`;
    const data = await httpRequest(url, { method: "GET" });

    return {
      photo_url: data?.photo_url ? `${API_CONFIG.DGTW_URL}${data.photo_url}?t=${Date.now()}` : null,
      audio_url: data?.audio_url ? `${API_CONFIG.DGTW_URL}${data.audio_url}?t=${Date.now()}` : null,
      raw: data,
    };
  } catch (error) {
    handleApiError("UserApi", "getUserFiles", error);
  }
}

/**
 * Uploads a profile avatar photo.
 * Encapsulates FormData creation so callers just pass the File object.
 * 
 * @endpoint POST /api/upload-photo/
 * @param {File} file Image file object
 * @returns {Promise<Object>} Server response
 */
export async function uploadPhoto(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_CONFIG.BACKEND_URL}/api/upload-photo/`;
    return await httpRequest(url, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    handleApiError("UserApi", "uploadPhoto", error);
  }
}

export const userApi = {
  getUserFiles,
  uploadPhoto,
};

export default userApi;
