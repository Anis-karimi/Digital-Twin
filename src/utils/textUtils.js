/**
 * Checks whether a given string contains Persian or Arabic characters.
 * @param {string|null|undefined} text 
 * @returns {boolean}
 */
export const isPersianText = (text) => {
  if (!text || typeof text !== "string") return false;
  // Unicode range for Arabic & Persian script
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

/**
 * Returns 'rtl' if text contains Persian characters, else defaultDir ('ltr' or 'rtl').
 * @param {string|null|undefined} text 
 * @param {'ltr'|'rtl'} defaultDir 
 * @returns {'ltr'|'rtl'}
 */
export const getTextDirection = (text, defaultDir = "ltr") => {
  return isPersianText(text) ? "rtl" : defaultDir;
};

/**
 * Returns Persian font class if text is Persian, else default font.
 * @param {string|null|undefined} text 
 * @param {string} defaultFont 
 * @returns {string}
 */
export const getTextFontClass = (text, defaultFont = "font-inter") => {
  return isPersianText(text) ? "font-vazir" : defaultFont;
};

/**
 * Cleans and normalizes chat messages and LLM responses.
 * - Extracts answer from JSON strings or objects if passed.
 * - Converts escaped Unicode characters like \u200c to real characters (e.g. Persian نیم‌فاصله).
 * - Converts escaped newlines (\n, \r\n, \\n) to real newline breaks.
 * - Unescapes escaped quotes and slashes.
 * - Normalizes Persian ZWNJ (نیم‌فاصله) spaces and multiple breaks.
 * 
 * @param {string|object|null|undefined} rawText 
 * @returns {string} Cleaned, human-readable text
 */
export const cleanMessageText = (rawText) => {
  if (rawText == null) return "";

  let text = rawText;
  if (typeof text === "object") {
    text =
      text.answer ||
      text.response ||
      text.message ||
      text.text ||
      JSON.stringify(text);
  }
  text = String(text);

  // If text is a stringified JSON object e.g. {"answer": "..."}
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.answer === "string") text = parsed.answer;
        else if (typeof parsed.response === "string") text = parsed.response;
        else if (typeof parsed.message === "string") text = parsed.message;
        else if (typeof parsed.text === "string") text = parsed.text;
      }
    } catch (_) {
      // Keep original string if parse fails
    }
  }

  // 1. Decode Unicode escape sequences (e.g. \u200c, \u200C, \u0627, \u00a0)
  text = text.replace(/\\+u([0-9a-fA-F]{4})/g, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch (_) {
      return match;
    }
  });

  // Decode 8-character Unicode escapes (e.g. \U0000200C)
  text = text.replace(/\\+U([0-9a-fA-F]{8})/g, (match, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch (_) {
      return match;
    }
  });

  // 2. Convert escaped newlines and whitespace characters to real whitespace
  text = text.replace(/\\+r\\+n/g, "\n");
  text = text.replace(/\\+n/g, "\n");
  text = text.replace(/\\+r/g, "\n");
  text = text.replace(/\\+t/g, "\t");

  // 3. Unescape quotes and slashes
  text = text.replace(/\\+"/g, '"');
  text = text.replace(/\\+'/g, "'");
  text = text.replace(/\\+\//g, "/");

  // 4. Normalize Persian Zero Width Non-Joiner (نیم‌فاصله \u200C)
  // Collapse duplicate ZWNJs into one
  text = text.replace(/\u200C+/g, "\u200C");
  // Clean redundant whitespace around ZWNJ
  text = text.replace(/[ \t]*\u200C[ \t]*/g, "\u200C");

  // 5. Normalize excessive blank lines (max 2 consecutive newlines)
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
};

export const cleanText = cleanMessageText;
export const sanitizeChatText = cleanMessageText;

export default {
  isPersianText,
  getTextDirection,
  getTextFontClass,
  cleanMessageText,
  cleanText,
  sanitizeChatText,
};

