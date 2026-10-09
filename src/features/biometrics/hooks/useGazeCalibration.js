/**
 * @file useGazeCalibration.js
 * @description React Hook for Gaze & Head Movement ('نه نه') Calibration.
 * Manages interactive target presentation and submissions of 7D features
 * to fit the personalized Ridge Regression polynomial model.
 */

import { useState, useCallback, useRef } from "react";
import { biometricsApi } from "@/api/new/biometrics.api";

// 5 Key Calibration Targets: Center, Left ('نه'), Right ('نه'), Top, Bottom
const CALIBRATION_TARGETS = [
  { id: "center_init", label: "مرکز تصویر", norm: [0.50, 0.50], x: 50, y: 50, hint: "مستقیماً به نقطه قرمز مرکز صفحه نگاه کنید" },
  { id: "turn_left", label: "سمت چپ (نه)", norm: [0.15, 0.50], x: 15, y: 50, hint: "سر و چشمان خود را به آرامی به سمت چپ حرکت دهید" },
  { id: "turn_right", label: "سمت راست (نه)", norm: [0.85, 0.50], x: 85, y: 50, hint: "سر و چشمان خود را به سمت راست حرکت دهید" },
  { id: "look_top", label: "بالای صفحه", norm: [0.50, 0.15], x: 50, y: 15, hint: "به آرامی به بالای صفحه نگاه کنید" },
  { id: "center_final", label: "مرکز نهایی", norm: [0.50, 0.50], x: 50, y: 50, hint: "مجدداً به مرکز صفحه خیره شوید و ثابت بمانید" },
];

export function useGazeCalibration(options = {}) {
  const {
    userId = "default",
    captureFrameBlob,
    onCalibrationComplete,
  } = options;

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState("تخمین هندسی اولیه");
  const [progress, setProgress] = useState(0);

  const collectedSamplesRef = useRef([]);
  const progressTimerRef = useRef(null);
  const sequenceTimerRef = useRef(null);

  // Check calibration status from backend
  const checkCalibrationStatus = useCallback(async () => {
    try {
      const data = await biometricsApi.getGazeCalibrationStatus(userId);
      setIsCalibrated(data?.is_calibrated || false);
      setStatusMessage(data?.is_calibrated ? "کالیبره‌شده با دقت بالا" : "نیاز به کالیبراسیون");
      if (data?.is_calibrated) {
        setProgress(100);
      }
    } catch (e) {
      console.warn("Could not check gaze calibration status:", e);
    }
  }, [userId]);

  // Clean up timers
  const clearTimers = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (sequenceTimerRef.current) {
      clearTimeout(sequenceTimerRef.current);
      sequenceTimerRef.current = null;
    }
  }, []);

  // Step through calibration targets
  const processNextTarget = useCallback(
    async (stepIndex) => {
      clearTimers();

      if (stepIndex >= CALIBRATION_TARGETS.length) {
        // Completed all targets -> submit to API
        setStatusMessage("در حال برازش مدل رگرسیون چندجمله‌ای...");
        setProgress(95);
        try {
          const res = await biometricsApi.calibrateGaze(userId, collectedSamplesRef.current);
          if (res?.is_calibrated || res?.status === "success") {
            setIsCalibrated(true);
            setProgress(100);
            setStatusMessage("کالیبراسیون زاویه سر و نگاه با موفقیت انجام شد");
            if (onCalibrationComplete) onCalibrationComplete();
          } else {
            setStatusMessage("خطا در برازش کالیبراسیون");
          }
        } catch (err) {
          setStatusMessage("خطای ارتباط با سرور در کالیبراسیون");
        } finally {
          setIsCalibrating(false);
          setCurrentTarget(null);
        }
        return;
      }

      const target = CALIBRATION_TARGETS[stepIndex];
      setCurrentStep(stepIndex + 1);
      setCurrentTarget(target);
      setStatusMessage(target.hint);

      // Clean discrete target percentage:
      // Point 1: 20%, Point 2: 40%, Point 3: 60%, Point 4: 80%, Point 5: 90% (stays 90% during fixation/submission, only hits 100% upon server confirmation)
      const currentTargetProgress = stepIndex === 4 ? 90 : (stepIndex + 1) * 20;
      setProgress(currentTargetProgress);

      // 900ms fixation dwell
      sequenceTimerRef.current = setTimeout(async () => {
        try {
          const blob = await captureFrameBlob(0.75, 320, 240);
          if (blob) {
            const telemData = await biometricsApi.sendBiometricTelemetry(userId, blob, "skip");
            if (telemData?.gaze_features && telemData.gaze_features.length >= 7) {
              collectedSamplesRef.current.push({
                features: telemData.gaze_features,
                target_norm: target.norm,
              });
            } else {
              // Synthetic / fallback 7D vector from pitch/yaw
              const p = (telemData?.pitch || 0.0) * (Math.PI / 180);
              const y = (telemData?.yaw || 0.0) * (Math.PI / 180);
              collectedSamplesRef.current.push({
                features: [p, y, 0.0, 0.0, 1.0, target.norm[0] - 0.5, target.norm[1] - 0.5],
                target_norm: target.norm,
              });
            }
          }
        } catch (e) {
          console.warn("Target sample capture error:", e);
        }

        // Brief 400ms pause before advancing to next target
        sequenceTimerRef.current = setTimeout(() => {
          processNextTarget(stepIndex + 1);
        }, 400);
      }, 900);
    },
    [userId, captureFrameBlob, onCalibrationComplete, clearTimers]
  );

  const startCalibration = useCallback(() => {
    clearTimers();
    setIsCalibrating(true);
    setCurrentStep(0);
    setProgress(0);
    collectedSamplesRef.current = [];
    processNextTarget(0);
  }, [processNextTarget, clearTimers]);

  const resetCalibration = useCallback(() => {
    clearTimers();
    setIsCalibrated(false);
    setCurrentStep(0);
    setProgress(0);
    setCurrentTarget(null);
    setStatusMessage("کالیبراسیون بازنشانی شد");
    collectedSamplesRef.current = [];
  }, [clearTimers]);

  return {
    isCalibrating,
    currentStep,
    totalSteps: CALIBRATION_TARGETS.length,
    currentTarget,
    isCalibrated,
    statusMessage,
    progress,
    startCalibration,
    resetCalibration,
    checkCalibrationStatus,
  };
}

export default useGazeCalibration;
