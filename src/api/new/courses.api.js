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

export const coursesApi = {
  getCourses,
  getCourseById,
  getCourseDetails,
  updateCourseDetails,
  getCoursesOverview,
};

export default coursesApi;
