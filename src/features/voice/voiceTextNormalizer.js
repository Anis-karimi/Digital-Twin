/**
 * @file voiceTextNormalizer.js
 * @description Advanced Persian TTS pre-processing, phonetic transliteration, and vocalization pipeline.
 * Converts mixed Persian/English technical texts into 100% Persian script with diacritics (Ezafe & short vowels)
 * using a hybrid approach:
 * 1. High-speed Computer Science & Engineering phonetic dictionary pre-pass.
 * 2. Specialized local LLM (Qwen 2.5 on port 8000) for context-aware vocalization and Ezafe marking.
 * 3. Strict post-pass sanitizer to guarantee zero (0%) Latin characters reach the TTS model.
 * 4. Resilient rule-based fallback if the LLM is slow or offline.
 */

import API_CONFIG from "../../api/config.js";

// In-memory cache: "course:::text" -> normalizedText
const normalizerCache = new Map();

/**
 * Phonetic transliterations for common Computer Science, Engineering & Tech terms.
 * Sorted by length (longer multi-word terms first) to prevent sub-string collision.
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
  [/\boperating system\b/gi, "سیستِم عامِل"],
  [/\bdata structure\b/gi, "ساختار داده"],
  [/\bmachine learning\b/gi, "یادگیریِ ماشین"],
  [/\bdeep learning\b/gi, "یادگیریِ عمیق"],
  [/\bartificial intelligence\b/gi, "هوشِ مصنوعی"],

  // Big-O complexities
  [/\bo\(1\)\b/gi, "او یِک"],
  [/\bo\(n\)\b/gi, "او اِن"],
  [/\bo\(log\s*n\)\b/gi, "او لاگ اِن"],
  [/\bo\(n\s*log\s*n\)\b/gi, "او اِن لاگ اِن"],
  [/\bo\(n\^2\)\b/gi, "او اِن دو"],
  [/\bo\(n\^3\)\b/gi, "او اِن سه"],
  [/\bo\(2\^n\)\b/gi, "او دو به توان اِن"],
  [/\bbig-o\b/gi, "بیگ‌او"],
  [/\bbig o\b/gi, "بیگ‌او"],

  // Hardware & Architectures
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
  [/\balu\b/gi, "ای‌ال‌یو"],
  [/\bbus\b/gi, "باس"],
  [/\bregister\b/gi, "رِجیستِر"],
  [/\bregisters\b/gi, "رِجیستِرهٰا"],
  [/\bcore\b/gi, "کور"],
  [/\bcores\b/gi, "کورها"],

  // OS & Concurrency
  [/\bthread\b/gi, "تِرِد"],
  [/\bthreads\b/gi, "تِرِدهٰا"],
  [/\bmultithreading\b/gi, "مالتی‌تردینگ"],
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
  [/\bbuffer\b/gi, "بافِر"],
  [/\bpaging\b/gi, "پِیجینگ"],
  [/\bsegmentation\b/gi, "سِگمِنتِیشِن"],
  [/\bmemory\b/gi, "مِموری"],
  [/\bstarvation\b/gi, "استاروِیشِن"],
  [/\blivelock\b/gi, "لایولاک"],
  [/\bpcb\b/gi, "پی‌سی‌بی"],
  [/\btcb\b/gi, "تی‌سی‌بی"],
  [/\bipc\b/gi, "آی‌پی‌سی"],
  [/\bpipe\b/gi, "پایپ"],
  [/\bsignal\b/gi, "سیگنال"],
  [/\bsyscall\b/gi, "سیس‌کال"],
  [/\binterrupt\b/gi, "اینتِراپت"],
  [/\binterrupts\b/gi, "اینتِراپت‌هٰا"],
  [/\bscheduling\b/gi, "اِسکِجولینگ"],
  [/\bscheduler\b/gi, "اِسکِجولِر"],

  // Data Structures & Algorithms
  [/\bstack\b/gi, "استَک"],
  [/\bqueue\b/gi, "کیو"],
  [/\bdeque\b/gi, "دِک"],
  [/\bpush\b/gi, "پوش"],
  [/\bpop\b/gi, "پاپ"],
  [/\bheap\b/gi, "هیپ"],
  [/\btree\b/gi, "تِری"],
  [/\bbst\b/gi, "بی‌اس‌تی"],
  [/\bavl\b/gi, "ای‌وی‌ال"],
  [/\bgraph\b/gi, "گِراف"],
  [/\bnode\b/gi, "نود"],
  [/\bnodes\b/gi, "نودهٰا"],
  [/\bvertex\b/gi, "وِرتِکس"],
  [/\bedge\b/gi, "اِج"],
  [/\bhashmap\b/gi, "هَش‌مَپ"],
  [/\bhash\b/gi, "هَش"],
  [/\bdfs\b/gi, "دی‌اف‌اس"],
  [/\bbfs\b/gi, "بی‌اف‌اس"],

  // Networks & Protocols
  [/\btcp\b/gi, "تی‌سی‌پی"],
  [/\budp\b/gi, "یو‌دی‌پی"],
  [/\bip\b/gi, "آی‌پی"],
  [/\bipv4\b/gi, "آی‌پی ورژن چهار"],
  [/\bipv6\b/gi, "آی‌پی ورژن شش"],
  [/\bmac\b/gi, "مَک"],
  [/\bdns\b/gi, "دی‌ان‌اس"],
  [/\bdhcp\b/gi, "دی‌اچ‌سی‌پی"],
  [/\bhttp\b/gi, "اچ‌تی‌تی‌پی"],
  [/\bhttps\b/gi, "اچ‌تی‌تی‌پی‌اس"],
  [/\bftp\b/gi, "اف‌تی‌پی"],
  [/\bssh\b/gi, "اس‌اس‌اچ"],
  [/\bssl\b/gi, "اس‌اس‌ال"],
  [/\btls\b/gi, "تی‌ال‌اس"],
  [/\bosi\b/gi, "او‌اِس‌آی"],
  [/\blan\b/gi, "لَن"],
  [/\bwan\b/gi, "وَن"],
  [/\bvlan\b/gi, "وی‌لَن"],
  [/\bnat\b/gi, "نَت"],
  [/\bvpn\b/gi, "وی‌پی‌ان"],
  [/\brouter\b/gi, "روتر"],
  [/\bswitch\b/gi, "سوییچ"],
  [/\bpacket\b/gi, "پَکِت"],
  [/\bpackets\b/gi, "پَکِت‌هٰا"],
  [/\bframe\b/gi, "فِرِیم"],
  [/\bhandshake\b/gi, "هَندشِیک"],
  [/\bsocket\b/gi, "ساکِت"],
  [/\bsockets\b/gi, "ساکِت‌هٰا"],
  [/\bport\b/gi, "پورت"],
  [/\bports\b/gi, "پورت‌هٰا"],

  // Databases
  [/\bsql\b/gi, "اس‌کیواِل"],
  [/\bnosql\b/gi, "نو‌اس‌کیواِل"],
  [/\bindex\b/gi, "اینْدِکس"],
  [/\bindexes\b/gi, "اینْدِکس‌هٰا"],
  [/\bjoin\b/gi, "جویْن"],
  [/\bquery\b/gi, "کوئِری"],
  [/\btable\b/gi, "تِیبِل"],
  [/\bschema\b/gi, "اسکیما"],
  [/\bacid\b/gi, "اَسید"],
  [/\btransaction\b/gi, "تِرَنزَکشِن"],

  // Software & Web
  [/\bai\b/gi, "هوش مصنوعی"],
  [/\bml\b/gi, "ام‌ال"],
  [/\bdl\b/gi, "دی‌ال"],
  [/\bapi\b/gi, "ای‌پی‌آی"],
  [/\brest\b/gi, "رِست"],
  [/\bjson\b/gi, "جِیسان"],
  [/\bxml\b/gi, "ایکس‌ام‌ال"],
  [/\bgit\b/gi, "گیت"],
  [/\bcommit\b/gi, "کامیت"],
  [/\bpull\b/gi, "پول"],
  [/\bmerge\b/gi, "مِرج"],
  [/\bbranch\b/gi, "برَنچ"],
  [/\bbug\b/gi, "باگ"],
  [/\bdebug\b/gi, "دی‌باگ"],
  [/\bserver\b/gi, "سِروِر"],
  [/\bclient\b/gi, "کلاینت"],
  [/\bfrontend\b/gi, "فرانت‌اند"],
  [/\bbackend\b/gi, "بَک‌اند"],
  [/\bfullstack\b/gi, "فول‌استَک"],
  [/\bdocker\b/gi, "داکِر"],
  [/\bcontainer\b/gi, "کانتِینِر"],
  [/\bhtml\b/gi, "اچ‌تی‌ام‌اِل"],
  [/\bcss\b/gi, "سی‌اس‌اس"],
  [/\bjs\b/gi, "جی‌اس"],
  [/\bjavascript\b/gi, "جاوا اسکریپت"],
  [/\bpython\b/gi, "پایتون"],
  [/\bjava\b/gi, "جاوا"],
  [/\bc\+\+\b/gi, "سی پلاس پلاس"],
  [/\bc#\b/gi, "سی شارپ"],
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

/**
 * Converts small integers (0-99) to written Persian words.
 */
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
 * 1. Strips Markdown fences and syntax.
 * 2. Replaces common CS & tech terms with exact Persian transliterations.
 * 3. Expands percentage signs and compound numbers.
 */
