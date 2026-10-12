/**
 * @file voiceTextNormalizer.js
 * @description Advanced Persian TTS pre-processing, phonetic transliteration, and vocalization pipeline.
 * Designed for academic oral exams and speech synthesis:
 * 1. Checks if the text is Persian; if the text is primarily or purely English, it is PRESERVED AS ENGLISH.
 * 2. Intelligent Parentheses Resolution:
 *    - Translation + English term (e.g. "هسته (kernel)", "زمینه (context)"): reads as "هَسته یا کِرنِل", "زَمینه یا کانتِکست".
 *    - Loanword + English spelling (e.g. "کش (cache)", "کشینگ (caching)"): avoids repetition and vocalizes cleanly as "کَش" (با فتحه).
 * 3. Contextual Disambiguation:
 *    - In Computer Science / OS context, "کش" is vocalized as "کَش" (fathe) and "حافظه کش" as "حافظه‌یِ کَش" to avoid Persian homographs.
 * 4. Technical Term Transliteration:
 *    - Converts inline English terms (e.g. "i-node" -> "آی‌نود", "CPU" -> "سی‌پی‌یو", "Thread" -> "تِرِد").
 * 5. Qwen 2.5 LLM Pass:
 *    - Adds Ezafe ("ـِ") and short vowels for natural, human-like academic speech cadence.
 * 6. Zero-Latin Guarantee & 0ms Cache:
 *    - Guarantees 0% Latin characters reach the Persian TTS engine, with resilient offline fallback.
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
 * Phonetic transliterations for common English technical terms.
 */
const PHONETIC_MAP = {
  kernel: "کِرنِل",
  context: "کانتِکست",
  cache: "کَش",
  caching: "کَشینگ",
  deadlock: "دِدلاک",
  thread: "تِرِد",
  threads: "تِرِدهٰا",
  multithreading: "مالتی‌ترِدینگ",
  process: "پِروسِس",
  processes: "پِروسِس‌هٰا",
  multiprocessing: "مالتی‌پِروسِسینگ",
  queue: "کیو",
  stack: "استَک",
  heap: "هیپ",
  "i-node": "آی‌نود",
  inode: "آی‌نود",
  cpu: "سی‌پی‌یو",
  gpu: "جی‌پی‌یو",
  ram: "رَم",
  rom: "رام",
  ssd: "اس‌اس‌دی",
  hdd: "اچ‌دی‌دی",
  memory: "مِموری",
  "virtual memory": "ویرچوال مِموری",
  paging: "پِیجینگ",
  segmentation: "سِگمِنتِیشِن",
  "page fault": "پِیج فالت",
  "page table": "پِیج تِیبِل",
  mutex: "میوتِکس",
  semaphore: "سِمافور",
  semaphores: "سِمافورها",
  socket: "ساکِت",
  port: "پورت",
  packet: "پَکِت",
  frame: "فِرِیم",
  router: "روتر",
  switch: "سوییچ",
  block: "بلوک",
  blocks: "بلوک‌هٰا",
  directory: "دایرِکتوری",
  filesystem: "فایل‌سیستِم",
  buffer: "بافِر",
  "round robin": "راوند رابین",
  "context switch": "کانتِکست سوییچ",
  "race condition": "رِیس کاندیشِن",
  "critical section": "کریتیکال سِکشِن",
  starvation: "استاروِیشِن",
  livelock: "لایولاک",
  scheduling: "اِسکِجولینگ",
  scheduler: "اِسکِجولِر",
  user: "یوزِر",
  hardware: "سَخت‌افزار",
  software: "نَرم‌افزار",
};

/**
 * Words where the Persian form is already a direct loanword of the English term.
 * In these cases, we do NOT repeat "یا" (e.g. "کش (cache)" -> "کَش", not "کش یا کش").
 */
const LOANWORDS = new Set([
  "کش", "کَش", "کشینگ", "کَشینگ", "سرور", "کلاینت", "پکت", "فریم",
  "روتر", "سوییچ", "سوکت", "ساکت", "پورت", "بایت", "بیت", "پایپ",
  "سیگنال", "ترد", "تِرِد", "پروسس", "سمافور", "میوتکس", "استک", "کیو",
  "هیپ", "بلوک", "بافِر", "بافر", "نود"
]);

