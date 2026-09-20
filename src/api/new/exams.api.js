/**
 * @file exams.api.js
 * @description Exam repository, student submissions, and assessment results for the new backend.
 */

import { requestWithFallback } from "../client";

/**
 * Fetches all exams created by the teacher.
 * @endpoint GET /teacher/exams
 * @returns {Promise<Array<Object>>}
 */
export async function getTeacherExams() {
  return requestWithFallback("/teacher/exams", { method: "GET" }, () => []);
}

/**
 * Persists a generated quiz to the database so it can be assigned to students.
 * @endpoint POST /quizzes
 * @param {Object} quizPayload Quiz questions and metadata
 * @returns {Promise<{success: boolean, quizId: string}>}
 */
export async function saveGeneratedQuiz(quizPayload) {
  return requestWithFallback(
    "/quizzes",
    {
      method: "POST",
      body: JSON.stringify(quizPayload),
    },
    () => ({ success: true, quizId: `quiz_${Date.now()}` })
  );
}

/**
 * Submits student answers for grading and report card generation.
 * @endpoint POST /quizzes/:id/submit
 * @param {string} quizId
 * @param {Record<number, string|number>} answers
 * @returns {Promise<import("../types").QuizResult>}
 */
export async function submitQuizAnswers(quizId, answers) {
  return requestWithFallback(
    `/quizzes/${quizId}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    },
    () => ({
      success: true,
      quizId,
      score: 85,
      total: 100,
      submittedAt: new Date().toISOString(),
    })
  );
}

/**
 * Retrieves analytics and grading results for a quiz.
 * @endpoint GET /quizzes/:id/results
 * @param {string} quizId
 * @returns {Promise<Object>}
 */
export async function getQuizResults(quizId) {
  return requestWithFallback(`/quizzes/${quizId}/results`, { method: "GET" }, () => ({
    quizId,
    totalSubmissions: 0,
    averageScore: 0,
  }));
}

export const examsApi = {
  getTeacherExams,
  saveGeneratedQuiz,
  submitQuizAnswers,
  getQuizResults,
};

export default examsApi;
