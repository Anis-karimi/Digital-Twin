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

export default {
  isPersianText,
  getTextDirection,
  getTextFontClass,
};
