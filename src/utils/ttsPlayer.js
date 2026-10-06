/**
 * @file ttsPlayer.js
 * @description Centralized Web Audio API player & TTS synthesizer for chat messages.
 * Streams audio from voiceApi.streamTTS, parses PCM samples, extracts authentic 
 * acoustic waveform frequency bars (RMS + Peak), and manages single-instance audio playback.
 */

import { voiceApi } from "@/api";
import { cleanMessageText } from "@/utils/textUtils";

// In-memory cache: text -> { audioBuffer, waveformBars, duration }
const ttsCache = new Map();

let audioCtxInstance = null;

function getAudioContext() {
  if (!audioCtxInstance) {
    audioCtxInstance = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtxInstance.state === "suspended") {
    audioCtxInstance.resume().catch((err) => console.warn("Failed to resume AudioContext:", err));
  }
  return audioCtxInstance;
}

/**
 * Format duration in seconds to mm:ss format (e.g. 0:14)
 */
export function formatAudioDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Computes authentic acoustic frequency bars from audio buffer channel data.
 * Divides audio into barCount buckets and computes RMS energy and peak amplitude.
 * Normalizes heights between 15% and 100%.
 */
export function computeWaveformBars(audioBuffer, barCount = 30) {
  if (!audioBuffer) {
    return Array(barCount).fill(20);
  }

  const channelData = audioBuffer.getChannelData(0);
  const totalSamples = channelData.length;
  if (totalSamples === 0) return Array(barCount).fill(20);

  const samplesPerBar = Math.floor(totalSamples / barCount);
  const rawEnergies = [];

  for (let i = 0; i < barCount; i++) {
    const start = i * samplesPerBar;
    const end = Math.min(start + samplesPerBar, totalSamples);
    let sumSquares = 0;
    let peak = 0;

    for (let j = start; j < end; j++) {
      const absVal = Math.abs(channelData[j]);
      sumSquares += absVal * absVal;
      if (absVal > peak) peak = absVal;
    }

    const count = Math.max(1, end - start);
    const rms = Math.sqrt(sumSquares / count);
    // Combined metric: 70% RMS energy + 30% peak transient
    const energy = rms * 0.7 + peak * 0.3;
    rawEnergies.push(energy);
  }

  const maxEnergy = Math.max(...rawEnergies, 0.0001);
  const minEnergy = Math.min(...rawEnergies);
  const range = maxEnergy - minEnergy || 0.0001;

  return rawEnergies.map((energy) => {
    const normalized = (energy - minEnergy) / range;
    // Map to 15% minimum height up to 100% maximum height
    return Math.max(15, Math.min(100, Math.round(15 + normalized * 85)));
  });
}

/**
 * Fetches and decodes TTS audio stream from backend.
 * Returns cached instance if already fetched.
 * 
 * @param {string} text Raw message text
 * @returns {Promise<{ audioBuffer: AudioBuffer, waveformBars: number[], duration: number }>}
 */
export async function synthesizeAndDecodeTTS(text) {
  const clean = cleanMessageText(text);
  if (!clean) {
    throw new Error("متنی برای تبدیل به صدا وجود ندارد");
  }

  // Return from cache if already computed
  if (ttsCache.has(clean)) {
    return ttsCache.get(clean);
  }

  const ctx = getAudioContext();

  const res = await voiceApi.streamTTS(clean);
  if (!res || !res.body) {
    throw new Error("TTS streaming response is not readable");
  }

  const reader = res.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.byteLength > 0) {
      chunks.push(value);
      totalBytes += value.byteLength;
    }
  }

  if (totalBytes === 0) {
    throw new Error("پاسخ صوتی از سرور دریافت نشد");
  }

  // Combine chunks into continuous Uint8Array
  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const c of chunks) {
    combined.set(c, offset);
    offset += c.byteLength;
  }

  let sampleRate = 22050;
  let audioPayload = combined;

  // Check for X-PCM: header (Digital Twin format)
  const headerSnippet = new TextDecoder("ascii").decode(
    combined.subarray(0, Math.min(128, combined.length))
  );

  if (headerSnippet.startsWith("X-PCM:")) {
    const nl = headerSnippet.indexOf("\n");
    if (nl >= 0) {
      const headerLine = headerSnippet.slice(0, nl).trim();
      headerLine
        .replace("X-PCM:", "")
        .split(";")
        .forEach((pair) => {
          const [k, v] = pair.split("=").map((s) => s.trim());
          if (k === "sample_rate") {
            const parsed = parseInt(v, 10);
            if (!isNaN(parsed) && parsed > 0) sampleRate = parsed;
          }
        });
      audioPayload = combined.subarray(nl + 1);
    }
  }

  let audioBuffer = null;

  // If header was present, it's 32-bit Float32 PCM
  if (headerSnippet.startsWith("X-PCM:")) {
    const remainder = audioPayload.byteLength % 4;
    if (remainder !== 0) {
      audioPayload = audioPayload.subarray(0, audioPayload.byteLength - remainder);
    }

    if (audioPayload.byteLength === 0) {
      throw new Error("داده صوتی نامعتبر است");
    }

    const alignedPayload = new Uint8Array(audioPayload);
    const float32 = new Float32Array(
      alignedPayload.buffer,
      alignedPayload.byteOffset,
      alignedPayload.byteLength / 4
    );

    audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32);
  } else {
    // Fallback: try decoding standard WAV/MP3 container via decodeAudioData
    try {
      audioBuffer = await ctx.decodeAudioData(combined.buffer.slice(0));
    } catch {
      // If decodeAudioData fails, try interpreting as Float32 raw PCM
      const remainder = combined.byteLength % 4;
      const aligned = remainder !== 0 ? combined.subarray(0, combined.byteLength - remainder) : combined;
      const float32 = new Float32Array(aligned.buffer, aligned.byteOffset, aligned.byteLength / 4);
      audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);
    }
  }

  const waveformBars = computeWaveformBars(audioBuffer, 30);
  const result = {
    audioBuffer,
    waveformBars,
    duration: audioBuffer.duration,
  };

  ttsCache.set(clean, result);
  return result;
}

