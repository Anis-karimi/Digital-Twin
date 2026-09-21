/**
 * @file dateUtils.js
 * @description Robust Jalali (Solar Hijri) & Gregorian date conversion and formatting utilities.
 */

// Persian digits converter
export const toPersianDigits = (num) => {
  if (num === null || num === undefined) return "";
  const str = String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
};

// Jalali month names
export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// Gregorian month names
export const GREGORIAN_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Jalali week days (starts on Saturday)
export const JALALI_WEEK_DAYS = [
  { short: "ش", full: "شنبه", index: 0 },
  { short: "ی", full: "یکشنبه", index: 1 },
  { short: "د", full: "دوشنبه", index: 2 },
  { short: "س", full: "سه‌شنبه", index: 3 },
  { short: "چ", full: "چهارشنبه", index: 4 },
  { short: "پ", full: "پنج‌شنبه", index: 5 },
  { short: "ج", full: "جمعه", index: 6 },
];

// Gregorian week days (starts on Monday)
export const GREGORIAN_WEEK_DAYS = [
  { short: "Mo", full: "Monday", index: 0 },
  { short: "Tu", full: "Tuesday", index: 1 },
  { short: "We", full: "Wednesday", index: 2 },
  { short: "Th", full: "Thursday", index: 3 },
  { short: "Fr", full: "Friday", index: 4 },
  { short: "Sa", full: "Saturday", index: 5 },
  { short: "Su", full: "Sunday", index: 6 },
];

/**
 * Checks if a Jalali year is a leap year.
 * @param {number} jy Jalali year
 * @returns {boolean}
 */
export function isJalaliLeapYear(jy) {
  const r = jy % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(r);
}

/**
 * Returns the number of days in a Jalali month.
 * @param {number} jy Jalali year
 * @param {number} jm Jalali month (1-12)
 * @returns {number}
 */
export function getDaysInJalaliMonth(jy, jm) {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

/**
 * Checks if a Gregorian year is a leap year.
 * @param {number} gy Gregorian year
 * @returns {boolean}
 */
export function isGregorianLeapYear(gy) {
  return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
}

/**
 * Returns the number of days in a Gregorian month.
 * @param {number} gy Gregorian year
 * @param {number} gm Gregorian month (1-12)
 * @returns {number}
 */
export function getDaysInGregorianMonth(gy, gm) {
  const days = [31, isGregorianLeapYear(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[gm - 1] || 30;
}

/**
 * Converts Gregorian date to Jalali (Solar Hijri) date.
 * @param {number} gy
 * @param {number} gm (1-12)
 * @param {number} gd (1-31)
 * @returns {{jy: number, jm: number, jd: number}}
 */
export function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  let gYear = gy <= 1600 ? gy : gy - 1600;
  const gy2 = gm > 2 ? gYear + 1 : gYear;
  let days =
    365 * gYear +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;

  let jm;
  let jd;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { jy, jm, jd };
}

/**
 * Converts Jalali (Solar Hijri) date to Gregorian date.
 * @param {number} jy
 * @param {number} jm (1-12)
 * @param {number} jd (1-31)
 * @returns {{gy: number, gm: number, gd: number}}
 */
export function jalaliToGregorian(jy, jm, jd) {
  let gy = jy <= 979 ? 621 : 1600;
  let jYear = jy <= 979 ? jy : jy - 979;
  let days =
    365 * jYear +
    Math.floor(jYear / 33) * 8 +
    Math.floor(((jYear % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;

  let gd = days + 1;
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  let gm;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }

  return { gy, gm, gd };
}

/**
 * Parses YYYY-MM-DD string into {gy, gm, gd}.
 * @param {string} dateString
 * @returns {{gy: number, gm: number, gd: number}|null}
 */
export function parseIsoDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const parts = dateString.split("T")[0].split("-");
  if (parts.length < 3) return null;
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);
  if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return null;
  return { gy, gm, gd };
}

/**
 * Formats {gy, gm, gd} to YYYY-MM-DD.
 */
export function formatIsoDate(gy, gm, gd) {
  const mm = String(gm).padStart(2, "0");
  const dd = String(gd).padStart(2, "0");
  return `${gy}-${mm}-${dd}`;
}

/**
 * Returns today's ISO date string (YYYY-MM-DD).
 */
export function getTodayIsoDate() {
  const now = new Date();
  return formatIsoDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * Formats an ISO date string for display in UI.
 * @param {string} isoString YYYY-MM-DD
 * @param {boolean} isRTL Persian or English
 * @returns {string}
 */
export function formatDisplayDate(isoString, isRTL = true) {
  const parsed = parseIsoDate(isoString);
  if (!parsed) return isRTL ? "انتخاب تاریخ" : "Select date";

  if (isRTL) {
    const { jy, jm, jd } = gregorianToJalali(parsed.gy, parsed.gm, parsed.gd);
    const monthName = JALALI_MONTH_NAMES[jm - 1] || "";
    return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
  } else {
    const dateObj = new Date(parsed.gy, parsed.gm - 1, parsed.gd);
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}

/**
 * Gets day of week for Jalali (0 = Saturday, 6 = Friday).
 * @param {number} jy
 * @param {number} jm
 * @param {number} jd
 * @returns {number} 0 to 6
 */
export function getJalaliDayOfWeek(jy, jm, jd) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const date = new Date(gy, gm - 1, gd);
  const dow = date.getDay(); // 0 is Sunday, 6 is Saturday
  return (dow + 1) % 7; // Convert so 0 is Saturday, 6 is Friday
}

/**
 * Gets day of week for Gregorian (0 = Monday, 6 = Sunday).
 * @param {number} gy
 * @param {number} gm
 * @param {number} gd
 * @returns {number} 0 to 6
 */
export function getGregorianDayOfWeek(gy, gm, gd) {
  const date = new Date(gy, gm - 1, gd);
  const dow = date.getDay(); // 0 is Sunday, 1 is Monday
  return dow === 0 ? 6 : dow - 1; // 0 is Monday, 6 is Sunday
}
