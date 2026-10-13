/**
 * @file admin.api.js
 * @description API service for system administration, courses management, and users directory.
 */

import { requestWithFallback } from "../client";
import { getAdminSettings } from "../existing/admin.api";

export { getAdminSettings };

/**
 * Fetches high-level administrative dashboard metrics.
 */
export async function getAdminOverview() {
  return await requestWithFallback(
    "/admin/overview",
    { method: "GET" },
    () => ({
      total_courses: 1,
      active_courses: 1,
      total_users: 22,
      total_students: 17,
      total_teachers: 3,
      total_admins: 1,
      total_enrollments: 17,
    })
  );
}

/**
 * Fetches all courses with teacher details and student counts.
 */
export async function getAdminCourses() {
  return await requestWithFallback(
    "/admin/courses",
    { method: "GET" },
    () => [
      {
        course_id: "c0000000-0000-4000-8000-000000000001",
        title: "سیستم عامل",
        description: "مفاهیم پایه‌ای سیستم‌های عامل، فرآیندها، نخ‌ها، زمان‌بندی پردازنده و مدیریت حافظه",
        subject: "مهندسی کامپیوتر",
        units: 3,
        teacher_name: "دکتر محمد اله بخش",
        teacher_username: "mohammad_allahbakhsh",
        is_active: true,
        is_public: true,
        students_count: 17,
      },
    ]
  );
}

/**
 * Registers a new course in the system.
 */
export async function createAdminCourse(payload) {
  return await requestWithFallback("/admin/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches users directory with role and query filters.
 */
export async function getAdminUsers({ role = "ALL", q = "", limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (role && role !== "ALL") params.append("role", role);
  if (q) params.append("q", q);
  if (limit) params.append("limit", String(limit));

  return await requestWithFallback(
    `/admin/users?${params.toString()}`,
    { method: "GET" },
    () => []
  );
}

/**
 * Fetches list of active teachers for dropdown selection.
 */
export async function getAdminTeachers() {
  return await requestWithFallback(
    "/admin/teachers",
    { method: "GET" },
    () => []
  );
}

/**
 * Fetches all members of a specific course.
 */
export async function getCourseMembers(courseId) {
  return await requestWithFallback(
    `/admin/courses/${courseId}/members`,
    { method: "GET" },
    () => []
  );
}

/**
 * Fetches students not enrolled in the course yet.
 */
export async function getAvailableStudents(courseId) {
  return await requestWithFallback(
    `/admin/courses/${courseId}/available-students`,
    { method: "GET" },
    () => []
  );
}

/**
 * Reassigns the teacher/instructor for a course.
 */
export async function assignCourseTeacher(courseId, teacherId) {
  return await requestWithFallback(`/admin/courses/${courseId}/teacher`, {
    method: "POST",
    body: JSON.stringify({ teacher_id: teacherId }),
  });
}

/**
 * Adds a student or user to a course.
 */
export async function addCourseMember(courseId, userId, role = "STUDENT") {
  return await requestWithFallback(`/admin/courses/${courseId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role }),
  });
}

/**
 * Removes a student or member from a course.
 */
export async function removeCourseMember(courseId, userId) {
  return await requestWithFallback(`/admin/courses/${courseId}/members/${userId}`, {
    method: "DELETE",
  });
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
