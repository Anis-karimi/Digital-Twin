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
 * @endpoint POST /tts_stream (on DGTW_URL)
 * @param {string} text Text to synthesize into speech
 * @returns {Promise<Response>} Raw response stream reader
 */
export async function streamTTS(text) {
  try {
    const formData = new FormData();
    formData.append("text", text);

    const response = await fetch(`${API_CONFIG.DGTW_URL}/tts_stream`, {
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
 * 
 * @endpoint WSS /ws (on STT_WS_URL)
 * @param {Object} callbacks
 * @param {Function} [callbacks.onOpen] WebSocket opened handler
 * @param {Function} [callbacks.onTranscript] Emits received transcription text (data.text || data.result)
 * @param {Function} [callbacks.onError] WebSocket error handler
 * @param {Function} [callbacks.onClose] WebSocket closed handler
 * @returns {WebSocket} Active WebSocket instance
 */
export function createSTTWebSocket({ onOpen, onTranscript, onError, onClose } = {}) {
  const ws = new WebSocket(API_CONFIG.STT_WS_URL);

  ws.onopen = (event) => {
    console.log("[STT WebSocket] Connected to:", API_CONFIG.STT_WS_URL);
    if (onOpen) onOpen(event);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const text = data.text || data.result || data.transcript || "";
      if (onTranscript && text) {
        onTranscript(text.trim(), data);
      }
    } catch (err) {
      console.warn("[STT WebSocket] Received non-JSON frame:", event.data);
    }
  };

  ws.onerror = (event) => {
    console.error("[STT WebSocket] Error:", event);
    if (onError) onError(event);
  };

  ws.onclose = (event) => {
    console.log("[STT WebSocket] Closed");
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
