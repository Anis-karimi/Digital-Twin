/**
 * @file courses.api.js
 * @description Courses management API module connecting to backend endpoints with robust mock fallbacks.
 */

import { requestWithFallback } from "../client";
import { courses as mockCourses } from "@/data/courses";

/**
 * Fetches all courses available to the active user.
 * @endpoint GET /courses
 * @returns {Promise<import("../types").Course[]>}
 */
export async function getCourses() {
  const res = await requestWithFallback("/courses", { method: "GET" }, () => mockCourses);
  return Array.isArray(res) && res.length > 0 ? res : mockCourses;
}

/**
 * Fetches a specific course by its identifier (UUID or 'os').
 * @endpoint GET /courses/:id
 * @param {string} courseId Course UUID or 'os'
 * @returns {Promise<import("../types").Course>}
 */
export async function getCourseById(courseId) {
  const fallback = () => {
    const found = mockCourses.find(
      (c) => String(c.id) === String(courseId) || courseId === "os"
    );
    return (
      found || {
        id: courseId || "os",
        title: "سیستم عامل",
        titleFa: "سیستم عامل",
        titleEn: "Operating Systems",
        preview:
          "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی",
        date: "2026-04-06T09:30:00Z",
        unreadCount: 0,
      }
    );
  };

  const res = await requestWithFallback(
    `/courses/${courseId}`,
    { method: "GET" },
    fallback
  );
  return res || fallback();
}

/**
 * Fetches course metadata and timeline cards (start date, end date, description, access level).
 * @endpoint GET /courses/:id/details
 * @param {string} courseId Course UUID or 'os'
 * @returns {Promise<Object>}
 */
export async function getCourseDetails(courseId) {
  const fallback = () => ({
    courseId: courseId || "os",
    name: "سیستم عامل",
    nameFa: "سیستم عامل",
    nameEn: "Operating Systems",
    startDate: "2026-03-01",
    endDate: "2026-07-01",
    description:
      "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی",
    accessLevel: "private",
    isActive: true,
    is_active: true,
  });

  const res = await requestWithFallback(
    `/courses/${courseId}/details`,
    { method: "GET" },
    fallback
  );

  return res || fallback();
}

/**
 * Updates course metadata and settings.
 * @endpoint PUT /courses/:id/details
 * @param {string} courseId Course UUID
 * @param {Object} details Updated metadata
 * @returns {Promise<Object>}
 */
export async function updateCourseDetails(courseId, details) {
  return requestWithFallback(
    `/courses/${courseId}/details`,
    {
      method: "PUT",
      body: JSON.stringify(details),
    },
    () => ({ success: true, courseId, data: details })
  );
}

/**
 * Updates course active status directly.
 * @endpoint PATCH /courses/:id/status
 * @param {string} courseId Course UUID
 * @param {boolean} isActive
 * @returns {Promise<Object>}
 */
export async function updateCourseStatus(courseId, isActive) {
  return requestWithFallback(
    `/courses/${courseId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive, is_active: isActive }),
    },
    () => ({ success: true, courseId, isActive })
  );
}

/**
 * Fetches course categories and recent active courses.
 * @endpoint GET /courses/overview
 * @returns {Promise<{categories: Array<{id: string, name: string}>, recentCourses: Array<Object>}>}
 */
export async function getCoursesOverview() {
  return requestWithFallback("/courses/overview", { method: "GET" }, () => ({
    categories: [
      { id: "operating-systems", name: "سیستم عامل" },
      { id: "security", name: "امنیت" },
      { id: "artificial-intelligence", name: "هوش مصنوعی" },
      { id: "software-engineering", name: "مهندسی نرم‌افزار" },
      { id: "technical-language", name: "زبان تخصصی" },
    ],
    recentCourses: [
      { id: "operating-systems", name: "سیستم عامل", visibility: "Private" },
    ],
  }));
}

/**
 * Uploads a new photo/avatar for the course.
 * @endpoint POST /courses/:id/photo
 * @param {string} courseId Course UUID or 'os'
 * @param {File} file Image file
 * @returns {Promise<{success: boolean, courseId: string, photo_url: string}>}
 */
export async function uploadCoursePhoto(courseId, file) {
  const targetId = courseId || "c0000000-0000-4000-8000-000000000001";
  const formData = new FormData();
  formData.append("file", file);

  return requestWithFallback(
    `/courses/${targetId}/photo`,
    {
      method: "POST",
      body: formData,
    },
    () => ({
      success: true,
      courseId: targetId,
      photo_url: URL.createObjectURL(file),
    })
  );
}

/**
 * Deletes the photo/avatar for the course, reverting to default.
 * @endpoint DELETE /courses/:id/photo
 * @param {string} courseId Course UUID or 'os'
 * @returns {Promise<{success: boolean, courseId: string, photo_url: null}>}
 */
export async function deleteCoursePhoto(courseId) {
  const targetId = courseId || "c0000000-0000-4000-8000-000000000001";
  return requestWithFallback(
    `/courses/${targetId}/photo`,
    {
      method: "DELETE",
    },
    () => ({
      success: true,
      courseId: targetId,
      photo_url: null,
    })
  );
}

export const coursesApi = {
  getCourses,
  getCourseById,
  getCourseDetails,
  updateCourseDetails,
  updateCourseStatus,
  uploadCoursePhoto,
  deleteCoursePhoto,
  getCoursesOverview,
};

export default coursesApi;

