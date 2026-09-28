import { useState, useRef, useCallback, useEffect } from "react";
import { voiceApi } from "@/api/existing/voice.api";

/**
 * Downsample Float32 audio buffer from input sample rate to 16kHz
 * Exactly matching ChatArea.jsx downsample implementation for old backend STT
 */
function downsample(buffer, inputRate, outputRate) {
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
 * useExamVoiceSTT
 * Directly uses the existing backend STT WebSocket (API_CONFIG.STT_WS_URL: wss://172.20.13.39:8881/ws)
 * exactly as implemented in ChatArea.jsx.
 */
export const useExamVoiceSTT = ({ onTranscript } = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);

  const recordingRef = useRef(false);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const transcriptCallbackRef = useRef(onTranscript);

  useEffect(() => {
    transcriptCallbackRef.current = onTranscript;
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (!recordingRef.current && !isRecording) return;
    console.log("[STT] 🛑 Stopping recording...");

    recordingRef.current = false;
    setIsRecording(false);

    // Disconnect processor & close audio context
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {
        console.warn("[STT] Processor disconnect error:", e);
      }
      processorRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        console.warn("[STT] AudioContext close error:", e);
      }
      audioCtxRef.current = null;
    }

    // Stop microphone stream tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn("[STT] Track stop error:", e);
      }
      streamRef.current = null;
    }

    // Send stop signal to existing backend STT WebSocket & close
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "stop" }));
          wsRef.current.close();
        }
      } catch (e) {
        console.warn("[STT] WebSocket close error:", e);
      }
      wsRef.current = null;
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    if (recordingRef.current) return;
    console.log("[STT] 🎙 Starting recording with existing backend STT (wss://172.20.13.39:8881/ws)...");
    setError(null);

    try {
      // 1. Connect to old backend STT WebSocket
      const ws = voiceApi.createSTTWebSocket({
        onOpen: () => {
          console.log("[STT WS] Connected to old backend STT");
        },
        onTranscript: (msg) => {
          console.log("[STT WS Received]:", msg);
          if (msg && transcriptCallbackRef.current) {
            transcriptCallbackRef.current(msg);
          }
        },
        onError: (e) => {
          console.error("[STT WS] Error:", e);
          setError("خطا در برقراری ارتباط با وب‌سوکت تبدیل گفتار");
        },
        onClose: () => {
          console.log("[STT WS] Closed");
          if (recordingRef.current) {
            stopRecording();
          }
        },
      });

      wsRef.current = ws;

      // 2. Capture microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      recordingRef.current = true;
      setIsRecording(true);

      // 3. Setup AudioContext and script processor (4096 buffer size)
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const proc = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = proc;

      source.connect(proc);

      const silent = audioCtx.createGain();
      silent.gain.value = 0;
      proc.connect(silent);
      silent.connect(audioCtx.destination);

      // 4. Stream 16kHz PCM chunks to WebSocket
      proc.onaudioprocess = (e) => {
        if (!recordingRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        let input = e.inputBuffer.getChannelData(0);

        input = downsample(
          input,
          audioCtxRef.current?.sampleRate || 44100,
          16000
        );

        const buf = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          buf[i] = Math.max(-1, Math.min(1, input[i])) * 32767;
        }

        wsRef.current.send(buf.buffer);
      };
    } catch (err) {
      console.error("[STT] Recording start error:", err);
      recordingRef.current = false;
      setIsRecording(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("دسترسی به میکروفون رد شد. لطفاً دسترسی را فعال فرمایید.");
      } else {
        setError("امکان دسترسی به میکروفون یا اتصال به سرویس صوت وجود ندارد.");
      }
    }
  }, [stopRecording]);

  const toggleRecording = useCallback(() => {
    if (recordingRef.current || isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
  };
};

export default useExamVoiceSTT;
