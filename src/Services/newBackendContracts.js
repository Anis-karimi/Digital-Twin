/**
 * @file newBackendContracts.js
 * @description Backward-compatible facade re-exporting new backend contracts from src/api.
 * All comments and annotations are strictly in English.
 */

import {
  API_CONFIG,
  coursesApi,
  studentsApi,
  navigationApi,
  notificationsApi,
  chatHistoryApi,
  authApi,
  examsApi,
} from "@/api";

export const NEW_BACKEND_CONFIG = {
  BASE_URL: API_CONFIG.NEW_BACKEND_URL,
  USE_NEW_BACKEND: API_CONFIG.USE_NEW_BACKEND,
  TIMEOUT: API_CONFIG.REQUEST_TIMEOUT_MS,
};

export const CourseService = coursesApi;
export const StudentService = studentsApi;
export const NavigationService = navigationApi;
export const NotificationService = notificationsApi;
export const ChatPersistenceService = chatHistoryApi;
export const UserProfileService = authApi;
export const QuizManagementService = examsApi;
export const StudentExplorationService = navigationApi;

export {
  coursesApi,
  studentsApi,
  navigationApi,
  notificationsApi,
  chatHistoryApi,
  authApi,
  examsApi,
} from "@/api";

export default {
  Course: CourseService,
  Student: StudentService,
  Navigation: NavigationService,
  Notification: NotificationService,
  ChatPersistence: ChatPersistenceService,
  UserProfile: UserProfileService,
  QuizManagement: QuizManagementService,
  StudentExploration: StudentExplorationService,
  CONFIG: NEW_BACKEND_CONFIG,
};
