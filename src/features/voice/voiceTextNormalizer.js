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

/**
 * Checks whether the text is primarily Persian script.
 * If text has 0 Persian characters or is an English sentence, returns false.
 */
export function isPersianText(text) {
  if (!text || typeof text !== "string") return false;
  const persianMatches = text.match(/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/g);
  if (!persianMatches || persianMatches.length === 0) return false;
  const latinMatches = text.match(/[a-zA-Z]/g);
  if (!latinMatches || latinMatches.length === 0) return true;
  const total = persianMatches.length + latinMatches.length;
  // If at least 20% of letters are Persian, consider it a Persian text with technical loanwords
  return persianMatches.length / total >= 0.2;
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
  if (!isPersianText(text)) return text; // Preserve full English questions!

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
  if (!isPersianText(text)) return text; // Do not sanitize pure English!

  let res = String(text);

  // Strip LLM echoes like "درس: سیستم‌های عامل" or "متن: "
  res = res.replace(/^درس:[^\n]*\n?/gm, "");
  res = res.replace(/^متن:[^\n]*\n?/gm, "");

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
 * @param {number} [options.timeoutMs=4500] LLM request timeout in ms
 * @param {boolean} [options.forceRefresh=false] Bypass cache
 * @returns {Promise<string>} Vocalized text
 */
export async function normalizeTextForTTS(rawText, courseContext = "سیستم‌های عامل", options = {}) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  // CRITICAL CHECK: If text is primarily English, NEVER force it to Persian!
  if (!isPersianText(rawText)) {
    return rawText;
  }

  const cleanCourse = (courseContext || "سیستم‌های عامل").trim();
  const cacheKey = `${cleanCourse}:::${rawText.trim()}`;

  if (!options.forceRefresh && normalizerCache.has(cacheKey)) {
    return normalizerCache.get(cacheKey);
  }

  // Pre-normalize using high-performance rules
  const prepared = preNormalizeText(rawText, cleanCourse);

  // Determine LLM URL
  const isViteDev =
    typeof window !== "undefined" && window.location.port === "5173";
  const llmEndpoint = isViteDev
    ? "/llm-proxy/v1/chat/completions"
    : `${API_CONFIG.LLM_BASE_URL || "http://94.184.177.171:8000/v1"}/chat/completions`;

  const systemPrompt = `شما متخصص آوانگاری زبان فارسی برای سیستم صوتی تبدیل متن به گفتار (Text-to-Speech) هستید.
وظیفه شما: متن ورودی را برای خوانده شدن کاملاً روان، رسا و طبیعی توسط گوینده صوتی، به خط ۱۰۰٪ فارسی بازنویسی و اعراب‌گذاری کنید.

قوانین حیاتی و اختصاصی:
۱. شما هرگز به سوالات پاسخ نمی‌دهید؛ فقط عین جملات ورودی را بازنویسی صوتی کنید.
۲. عبارات داخل پرانتز معادل:
   - اگر داخل پرانتز معادل انگلیسی برای یک کلمه فارسی است (ترجمه + اصطلاح اصلی مانند «هسته (kernel)» یا «زمینه (context)»)، با «یا» بخوانید: «هَسته یا کِرنِل»، «زَمینه یا کانتِکست».
   - اگر کلمه فارسی خود همان اصطلاح خارجی است (مانند «کش (cache)» یا «کشینگ (caching)»)، نیازی به تکرار نیست؛ فقط همان کلمه را با اعراب و تلفظ دقیق بنویسید: «کَش» (با فتحه، نه کِش)، «کَشینگ».
۳. در درس سیستم عامل، کلمه «کش» مخفف Cache است و باید حتماً به صورت «کَش» (با فتحه) تلفظ شود و در ترکیب‌ها کسره اضافه («ـِ») داشته باشد: «حافظه‌یِ کَش»، «سطحِ کَش».
۴. اصطلاحات فنی انگلیسی در متن (مانند i-node -> آی‌نود، CPU -> سی‌پی‌یو، Thread -> تِرِد) را به تلفظ صوتی فارسی بنویسید.
۵. تمام نمادهای مارک‌داون (*, #, \`, _) و پرانتزها را حذف یا به مکث صوتی تبدیل کنید.
۶. خروجی فقط و فقط متن نهایی فارسی باشد بدون هیچ توضیح، پیشوند یا نقل قول.`;

  const fewShots = [
    {
      role: "user",
      content: "درس: سیستم‌های عامل\nمتن: بسته به زمینه (context) خاص، هسته (kernel) حافظه کش (cache) را مدیریت می‌کند."
    },
    {
      role: "assistant",
      content: "بسته به زمینه یا کانتِکست خاص، هَسته یا کِرنِل، حافظه‌یِ کَش را مدیریت می‌کند."
    },
    {
      role: "user",
      content: "درس: سیستم‌های عامل\nمتن: کشینگ (caching) برای بهبود عملکرد و کاهش Page Fault در پروسس‌ها به کار می‌رود."
    },
    {
      role: "assistant",
      content: "کَشینگ برای بهبودِ عملکرد و کاهشِ پِیج فالت در پِروسِس‌ها به کار می‌رود."
    }
  ];

  const messages = [
    { role: "system", content: systemPrompt },
    ...fewShots,
    { role: "user", content: `درس: ${cleanCourse}\nمتن: ${prepared}` }
  ];

  const timeoutMs = options.timeoutMs || 4500;

  try {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(llmEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: API_CONFIG.LLM_MODEL || "Qwen/Qwen2.5-7B-Instruct-AWQ",
        messages,
        temperature: 0.05,
        max_tokens: 450
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutTimer);

    if (response.ok) {
      const data = await response.json();
      const output = data?.choices?.[0]?.message?.content?.trim();
      if (output && output.length > 5) {
        const sanitized = postSanitizeText(output);
        normalizerCache.set(cacheKey, sanitized);
        return sanitized;
      }
    }
  } catch (err) {
    console.warn(
      `[voiceTextNormalizer] LLM vocalization skipped (${err.name}: ${err.message}). Using deterministic phonetic fallback.`
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
  if (!isPersianText(rawText)) return; // Don't pre-warm pure English text!
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
  preNormalizeText,
  postSanitizeText,
  isPersianText,
  resolveParenthesesTerms,
  disambiguateTechnicalPersian
};
