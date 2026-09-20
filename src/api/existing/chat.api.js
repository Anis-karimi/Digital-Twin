/**
 * @file chat.api.js
 * @description Chat and LLM interaction endpoints.
 * Handles FormData construction internally so callers pass simple plain objects.
 */

import axios from "axios";
import { API_CONFIG } from "../config";
import { httpRequest, handleApiError } from "../client";

/**
 * Sends a prompt query to the LLM agent and returns the text response.
 * Completely encapsulates FormData construction.
 * 
 * @endpoint POST /api/ask
 * @param {import("../types").AskAIRequest} params
 * @returns {Promise<string>} Text answer from the AI assistant
 */
export async function askAI({
  query,
  contexts = "",
  language = "fa",
  llmModel = "gemma4",
  courseName = "",
  teacherName = "Teacher",
}) {
  try {
    const formData = new FormData();
    formData.append("query", query);
    formData.append("contexts", contexts);
    formData.append("language", language);
    formData.append("llm_model", llmModel);
    formData.append("courseName", courseName);
    formData.append("teacherName", teacherName);

    const response = await axios.post(`${API_CONFIG.BACKEND_URL}/api/ask`, formData);
    const data = response.data;

    return (
      data?.answer ||
      data?.response ||
      data?.message ||
      data?.data ||
      (typeof data === "string" ? data : "")
    );
  } catch (error) {
    handleApiError("ChatApi", "askAI", error);
  }
}

/**
 * Generates and downloads a PDF file containing the chat history.
 * @endpoint POST /api/generate-pdf/
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {Promise<Blob>} Binary PDF blob
 */
export async function generateChatPdf(messages) {
  try {
    const url = `${API_CONFIG.BACKEND_URL}/api/generate-pdf/`;
    return await httpRequest(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      },
      "blob"
    );
  } catch (error) {
    handleApiError("ChatApi", "generateChatPdf", error);
  }
}

export const chatApi = {
  askAI,
  generatePdf: generateChatPdf,
};

export default chatApi;