export function preNormalizeText(text) {
  if (!text) return "";
  let res = String(text);

  // Remove code blocks and inline code ticks
  res = res.replace(/```[\s\S]*?```/g, " ");
  res = res.replace(/`([^`]+)`/g, "$1");

  // Remove bold, italic, headers, bullet stars, tildes
  res = res.replace(/[*#_~>]/g, " ");

  // Expand percentages
  res = res.replace(/(\d+)\s*%/g, "$1 دَرصَد");
  res = res.replace(/(\d+)\s*٪/g, "$1 دَرصَد");

  // Apply CS & Tech terms dictionary
  for (const [pattern, rep] of TECH_TERMS) {
    res = res.replace(pattern, rep);
  }

  return res.replace(/\s+/g, " ").trim();
}

/**
 * Post-pass sanitizer:
 * GUARANTEES 100% ZERO LATIN CHARACTERS.
 * Converts remaining digits and stray Latin letters to Persian phonetics.
 */
export function postSanitizeText(text) {
  if (!text) return "";
  let res = String(text);

  // Convert English & Persian digits (0-9, ۰-۹) to Persian words
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
 * @returns {Promise<string>} 100% Persian script vocalized text
 */
export async function normalizeTextForTTS(rawText, courseContext = "سیستم‌های عامل", options = {}) {
  if (!rawText || typeof rawText !== "string") {
    return "";
  }

  const cleanCourse = (courseContext || "سیستم‌های عامل").trim();
  const cacheKey = `${cleanCourse}:::${rawText.trim()}`;

  if (!options.forceRefresh && normalizerCache.has(cacheKey)) {
    return normalizerCache.get(cacheKey);
  }

  // Pre-normalize using high-performance dictionary
  const prepared = preNormalizeText(rawText);

  // Determine LLM URL: in Vite dev mode use proxy, otherwise API_CONFIG.LLM_BASE_URL
  const isViteDev =
    typeof window !== "undefined" && window.location.port === "5173";
  const llmEndpoint = isViteDev
    ? "/llm-proxy/v1/chat/completions"
    : `${API_CONFIG.LLM_BASE_URL || "http://94.184.177.171:8000/v1"}/chat/completions`;

  const systemPrompt = `شما متخصص آوانگاری زبان فارسی برای سیستم صوتی تبدیل متن به گفتار (Text-to-Speech) هستید.