/**
 * Resolves Persian (English) parentheses intelligently:
 * 1. "هسته (kernel)" -> "هَسته یا کِرنِل"
 * 2. "کش (cache)" -> "کَش" (با فتحه)
 * 3. "کشینگ (caching)" -> "کَشینگ"
 */
export function resolveParenthesesTerms(text) {
  if (!text) return "";
  // Match a Persian word followed by an English term in parentheses
  const pattern = /([\u0600-\u06FF]+)\s*\(([a-zA-Z0-9_\-\s]{2,25})\)/g;
  return text.replace(pattern, (match, fa, enRaw) => {
    const enLower = enRaw.trim().toLowerCase();
    const phonetic = PHONETIC_MAP[enLower] || enRaw;
    const faClean = fa.replace(/[\u064B-\u065F\u0670]/g, "").trim();

    if (LOANWORDS.has(faClean) || enLower === "cache" || enLower === "caching") {
      if (enLower === "cache") return "کَش";
      if (enLower === "caching") return "کَشینگ";
      return phonetic;
    }

    // Translation + English equivalent: read with "یا"
    return `${fa} یا ${phonetic}`;
  });
}

/**
 * Disambiguates technical homographs in Computer Science / Operating Systems:
 * - "کش" -> "کَش" (fathe, cache)
 * - "حافظه کش" -> "حافظه‌یِ کَش"
 * - "سطح کش" -> "سطحِ کَش"
 * - "کشینگ" -> "کَشینگ"
 */
export function disambiguateTechnicalPersian(text) {
  if (!text) return "";
  let res = text;
  res = res.replace(/\bحافظه\s+کش\b/g, "حافظه‌یِ کَش");
  res = res.replace(/\bحافظه‌ی\s+کش\b/g, "حافظه‌یِ کَش");
  res = res.replace(/\bسطح\s+کش\b/g, "سطحِ کَش");
  res = res.replace(/\bسطوح\s+کش\b/g, "سطوحِ کَش");
  res = res.replace(/\bکشینگ\b/g, "کَشینگ");
  res = res.replace(/\bکش\b/g, "کَش");
  return res;
}

/**
 * Transliteration dictionary for standalone technical loanwords and abbreviations.
 */
