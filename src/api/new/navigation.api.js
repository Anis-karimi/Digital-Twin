/**
 * @file navigation.api.js
 * @description Dynamic navigation tabs and student course enrollment endpoints.
 */

import { requestWithFallback } from "../client";
import { lessonItems as mockLessonItems } from "@/data/LessonsNavBar";
import { courses as mockCourses } from "@/data/courses";

/**
 * Fetches dynamic course tabs for the teacher top navigation bar.
 * @endpoint GET /navigation/lesson-tabs
 * @returns {Promise<Array<Object>>}
 */
export async function getLessonTabs() {
  const res = await requestWithFallback(
    "/navigation/lesson-tabs",
    { method: "GET" },
    () => mockLessonItems
  );
  return Array.isArray(res) && res.length > 0 ? res : mockLessonItems;
}

/**
 * Fetches the catalogue of all courses offered across the platform for student discovery.
 * @endpoint GET /courses
 * @returns {Promise<import("../types").Course[]>}
 */
export async function getAvailableCourses() {
  const res = await requestWithFallback("/courses", { method: "GET" }, () => mockCourses);
  return Array.isArray(res) && res.length > 0 ? res : mockCourses;
}

/**
 * Submits a student's enrollment request for a specific course.
 * @endpoint POST /student/courses/:courseId/join-request
 * @param {string} courseId
 * @returns {Promise<Object>}
 */
export async function requestJoinCourse(courseId) {
  return requestWithFallback(
    `/student/courses/${courseId}/join-request`,
    { method: "POST" },
    () => ({
      success: true,
      courseId,
      message: "Enrollment request submitted.",
    })
  );
}

export const navigationApi = {
  getLessonTabs,
  getAvailableCourses,
  requestJoinCourse,
};

export default navigationApi;
