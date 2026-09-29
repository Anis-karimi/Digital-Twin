/**
 * @file notifications.api.js
 * @description Teacher notifications and student join request endpoints.
 */

import { requestWithFallback } from "../client";

const defaultMockJoinRequests = [
  { id: 1, name: "Anis Karimi", subject: "OS", avatarClassName: "bg-error-100" },
  { id: 2, name: "محمد رسولی", subject: "امنیت", avatarClassName: "bg-warning-100" },
  { id: 3, name: "ملیکا یزدان پناه", subject: "هوش مصنوعی", avatarClassName: "bg-success-100" },
];

/**
 * Fetches pending student join requests for teacher approval.
 * @endpoint GET /teacher/notifications/join-requests
 * @returns {Promise<import("../types").JoinRequest[]>}
 */
export async function getJoinRequests() {
  return requestWithFallback("/teacher/notifications/join-requests", { method: "GET" }, () => [
    ...defaultMockJoinRequests,
  ]);
}

/**
 * Approves a student's join request.
 * @endpoint POST /teacher/notifications/join-requests/:id/accept
 * @param {string|number} requestId
 * @returns {Promise<Object>}
 */
export async function acceptJoinRequest(requestId) {
  return requestWithFallback(
    `/teacher/notifications/join-requests/${requestId}/accept`,
    { method: "POST" },
    () => ({ success: true, requestId, status: "accepted" })
  );
}

/**
 * Declines or dismisses a student's join request.
 * @endpoint POST /teacher/notifications/join-requests/:id/reject
 * @param {string|number} requestId
 * @returns {Promise<Object>}
 */
export async function rejectJoinRequest(requestId) {
  return requestWithFallback(
    `/teacher/notifications/join-requests/${requestId}/reject`,
    { method: "POST" },
    () => ({ success: true, requestId, status: "rejected" })
  );
}

/**
 * Fetches approved membership notifications for the authenticated student.
 * @endpoint GET /teacher/notifications/student-notifications
 * @returns {Promise<Array<Object>>}
 */
export async function getStudentNotifications() {
  return requestWithFallback(
    "/teacher/notifications/student-notifications",
    { method: "GET" },
    () => {
      try {
        const local = localStorage.getItem("student_approved_notifications");
        return local ? JSON.parse(local) : [];
      } catch {
        return [];
      }
    }
  );
}

/**
 * Fetches system notifications and administrative announcements.
 * @endpoint GET /teacher/notifications/messages
 * @returns {Promise<Array<Object>>}
 */
export async function getSystemMessages() {
  return requestWithFallback("/teacher/notifications/messages", { method: "GET" }, () => []);
}

/**
 * Fetches the count of unread/pending notifications for teacher/student badge.
 * @endpoint GET /teacher/notifications/unread-count
 * @returns {Promise<{count: number}>}
 */
export async function getUnreadNotificationsCount() {
  return requestWithFallback(
    "/teacher/notifications/unread-count",
    { method: "GET" },
    () => ({ count: 0 })
  );
}

export const notificationsApi = {
  getJoinRequests,
  getStudentNotifications,
  acceptJoinRequest,
  rejectJoinRequest,
  getSystemMessages,
  getUnreadNotificationsCount,
};

export default notificationsApi;
