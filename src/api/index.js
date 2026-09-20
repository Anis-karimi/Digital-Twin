/**
 * @file index.js
 * @description Centralized entry point for all API services.
 * Exports modular domain clients for both active backend services and new backend contracts.
 */

// Configuration & Client
export { API_CONFIG } from "./config";
export { httpRequest, requestWithFallback, handleApiError, ApiError } from "./client";

// Existing Backend Endpoints
export { adminApi, getAdminSettings } from "./existing/admin.api";
export { chatApi, askAI, generateChatPdf } from "./existing/chat.api";
export { voiceApi, streamTTS, uploadAudio, deleteAudio, createSTTWebSocket } from "./existing/voice.api";
export { userApi, getUserFiles, uploadPhoto } from "./existing/user.api";
export { contextsApi, getContextDocuments, uploadDocument, deleteDocuments, getDocumentDownloadUrl } from "./existing/contexts.api";
export { quizApi, generateQuiz, explainAnswer } from "./existing/quiz.api";

// New Backend Contracts & Modules (with Smart Mock Fallback)
export { coursesApi, getCourses, getCourseById, getCourseDetails, updateCourseDetails, getCoursesOverview } from "./new/courses.api";
export { studentsApi, getStudentsByCourse, getStudentById, toggleBlockStudent, removeStudentFromCourse } from "./new/students.api";
export { notificationsApi, getJoinRequests, acceptJoinRequest, rejectJoinRequest, getSystemMessages } from "./new/notifications.api";
export { chatHistoryApi, getChatHistory, saveChatMessage, submitMessageFeedback, clearChatHistory } from "./new/chatHistory.api";
export { authApi, getCurrentUserProfile, login, logout, updateProfile } from "./new/auth.api";
export { examsApi, getTeacherExams, saveGeneratedQuiz, submitQuizAnswers, getQuizResults } from "./new/exams.api";
export { navigationApi, getLessonTabs, getAvailableCourses, requestJoinCourse } from "./new/navigation.api";

// Unified API Object
import { adminApi } from "./existing/admin.api";
import { chatApi } from "./existing/chat.api";
import { voiceApi } from "./existing/voice.api";
import { userApi } from "./existing/user.api";
import { contextsApi } from "./existing/contexts.api";
import { quizApi } from "./existing/quiz.api";

import { coursesApi } from "./new/courses.api";
import { studentsApi } from "./new/students.api";
import { notificationsApi } from "./new/notifications.api";
import { chatHistoryApi } from "./new/chatHistory.api";
import { authApi } from "./new/auth.api";
import { examsApi } from "./new/exams.api";
import { navigationApi } from "./new/navigation.api";

export const api = {
  // Active backend services
  admin: adminApi,
  chat: chatApi,
  voice: voiceApi,
  user: userApi,
  contexts: contextsApi,
  quiz: quizApi,

  // New backend / domain contracts
  courses: coursesApi,
  students: studentsApi,
  notifications: notificationsApi,
  chatHistory: chatHistoryApi,
  auth: authApi,
  exams: examsApi,
  navigation: navigationApi,
};

export default api;
