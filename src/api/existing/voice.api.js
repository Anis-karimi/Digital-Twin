/**
 * @file voice.api.js
 * @description Audio, Text-to-Speech (TTS), and Speech-to-Text (STT) endpoints.
 */

import { API_CONFIG } from "../config";
import { httpRequest, handleApiError } from "../client";

/**
 * Initiates TTS streaming from Digital Twin server.
 * Encapsulates FormData creation for text payload.
 * 
 * @endpoint POST /tts_router_stream (on DGTW_URL)
 * @param {string} text Text to synthesize into speech
 * @returns {Promise<Response>} Raw response stream reader
 */
export async function streamTTS(text) {
  try {
    const formData = new FormData();
    formData.append("text", text);

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

  // Accumulates finalized sentences across speaker pauses
  let committedTranscript = "";

  ws.onopen = (event) => {
    console.log(`[STT WebSocket] Connected (${isEn ? "en" : "fa"}) to:`, wsUrl);
    if (onOpen) onOpen(event);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[STT WebSocket] frame:", data);

      // 1. Extract finalized text (Vosk: data.text, Whisper: data.text / transcript, custom: result)
      let finalText = "";
      if (typeof data.text === "string") {
        finalText = data.text;
      } else if (typeof data.transcript === "string") {
        finalText = data.transcript;
      } else if (typeof data.result === "string") {
        finalText = data.result;
      } else if (Array.isArray(data.result)) {
        // Vosk array of word objects
        finalText = data.result
          .map((w) => (typeof w === "object" ? w?.word : w))
          .filter(Boolean)
          .join(" ");
      }

      // 2. Extract partial/interim text (Vosk: data.partial)
      let partialText = "";
      if (typeof data.partial === "string") {
        partialText = data.partial;
      }

      finalText = finalText.trim();
      partialText = partialText.trim();

      // Case A: A completed utterance/phrase frame has arrived (after silence/pause)
      if (finalText) {
        if (!committedTranscript) {
          committedTranscript = finalText;
        } else if (finalText.startsWith(committedTranscript)) {
          // If server sends cumulative text, adopt directly
          committedTranscript = finalText;
        } else {
          // Server sends chunk per pause (standard Vosk/Kaldi behavior)
          committedTranscript = `${committedTranscript} ${finalText}`;
        }

        if (onTranscript) {
          onTranscript(committedTranscript, {
            ...data,
            isFinal: true,
            chunk: finalText,
            accumulated: committedTranscript,
          });
        }
      }
      // Case B: Partial interim words while the speaker is actively talking
      else if (partialText) {
        const currentFull = committedTranscript
          ? `${committedTranscript} ${partialText}`
          : partialText;

        if (onTranscript) {
          onTranscript(currentFull, {
            ...data,
            isFinal: false,
            chunk: partialText,
            accumulated: currentFull,
          });
        }
      }
    } catch (err) {
      console.warn("[STT WebSocket] Received non-JSON frame:", event.data);
    }
  };

  ws.onerror = (event) => {
    console.error(`[STT WebSocket] Error on ${wsUrl}:`, event);
    if (onError) onError(event);
  };

  ws.onclose = (event) => {
    console.log(`[STT WebSocket] Closed (${isEn ? "en" : "fa"})`);
    if (onClose) onClose(event);
  };

  return ws;
}

export const voiceApi = {
  streamTTS,
  uploadAudio,
  deleteAudio,
  createSTTWebSocket,
};

export default voiceApi;
