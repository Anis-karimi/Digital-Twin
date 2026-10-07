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
 * Formats question options into Persian labels (الف، ب، ج، د).
 * @param {Array<string|Object>} options
 * @returns {string}
 */
function formatOptionsText(options) {
  if (!Array.isArray(options) || options.length === 0) return "";
  const labels = ["الف", "ب", "ج", "د", "هـ"];
  return options
    .map((opt, idx) => {
      const label = labels[idx] || `گزینه ${idx + 1}`;
      if (typeof opt === "object" && opt !== null) {
        const text = opt.text || opt.answer || JSON.stringify(opt);
        return `${label}) ${text}`;
      }
      return `${label}) ${opt}`;
    })
    .join("\n");
}

// In-memory cache for fast reuse of already retrieved explanations
const explanationCache = new Map();

/**
 * Builds the prepared pedagogical prompt for the Qwen LLM server.
 * Instructs the model to output a crisp, fast 2-3 line explanation.
 * @param {Object} params
 * @returns {{systemPrompt: string, userPrompt: string}}
 */
function buildExplanationPrompt({ question, options, answer, selectedAnswer }) {
  const systemPrompt =
    "شما یک استاد و مشاور آموزشی هستید. وظیفه شما ارائه تحلیلی بسیار کوتاه، روان و آموزنده برای سوال آزمون در حداکثر ۲ الی ۳ خط است.\n" +
    "قوانین اجباری:\n" +
    "۱. پاسخ باید حداکثر در ۲ الی ۳ خط کوتاه و مفید (حداکثر ۵۰ الی ۷۰ کلمه) باشد.\n" +
    "۲. در خط اول دلیل علمی و قطعی درستی گزینه صحیح را مشخص کن.\n" +
    "۳. در خط دوم نکته کلیدی آموزشی یا تفاوت آن با گزینه انتخابی را ذکر کن.\n" +
    "۴. از سلام، مقدمه‌چینی، نتیجه‌گیری‌های طولانی و بررسی جداگانه تک‌تک گزینه‌ها اکیداً خودداری کن.\n" +
    "۵. پاسخ باید کاملاً روان، علمی و به زبان فارسی باشد.";

  const optionsText = formatOptionsText(options);

  const parts = [`سوال: ${question}`];

  if (optionsText) {
    parts.push(`گزینه‌ها:\n${optionsText}`);
  }

  if (answer !== undefined && answer !== null && String(answer).trim()) {
    parts.push(`پاسخ صحیح: ${answer}`);
  }

  if (
    selectedAnswer !== undefined &&
    selectedAnswer !== null &&
    String(selectedAnswer).trim()
  ) {
    parts.push(`پاسخ انتخابی کاربر: ${selectedAnswer}`);
  }

  parts.push(
    "لطفاً در حداکثر ۲ الی ۳ خط کوتاه و مفید، دلیل درستی گزینه صحیح و نکته کلیدی را توضیح بده:"
  );

  return { systemPrompt, userPrompt: parts.join("\n\n") };
}

/**
 * Fetches an analytical explanation for a specific quiz question using the Qwen LLM.
 * Accepts either a question string or a full question data object.
 *
 * @endpoint POST /api/v1/quiz/explain-answer (or direct Qwen endpoint fallback)
 * @param {string|{question: string, options?: Array, answer?: string|number, selectedAnswer?: string|number, language?: string}} questionData
 * @returns {Promise<string>} Detailed explanation text
 */
export async function explainAnswer(questionData) {
  let question = "";
  let options = [];
  let answer = null;
  let selectedAnswer = null;
  let language = "fa";

  if (typeof questionData === "string") {
    question = questionData.trim();
  } else if (typeof questionData === "object" && questionData !== null) {
    question = (questionData.question || questionData.question_text || "").trim();
    options = questionData.options || [];
    answer = questionData.answer ?? questionData.correct_answer ?? null;
    selectedAnswer = questionData.selectedAnswer ?? questionData.selected_answer ?? null;
    language = questionData.language || "fa";
  }

  if (!question) {
    return "متن سوال نامعتبر است.";
  }

  // Check in-memory cache
  const cacheKey = `${question}::${String(answer || "").trim()}::${String(selectedAnswer || "").trim()}`;
  if (explanationCache.has(cacheKey)) {
    return explanationCache.get(cacheKey);
  }

  const { systemPrompt, userPrompt } = buildExplanationPrompt({
    question,
    options,
    answer,
    selectedAnswer,
  });

  // 1. Primary Strategy: Call Core Backend endpoints via reverse proxy/gateway
  const backendEndpoints = ["/quiz/explain-answer", "/quizzes/explain-answer"];
  for (const endpoint of backendEndpoints) {
    try {
      const backendUrl = `${API_CONFIG.NEW_BACKEND_URL}${endpoint}`;
      const data = await httpRequest(
        backendUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            options,
            answer,
            selected_answer: selectedAnswer,
            language,
          }),
          timeout: 60000,
        },
        "json"
      );

      if (data?.explanation && typeof data.explanation === "string" && data.explanation.trim()) {
        const res = data.explanation.trim();
        if (!res.startsWith("در حال حاضر امکان دریافت تحلیل")) {
          explanationCache.set(cacheKey, res);
        }
        return res;
      }
    } catch (backendError) {
      console.warn(`[QuizApi] Backend ${endpoint} failed:`, backendError.message);
    }
  }

  // 2. Fallback: Only if running via Vite dev proxy on localhost:5173
  try {
    const isBrowser = typeof window !== "undefined";
    const isDev = isBrowser && window.location.port === "5173";

    if (isDev) {
      const directUrl = "/llm-proxy/v1/chat/completions";
      const llmData = await httpRequest(
        directUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: API_CONFIG.LLM_MODEL || "Qwen/Qwen2.5-7B-Instruct-AWQ",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 250,
          }),
          timeout: 60000,
        },
        "json"
      );

      const content = llmData?.choices?.[0]?.message?.content;
      if (content && typeof content === "string" && content.trim()) {
        const res = content.trim();
        explanationCache.set(cacheKey, res);
        return res;
      }
    }
  } catch (llmError) {
    console.error("[QuizApi] Dev LLM proxy request failed:", llmError.message);
  }

  return "در حال حاضر امکان ارتباط با سرور تحلیل هوش مصنوعی وجود ندارد. لطفاً دقایقی دیگر تلاش فرمایید.";
}

export const quizApi = {
  generateQuiz,
  explainAnswer,
};

export default quizApi;
