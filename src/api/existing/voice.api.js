/**
 * @file voice.api.js
 * @description Audio, Text-to-Speech (TTS), and Speech-to-Text (STT) endpoints.
 */

import { API_CONFIG } from "../config";
import { httpRequest, handleApiError } from "../client";
import { normalizeTextForTTS } from "@/features/voice";

/**
 * Initiates TTS streaming from Digital Twin server.
 * Automatically normalizes any technical or Latin text to 100% Persian script before streaming.
 * 
 * @endpoint POST /tts_router_stream (on DGTW_URL)
 * @param {string} text Text to synthesize into speech
 * @param {string} [courseContext=""] Academic course context for domain-specific terminology
 * @returns {Promise<Response>} Raw response stream reader
 */
export async function streamTTS(text, courseContext = "") {
  try {
    let payloadText = text;
    // Auto-normalize ONLY if text is a Persian sentence containing Latin characters or markdown
    if (
      payloadText &&
      /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(payloadText) &&
      (/[a-zA-Z]/.test(payloadText) || /[*#`]/.test(payloadText))
    ) {
      try {
        payloadText = await normalizeTextForTTS(payloadText, courseContext);
      } catch (normErr) {
        console.warn("[VoiceApi.streamTTS] Normalization fallback warning:", normErr);
      }
    }

    const formData = new FormData();
    formData.append("text", payloadText);

    const ttsUrl =
      API_CONFIG.TTS_STREAM_URL || `${API_CONFIG.DGTW_URL}/tts_router_stream`;

    const response = await fetch(ttsUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`TTS stream failed with status ${response.status}`);
    }
    if (!response.body) {
      throw new Error("ReadableStream is not supported by current environment");
    }

    return response;
  } catch (error) {
    handleApiError("VoiceApi", "streamTTS", error);
  }
}

/**
 * Uploads a recorded audio sample (24kHz WAV) to train/clone the teacher's voice.
 * Encapsulates FormData creation.
 * 
 * @endpoint POST /api/upload-audio
 * @param {Blob|File} wavBlob Audio file/blob to upload
 * @param {string} [fileName="teacher_audio.wav"] Target file name
 * @returns {Promise<Object>} Server response
 */
export async function uploadAudio(wavBlob, fileName = "teacher_audio.wav") {
  try {
    const formData = new FormData();
    formData.append(
      "file",
      wavBlob instanceof File ? wavBlob : new File([wavBlob], fileName, { type: "audio/wav" })
    );

    const url = `${API_CONFIG.BACKEND_URL}/api/upload-audio`;
    return await httpRequest(url, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    handleApiError("VoiceApi", "uploadAudio", error);
  }
}

/**
 * Deletes the stored teacher audio sample from the server.
 * @endpoint DELETE /api/delete-audio/
 * @returns {Promise<Object>} Server response
 */
export async function deleteAudio() {
  try {
    const url = `${API_CONFIG.BACKEND_URL}/api/delete-audio/`;
    return await httpRequest(url, { method: "DELETE" });
  } catch (error) {
    handleApiError("VoiceApi", "deleteAudio", error);
  }
}

/**
 * Normalizes a word for comparison (Persian / Arabic characters and punctuation)
 * without altering displayed text.
 */
function normalizeWordForComparison(w) {
  return (w || "")
    .replace(/\u064A/g, "\u06CC") // Arabic Yeh -> Persian Yeh
    .replace(/\u0643/g, "\u06A9") // Arabic Kaf -> Persian Kaf
    .replace(/\u0629/g, "\u0647") // Teh Marbuta -> Heh
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Strip zero-width characters
    .replace(/[.,،!؟?:;\-_]/g, "") // Strip punctuation
    .trim()
    .toLowerCase();
}

function cleanCharStr(s) {
  return (s || "")
    .replace(/\u064A/g, "\u06CC")
    .replace(/\u0643/g, "\u06A9")
    .replace(/\u0629/g, "\u0647")
    .replace(/[\s\u200B-\u200D\uFEFF]/g, "")
    .replace(/[.,،!؟?:;\-_]/g, "")
    .toLowerCase();
}

function splitWords(str) {
  return (str || "").trim().split(/\s+/).filter(Boolean);
}

function lcsLen(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function charSimilarity(s1, s2) {
  const c1 = cleanCharStr(s1);
  const c2 = cleanCharStr(s2);
  if (!c1 || !c2) return 0;
  if (c1 === c2) return 1;
  const lcs = lcsLen(c1, c2);
  return (2 * lcs) / (c1.length + c2.length);
}

function isRevision(prevSeg, text) {
  const segSim = charSimilarity(prevSeg, text);
  if (segSim >= 0.70) return true;

  const w1 = splitWords(prevSeg);
  const w2 = splitWords(text);
  if (w1.length === 0 || w2.length === 0) return false;

  const c1_first = cleanCharStr(w1[0]);
  const c2_first = cleanCharStr(w2[0]);
  const firstWordMatch = (c1_first === c2_first || c1_first.startsWith(c2_first) || c2_first.startsWith(c1_first));

  if (firstWordMatch && segSim >= 0.48) {
    return true;
  }

  return false;
}

function findSuffixOverlap(existing, next) {
  const c1 = cleanCharStr(existing);
  const c2 = cleanCharStr(next);
  if (!c1 || !c2) return { type: "none", overlapLen: 0 };

  const searchWindow = Math.min(c1.length, c2.length + 30);
  const tailOfC1 = c1.slice(c1.length - searchWindow);
  if (tailOfC1.includes(c2)) {
    return { type: "contained", overlapLen: c2.length };
  }

  const maxLen = Math.min(c1.length, c2.length);
  for (let len = maxLen; len >= 4; len--) {
    if (c1.slice(c1.length - len) === c2.slice(0, len)) {
      return { type: "suffix", overlapLen: len };
    }
  }

  return { type: "none", overlapLen: 0 };
}

function mapCleanCharIndexToOriginal(original, targetCleanCharCount) {
  let count = 0;
  for (let i = 0; i < original.length; i++) {
    const ch = original[i];
    if (cleanCharStr(ch)) {
      count++;
      if (count >= targetCleanCharCount) {
        return i + 1;
      }
    }
  }
  return original.length;
}

/**
 * Merges transcript parts, eliminating overlapping words at boundaries.
 */
export function mergeTranscriptParts(parts) {
  return parts.filter(Boolean).map((p) => p.trim()).filter(Boolean).join(" ");
}

/**
 * Intelligent tracker for streaming Speech-to-Text frames.
 * Handles sliding window ASR, hypothesis revisions, progressive word growth,
 * and chunk boundary deduplication.
 */
export class STTTranscriptTracker {
  constructor() {
    this.history = [];
    this.lastUpdateTime = 0;
  }

  getFullTranscript() {
    return this.history.filter(Boolean).map((p) => p.trim()).filter(Boolean).join(" ");
  }

  finalizeActive() {
    return this.getFullTranscript();
  }

  feed(rawText, isExplicitFinal = false, now = Date.now()) {
    const text = (rawText || "").trim();
    if (!text) return this.getFullTranscript();

    const timeDiff = this.lastUpdateTime ? now - this.lastUpdateTime : 0;
    this.lastUpdateTime = now;

    if (this.history.length === 0) {
      this.history.push(text);
      return this.getFullTranscript();
    }

    const lastIdx = this.history.length - 1;
    const lastSeg = this.history[lastIdx];
    const fullSoFar = this.getFullTranscript();

    const cleanFull = cleanCharStr(fullSoFar);
    const cleanText = cleanCharStr(text);

    // Intentional repetition: identical phrase after long silence (> 2500ms)
    const segSim = charSimilarity(lastSeg, text);
    if (segSim === 1.0 && timeDiff > 2500) {
      this.history.push(text);
      return this.getFullTranscript();
    }

    // 1. Direct extension of full session text
    if (cleanText.startsWith(cleanFull)) {
      this.history = [text];
      return this.getFullTranscript();
    }

    // 2. High revision of full session text
    if (charSimilarity(fullSoFar, text) >= 0.75) {
      this.history = [text];
      return this.getFullTranscript();
    }

    // 3. Extension of last segment (e.g. "یک" -> "یک دو")
    if (cleanText.startsWith(cleanCharStr(lastSeg))) {
      this.history[lastIdx] = text;
      return this.getFullTranscript();
    }

    // 4. Revision of last segment (e.g. "تعادل" -> "تاحالا", "وی هی تکرارش کرد" -> "وی تو کرت کرد")
    if (isRevision(lastSeg, text)) {
      this.history[lastIdx] = text;
      return this.getFullTranscript();
    }

    // 5. Revision of second to last segment (if exists)
    if (this.history.length >= 2 && isRevision(this.history[lastIdx - 1], text)) {
      this.history[lastIdx - 1] = text;
      return this.getFullTranscript();
    }

    // 6. Suffix / Boundary overlap with sliding window
    const overlap = findSuffixOverlap(fullSoFar, text);
    if (overlap.type === "contained") {
      return this.getFullTranscript();
    }

    if (overlap.type === "suffix") {
      const origCutIdx = mapCleanCharIndexToOriginal(text, overlap.overlapLen);
      const remainingNewText = text.slice(origCutIdx).trim();
      if (remainingNewText) {
        this.history.push(remainingNewText);
      }
      return this.getFullTranscript();
    }

    // 7. Distinct new utterance
    this.history.push(text);
    return this.getFullTranscript();
  }
}

/**
 * Creates and opens a WebSocket connection for real-time speech-to-text.
 * Supports Persian (fa, port 8881) and English (en, port 8882).
 * 
 * @endpoint WSS /ws (on STT_WS_URL_FA or STT_WS_URL_EN)
 * @param {Object} callbacks
 * @param {'fa'|'en'} [callbacks.lang='fa'] Language for STT ('fa' = Port 8881, 'en' = Port 8882)
 * @param {Function} [callbacks.onOpen] WebSocket opened handler
 * @param {Function} [callbacks.onTranscript] Emits received transcription text (data.text || data.result)
 * @param {Function} [callbacks.onError] WebSocket error handler
 * @param {Function} [callbacks.onClose] WebSocket closed handler
 * @returns {WebSocket} Active WebSocket instance
 */
export function createSTTWebSocket({ lang = "fa", onOpen, onTranscript, onError, onClose } = {}) {
  const isEn = String(lang || "").toLowerCase() === "en";
  const wsUrl = isEn
    ? (API_CONFIG.STT_WS_URL_EN || "wss://172.20.13.39:8882/ws")
    : (API_CONFIG.STT_WS_URL_FA || "wss://172.20.13.39:8881/ws");

  console.log(`[STT WebSocket] Connecting (${isEn ? "English :8882" : "Persian :8881"}) to:`, wsUrl);
  const ws = new WebSocket(wsUrl);

  const tracker = new STTTranscriptTracker();
  let pauseTimer = null;
  const PAUSE_THRESHOLD_MS = 1200; // 1.2s silence finalizes the active segment

  ws.onopen = (event) => {
    console.log(`[STT WebSocket] Connected (${isEn ? "en" : "fa"}) to:`, wsUrl);
    if (onOpen) onOpen(event);
  };

  ws.onmessage = (event) => {
    try {
      let data = {};
      let incomingText = "";
      let isExplicitFinal = false;

      if (typeof event.data === "string") {
        try {
          data = JSON.parse(event.data);
        } catch {
          data = { text: event.data };
        }
      }

      console.log("[STT WebSocket] frame:", data);

      // Extract text from standard formats:
      // - data.text (Whisper, Vosk final, custom STT)
      // - data.transcript (Web Speech / custom)
      // - data.result (string or Vosk array of { word })
      // - data.partial (Vosk partial/interim)
      if (typeof data.text === "string" && data.text.trim()) {
        incomingText = data.text.trim();
        isExplicitFinal = Boolean(data.is_final || data.final);
      } else if (typeof data.transcript === "string" && data.transcript.trim()) {
        incomingText = data.transcript.trim();
        isExplicitFinal = Boolean(data.is_final || data.final);
      } else if (typeof data.result === "string" && data.result.trim()) {
        incomingText = data.result.trim();
        isExplicitFinal = Boolean(data.is_final || data.final);
      } else if (Array.isArray(data.result)) {
        incomingText = data.result
          .map((w) => (typeof w === "object" ? w?.word : w))
          .filter(Boolean)
          .join(" ")
          .trim();
        isExplicitFinal = true;
      } else if (typeof data.partial === "string" && data.partial.trim()) {
        incomingText = data.partial.trim();
        isExplicitFinal = false;
      }

      if (!incomingText) return;

      if (pauseTimer) {
        clearTimeout(pauseTimer);
        pauseTimer = null;
      }

      const fullTranscript = tracker.feed(incomingText, isExplicitFinal);

      if (onTranscript) {
        onTranscript(fullTranscript, {
          ...data,
          isFinal: isExplicitFinal,
          chunk: incomingText,
          accumulated: fullTranscript,
        });
      }

      // Schedule finalization of the active utterance when speaker pauses
      pauseTimer = setTimeout(() => {
        tracker.finalizeActive();
      }, PAUSE_THRESHOLD_MS);
    } catch (err) {
      console.warn("[STT WebSocket] Error handling frame:", err);
    }
  };

  ws.onerror = (event) => {
    console.error(`[STT WebSocket] Error on ${wsUrl}:`, event);
    if (onError) onError(event);
  };

  ws.onclose = (event) => {
    if (pauseTimer) {
      clearTimeout(pauseTimer);
      pauseTimer = null;
    }
    const finalTranscript = tracker.finalizeActive();
    if (onTranscript && finalTranscript) {
      onTranscript(finalTranscript, {
        isFinal: true,
        accumulated: finalTranscript,
      });
    }
    console.log(`[STT WebSocket] Closed (${isEn ? "en" : "fa"})`);
    if (onClose) onClose(event);
  };

  ws.getTranscript = () => tracker.getFullTranscript();
  ws.finalize = () => tracker.finalizeActive();

  return ws;
}

export const voiceApi = {
  streamTTS,
  uploadAudio,
  deleteAudio,
  createSTTWebSocket,
  STTTranscriptTracker,
  mergeTranscriptParts,
};

export default voiceApi;
