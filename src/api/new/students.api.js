/**
 * @file students.api.js
 * @description Students roster and member management endpoints for the new backend.
 */

import { requestWithFallback } from "../client";
import { students as mockStudents } from "@/data/students";

/**
 * Fetches all enrolled students for a specific course.
 * @endpoint GET /courses/:courseId/students
 * @param {string} courseId Course ID (e.g. 'os')
 * @returns {Promise<import("../types").Student[]>}
 */
export async function getStudentsByCourse(courseId) {
  return requestWithFallback(`/courses/${courseId}/students`, { method: "GET" }, () =>
    mockStudents.filter((student) => String(student.lessonId) === String(courseId))
  );
}

/**
 * Fetches a single student's profile by their identifier.
 * @endpoint GET /students/:id
 * @param {string} studentId Student ID
 * @returns {Promise<import("../types").Student|null>}
 */
export async function getStudentById(studentId) {
  return requestWithFallback(`/students/${studentId}`, { method: "GET" }, () =>
    mockStudents.find((student) => String(student.id) === String(studentId)) || null
  );
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
