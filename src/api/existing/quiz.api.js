/**
 * @file quiz.api.js
 * @description Quiz generation and answer explanation endpoints.
 */

import { API_CONFIG } from "../config";
import { httpRequest, handleApiError } from "../client";

/**
 * Requests the LLM to generate a multiple-choice quiz.
 * Completely encapsulates FormData construction and resiliently handles nested JSON parsing.
 * 
 * @endpoint POST /api/generate-quiz
 * @param {import("../types").GenerateQuizRequest} params
 * @returns {Promise<import("../types").QuizQuestion[]>} Array of parsed quiz questions
 */
export async function generateQuiz({
  topic,
  count,
  difficulty = "normal",
  contexts = "",
  language = "en",
  llmModel = "gemma4",
}) {
  try {
    const formData = new FormData();
    formData.append("topic", topic);
    formData.append("count", parseInt(count, 10));
    formData.append("difficulty", difficulty);
    formData.append("contexts", contexts);
    formData.append("language", language);
    formData.append("llm_model", llmModel);

    const url = `${API_CONFIG.BACKEND_URL}/api/generate-quiz`;
    const data = await httpRequest(url, {
      method: "POST",
      body: formData,
    });

    let rawQuiz = data?.quiz;

    // Handle nested or string-encoded JSON outputs from LLM
    if (typeof rawQuiz === "string") {
      rawQuiz = rawQuiz.trim();
      try {
        rawQuiz = JSON.parse(rawQuiz);
      } catch {
        try {
          rawQuiz = JSON.parse(JSON.parse(rawQuiz));
        } catch (parseError) {
          console.error("Failed to parse quiz response:", parseError);
          rawQuiz = [];
        }
      }
    }

    return Array.isArray(rawQuiz) ? rawQuiz : [];
  } catch (error) {
    handleApiError("QuizApi", "generateQuiz", error);
  }
}

/**
 * Fetches an analytical explanation for a specific quiz question.
 * @endpoint POST /api/explain-answer
 * @param {string} question The question prompt to explain
 * @returns {Promise<string>} Detailed explanation text
 */
export async function explainAnswer(question) {
  try {
    const url = `${API_CONFIG.BACKEND_URL}/api/explain-answer`;
    const data = await httpRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    return data?.explanation || "No explanation available.";
  } catch (error) {
    handleApiError("QuizApi", "explainAnswer", error);
  }
}

export const quizApi = {
  generateQuiz,
  explainAnswer,
};

export default quizApi;
