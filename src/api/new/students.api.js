/**
 * @file students.api.js
 * @description Students roster and member management endpoints connecting to backend with fallback to mock students.
 */

import { requestWithFallback } from "../client";
import { students as mockStudents } from "@/data/students";

/**
 * Fetches all enrolled students for a specific course.
 * @endpoint GET /courses/:courseId/students
 * @param {string} courseId Course ID (UUID or 'os')
 * @returns {Promise<import("../types").Student[]>}
 */
export async function getStudentsByCourse(courseId) {
  const fallbackSupplier = () => {
    const filtered = mockStudents.filter(
      (student) =>
        String(student.lessonId) === String(courseId) ||
        courseId === "os" ||
        !courseId
    );
    return filtered.length > 0 ? filtered : mockStudents.filter((s) => s.lessonId === "os");
  };

  const res = await requestWithFallback(
    `/courses/${courseId}/students`,
    { method: "GET" },
    fallbackSupplier
  );

  return Array.isArray(res) && res.length > 0 ? res : fallbackSupplier();
}

/**
 * Fetches a single student's profile by their identifier.
 * @endpoint GET /students/:id
 * @param {string} studentId Student ID
 * @returns {Promise<import("../types").Student|null>}
 */
export async function getStudentById(studentId) {
  const fallback = () =>
    mockStudents.find((student) => String(student.id) === String(studentId)) ||
    mockStudents.find((student) => String(student.title) === String(studentId)) ||
    mockStudents[0];

  const res = await requestWithFallback(
    `/students/${studentId}`,
    { method: "GET" },
    fallback
  );

  return res || fallback();
}

/**
 * Toggles blocked state for a student in a course.
 * @endpoint PATCH /courses/:courseId/students/:studentId/block
 * @param {string} courseId Course ID
 * @param {string} studentId Student ID
 * @param {boolean} isBlocked Block status
 * @returns {Promise<Object>}
 */
export async function toggleBlockStudent(courseId, studentId, isBlocked) {
  return requestWithFallback(
    `/courses/${courseId}/students/${studentId}/block`,
    {
      method: "PATCH",
      body: JSON.stringify({ blocked: isBlocked }),
    },
    () => ({ success: true, studentId, blocked: isBlocked })
  );
}

/**
 * Removes a student from a course.
 * @endpoint DELETE /courses/:courseId/students/:studentId
 * @param {string} courseId Course ID
 * @param {string} studentId Student ID
 * @returns {Promise<Object>}
 */
export async function removeStudentFromCourse(courseId, studentId) {
  return requestWithFallback(
    `/courses/${courseId}/students/${studentId}`,
    { method: "DELETE" },
    () => ({ success: true, removedStudentId: studentId })
  );
}

export const studentsApi = {
  getStudentsByCourse,
  getStudentById,
  toggleBlockStudent,
  removeStudentFromCourse,
};

export default studentsApi;