const TECH_TERMS = [
  // Multi-word phrases
  [/\b3-way handshake\b/gi, "تری‌وی هَندشِیک"],
  [/\bthree-way handshake\b/gi, "تری‌وی هَندشِیک"],
  [/\buser thread\b/gi, "یوزِر تِرِد"],
  [/\bkernel thread\b/gi, "کِرنِل تِرِد"],
  [/\bround robin\b/gi, "راوند رابین"],
  [/\bcontext switch\b/gi, "کانتِکست سوییچ"],
  [/\bpage fault\b/gi, "پِیج فالت"],
  [/\bpage faults\b/gi, "پِیج فالت‌هٰا"],
  [/\bpage table\b/gi, "پِیج تِیبِل"],
  [/\bvirtual memory\b/gi, "ویرچوال مِموری"],
  [/\brace condition\b/gi, "رِیس کاندیشِن"],
  [/\bcritical section\b/gi, "کریتیکال سِکشِن"],
  [/\bsystem call\b/gi, "سیستِم کال"],
  [/\bprimary key\b/gi, "پرایمِری کی"],
  [/\bforeign key\b/gi, "فورِن کی"],
  [/\binner join\b/gi, "اینِر جویْن"],
  [/\bouter join\b/gi, "اوتر جویْن"],
  [/\blinked list\b/gi, "لینکِد لیست"],
  [/\bhash table\b/gi, "هَش تِیبِل"],
  [/\bbinary tree\b/gi, "باینِری تِری"],
  [/\bmac address\b/gi, "مَک آدْرِس"],
  [/\bmode\b/gi, "مُد"],

  // Hardware & Architectures
  [/\bi-node\b/gi, "آی‌نود"],
  [/\binode\b/gi, "آی‌نود"],
  [/\bx86\b/gi, "ایکس هشتاد و شش"],
  [/\bx64\b/gi, "ایکس شصت و چهار"],
  [/\barm\b/gi, "آرم"],
  [/\bcpu\b/gi, "سی‌پی‌یو"],
  [/\bgpu\b/gi, "جی‌پی‌یو"],
  [/\bram\b/gi, "رَم"],
  [/\brom\b/gi, "رام"],
  [/\bssd\b/gi, "اس‌اس‌دی"],
  [/\bhdd\b/gi, "اچ‌دی‌دی"],
  [/\bi\/o\b/gi, "آی‌او"],
  [/\bio\b/gi, "آی‌او"],
  [/\bmmu\b/gi, "ام‌ام‌یو"],
  [/\bregister\b/gi, "رِجیستِر"],
  [/\bregisters\b/gi, "رِجیستِرهٰا"],
  [/\bcore\b/gi, "کور"],
  [/\bcores\b/gi, "کورها"],

  // OS & Concurrency
  [/\bthread\b/gi, "تِرِد"],
  [/\bthreads\b/gi, "تِرِدهٰا"],
  [/\bmultithreading\b/gi, "مالتی‌ترِدینگ"],
  [/\bprocess\b/gi, "پِروسِس"],
  [/\bprocesses\b/gi, "پِروسِس‌هٰا"],
  [/\bmultiprocessing\b/gi, "مالتی‌پِروسِسینگ"],
  [/\bdeadlock\b/gi, "دِدلاک"],
  [/\bdeadlocks\b/gi, "دِدلاک‌هٰا"],
  [/\bmutex\b/gi, "میوتِکس"],
  [/\bsemaphore\b/gi, "سِمافور"],
  [/\bsemaphores\b/gi, "سِمافورها"],
  [/\bkernel\b/gi, "کِرنِل"],
  [/\buser\b/gi, "یوزِر"],
  [/\bcache\b/gi, "کَش"],
  [/\bcaching\b/gi, "کَشینگ"],
  [/\bbuffer\b/gi, "بافِر"],
  [/\bpaging\b/gi, "پِیجینگ"],
  [/\bsegmentation\b/gi, "سِگمِنتِیشِن"],
  [/\bmemory\b/gi, "مِموری"],
  [/\bstarvation\b/gi, "استاروِیشِن"],
  [/\blivelock\b/gi, "لایولاک"],
  [/\bpcb\b/gi, "پی‌سی‌بی"],
  [/\btcb\b/gi, "تی‌سی‌بی"],
  [/\bipc\b/gi, "آی‌پی‌سی"],
  [/\bsyscall\b/gi, "سیس‌کال"],
  [/\binterrupt\b/gi, "اینتِراپت"],
  [/\binterrupts\b/gi, "اینتِراپت‌هٰا"],
  [/\bscheduling\b/gi, "اِسکِجولینگ"],
  [/\bscheduler\b/gi, "اِسکِجولِر"],

  // Data Structures & Big-O
  [/\bstack\b/gi, "استَک"],
  [/\bqueue\b/gi, "کیو"],
  [/\bdeque\b/gi, "دِک"],
  [/\bpush\b/gi, "پوش"],
  [/\bpop\b/gi, "پاپ"],
  [/\bheap\b/gi, "هیپ"],
  [/\bbst\b/gi, "بی‌اس‌تی"],
  [/\bhashmap\b/gi, "هَش‌مَپ"],
  [/\bbo\(1\)\b/gi, "او یِک"],
  [/\bo\(n\)\b/gi, "او اِن"],
  [/\bo\(log\s*n\)\b/gi, "او لاگ اِن"],
  [/\bbig-o\b/gi, "بیگ‌او"],
  [/\bbig o\b/gi, "بیگ‌او"],

  // Networks & DB
  [/\btcp\b/gi, "تی‌سی‌پی"],
  [/\budp\b/gi, "یو‌دی‌پی"],
  [/\bip\b/gi, "آی‌پی"],
  [/\bdns\b/gi, "دی‌ان‌اس"],
  [/\bhttp\b/gi, "اچ‌تی‌تی‌پی"],
  [/\bhttps\b/gi, "اچ‌تی‌تی‌پی‌اس"],
  [/\bssh\b/gi, "اس‌اس‌اچ"],
  [/\bsql\b/gi, "اس‌کیواِل"],
  [/\bapi\b/gi, "ای‌پی‌آی"],
  [/\bpacket\b/gi, "پَکِت"],
  [/\bsocket\b/gi, "ساکِت"],
  [/\bport\b/gi, "پورت"],
];

