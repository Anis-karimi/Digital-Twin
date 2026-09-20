/**
 * @file existingBackendApi.js
 * @description Backward-compatible facade re-exporting all active backend endpoints from src/api.
 * All comments and annotations are strictly in English.
 */

import {
  API_CONFIG,
  adminApi,
  chatApi,
  voiceApi,
  userApi,
  contextsApi,
  quizApi,
} from "@/api";

// Re-export constants and namespaces
export { API_CONFIG };
export const AdminApi = adminApi;
export const ChatApi = chatApi;
export const UserAssetsApi = userApi;
export const CourseDocsApi = contextsApi;
export const QuizApi = quizApi;
export const DigitalTwinAudioApi = voiceApi;

// Named direct function exports
export {
  getAdminSettings,
  askAI,
  generateChatPdf,
  getUserFiles,
  uploadPhoto,
  uploadAudio,
  deleteAudio,
  getContextDocuments,
  uploadDocument as uploadContextDocument,
  deleteDocuments as deleteContextDocuments,
  getDocumentDownloadUrl,
  generateQuiz,
  explainAnswer,
  streamTTS,
  createSTTWebSocket,
} from "@/api";

export default {
  Admin: AdminApi,
  Chat: ChatApi,
  UserAssets: UserAssetsApi,
  CourseDocs: CourseDocsApi,
  Quiz: QuizApi,
  DigitalTwinAudio: DigitalTwinAudioApi,
  CONFIG: API_CONFIG,
};
