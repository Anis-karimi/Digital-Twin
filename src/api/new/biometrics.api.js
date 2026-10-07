/**
 * @file biometrics.api.js
 * @description Biometric Face Authentication, Gaze/Head Calibration ('نه نه'),
 * 3-Second Neutral Baseline, Real-time Telemetry, and Exam Proctoring API client.
 */

import { requestWithFallback } from "../client";
import { API_CONFIG } from "../config";

const BASE_PREFIX = "/biometrics";

/**
 * 1. Face Enrollment (Anti-Spoof Gate + 512-D ArcFace Vector)
 * @param {string} userId
 * @param {Blob} imageBlob
 * @param {string} [livenessMode="balanced"]
 * @returns {Promise<Object>}
 */
export async function enrollStudentFace(userId, imageBlob, livenessMode = "balanced") {
  const formData = new FormData();
  formData.append("user_id", String(userId).trim());
  formData.append("file", imageBlob, "face_enroll.jpg");
  formData.append("liveness_mode", livenessMode);

  return requestWithFallback(
    `${BASE_PREFIX}/enroll`,
    {
      method: "POST",
      body: formData,
    },
    () => ({
      status: "enrolled",
      user_id: userId,
      vector_size: 512,
      liveness: "passed",
    })
  );
}

/**
 * 2. Face Verification (1:1 Cosine Distance <= 0.65)
 * @param {string} userId
 * @param {Blob} imageBlob
 * @param {string} [livenessMode="balanced"]
 * @returns {Promise<Object>}
 */
export async function verifyStudentFace(userId, imageBlob, livenessMode = "balanced") {
  const formData = new FormData();
  formData.append("user_id", String(userId).trim());
  formData.append("file", imageBlob, "face_verify.jpg");
  formData.append("liveness_mode", livenessMode);

  return requestWithFallback(
    `${BASE_PREFIX}/verify`,
    {
      method: "POST",
      body: formData,
    },
    () => ({
      verified: true,
      status: "matched",
      cosine_distance: 0.28,
      threshold: 0.65,
      liveness: "passed",
      user_id: userId,
    })
  );
}

/**
 * 3. Gaze & Head Movement Calibration ('نه نه')
 * @param {string} userId
 * @param {Array<Object>} samples
 * @returns {Promise<Object>}
 */
export async function calibrateGaze(userId, samples) {
  return requestWithFallback(
    `${BASE_PREFIX}/calibrate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: String(userId).trim(),
        samples,
      }),
    },
    () => ({
      status: "success",
      message: `Successfully calibrated ${samples?.length || 5} points`,
      user_id: userId,
      samples_count: samples?.length || 5,
      is_calibrated: true,
    })
  );
}

/**
 * 4. Get Gaze Calibration Status
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getGazeCalibrationStatus(userId) {
  return requestWithFallback(
    `${BASE_PREFIX}/calibrate/status?user_id=${encodeURIComponent(userId)}`,
    { method: "GET" },
    () => ({
      user_id: userId,
      is_calibrated: false,
      samples_count: 0,
    })
  );
}

/**
 * 5. 3-Second Neutral Baseline Emotion Calibration
 * @param {string} userId
 * @param {Array<Array<number>>} samples
 * @returns {Promise<Object>}
 */
export async function calibrateNeutralBaseline(userId, samples) {
  return requestWithFallback(
    `${BASE_PREFIX}/telemetry/calibrate_neutral`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: String(userId).trim(),
        samples,
      }),
    },
    () => ({
      status: "success",
      message: "Successfully calibrated neutral baseline",
      user_id: userId,
      samples_count: samples?.length || 6,
      is_calibrated: true,
    })
  );
}

/**
 * 6. Get Neutral Baseline Status
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getNeutralCalibrationStatus(userId) {
  return requestWithFallback(
    `${BASE_PREFIX}/telemetry/calibrate_neutral/status?user_id=${encodeURIComponent(userId)}`,
    { method: "GET" },
    () => ({
      user_id: userId,
      is_calibrated: false,
      duration_sec: 3.0,
      samples_buffered: 0,
    })
  );
}

/**
 * 7. Send Real-Time Frame Telemetry Pulse (1-2 FPS)
 * @param {string} userId
 * @param {Blob} imageBlob
 * @param {string} [detector="skip"]
 * @returns {Promise<Object>}
 */
export async function sendBiometricTelemetry(userId, imageBlob, detector = "skip") {
  const formData = new FormData();
  formData.append("user_id", String(userId).trim());
  formData.append("file", imageBlob, "telemetry.jpg");
  formData.append("detector", detector);

  return requestWithFallback(
    `${BASE_PREFIX}/telemetry`,
    {
      method: "POST",
      body: formData,
    },
    () => ({
      user_id: userId,
      dominant_emotion: "neutral",
      stress_score: 22.0,
      status: "Normal",
      continuous_valence: 0.1,
      continuous_arousal: 0.05,
      attention_score: 96.0,
      attention_status: "Focused",
      is_focused: true,
      pitch: 0.0,
      yaw: 0.0,
      roll: 0.0,
      gaze_direction: "Center",
      face_detected: true,
      is_calibrated: true,
      is_neutral_calibrated: true,
    })
  );
}

/**
 * 8. Comprehensive Student Biometric Profile Status
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getStudentBiometricProfile(userId) {
  return requestWithFallback(
    `${BASE_PREFIX}/student/${encodeURIComponent(userId)}/status`,
    { method: "GET" },
    () => ({
      user_id: userId,
      is_enrolled: false,
      is_gaze_calibrated: false,
      is_neutral_calibrated: false,
    })
  );
}

/**
 * 9. Log Exam Distraction Event
 * @param {string} sessionId
 * @param {string} userId
 * @param {Object} details
 * @returns {Promise<Object>}
 */
export async function logExamDistraction(sessionId, userId, details = {}) {
  return requestWithFallback(
    `${BASE_PREFIX}/exam/${encodeURIComponent(sessionId)}/distraction`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        timestamp: Date.now() / 1000,
        attention_score: details.attention_score ?? 30.0,
        gaze_direction: details.gaze_direction || "Away",
        pitch: details.pitch || 0.0,
        yaw: details.yaw || 0.0,
        duration_seconds: details.duration_seconds || 2.0,
        notes: details.notes || "Looked away from screen",
      }),
    },
    () => ({
      status: "logged",
      session_id: sessionId,
      user_id: userId,
      total_distractions_count: 1,
    })
  );
}

export const biometricsApi = {
  enrollStudentFace,
  verifyStudentFace,
  calibrateGaze,
  getGazeCalibrationStatus,
  calibrateNeutralBaseline,
  getNeutralCalibrationStatus,
  sendBiometricTelemetry,
  getStudentBiometricProfile,
  logExamDistraction,
};

export default biometricsApi;
