/**
 * @file chatHistory.api.js
 * @description Persistent chat message storage, feedback, and history management.
 */

import { requestWithFallback } from "../client";

/**
 * Retrieves persisted chat history from the backend database.
 * Prevents loss of conversation upon page refresh.
 * 
 * @endpoint GET /chats/:type/:targetId/messages
 * @param {'course'|'student'} chatType Chat category
 * @param {string} targetId Course ID or Student ID
 * @returns {Promise<import("../types").ChatMessage[]>}
 */
export async function getChatHistory(chatType, targetId) {
  return requestWithFallback(
    `/chats/${chatType}/${targetId}/messages`,
    { method: "GET" },
    () => []
  );
}

/**
 * Saves a new user message or assistant response to the database.
 * @endpoint POST /chats/:type/:targetId/messages
 * @param {'course'|'student'} chatType
 * @param {string} targetId
 * @param {import("../types").ChatMessage} message
 * @returns {Promise<Object>}
 */
export async function saveChatMessage(chatType, targetId, message) {
  return requestWithFallback(
    `/chats/${chatType}/${targetId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(message),
    },
    () => ({ success: true, savedMessage: message })
  );
}

/**
 * Submits user feedback (thumbs up / thumbs down) for an AI response.
 * @endpoint POST /messages/:messageId/feedback
 * @param {string|number} messageId
 * @param {'like'|'dislike'|null} feedback
 * @returns {Promise<Object>}
 */
export async function submitMessageFeedback(messageId, feedback) {
  return requestWithFallback(
    `/messages/${messageId}/feedback`,
    {
      method: "POST",
      body: JSON.stringify({ feedback }),
    },
    () => ({ success: true, messageId, feedback })
  );
}

/**
 * Clears the chat conversation history on the server.
 * @endpoint DELETE /chats/:type/:targetId/history
 * @param {'course'|'student'} chatType
 * @param {string} targetId
 * @returns {Promise<Object>}
 */
export async function clearChatHistory(chatType, targetId) {
  return requestWithFallback(
    `/chats/${chatType}/${targetId}/history`,
    { method: "DELETE" },
    () => ({ success: true, cleared: true })
  );
}

export const chatHistoryApi = {
  getChatHistory,
  saveChatMessage,
  submitMessageFeedback,
  clearChatHistory,
};

export default chatHistoryApi;