// -------------------------------------------------------------
// Global Singleton Audio Playback Controller
// Ensures only one audio message plays at any time in the app
// -------------------------------------------------------------

let currentSource = null;
let currentAudioBuffer = null;
let playbackStartTime = 0;
let playbackOffset = 0;
let isAudioPlaying = false;
let progressTimer = null;
let activeCallbacks = null;
let activeMessageKey = null;

/**
 * Plays audio buffer from specified offset with progress tracking.
 */
export function playTTSAudio(messageKey, audioBuffer, { offset = 0, onProgress, onEnded, onStateChange } = {}) {
  // If another message was playing, notify it and stop
  if (activeCallbacks && activeMessageKey !== messageKey) {
    activeCallbacks.onStateChange?.(false);
  }
  stopTTSAudio();

  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    ctx.resume().catch((err) => console.warn(err));
  }

  activeMessageKey = messageKey;
  currentAudioBuffer = audioBuffer;
  playbackOffset = Math.max(0, Math.min(offset, audioBuffer.duration));
  playbackStartTime = ctx.currentTime - playbackOffset;
  isAudioPlaying = true;

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(ctx.destination);
  currentSource = source;

  activeCallbacks = { onProgress, onEnded, onStateChange };
  onStateChange?.(true);

  source.onended = () => {
    if (currentSource === source) {
      isAudioPlaying = false;
      currentSource = null;
      clearInterval(progressTimer);
      activeCallbacks?.onProgress?.(audioBuffer.duration, 1.0);
      activeCallbacks?.onEnded?.();
      activeCallbacks?.onStateChange?.(false);
      playbackOffset = 0;
      activeMessageKey = null;
      activeCallbacks = null;
    }
  };

  source.start(0, playbackOffset);

  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (!isAudioPlaying || !currentSource) return;
    const elapsed = ctx.currentTime - playbackStartTime;
    if (elapsed >= audioBuffer.duration) {
      clearInterval(progressTimer);
      return;
    }
    const ratio = Math.max(0, Math.min(1, elapsed / audioBuffer.duration));
    activeCallbacks?.onProgress?.(elapsed, ratio);
  }, 40);
}

/**
 * Pauses playback while retaining current progress.
 */
export function pauseTTSAudio() {
  if (!isAudioPlaying || !currentSource) return;
  const ctx = getAudioContext();
  const elapsed = ctx.currentTime - playbackStartTime;
  playbackOffset = Math.max(0, Math.min(elapsed, currentAudioBuffer?.duration || 0));
  isAudioPlaying = false;
  clearInterval(progressTimer);

  try {
    currentSource.stop();
  } catch (e) {
    // Ignore if already stopped
  }
  currentSource = null;
  activeCallbacks?.onStateChange?.(false);
}

/**
 * Seeks to target second and resumes playback.
 */
export function seekTTSAudio(messageKey, audioBuffer, targetSeconds, callbacks = {}) {
  playTTSAudio(messageKey, audioBuffer, { ...callbacks, offset: targetSeconds });
}

/**
 * Stops playback completely and resets.
 */
export function stopTTSAudio() {
  isAudioPlaying = false;
  clearInterval(progressTimer);
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore
    }
    currentSource = null;
  }
  if (activeCallbacks) {
    activeCallbacks.onStateChange?.(false);
    activeCallbacks = null;
  }
  playbackOffset = 0;
  currentAudioBuffer = null;
  activeMessageKey = null;
}

export function isAudioPlayingFor(messageKey) {
  return isAudioPlaying && activeMessageKey === messageKey;
}

export function getActiveMessageKey() {
  return activeMessageKey;
}
