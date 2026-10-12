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
export async function enrollStudentFace(userId, imageBlob, livenessMode = "balanced", detector = "opencv") {
  const formData = new FormData();
  formData.append("user_id", String(userId).trim());
  formData.append("file", imageBlob, "face_enroll.jpg");
  formData.append("liveness_mode", livenessMode);
  formData.append("detector", detector);

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
export async function calibrateNeutralBaseline(userId, samples = null) {
  const payload = {
    user_id: String(userId).trim(),
  };
  if (Array.isArray(samples) && samples.length > 0) {
    payload.samples = samples;
  }

  return requestWithFallback(
    `${BASE_PREFIX}/telemetry/calibrate_neutral`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

/**
 * 10. Reset Student Biometrics (Allow Re-Registration if can_edit is true)
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function resetStudentBiometrics(userId) {
  return requestWithFallback(
    `${BASE_PREFIX}/student/${encodeURIComponent(userId)}/reset`,
    {
      method: "POST",
    },
    () => ({
      status: "success",
      message: "اطلاعات بیومتریک با موفقیت حذف شد.",
      user_id: userId,
      can_edit: true,
    })
  );
}

/**
 * 11. Admin Toggle Biometric Edit Permission
 * @param {string} userId
 * @param {boolean} canEdit
 * @returns {Promise<Object>}
 */
export async function toggleBiometricEditPermission(userId, canEdit) {
  return requestWithFallback(
    `${BASE_PREFIX}/student/${encodeURIComponent(userId)}/edit-permission`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ can_edit: canEdit }),
    },
    () => ({
      status: "success",
      user_id: userId,
      can_edit: canEdit,
    })
  );
}

/**
 * Resolves candidate user identifiers for biometrics in prioritized order.
 * @param {Object} currentUser
 * @returns {Array<string>}
 */
export function getCandidateBiometricIds(currentUser) {
  let user = currentUser;
  if (!user || (!user.user_id && !user.id && !user.username)) {
    try {
      const saved = localStorage.getItem("current_user");
      if (saved) user = JSON.parse(saved);
    } catch { }
  }
  const ids = [];
  if (user?.user_id) ids.push(String(user.user_id).trim());
  if (user?.id) ids.push(String(user.id).trim());
  if (user?.student_id) ids.push(String(user.student_id).trim());
  if (user?.username) ids.push(String(user.username).trim());
  return [...new Set(ids.filter(Boolean))];
}

/**
 * Checks biometric enrollment status across all candidate identifiers and caches verified state.
 * The backend database is the single source of truth.
 * @param {Object} currentUser
 * @returns {Promise<Object>}
 */
export async function checkStudentBiometricStatus(currentUser) {
  const candidateIds = getCandidateBiometricIds(currentUser);
  if (!candidateIds.length) {
    return {
      is_enrolled: false,
      face_enrolled: false,
      is_fully_registered: false,
      ready_for_exam: false,
    };
  }

  let resolvedStatus = null;
  let serverFoundEnrolled = false;

  for (const cid of candidateIds) {
    try {
      const res = await getStudentBiometricProfile(cid);
      if (
        res &&
        (res.is_enrolled ||
          res.face_enrolled ||
          res.is_fully_registered ||
          res.ready_for_exam)
      ) {
        resolvedStatus = res;
        serverFoundEnrolled = true;
        break;
      } else if (res && !resolvedStatus) {
        resolvedStatus = res;
      }
    } catch (err) {
      console.warn(`Failed checking biometrics for candidate ${cid}:`, err);
    }
  }

  if (serverFoundEnrolled) {
    try {
      localStorage.setItem("dt_biometrics_registered", "true");
      for (const cid of candidateIds) {
        localStorage.setItem(`dt_biometrics_${cid}`, "true");
      }
    } catch { }
    return { ...resolvedStatus, is_enrolled: true, is_fully_registered: true, ready_for_exam: true };
  }

  // Server confirms student is NOT enrolled. Purge any stale localStorage keys so settings modal does not lie!
  try {
    localStorage.removeItem("dt_biometrics_registered");
    for (const cid of candidateIds) {
      localStorage.removeItem(`dt_biometrics_${cid}`);
    }
  } catch { }

  return resolvedStatus || {
    user_id: candidateIds[0],
    is_enrolled: false,
    face_enrolled: false,
    is_fully_registered: false,
    ready_for_exam: false,
  };
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
  resetStudentBiometrics,
  toggleBiometricEditPermission,
  getCandidateBiometricIds,
  checkStudentBiometricStatus,
};

export default biometricsApi;

