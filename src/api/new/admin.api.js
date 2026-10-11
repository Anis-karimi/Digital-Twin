/**
 * @file admin.api.js
 * @description API service for system administration, courses management, and users directory.
 */

import { API_CONFIG } from "../config";
import { handleApiError } from "../client";
import { getAdminSettings } from "../existing/admin.api";

export { getAdminSettings };

/**
 * Fetches high-level administrative dashboard metrics.
 */
export async function getAdminOverview() {
  try {
    const res = await fetch(`${API_CONFIG.MAIN_SERVICE_URL}/admin/overview`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "getAdminOverview", error);
    return {
      total_courses: 2,
      active_courses: 2,
      total_users: 21,
      total_students: 17,
      total_teachers: 3,
      total_admins: 1,
      total_enrollments: 17,
    };
  }
}

/**
 * Fetches all courses with teacher details and student counts.
 */
export async function getAdminCourses() {
  try {
    const res = await fetch(`${API_CONFIG.MAIN_SERVICE_URL}/admin/courses`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "getAdminCourses", error);
    return [];
  }
}

/**
 * Registers a new course in the system.
 */
export async function createAdminCourse(payload) {
  try {
    const res = await fetch(`${API_CONFIG.MAIN_SERVICE_URL}/admin/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "createAdminCourse", error);
    throw error;
  }
}

/**
 * Fetches users directory with role and query filters.
 */
export async function getAdminUsers({ role = "ALL", q = "", limit = 100 } = {}) {
  try {
    const params = new URLSearchParams();
    if (role && role !== "ALL") params.append("role", role);
    if (q) params.append("q", q);
    if (limit) params.append("limit", String(limit));

    const res = await fetch(
      `${API_CONFIG.MAIN_SERVICE_URL}/admin/users?${params.toString()}`,
      { headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "getAdminUsers", error);
    return [];
  }
}

/**
 * Fetches list of active teachers for dropdown selection.
 */
export async function getAdminTeachers() {
  try {
    const res = await fetch(`${API_CONFIG.MAIN_SERVICE_URL}/admin/teachers`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "getAdminTeachers", error);
    return [];
  }
}

/**
 * Fetches all members of a specific course.
 */
export async function getCourseMembers(courseId) {
  try {
    const res = await fetch(`${API_CONFIG.MAIN_SERVICE_URL}/admin/courses/${courseId}/members`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "getCourseMembers", error);
    return [];
  }
}

/**
 * Fetches students not enrolled in the course yet.
 */
export async function getAvailableStudents(courseId) {
  try {
    const res = await fetch(
      `${API_CONFIG.MAIN_SERVICE_URL}/admin/courses/${courseId}/available-students`,
      { headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "getAvailableStudents", error);
    return [];
  }
}

/**
 * Reassigns the teacher/instructor for a course.
 */
export async function assignCourseTeacher(courseId, teacherId) {
  try {
    const res = await fetch(`${API_CONFIG.MAIN_SERVICE_URL}/admin/courses/${courseId}/teacher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: teacherId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "assignCourseTeacher", error);
    throw error;
  }
}

/**
 * Adds a student or user to a course.
 */
export async function addCourseMember(courseId, userId, role = "STUDENT") {
  try {
    const res = await fetch(`${API_CONFIG.MAIN_SERVICE_URL}/admin/courses/${courseId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "addCourseMember", error);
    throw error;
  }
}

/**
 * Removes a student or member from a course.
 */
export async function removeCourseMember(courseId, userId) {
  try {
    const res = await fetch(
      `${API_CONFIG.MAIN_SERVICE_URL}/admin/courses/${courseId}/members/${userId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    handleApiError("AdminApi", "removeCourseMember", error);
    throw error;
  }
}

export const adminApi = {
  getSettings: getAdminSettings,
  getOverview: getAdminOverview,
  getCourses: getAdminCourses,
  createCourse: createAdminCourse,
  getUsers: getAdminUsers,
  getTeachers: getAdminTeachers,
  getCourseMembers,
  getAvailableStudents,
  assignCourseTeacher,
  addCourseMember,
  removeCourseMember,
};

export default adminApi;
