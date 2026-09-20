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
 * Fetches system notifications and administrative announcements.
 * @endpoint GET /teacher/notifications/messages
 * @returns {Promise<Array<Object>>}
 */
export async function getSystemMessages() {
  return requestWithFallback("/teacher/notifications/messages", { method: "GET" }, () => []);
}

export const notificationsApi = {
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  getSystemMessages,
};

export default notificationsApi;
