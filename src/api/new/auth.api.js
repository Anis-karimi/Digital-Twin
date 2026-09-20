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
  return requestWithFallback(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(credentials),
    },
    () => ({ token: "mock_jwt_token", role: "teacher" })
  );
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

export const authApi = {
  getCurrentUserProfile,
  login,
  logout,
  updateProfile,
};

export default authApi;
