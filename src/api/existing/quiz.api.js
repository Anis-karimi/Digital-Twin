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

/**
 * Builds the prepared pedagogical prompt for the Qwen LLM server.
 * @param {Object} params
 * @returns {{systemPrompt: string, userPrompt: string}}
 */
function buildExplanationPrompt({ question, options, answer, selectedAnswer }) {
  const systemPrompt =
    "شما یک استاد دانشگاه و متخصص آموزشی با تجربه و مسلط هستید.\n" +
    "وظیفه شما تحلیل دقیق و تشریحی سوال آزمون و ارائه یک پاسخنامه تحلیلی، مستدل، آموزنده و جامع به زبان فارسی است.\n" +
    "پاسخ باید ساختاریافته، بسیار روان، علمی و با رعایت نکات نگارشی فارسی باشد.";

  const optionsText = formatOptionsText(options);

  const parts = [
    "لطفاً سوال آزمون چهارگزینه‌ای زیر را به شکل کامل و جامع تشریح و تحلیل کنید:\n",
    `**صورت سوال:**\n${question}\n`,
  ];

  if (optionsText) {
    parts.push(`**گزینه‌ها:**\n${optionsText}\n`);
  }

  if (answer !== undefined && answer !== null && String(answer).trim()) {
    parts.push(`**پاسخ صحیح اعلام‌شده:** ${answer}\n`);
  }

  if (
    selectedAnswer !== undefined &&
    selectedAnswer !== null &&
    String(selectedAnswer).trim()
  ) {
    parts.push(`**پاسخ انتخابی دانشجو:** ${selectedAnswer}\n`);
  }

  parts.push(
    "لطفاً پاسخ را در قالبی کاملاً ساختاریافته و با عناوین زیر ارائه دهید:\n\n" +
      "۱. **پاسخ صحیح و استدلال علمی:**\n" +
      "گزینه یا پاسخ درست را مشخص کرده و منطق علمی و مستدل پشت آن را به طور کامل توضیح دهید.\n\n" +
      "۲. **تحلیل و رد سایر گزینه‌ها:**\n" +
      "سایر گزینه‌ها را به تفکیک بررسی کنید و علت نادرست بودن یا تله مفهومی آن‌ها را مشخص کنید.\n\n" +
      "۳. **نکته کلیدی آموزشی:**\n" +
      "یک جمع‌بندی مفهومی یا نکته مهم امتحانی مرتبط با این مبحث برای یادگیری عمیق‌تر ارائه دهید."
  );

  if (
    selectedAnswer !== undefined &&
    selectedAnswer !== null &&
    answer !== undefined &&
    answer !== null &&
    String(selectedAnswer).trim() !== String(answer).trim()
  ) {
    parts.push(
      "\n۴. **علت اشتباه احتمالی دانشجو:**\n" +
        "دلیل انتخاب این گزینه نادرست توسط دانشجو و کج‌فهمی رایج در این زمینه را توضیح دهید."
    );
  }

  return { systemPrompt, userPrompt: parts.join("\n") };
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

  const { systemPrompt, userPrompt } = buildExplanationPrompt({
    question,
    options,
    answer,
    selectedAnswer,
  });

  // 1. Primary Strategy: Call the Core Backend /api/v1/quiz/explain-answer
  try {
    const backendUrl = `${API_CONFIG.NEW_BACKEND_URL}/quiz/explain-answer`;
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
        timeout: 45000,
      },
      "json"
    );

    if (data?.explanation && typeof data.explanation === "string" && data.explanation.trim()) {
      return data.explanation.trim();
    }
  } catch (backendError) {
    console.warn(
      "[QuizApi] Core backend explain-answer failed, attempting direct LLM fallback:",
      backendError.message
    );
  }

  // 2. Direct Strategy: Query the Qwen LLM server (http://94.184.177.171:8000/v1)
  try {
    const isBrowser = typeof window !== "undefined";
    const isDev = isBrowser && window.location.port === "5173";

    // Use Vite proxy in dev to avoid browser CORS/Mixed Content restrictions
    const directUrl = isDev
      ? "/llm-proxy/v1/chat/completions"
      : `${API_CONFIG.LLM_BASE_URL}/chat/completions`;

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
          temperature: 0.3,
          max_tokens: 1500,
        }),
        timeout: 45000,
      },
      "json"
    );

    const content = llmData?.choices?.[0]?.message?.content;
    if (content && typeof content === "string" && content.trim()) {
      return content.trim();
    }
  } catch (llmError) {
    console.error("[QuizApi] Direct LLM request failed:", llmError.message);
  }

  return "در حال حاضر امکان ارتباط با سرور تحلیل هوش مصنوعی وجود ندارد. لطفاً دقایقی دیگر تلاش فرمایید.";
}

export const quizApi = {
  generateQuiz,
  explainAnswer,
};

export default quizApi;