const PERSIAN_DIGIT_WORDS = [
  "صِفر", "یِک", "دو", "سِه", "چَهار", "پَنج", "شِش", "هَفت", "هَشت", "نُه", "دَه",
  "یازده", "دَوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده", "بیست"
];

const TENS_WORDS = {
  20: "بیست", 30: "سی", 40: "چهل", 50: "پنجاه",
  60: "شصت", 70: "هفتاد", 80: "هشتاد", 90: "نود"
};

const LATIN_LETTER_PHONETIC = {
  a: "اِی", b: "بی", c: "سی", d: "دی", e: "ای", f: "اف", g: "جی",
  h: "اچ", i: "آی", j: "جِی", k: "کِی", l: "ال", m: "ام", n: "ان",
  o: "او", p: "پی", q: "کیو", r: "آر", s: "اس", t: "تی", u: "یو",
  v: "وی", w: "دابلیو", x: "ایکس", y: "وای", z: "زد"
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
 * Pre-normalization pass:
 * 1. Checks if text is Persian; if not, returns untouched.
 * 2. Resolves parentheses: "هسته (kernel)" -> "هسته یا کِرنِل", "کش (cache)" -> "کَش".
 * 3. Disambiguates homographs: "کش" -> "کَش" in OS context.
 * 4. Transliterates remaining technical terms and cleans markdown.
 */
export function preNormalizeText(text, courseContext = "سیستم‌های عامل") {
  if (!text) return "";
  if (detectTextLanguage(text) === "en") return text;

  let res = String(text);

  // 1. Remove Markdown code blocks & ticks
  res = res.replace(/```[\s\S]*?```/g, " ");
  res = res.replace(/`([^`]+)`/g, "$1");
  res = res.replace(/[*#_~>]/g, " ");

  // 2. Intelligent parentheses resolution ("هسته (kernel)" -> "هسته یا کِرنِل", "کش (cache)" -> "کَش")
  res = resolveParenthesesTerms(res);

  // 3. Disambiguate technical Persian terms ("کش" -> "کَش", "حافظه کش" -> "حافظه‌یِ کَش")
  res = disambiguateTechnicalPersian(res);

  // 4. Expand percentages
  res = res.replace(/(\d+)\s*%/g, "$1 دَرصَد");
  res = res.replace(/(\d+)\s*٪/g, "$1 دَرصَد");

  // 5. Apply technical dictionary
  for (const [pattern, rep] of TECH_TERMS) {
    res = res.replace(pattern, rep);
  }

  // 6. Handle remaining explanatory parentheses (replace with natural commas)
  res = res.replace(/\(([^)]+)\)/g, "، $1،");

  return res.replace(/\s+/g, " ").trim();
}

/**
 * Post-pass sanitizer:
 * GUARANTEES 100% ZERO LATIN CHARACTERS for Persian texts.
 * Converts remaining digits and stray Latin letters to Persian phonetics.
 */
export function postSanitizeText(text) {
  if (!text) return "";
  if (detectTextLanguage(text) === "en") return text;

  let res = String(text);

  // Strip LLM echoes like "درس: سیستم‌های عامل" or "متن: "
  res = res.replace(/^درس:[^\n]*\n?/gm, "");
  res = res.replace(/^متن:[^\n]*\n?/gm, "");

  // Remove illegal ezafe directly on prepositions and conjunctions (ازِ -> از, برایِ -> برای, بهِ -> به)
  res = res.replace(/(?:^|\s+)(از|برای|به|با|در|که|تا|و|یا|چون|اما|اگر|ولی)[\u0650ـِ]+/g, " $1");

  // Remove illegal ezafe before prepositions, conjunctions, verbs, or question words
  res = res.replace(
    /[\u0650ـِ]+(?=\s+(?:در|با|از|به|برای|که|تا|و|یا|چون|اما|اگر|ولی|چگونه|چطور|چرا|چیست|کجا|کی|است|شد|بود|باشد|می‌شود)(?:\s+|$|[،.؛:؟!]))/g,
    ""
  );
  res = res.replace(
    /(?:ه|ه‌ی|هی)ِ(?=\s+(?:در|با|از|به|برای|که|تا|و|یا|چون|اما|اگر|ولی|چگونه|چطور|چرا|چیست|کجا|کی|است|شد|بود|باشد|می‌شود)(?:\s+|$|[،.؛:؟!]))/g,
    "ه"
  );

  // Fix silent he with direct combining kasra (e.g. ارائهِ -> ارائه‌یِ)
  res = res.replace(/([هة])[\u0650]/g, "$1\u200cی\u0650");

  // Apply technical dictionary to map remaining English terms to Persian phonetics
  for (const [pattern, rep] of TECH_TERMS) {
    res = res.replace(pattern, rep);
  }

  // Remove any remaining parentheses
  res = res.replace(/\(([^)]+)\)/g, "، $1،");
  res = res.replace(/[()]/g, "");

  // Convert digits to Persian words
  res = res.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  res = res.replace(/\b(\d{1,2})\b/g, (m) => numberToPersianWords(m));

  // Convert any remaining stray Latin letters to Persian phonetic pronunciations
  res = res.replace(/[a-zA-Z]+/g, (match) => {
    return match
      .toLowerCase()
      .split("")
      .map((ch) => LATIN_LETTER_PHONETIC[ch] || ch)
      .join("‌");
  });

  // Strip remaining unwanted punctuation or braces
  res = res.replace(/[{}[\]_#*\\/|~^]/g, " ");
  res = res.replace(/\s+/g, " ").trim();

  return res;
}

/**
 * Normalizes text for Persian TTS using Qwen 2.5 LLM with dynamic course context.
 *
 * @param {string} rawText The original question or sentence to speak
 * @param {string} [courseContext="سیستم‌های عامل"] Current academic course context
 * @param {object} [options]
 * @param {number} [options.timeoutMs=45000] LLM request timeout in ms
 * @param {boolean} [options.forceRefresh=false] Bypass cache
 * @returns {Promise<string>} Vocalized text
 */
export async function normalizeTextForTTS(rawText, courseContext = "سیستم‌های عامل", options = {}) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  // 0. Intelligent Language Detection:
  // If the text is English, preserve it completely as original English!
  if (detectTextLanguage(rawText) === "en") {
    return rawText;
  }

  const cleanCourse = (courseContext || "سیستم‌های عامل").trim();
  const cacheKey = `${cleanCourse}:::${rawText.trim()}`;

  if (!options.forceRefresh && normalizerCache.has(cacheKey)) {
    return normalizerCache.get(cacheKey);
  }

  // 1. Pre-cleaning (0ms): Clean markdown & resolve loanword parentheses
  let cleanRaw = String(rawText)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*#_~]/g, " ");

  cleanRaw = cleanRaw.replace(/(کش|کَش)\s*\(\s*cache\s*\)/gi, "$1");
  cleanRaw = cleanRaw.replace(/(کشینگ|کَشینگ)\s*\(\s*caching\s*\)/gi, "$1");
  cleanRaw = cleanRaw.replace(/\((\s*[a-zA-Z0-9_\-]{2,20}\s*)\)/g, " یا $1 ");
  cleanRaw = cleanRaw.replace(/\(([^)]+)\)/g, "، $1،");
  cleanRaw = cleanRaw.replace(/\s+/g, " ").trim();

  // Deterministic rule-based preparation kept strictly for offline/fallback pass
  const prepared = preNormalizeText(rawText, cleanCourse);

  // Hybrid Endpoint: Tier 1 Qwen Lexical Transliteration + Tier 2 ALBERT HomoRich Syntactic Ezafe
  const vocalizeEndpoint =
    typeof window !== "undefined"
      ? "/api/v1/llm/vocalize"
    : `${(API_CONFIG.BACKEND_URL || "http://localhost:7000").replace(/\/+$/, "")}/api/v1/llm/vocalize`;

  const timeoutMs = options.timeoutMs || 45000;

  try {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    // 1. Try unified Production Hybrid Vocalization Endpoint
    const hybridResponse = await fetch(vocalizeEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: rawText,
        course_context: cleanCourse,
        apply_ezafe: true
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
      `[voiceTextNormalizer] Hybrid vocalize unavailable (${hybridErr.name}: ${hybridErr.message}), falling back.`
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
  disambiguateTechnicalPersian
};
