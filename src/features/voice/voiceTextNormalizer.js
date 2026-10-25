/**
 * @file voiceTextNormalizer.js
 * @description Advanced Persian/Bilingual TTS pre-processing, punctuation enhancement, and speech phrasing pipeline.
 * Designed for academic oral exams and bilingual speech synthesis:
 * 1. Checks if the text is pure English; if so, it is preserved completely as-is.
 * 2. Intelligent Parentheses Resolution:
 *    - Translation + English term (e.g. "هسته (kernel)"): converts to "هسته، یا kernel،"
 *    - Loanword + English spelling (e.g. "کش (cache)", "کشینگ (caching)"): avoids awkward repetition and cleanly resolves to "کش" or "کشینگ".
 *    - Explanatory parentheses (e.g. "(به عنوان مثال)"): converts to natural pause commas "، به عنوان مثال،".
 * 3. English Words Preservation (No Fingilish):
 *    - English technical words are PRESERVED in authentic Latin script so that the dedicated English voice model can synthesize them with natural pronunciation.
 * 4. Punctuation for Breathing & Phrasing (Instead of Diacritics/اعراب):
 *    - Strips all vocalization diacritics / اعراب (fathe, kasre, zamme, tanvin, ezafe markers) to prevent robotic speech artifacts.
 *    - Strategically inserts commas (،) and periods (.) before conjunctions, after discourse markers, and around loanwords to guarantee natural human-like cadence and breathing pauses.
 */

import API_CONFIG from "../../api/config.js";

// In-memory cache: "course:::text" -> normalizedText
const normalizerCache = new Map();

export const PERSIAN_STRUCTURAL_WORDS = new Set([
  "در", "به", "با", "از", "برای", "که", "تا", "و", "یا", "این", "آن", "است", "شد", "بود",
  "باشد", "می‌شود", "میشود", "توضیح", "دهید", "کنید", "چیست", "چگونه", "چرا", "کدام",
  "آیا", "بررسی", "تعریف", "مقایسه", "نقش", "تفاوت", "بین", "نحوه", "عملکرد", "سیستم",
  "حافظه", "مدیریت", "انجام", "مگر", "حتی", "نیز", "همیشه", "نیست", "کاربرد", "برنامه",
  "سخت‌افزار", "نرم‌افزار", "پردازش", "پاسخ", "مفاهیم", "ساختار", "روان", "روش", "چند",
  "یک", "دو", "سه", "چهار", "پنج", "مورد", "مزایا", "معایب", "ویژگی", "ویژگی‌های",
  "را", "هم", "دیگر", "یکدیگر", "بگوییم", "اجرا", "دارند", "ارائه", "مجموعه", "حل"
]);

export const ENGLISH_STRUCTURAL_WORDS = new Set([
  "the", "is", "are", "was", "were", "of", "in", "to", "and", "a", "an", "that", "this",
  "for", "as", "with", "by", "on", "at", "from", "which", "what", "how", "why", "who",
  "when", "where", "explain", "describe", "compare", "based", "provided", "act", "acts",
  "provide", "consisting", "running", "parallel", "hide", "effects", "between", "does",
  "do", "did", "can", "could", "would", "should", "will", "discuss", "define", "outline",
  "list", "following", "true", "false", "difference", "differences"
]);

/**
 * Intelligently determines if text is primarily English or Persian with English loanwords:
 * - If English text: returns 'en' (must be preserved completely as-is).
 * - If Persian sentence containing English loanwords: returns 'fa' (must be vocalized to Persian).
 */
