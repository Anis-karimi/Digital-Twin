/**
 * @file contexts.api.js
 * @description Course documents and context management endpoints for RAG.
 */

import { API_CONFIG } from "../config";
import { httpRequest, handleApiError } from "../client";

/**
 * Retrieves the list of uploaded context document filenames.
 * @endpoint GET /api/contexts
 * @returns {Promise<string[]>} List of document names
 */
export async function getContextDocuments() {
  try {
    const url = `${API_CONFIG.BACKEND_URL}/api/contexts`;
    const data = await httpRequest(url, { method: "GET" });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    handleApiError("ContextsApi", "getContextDocuments", error);
  }
}

/**
 * Uploads a course context document (e.g. PDF, syllabus).
 * Encapsulates FormData creation.
 * 
 * @endpoint POST /api/upload
 * @param {File} file Document file object
 * @returns {Promise<Object>} Server response
 */
export async function uploadDocument(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_CONFIG.BACKEND_URL}/api/upload`;
    return await httpRequest(url, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    handleApiError("ContextsApi", "uploadDocument", error);
  }
}

/**
 * Deletes one or more context documents from the server.
 * @endpoint POST /api/contexts/delete
 * @param {string[]} documentNames List of filenames to delete
 * @returns {Promise<Object>} Server response
 */
export async function deleteDocuments(documentNames) {
  try {
    const url = `${API_CONFIG.BACKEND_URL}/api/contexts/delete`;
    return await httpRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contexts: documentNames }),
    });
  } catch (error) {
    handleApiError("ContextsApi", "deleteDocuments", error);
  }
}

/**
 * Builds the direct download or preview URL for an uploaded document.
 * @endpoint GET /tmp/{encodeURIComponent(fileName)}
 * @param {string} fileName Document filename
 * @returns {string} Direct URL
 */
export function getDocumentDownloadUrl(fileName) {
  return `${API_CONFIG.BACKEND_URL}/tmp/${encodeURIComponent(fileName)}`;
}

export const contextsApi = {
  getDocuments: getContextDocuments,
  uploadDocument,
  deleteDocuments,
  getDownloadUrl: getDocumentDownloadUrl,
};

export default contextsApi;
