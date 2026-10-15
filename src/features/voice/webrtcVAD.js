/**
 * @file webrtcVAD.js
 * @description Production-grade WebRTC Voice Activity Detection (VAD) & Auto-Activation Engine.
 * 
 * Features:
 * 1. WebRTC standard audio constraints (AEC, NS, AGC) for high-fidelity speech isolation.
 * 2. Real-time Spectral Bandpass Energy analysis (260Hz - 3400Hz human formant band).
 * 3. Dynamic Adaptive Noise Floor tracking to prevent false triggers in both quiet & noisy rooms.
 * 4. Circular Pre-Roll Ring Buffer (300ms) to ensure zero clipping of opening syllables.
 * 5. Dynamic Echo/TTS Suppression & Barge-In support when exam bot is reading questions.
 * 6. Smooth Hangover Silence Timer (1100ms) for natural sentence pacing without mid-speech cuts.
 */

export const WEBRTC_AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 16000 },
  },
};

/**
 * Resamples floating-point audio buffer to target 16kHz sample rate.
 */
export function downsampleTo16k(buffer, inputRate, outputRate = 16000) {
  if (outputRate === inputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLen = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLen);
  let offset = 0;
  for (let i = 0; i < newLen; i++) {
    const next = Math.round((i + 1) * ratio);
    let sum = 0;
    let count = 0;
    for (let j = offset; j < next && j < buffer.length; j++) {
      sum += buffer[j];
      count++;
    }
    result[i] = count > 0 ? sum / count : 0;
    offset = next;
  }
  return result;
}

/**
 * Converts Float32 audio chunk to Int16 PCM ArrayBuffer.
 */
export function floatToInt16PCM(float32Array) {
  const pcm = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm.buffer;
}

/**
 * Circular Ring Buffer to retain pre-roll audio frames.
 */
class CircularAudioBuffer {
  constructor(capacityFrames) {
    this.capacity = capacityFrames;
    this.buffer = [];
    this.totalFrames = 0;
  }

  push(chunk) {
    this.buffer.push(chunk);
    this.totalFrames += chunk.length;
    while (this.totalFrames > this.capacity && this.buffer.length > 0) {
      const removed = this.buffer.shift();
      this.totalFrames -= removed.length;
    }
  }

  flush() {
    const items = [...this.buffer];
    this.buffer = [];
    this.totalFrames = 0;
    return items;
  }

  clear() {
    this.buffer = [];
    this.totalFrames = 0;
  }
}

/**
 * WebRTC Voice Activity Detector Engine
 */
export class WebRtcVoiceActivityDetector {
  constructor(options = {}) {
    this.options = {
      silenceTimeoutMs: 1100,      // Hangover duration before speech is finalized
      preRollMs: 320,              // Retain 320ms prior to detected trigger
      minSpeechDurationMs: 80,     // Require speech candidate for >=80ms to prevent clicks
      baseThreshold: 0.52,         // Normal speech probability threshold
      ttsSuppressionThreshold: 0.88, // Threshold when bot is speaking
      onSpeechStart: null,
      onSpeechEnd: null,
      onAudioChunk: null,
      onAudioLevel: null,
      ...options,
    };

    this.stream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.processor = null;
    this.source = null;
    this.silentGain = null;

    // Detection State
    this.isListening = false;
    this.isSpeaking = false;
    this.isBotSpeaking = false;
    this.speechCandidateStart = 0;
    this.silenceTimer = null;
    this.noiseFloor = 0.015;

    // Pre-roll Circular Buffer (~320ms @ 16kHz = 5120 samples)
    this.preRollBuffer = new CircularAudioBuffer(5120);

    // Binds
    this._handleAudioProcess = this._handleAudioProcess.bind(this);
  }

  setBotSpeaking(speaking) {
    this.isBotSpeaking = Boolean(speaking);
  }

