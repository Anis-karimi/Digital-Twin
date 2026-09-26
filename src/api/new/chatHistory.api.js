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

/**
 * Persists a conversation turn (user prompt and assistant/fallback response) to the new backend database.
 * @endpoint POST /chats/:type/:targetId/messages
 * @param {'course'|'student'} chatType
 * @param {string} targetId
 * @param {{ text: string, answer?: string, courseName?: string, language?: string }} payload
 * @returns {Promise<{ success: boolean, userMessage: Object, aiMessage: Object }>}
 */
export async function saveConversationTurn(chatType, targetId, payload) {
  return requestWithFallback(
    `/chats/${chatType}/${targetId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    () => {
      const now = new Date();
      return {
        success: true,
        userMessage: {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          text: payload.text,
          sender: "me",
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "long" }),
        },
        aiMessage: {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1),
          text: payload.answer || "مشکلی در ارتباط با سرور به وجود آمد.",
          sender: "other",
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "long" }),
        },
      };
    }
  );
}

/**
 * Adds a teacher's quoted comment to a bot message.
 * @endpoint POST /messages/:messageId/comments
 * @param {string|number} messageId
 * @param {string} teacherName
 * @param {string} comment
 * @returns {Promise<Object>}
 */
export async function addMessageComment(messageId, teacherName, comment) {
  return requestWithFallback(
    `/messages/${messageId}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ teacher_name: teacherName, comment }),
    },
    () => {
      const now = new Date();
      return {
        success: true,
        comment: {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          teacher_name: teacherName,
          comment,
          time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "long" }),
        },
      };
    }
  );
}

/**
 * Deletes a teacher's comment from a message.
 * @endpoint DELETE /messages/:messageId/comments/:commentId
 * @param {string|number} messageId
 * @param {string} commentId
 * @returns {Promise<Object>}
 */
export async function deleteMessageComment(messageId, commentId) {
  return requestWithFallback(
    `/messages/${messageId}/comments/${commentId}`,
    {
      method: "DELETE",
    },
    () => ({ success: true })
  );
}

/**
 * Backward compatibility alias for saveConversationTurn.
 */
export const sendMessageWithRAG = saveConversationTurn;

export const chatHistoryApi = {
  getChatHistory,
  saveChatMessage,
  saveConversationTurn,
  sendMessageWithRAG,
  submitMessageFeedback,
  clearChatHistory,
  addMessageComment,
  deleteMessageComment,
};

export default chatHistoryApi;

