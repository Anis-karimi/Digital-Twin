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
 * Checks whether the selected answer is incorrect relative to the correct answer.
 * @param {string|number} selectedAnswer
 * @param {string|number} answer
 * @param {Array} options
 * @returns {boolean}
 */
function checkIfIncorrect(selectedAnswer, answer, options) {
  if (selectedAnswer === undefined || selectedAnswer === null) return false;
  const sel = String(selectedAnswer).trim();
  const ans = String(answer || "").trim();
  if (!sel || ["unanswered", "بی‌پاسخ", "none", "null", "undefined"].includes(sel.toLowerCase())) {
    return false;
  }
  if (!ans) return false;
  if (sel.toLowerCase() === ans.toLowerCase()) return false;

  const enLetters = ["a", "b", "c", "d", "e"];
  const faLetters = ["الف", "ب", "ج", "د", "هـ"];
  const numLetters = ["1", "2", "3", "4", "5"];

  const getIdx = (v) => {
    const clean = String(v).toLowerCase().replace(/[\)\.:\-]/g, "").trim();
    let idx = enLetters.indexOf(clean);
    if (idx !== -1) return idx;
    idx = faLetters.indexOf(clean);
    if (idx !== -1) return idx;
    idx = numLetters.indexOf(clean);
    if (idx !== -1) return idx;
    for (let i = 0; i < 5; i++) {
      if (
        clean.startsWith(`گزینه ${faLetters[i]}`) ||
        clean.startsWith(`گزینه ${numLetters[i]}`) ||
        clean.startsWith(`گزینه ${enLetters[i]}`)
      ) {
        return i;
      }
      if (String(v).startsWith(`${enLetters[i]})`) || String(v).startsWith(`${faLetters[i]})`)) {
        return i;
      }
    }
    if (Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        const optText = typeof opt === "object" ? (opt.text || opt.answer || "") : String(opt);
        if (optText && (v.toLowerCase() === optText.toLowerCase() || optText.toLowerCase().includes(v.toLowerCase()))) {
          return i;
        }
      }
    }
    return null;
  };

  const selIdx = getIdx(sel);
  const ansIdx = getIdx(ans);
  if (selIdx !== null && ansIdx !== null) {
    return selIdx !== ansIdx;
  }
  return sel.toLowerCase() !== ans.toLowerCase();
}

/**
 * Builds the prepared pedagogical prompt for the Qwen LLM server.
 * Instructs the model to output scientific reasoning, plus mistake reason ONLY if incorrect.
 * @param {Object} params
 * @returns {{systemPrompt: string, userPrompt: string}}
 */
function buildExplanationPrompt({ question, options, answer, selectedAnswer }) {
  const isIncorrect = checkIfIncorrect(selectedAnswer, answer, options);
  const optionsText = formatOptionsText(options);
  const parts = [`صورت سوال: ${question}`];

  if (optionsText) {
    parts.push(`گزینه‌ها:\n${optionsText}`);
  }

  if (answer !== undefined && answer !== null && String(answer).trim()) {
    parts.push(`گزینه صحیح: ${answer}`);
  }

  if (isIncorrect) {
    const systemPrompt =
      "شما یک استاد و تحلیل‌گر آزمون هستید. برای این سوال، فقط و فقط دو بخش زیر را بسیار صریح، کوتاه و علمی بنویس:\n" +
      "۱. استدلال علمی: دلیل علمی درستی گزینه صحیح در ۱ الی ۲ جمله کوتاه.\n" +
      "۲. علت اشتباه احتمالی: در ۱ جمله کوتاه توضیح بده چرا گزینه انتخابی کاربر نادرست است یا چه تله مفهومی وجود داشته است.\n" +
      "قوانین اکید: از هرگونه سلام، مقدمه‌چینی، بررسی سایر گزینه‌ها و بخش‌بندی‌های دیگر اکیداً خودداری کن.";

    if (
      selectedAnswer !== undefined &&
      selectedAnswer !== null &&
      String(selectedAnswer).trim()
    ) {
      parts.push(`گزینه انتخابی اشتباه کاربر: ${selectedAnswer}`);
    }

    parts.push(
      "فقط استدلال علمی گزینه صحیح و در ادامه علت اشتباه احتمالی کاربر را بنویس:"
    );

    return { systemPrompt, userPrompt: parts.join("\n\n") };
  }

  const systemPrompt =
    "شما یک استاد و تحلیل‌گر آزمون هستید. تنها وظیفه شما بیان استدلال علمی درستی گزینه صحیح است.\n" +
    "قوانین اکید:\n" +
    "۱. فقط و فقط استدلال علمی درستی پاسخ صحیح را در ۱ الی ۲ جمله کوتاه، صریح و علمی بنویس.\n" +
    "۲. از نوشتن هرگونه بخش دیگری (مانند مقدمه، سلام، بررسی سایر گزینه‌ها، علت اشتباه یا نکات اضافی) اکیداً خودداری کن.";

  parts.push("فقط استدلال علمی درستی گزینه صحیح را بنویس:");

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
