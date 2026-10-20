/**
 * @file useWebRtcVAD.js
 * @description React Hook integrating WebRTC Voice Activity Detection (VAD) with real-time STT streaming.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { WebRtcVoiceActivityDetector, WEBRTC_AUDIO_CONSTRAINTS } from "./webrtcVAD";
import { voiceApi } from "@/api/existing/voice.api";

export function useWebRtcVAD({
  enabled = true,
  voiceLang = "fa",
  isBotSpeaking = false,
  onTranscript = null,
  onSpeechStarted = null,
  onSpeechEnded = null,
  silenceTimeoutMs = 1100,
  preRollMs = 320,
}) {
  const [isAutoVADEnabled, setIsAutoVADEnabled] = useState(() => {
    const saved = localStorage.getItem("exam_auto_vad_enabled");
    return saved !== null ? saved === "true" : true;
  });

  const [recording, setRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [micStream, setMicStream] = useState(null);

  const vadRef = useRef(null);
  const wsRef = useRef(null);
  const isRecordingRef = useRef(false);
  const manualOverrideRef = useRef(false);
  const activeLangRef = useRef(voiceLang);

  const onTranscriptRef = useRef(onTranscript);
  const onSpeechStartedRef = useRef(onSpeechStarted);
  const onSpeechEndedRef = useRef(onSpeechEnded);
  const isAutoVADEnabledRef = useRef(isAutoVADEnabled);

  useEffect(() => {
    activeLangRef.current = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onSpeechStartedRef.current = onSpeechStarted;
  }, [onSpeechStarted]);

  useEffect(() => {
    onSpeechEndedRef.current = onSpeechEnded;
  }, [onSpeechEnded]);

  useEffect(() => {
    isAutoVADEnabledRef.current = isAutoVADEnabled;
  }, [isAutoVADEnabled]);

  // Persist auto VAD toggle setting
  const toggleAutoVAD = useCallback(() => {
    setIsAutoVADEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("exam_auto_vad_enabled", String(next));
      return next;
    });
  }, []);

  // Sync bot speaking state with VAD suppression
  useEffect(() => {
    if (vadRef.current) {
      vadRef.current.setBotSpeaking(isBotSpeaking);
    }
  }, [isBotSpeaking]);

  /**
   * Opens / ensures active WebSocket connection for STT.
   */
  const ensureSTTWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    const currentLang = activeLangRef.current || "fa";
    const ws = voiceApi.createSTTWebSocket({
      lang: currentLang,
      onOpen: () => {
        console.log(`[VAD WebSocket] Connected (${currentLang})`);
      },
      onTranscript: (fullText, meta) => {
        if (fullText && onTranscriptRef.current) {
          onTranscriptRef.current(fullText, meta);
        }
      },
      onError: (err) => {
        console.warn("[VAD WebSocket] Error:", err);
      },
      onClose: () => {
        console.log("[VAD WebSocket] Closed");
      },
    });

    wsRef.current = ws;
    return ws;
  }, []);

  /**
   * Internal handler when speech begins (either via VAD auto-trigger or manual start).
   */
  const handleSpeechStart = useCallback(() => {
    if (isRecordingRef.current) return;

    isRecordingRef.current = true;
    setRecording(true);
    setIsVoiceActive(true);

    // Initialize STT WebSocket stream
    ensureSTTWebSocket();

    onSpeechStartedRef.current?.();
  }, [ensureSTTWebSocket]);

  /**
   * Internal handler when speech ends (after hangover silence).
   */
  const handleSpeechEnd = useCallback(() => {
    if (!isRecordingRef.current) return;

    // If student initiated manual recording, don't stop on brief pauses unless manual stop clicked
    if (manualOverrideRef.current) {
      setIsVoiceActive(false);
      return;
    }

    isRecordingRef.current = false;
    setRecording(false);
    setIsVoiceActive(false);

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.finalize?.();
          wsRef.current.send(JSON.stringify({ type: "stop" }));
          wsRef.current.close();
        }
      } catch {}
      wsRef.current = null;
    }

    onSpeechEndedRef.current?.();
  }, []);

  /**
   * Handle streaming PCM audio chunk from VAD to STT.
   */
  const handleAudioChunk = useCallback((pcmChunk) => {
    if (isRecordingRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(pcmChunk);
    }
  }, []);

  /**
   * Start VAD background listening engine.
   */
  const startVAD = useCallback(async (customStream = null) => {
    if (vadRef.current?.isListening) return;

    try {
      let streamToUse = customStream;
      if (!streamToUse || !streamToUse.active) {
        streamToUse = await navigator.mediaDevices.getUserMedia(WEBRTC_AUDIO_CONSTRAINTS);
      }
      setMicStream(streamToUse);

      const detector = new WebRtcVoiceActivityDetector({
        silenceTimeoutMs,
        preRollMs,
        onSpeechStart: () => {
          if (isAutoVADEnabledRef.current) {
            handleSpeechStart();
          }
        },
        onSpeechEnd: () => {
          if (isAutoVADEnabledRef.current) {
            handleSpeechEnd();
          }
        },
        onAudioChunk: (chunk) => {
          handleAudioChunk(chunk);
        },
        onAudioLevel: (lvl) => {
          setAudioLevel(lvl);
        },
      });

      detector.setBotSpeaking(isBotSpeaking);
      await detector.start(streamToUse);
      vadRef.current = detector;
    } catch (err) {
      console.warn("⚠️ [useWebRtcVAD] Microphone initialization deferred or failed:", err);
    }
  }, [silenceTimeoutMs, preRollMs, isBotSpeaking, handleSpeechStart, handleSpeechEnd, handleAudioChunk]);

  /**
   * Manual Record Trigger (student clicks mic button).
   */
  const startManualRecording = useCallback(async () => {
    manualOverrideRef.current = true;
    handleSpeechStart();

    if (!vadRef.current?.isListening) {
      await startVAD();
    }
  }, [handleSpeechStart, startVAD]);

  /**
   * Manual Stop Trigger (student clicks mic button again).
   */
  const stopManualRecording = useCallback(() => {
    manualOverrideRef.current = false;
    isRecordingRef.current = false;
    setRecording(false);
    setIsVoiceActive(false);

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.finalize?.();
          wsRef.current.send(JSON.stringify({ type: "stop" }));
          wsRef.current.close();
        }
      } catch {}
      wsRef.current = null;
    }

    onSpeechEndedRef.current?.();
  }, []);

  /**
   * Teardown & cleanup.
   */
  const cleanup = useCallback(() => {
    isRecordingRef.current = false;
    manualOverrideRef.current = false;
    setRecording(false);
    setIsVoiceActive(false);
    setAudioLevel(0);

    if (vadRef.current) {
      vadRef.current.stop(false);
      vadRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "stop" }));
          wsRef.current.close();
        }
      } catch {}
      wsRef.current = null;
    }

    setMicStream(null);
  }, []);

  useEffect(() => {
    if (enabled) {
      startVAD();
    } else {
      cleanup();
    }
    return () => {
      cleanup();
    };
  }, [enabled]);

  return {
    isAutoVADEnabled,
    toggleAutoVAD,
    recording,
    audioLevel,
    isVoiceActive,
    micStream,
    startVAD,
    startManualRecording,
    stopManualRecording,
    cleanup,
  };
}