export function detectTextLanguage(text) {
  if (!text || typeof text !== "string") return "fa";
  const clean = text.trim();
  if (!clean) return "fa";

  // Strip metadata/question number prefixes (e.g. "سوال ۱:", "Question 2:")
  const cleanBody = clean.replace(/^(?:سوال|پرسش|پاسخ|تمرین|تست|درس|question|q)\s*\d*[\s:\-—]*/i, "").trim();

  const persianChars = (cleanBody.match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  if (persianChars === 0) return "en";

  const latinChars = (cleanBody.match(/[a-zA-Z]/g) || []).length;
  if (latinChars === 0) return "fa";

  const persianWords = cleanBody.toLowerCase().match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g) || [];
  const latinWords = cleanBody.toLowerCase().match(/[a-zA-Z]+/g) || [];

  let faStructuralCount = 0;
  for (const w of persianWords) {
    if (PERSIAN_STRUCTURAL_WORDS.has(w)) faStructuralCount++;
  }

  let enStructuralCount = 0;
  for (const w of latinWords) {
    if (ENGLISH_STRUCTURAL_WORDS.has(w)) enStructuralCount++;
  }

  // If predominantly English sentence structure (English verbs/prepositions without Persian structural tokens)
  if (enStructuralCount >= 2 && faStructuralCount === 0) {
    return "en";
  }

  // If Persian structure or multiple Persian words present, it is a Persian sentence with loanwords
  if (faStructuralCount >= 1 || persianWords.length >= 2) {
    return "fa";
  }

  return persianWords.length >= latinWords.length ? "fa" : "en";
}

/**
 * Checks whether the text is Persian context (returns false for pure English).
 */
export function isPersianText(text) {
  return detectTextLanguage(text) === "fa";
}

/**
 * Resolves Persian (English) parentheses:
 * 1. "هسته (kernel)" -> "هسته، یا kernel،"
 * 2. "کش (cache)" -> "کش"
 * 3. "کشینگ (caching)" -> "کشینگ"
 * 4. "(توضیح بیشتر)" -> "، توضیح بیشتر،"
 * English words are kept in English without transliteration to Fingilish.
 */
export function resolveParenthesesTerms(text) {
  if (!text) return "";
  let res = String(text);

  // 1. Avoid repetition for direct loanwords: کش (cache) -> کش
  res = res.replace(/(کش|کَش)\s*\(\s*cache\s*\)/gi, "$1");
  res = res.replace(/(کشینگ|کَشینگ)\s*\(\s*caching\s*\)/gi, "$1");

  // 2. Persian word followed by an English term in parentheses: e.g. "هسته (kernel)" -> "هسته، یا kernel،"
  const pattern = /([\u0600-\u06FF]+)\s*\(([a-zA-Z0-9_\-\s]{2,30})\)/g;
  res = res.replace(pattern, (match, fa, enRaw) => {
    const enClean = enRaw.trim();
    return `${fa}، یا ${enClean}،`;
  });

  // 3. Standalone English in parentheses: (context switch) -> ، یا context switch،
  res = res.replace(/\(\s*([a-zA-Z0-9_\-\s]{2,30})\s*\)/g, "، یا $1،");

  // 4. Explanatory parentheses: (توضیح) -> ، توضیح،
  res = res.replace(/\(([^)]+)\)/g, "، $1،");
  res = res.replace(/[()]/g, "");

  return res;
}

/**
 * Backwards compatibility placeholder:
 * Strips any diacritics and ensures clean spacing around CS terms without inserting اعراب.
 */
export function disambiguateTechnicalPersian(text) {
  if (!text) return "";
  let res = String(text);
  res = res.replace(/[\u064B-\u065F\u0670ـِ]/g, "");
  res = res.replace(/\bحافظه\s+کش\b/g, "حافظه کش");
  res = res.replace(/\bسطح\s+کش\b/g, "سطح کش");
  return res;
}

const PERSIAN_DIGIT_WORDS = [
  "صفر", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه", "ده",
  "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده", "بیست"
];

const TENS_WORDS = {
  20: "بیست", 30: "سی", 40: "چهل", 50: "پنجاه",
  60: "شصت", 70: "هفتاد", 80: "هشتاد", 90: "نود"
};

function numberToPersianWords(num) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return num;
  if (n <= 20) return PERSIAN_DIGIT_WORDS[n] || String(n);
  if (n < 100) {
    const tens = Math.floor(n / 10) * 10;
    const units = n % 10;
    if (units === 0) return TENS_WORDS[tens] || String(n);
    return `${TENS_WORDS[tens]} و ${PERSIAN_DIGIT_WORDS[units]}`;
  }
  return String(n);
}

/**
 * Enhances text with punctuation (commas and periods) to create natural pauses and phrasing for TTS,
 * replacing phonetic diacritics / vowels. Preserves English words completely.
 */
