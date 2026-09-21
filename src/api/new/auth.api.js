/**
 * @file auth.api.js
 * @description User authentication, session management, and profile endpoints.
 */

import { requestWithFallback } from "../client";

/**
 * Fetches the currently authenticated user's profile and active roles.
 * @endpoint GET /auth/me
 * @returns {Promise<import("../types").UserProfile>}
 */
export async function getCurrentUserProfile() {
  return requestWithFallback("/auth/me", { method: "GET" }, () => ({
    id: "usr_001",
    name: "استاد دیجیتال",
    nameEn: "Digital Teacher",
    role: "teacher",
    email: "teacher@university.ac.ir",
    avatar: null,
  }));
}

/**
 * Authenticates user credentials and stores the JWT session token.
 * @endpoint POST /auth/login
 * @param {Object} credentials
 * @param {string} credentials.username
 * @param {string} credentials.password
 * @returns {Promise<{token: string, role: string}>}
 */
export async function login(credentials) {
  const result = await requestWithFallback(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    () => ({ token: "mock_jwt_token", role: "teacher" })
  );

  if (result?.access_token || result?.token) {
    const activeToken = result.access_token || result.token;
    localStorage.setItem("token", activeToken);
    if (result.role) {
      localStorage.setItem("user_role", result.role.toLowerCase());
    }
  }

  return result;
}

/**
 * Authenticates using an external SSO token and creates an active session.
 * @endpoint POST /auth/external-login
 * @param {{role: string, token?: string, username?: string}} data
 * @returns {Promise<{token: string, role: string, user: Object}>}
 */
export async function externalLogin(data) {
  const result = await requestWithFallback(
    "/auth/external-login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    () => ({ token: data.token || "session_token", role: data.role || "teacher" })
  );

  if (result?.access_token || result?.token) {
    const activeToken = result.access_token || result.token;
    localStorage.setItem("token", activeToken);
    if (result.role) {
      localStorage.setItem("user_role", result.role.toLowerCase());
    }
  }

  return result;
}

/**
 * Terminates user session and removes local auth tokens.
 * @endpoint POST /auth/logout
 * @returns {Promise<{success: boolean}>}
 */
export async function logout() {
  return requestWithFallback(
    "/auth/logout",
    { method: "POST" },
    () => {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      return { success: true };
    }
  );
}

/**
 * Updates profile information for the current user.
 * @endpoint PUT /user/profile
 * @param {Partial<import("../types").UserProfile>} profileData
 * @returns {Promise<Object>}
 */
export async function updateProfile(profileData) {
  return requestWithFallback(
    "/user/profile",
    {
      method: "PUT",
      body: JSON.stringify(profileData),
    },
    () => ({ success: true, profile: profileData })
  );
}

/**
 * Retrieves user theme, language and preferences from new backend.
 * @endpoint GET /users/me/settings
 * @returns {Promise<{theme?: string, language?: string, appearance?: Object}>}
 */
export async function getUserSettings() {
  return requestWithFallback(
    "/users/me/settings",
    { method: "GET" },
    () => ({
      theme: localStorage.getItem("theme") || "light",
      language: localStorage.getItem("language") || "fa",
    })
  );
}

/**
 * Persists user theme and language to new backend.
 * @endpoint PATCH /users/me/settings
 * @param {Object} settings
 * @param {string} [settings.theme]
 * @param {string} [settings.language]
 * @param {Object} [settings.appearance]
 * @returns {Promise<Object>}
 */
export async function updateUserSettings(settings) {
  return requestWithFallback(
    "/users/me/settings",
    {
      method: "PATCH",
      body: JSON.stringify(settings),
    },
    () => settings
  );
}

export const authApi = {
  getCurrentUserProfile,
  login,
  externalLogin,
  logout,
  updateProfile,
  getUserSettings,
  updateUserSettings,
};

export default authApi;