وظیفه شما: متن ورودی را برای خوانده شدن کاملاً روان و طبیعی توسط گوینده صوتی، به خط ۱۰۰٪ فارسی بازنویسی و اعراب‌گذاری کنید.

قوانین الزامی:
۱. شما هرگز به سوالات پاسخ نمی‌دهید و نباید مسئله را حل کنید؛ فقط عین جملات ورودی را بازنویسی صوتی کنید.
۲. هیچ کاراکتر لاتین/انگلیسی (A-Z, a-z) نباید در خروجی باشد. تمام اصطلاحات فنی انگلیسی و مخفف‌ها را با املای صوتی فارسی بنویسید.
۳. برای اتصال روان کلمات و خوانش بی‌نقص توسط مدل صوتی، برای ترکیبات اضافه و کلمات کلیدی حتماً از کسره اضافه (ـِ) و حرکات (فتحه َ، کسره ِ، ضمه ُ، تشدید ّ) استفاده کنید.
۴. اعداد و نشانه‌ها را حتماً به حروف فارسی بنویسید (مثلاً ۲ -> دو).
۵. تمام نمادهای مارک‌داون (*, #, \`, _) را پاک کنید.
۶. خروجی فقط و فقط متن نهایی فارسی باشد بدون هیچ توضیح، پیشوند یا نقل قول.`;

  const fewShots = [
    {
      role: "user",
      content: "درس: سیستم‌های عامل\nمتن: لطفاً الگوریتم راوند رابین با دو تا سی‌پی‌یو کور را شرح دهید."
    },
    {
      role: "assistant",
      content: "لُطفاً الگوریتمِ راوند رابین با دو تا سی‌پی‌یو کور را شَرح دَهید."
    },
    {
      role: "user",
      content: "درس: پایگاه داده\nمتن: تفاوت پرایمِری کی و فورِن کی در اس‌کیواِل چیست؟"
    },
    {
      role: "assistant",
      content: "تَفاوتِ پرایمِری کی و فورِن کی دَر اس‌کیواِل چیست؟"
    },
    {
      role: "user",
      content: "درس: شبکه‌های کامپیوتری\nمتن: در مدل او‌اس‌آی نقش لایه ترنسپورت چیست؟"
    },
    {
      role: "assistant",
      content: "دَر مُدِلِ او‌اِس‌آی، نَقشِ لایه‌یِ ترَنسپورت چیست؟"
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
        max_tokens: 350
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
 * Pre-warms normalization in the background without blocking the current call.
 */
export function warmupQuestionNormalization(rawText, courseContext = "سیستم‌های عامل") {
  if (!rawText || typeof rawText !== "string") return;
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
  postSanitizeText
};