export function enhancePunctuationForTTS(text) {
  if (!text) return "";
  let res = String(text);

  // 1. Remove all diacritics (اعراب: فتح، ضمه، کسره، تنوین، تشدید، سکون و کسره اضافه)
  res = res.replace(/[\u064B-\u065F\u0670ـِ]/g, "");

  // 2. Normalize markdown & special chars
  res = res.replace(/[{}[\]_#*\\/|~^]/g, " ");
  res = res.replace(/[:;؛]/g, "،");
  res = res.replace(/[\u061F\?]+/g, "؟");
  res = res.replace(/[!]+/g, ".");

  // 3. Commas before major conjunctions if not already punctuated
  const conjunctions = [
    "چرا که", "چراکه", "به‌طوری‌که", "به طوری که", "به همین دلیل",
    "در نتیجه", "بنابراین", "از این رو", "همچنین", "اما", "ولی", "زیرا", "بلکه"
  ];
  for (const conj of conjunctions) {
    const regex = new RegExp(`(?<![،,.:؛?!؟\\s])\\s+(${conj})\\b`, "g");
    res = res.replace(regex, "، $1");
  }

  // 'که' with negative lookbehind to avoid 'این‌که', 'آن‌که'
  res = res.replace(/(?<![،,.:؛?!؟\s\u200c])\s+(که)\b/g, "، که");

  // 4. Commas after introductory phrases
  const introPhrases = [
    "به عنوان مثال", "برای نمونه", "مثلاً", "مثلا", "در واقع",
    "به طور کلی", "به‌طور کلی", "از طرفی", "از سوی دیگر", "در این حالت", "در این صورت", "در نهایت"
  ];
  for (const intro of introPhrases) {
    const regex = new RegExp(`(^|[.،؟!\n]\\s*)(${intro})\\s+(?![،,])`, "g");
    res = res.replace(regex, "$1$2، ");
  }

  // 5. Question/Numbered list prefixes
  res = res.replace(/^(سوال|پرسش|مورد|بخش)\s*([۰-۹\d]+)\s*[:\-—]/gm, "$1 $2. ");
  res = res.replace(/^([۰-۹\d]+)\s*[\-—]\s*/gm, "$1. ");

  // 6. Deduplicate & cleanup punctuation and spacing
  res = res.replace(/\s*،\s*/g, "، ");
  res = res.replace(/،(\s*،)+/g, "،");
  res = res.replace(/\s*\.\s*/g, ". ");
  res = res.replace(/\.(\s*\.)+/g, ".");
  res = res.replace(/،\s*\./g, ".");
  res = res.replace(/،\s*؟/g, "؟");
  res = res.replace(/\.\s*؟/g, "؟");
  res = res.replace(/\s+/g, " ").trim();

  // 7. Ensure ending punctuation
  if (res && !/[.؟!؟]$/.test(res)) {
    res += ".";
  }

  return res;
}

/**
 * Pre-normalization pass:
 * 1. Checks if text is English; if so, returns untouched.
 * 2. Cleans markdown.
 * 3. Resolves parentheses with "یا" while keeping English words intact.
 * 4. Expands percentages.
 * 5. Enhances punctuation (adds pauses with commas and periods, no اعراب).
 */
export function preNormalizeText(text, courseContext = "سیستم‌های عامل") {
  if (!text) return "";
  if (detectTextLanguage(text) === "en") return text;

  let res = String(text);

  // 1. Remove Markdown code blocks & ticks
  res = res.replace(/```[\s\S]*?```/g, " ");
  res = res.replace(/`([^`]+)`/g, "$1");
  res = res.replace(/[*#_~>]/g, " ");

  // 2. Intelligent parentheses resolution ("هسته (kernel)" -> "هسته، یا kernel،")
  res = resolveParenthesesTerms(res);

  // 3. Expand percentages
  res = res.replace(/(\d+)\s*%/g, "$1 درصد");
  res = res.replace(/(\d+)\s*٪/g, "$1 درصد");

  // 4. Enhance punctuation for natural pauses
  res = enhancePunctuationForTTS(res);

  return res.replace(/\s+/g, " ").trim();
}

/**
 * Post-pass sanitizer:
 * - Strips LLM artifacts
 * - Strips all diacritics / اعراب
 * - Converts standalone digits to Persian words
 * - Preserves English words in Latin script (does NOT convert to Fingilish)
 * - Enhances punctuation for cadence
 */
export function postSanitizeText(text) {
  if (!text) return "";
  if (detectTextLanguage(text) === "en") return text;

  let res = String(text);

  // Strip LLM echoes like "درس: سیستم‌های عامل" or "متن: "
  res = res.replace(/^درس:[^\n]*\n?/gm, "");
  res = res.replace(/^متن:[^\n]*\n?/gm, "");

  // Strip all diacritics / اعراب
  res = res.replace(/[\u064B-\u065F\u0670ـِ]/g, "");

  // Remove any remaining parentheses
  res = res.replace(/\(([^)]+)\)/g, "، $1،");
  res = res.replace(/[()]/g, "");

  // Convert standalone digits to Persian words
  res = res.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  res = res.replace(/\b(\d{1,2})\b/g, (m) => numberToPersianWords(m));

  // Enhance punctuation
  res = enhancePunctuationForTTS(res);

  return res;
}

/**
 * Normalizes text for TTS:
 * - English text is preserved completely as-is.
 * - In Persian text, English words are preserved in English (read by dedicated English voice model).
 * - Parentheses with English terms are converted to "یا" with pause commas.
 * - Punctuation (commas and periods) is added for natural pauses instead of phonetic diacritics (اعراب).
 */
export async function normalizeTextForTTS(rawText, courseContext = "سیستم‌های عامل", options = {}) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  // 0. Language Detection:
  if (detectTextLanguage(rawText) === "en") {
    return rawText;
  }

  const cleanCourse = (courseContext || "سیستم‌های عامل").trim();
  const cacheKey = `${cleanCourse}:::${rawText.trim()}`;

  if (!options.forceRefresh && normalizerCache.has(cacheKey)) {
    return normalizerCache.get(cacheKey);
  }

  // 1. Deterministic pre-normalization (0ms)
  const prepared = preNormalizeText(rawText, cleanCourse);

  const vocalizeEndpoint =
    typeof window !== "undefined"
      ? "/api/v1/llm/vocalize"
      : `${(API_CONFIG.BACKEND_URL || "http://localhost:7000").replace(/\/+$/, "")}/api/v1/llm/vocalize`;

  const timeoutMs = options.timeoutMs || 45000;

  try {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    const hybridResponse = await fetch(vocalizeEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: rawText,
        course_context: cleanCourse,
        apply_ezafe: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutTimer);

    if (hybridResponse.ok) {
      const hybridData = await hybridResponse.json();
      if (hybridData?.detected_language === "en") {
        normalizerCache.set(cacheKey, rawText);
        return rawText;
      }
      const vocalized = hybridData?.vocalized_text?.trim();
      if (vocalized && vocalized.length > 3) {
        const sanitized = postSanitizeText(vocalized);
        normalizerCache.set(cacheKey, sanitized);
        return sanitized;
      }
    }
  } catch (hybridErr) {
    console.debug(
      `[voiceTextNormalizer] Vocalize service unavailable (${hybridErr.name}: ${hybridErr.message}), falling back.`
    );
  }

  // Deterministic rule-based fallback
  const fallback = postSanitizeText(prepared);
  normalizerCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Pre-warms normalization in the background without blocking.
 */
export function warmupQuestionNormalization(rawText, courseContext = "سیستم‌های عامل") {
  if (!rawText || typeof rawText !== "string") return;
  if (detectTextLanguage(rawText) === "en") return;
  const cleanCourse = (courseContext || "سیستم‌های عامل").trim();
  const cacheKey = `${cleanCourse}:::${rawText.trim()}`;
  if (normalizerCache.has(cacheKey)) return;

  normalizeTextForTTS(rawText, cleanCourse).catch((e) => {
    console.debug("[voiceTextNormalizer] Pre-warm silent ignore:", e.message);
  });
}

export default {
  normalizeTextForTTS,
  warmupQuestionNormalization,
  detectTextLanguage,
  isPersianText,
  preNormalizeText,
  postSanitizeText,
  resolveParenthesesTerms,
  disambiguateTechnicalPersian,
  enhancePunctuationForTTS
};