  /**
   * Initializes microphone access with WebRTC constraints and sets up AudioContext.
   */
  async start(existingStream = null) {
    if (this.isListening) return;

    try {
      if (existingStream && existingStream.active && existingStream.getAudioTracks().length > 0) {
        this.stream = existingStream;
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia(WEBRTC_AUDIO_CONSTRAINTS);
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      this.source = this.audioCtx.createMediaStreamSource(this.stream);

      // 1. Frequency Analyser for Speech Bandpass Ratio
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;
      this.source.connect(this.analyser);

      // 2. Audio Processing Node (4096 buffer size)
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = this._handleAudioProcess;

      // 3. Connect to silent sink so browser won't echo back into speakers
      this.silentGain = this.audioCtx.createGain();
      this.silentGain.gain.value = 0;

      this.source.connect(this.processor);
      this.processor.connect(this.silentGain);
      this.silentGain.connect(this.audioCtx.destination);

      this.isListening = true;
      this.isSpeaking = false;
      this.noiseFloor = 0.015;
      this.preRollBuffer.clear();

      console.log("🎙 [WebRTC VAD] Initialized and listening for voice activity.");
    } catch (err) {
      console.error("❌ [WebRTC VAD] Failed to initialize:", err);
      this.stop();
      throw err;
    }
  }

  _handleAudioProcess(event) {
    if (!this.isListening) return;

    const rawInput = event.inputBuffer.getChannelData(0);
    const sampleRate = this.audioCtx?.sampleRate || 44100;

    // 1. Calculate Time-Domain RMS Energy
    let sum = 0;
    const step = Math.max(1, Math.floor(rawInput.length / 32));
    let count = 0;
    for (let i = 0; i < rawInput.length; i += step) {
      sum += rawInput[i] * rawInput[i];
      count++;
    }
    const rms = Math.sqrt(sum / (count || 1));

    // Continuous UI Voice Level callback (normalized 0.0 - 1.0)
    const normalizedLevel = Math.min(1.0, Math.max(0, rms * 4.2));
    this.options.onAudioLevel?.(normalizedLevel);

    // 2. Frequency Analysis: Human Speech Bandpass Energy (260Hz - 3400Hz)
    let speechBandRatio = 0.45;
    if (this.analyser) {
      const bufferLen = this.analyser.frequencyBinCount;
      const freqData = new Uint8Array(bufferLen);
      this.analyser.getByteFrequencyData(freqData);

      const hzPerBin = (sampleRate / 2) / bufferLen;
      const minBin = Math.max(1, Math.floor(260 / hzPerBin));
      const maxBin = Math.min(bufferLen - 1, Math.ceil(3400 / hzPerBin));

      let totalFreqPower = 0;
      let speechFreqPower = 0;

      for (let i = 0; i < bufferLen; i++) {
        const val = freqData[i];
        totalFreqPower += val;
        if (i >= minBin && i <= maxBin) {
          speechFreqPower += val;
        }
      }

      if (totalFreqPower > 10) {
        speechBandRatio = speechFreqPower / totalFreqPower;
      }
    }

    // 3. Adaptive Noise Floor Tracking
    if (!this.isSpeaking) {
      if (rms < this.noiseFloor) {
        this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
      } else {
        this.noiseFloor = this.noiseFloor * 0.998 + rms * 0.002;
      }
    }

    // 4. SNR and Composite Speech Probability Score (0.0 to 1.0)
    const effectiveNoiseFloor = Math.max(0.004, this.noiseFloor);
    const snr = rms / effectiveNoiseFloor;
    const snrScore = Math.min(1.0, Math.max(0, (snr - 1.2) / 4.5));
    const speechScore = speechBandRatio * 0.4 + snrScore * 0.6;

    // Threshold adjusts dynamically when bot is speaking TTS
    const activeThreshold = this.isBotSpeaking
      ? this.options.ttsSuppressionThreshold
      : this.options.baseThreshold;

    const isSpeechCandidate = speechScore >= activeThreshold && rms > 0.012;
    const now = performance.now();

    // 5. Downsample chunk to 16kHz Int16 for streaming
    const downsampled16k = downsampleTo16k(rawInput, sampleRate, 16000);
    const pcmChunk = floatToInt16PCM(downsampled16k);

    // 6. VAD State Machine
    if (isSpeechCandidate) {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      if (!this.isSpeaking) {
        if (!this.speechCandidateStart) {
          this.speechCandidateStart = now;
        } else if (now - this.speechCandidateStart >= this.options.minSpeechDurationMs) {
          // Confirmed speech start!
          this.isSpeaking = true;
          this.speechCandidateStart = 0;
          console.log(`🗣 [WebRTC VAD] Speech Started (Score: ${speechScore.toFixed(2)}, RMS: ${rms.toFixed(3)})`);

          this.options.onSpeechStart?.({
            score: speechScore,
            rms,
            timestamp: now,
          });

          // Flush pre-roll buffer to preserve opening syllables
          const preRollChunks = this.preRollBuffer.flush();
          for (const chunk of preRollChunks) {
            this.options.onAudioChunk?.(chunk);
          }
        }
      }

      if (this.isSpeaking) {
        this.options.onAudioChunk?.(pcmChunk);
      } else {
        this.preRollBuffer.push(pcmChunk);
      }
    } else {
      // Silence / Background noise frame
      this.speechCandidateStart = 0;

      if (this.isSpeaking) {
        // Stream chunk during hangover period so words aren't abruptly truncated
        this.options.onAudioChunk?.(pcmChunk);

        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            this.isSpeaking = false;
            this.silenceTimer = null;
            console.log("🤫 [WebRTC VAD] Speech Ended (Hangover elapsed)");
            this.options.onSpeechEnd?.({ timestamp: performance.now() });
            this.preRollBuffer.clear();
          }, this.options.silenceTimeoutMs);
        }
      } else {
        // In idle listening, continuously buffer recent audio in circular buffer
        this.preRollBuffer.push(pcmChunk);
      }
    }
  }

  /**
   * Stops listening and cleans up all audio tracks and contexts.
   */
  stop(keepStreamAlive = false) {
    this.isListening = false;
    this.isSpeaking = false;
    this.speechCandidateStart = 0;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    this.processor?.disconnect();
    this.silentGain?.disconnect();
    this.analyser?.disconnect();
    this.source?.disconnect();

    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
    }

    if (!keepStreamAlive && this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.audioCtx = null;
    this.processor = null;
    this.silentGain = null;
    this.analyser = null;
    this.source = null;
    this.preRollBuffer.clear();

    console.log("🛑 [WebRTC VAD] Stopped & Cleaned up.");
  }
}
