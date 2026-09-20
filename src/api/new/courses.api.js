/**
 * @file courses.api.js
 * @description Courses management API module for the new backend with local mock fallback.
 */

import { requestWithFallback } from "../client";
import { courses as mockCourses } from "@/data/courses";

/**
 * Fetches all courses available to the active user.
 * @endpoint GET /courses
 * @returns {Promise<import("../types").Course[]>}
 */
export async function getCourses() {
  return requestWithFallback("/courses", { method: "GET" }, () => mockCourses);
}

/**
 * Fetches a specific course by its identifier.
 * @endpoint GET /courses/:id
 * @param {string} courseId Course ID (e.g. 'os')
 * @returns {Promise<import("../types").Course>}
 */
export async function getCourseById(courseId) {
  return requestWithFallback(`/courses/${courseId}`, { method: "GET" }, () => {
    const found = mockCourses.find((c) => String(c.id) === String(courseId));
    return (
      found || {
        id: courseId,
        title: "سیستم عامل",
        titleFa: "سیستم عامل",
        titleEn: "سیستم عامل",
        preview: "",
        date: new Date().toISOString(),
        unreadCount: 0,
      }
    );
  });
}

/**
 * Fetches course metadata and timeline cards (start date, end date, description, access level).
 * @endpoint GET /courses/:id/details
 * @param {string} courseId Course ID
 * @returns {Promise<Object>}
 */
export async function getCourseDetails(courseId) {
  return requestWithFallback(`/courses/${courseId}/details`, { method: "GET" }, () => ({
    courseId,
    name: "سیستم عامل",
    nameFa: "سیستم عامل",
    nameEn: "سیستم عامل",
    startDate: "2026-03-01",
    endDate: "2026-07-01",
    description:
      "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی)",
    accessLevel: "private",
  }));
}

/**
 * Updates course metadata and settings.
 * @endpoint PUT /courses/:id/details
 * @param {string} courseId Course ID
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
