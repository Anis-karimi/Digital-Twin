/**
 * @file useGazeCalibration.js
 * @description React Hook for Gaze & Head Movement ('نه نه') Calibration.
 * Manages interactive target presentation and submissions of genuine 7D features
 * to fit the personalized Ridge Regression polynomial model.
 * Strict face-in-frame validation prevents recording frames without a verified face.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "@/translations/useTranslation";
import { biometricsApi } from "@/api/new/biometrics.api";

// 5 Key Calibration Targets: Center, Left ('نه'), Right ('نه'), Top, Center Final
export const getCalibrationTargets = (t = (k) => k) => [
  { id: "center_init", label: t("gazeCenterInit"), norm: [0.50, 0.50], x: 50, y: 50, hint: t("gazeHintCenterInit") },
  { id: "turn_left", label: t("gazeTurnLeft"), norm: [0.18, 0.50], x: 18, y: 50, hint: t("gazeHintTurnLeft") },
  { id: "turn_right", label: t("gazeTurnRight"), norm: [0.82, 0.50], x: 82, y: 50, hint: t("gazeHintTurnRight") },
  { id: "look_top", label: t("gazeLookTop"), norm: [0.50, 0.20], x: 50, y: 20, hint: t("gazeHintLookTop") },
  { id: "center_final", label: t("gazeCenterFinal"), norm: [0.50, 0.50], x: 50, y: 50, hint: t("gazeHintCenterFinal") },
];
export const CALIBRATION_TARGETS = getCalibrationTargets();

export function useGazeCalibration(options = {}) {
  const { t } = useTranslation();
  const CALIBRATION_TARGETS = useMemo(() => getCalibrationTargets(t), [t]);
  const {
    userId = "default",
    captureFrameBlob,
    isFaceInFrame,
    onCalibrationComplete,
  } = options;

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [pointProgress, setPointProgress] = useState(0); // 0 - 100 for current point dwell
  const [progress, setProgress] = useState(0); // 0 - 100 overall
  const [isFaceMissing, setIsFaceMissing] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState(() => t("initialGeometricEstimation"));

  const collectedSamplesRef = useRef([]);
  const timerRef = useRef(null);
  const isFaceInFrameRef = useRef(isFaceInFrame);
  const optionsRef = useRef({ userId, captureFrameBlob, onCalibrationComplete });

  useEffect(() => {
    isFaceInFrameRef.current = isFaceInFrame;
  }, [isFaceInFrame]);

  useEffect(() => {
    optionsRef.current = { userId, captureFrameBlob, onCalibrationComplete };
  }, [userId, captureFrameBlob, onCalibrationComplete]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Check calibration status from backend
  const checkCalibrationStatus = useCallback(async () => {
    try {
      const data = await biometricsApi.getGazeCalibrationStatus(userId);
      setIsCalibrated(data?.is_calibrated || false);
      setStatusMessage(data?.is_calibrated ? t("calibratedHighPrecision") : t("calibrationNeeded"));
      if (data?.is_calibrated) {
        setProgress(100);
      }
    } catch (e) {
      console.warn("Could not check gaze calibration status:", e);
    }
  }, [userId]);

  // Finalize calibration by sending verified samples to backend
  const finalizeCalibration = useCallback(async () => {
    clearTimers();
    setStatusMessage(t("fittingPolynomialRegression"));
    setProgress(95);

    try {
      const { userId: uid, onCalibrationComplete } = optionsRef.current;
      const samples = collectedSamplesRef.current;
      if (samples.length < 5) {
        setStatusMessage(t("insufficientSamplesForCalibration"));
        setIsCalibrating(false);
        return;
      }

      const res = await biometricsApi.calibrateGaze(uid, samples);
      if (res?.is_calibrated || res?.status === "success") {
        setIsCalibrated(true);
        setProgress(100);
        setStatusMessage(t("gazeCalibrationCompleteSuccess"));
        if (onCalibrationComplete) {
          onCalibrationComplete();
        }
      } else {
        setStatusMessage(t("errorFittingCalibration"));
      }
    } catch (err) {
      console.warn("Gaze calibration final submission error:", err);
      setStatusMessage(t("serverErrorGazeCalibration"));
    } finally {
      setIsCalibrating(false);
      setCurrentTarget(null);
    }
  }, [clearTimers]);

  // Process a single target with steady face presence verification
  const processTarget = useCallback(
    (stepIndex) => {
      clearTimers();

      if (stepIndex >= CALIBRATION_TARGETS.length) {
        finalizeCalibration();
        return;
      }

      const target = CALIBRATION_TARGETS[stepIndex];
      setCurrentStep(stepIndex + 1);
      setCurrentTarget(target);
      setPointProgress(0);
      setStatusMessage(target.hint);
      setIsFaceMissing(false);

      const baseProgress = stepIndex * 20;
      setProgress(baseProgress);

      const DWELL_TARGET_MS = 1300; // 1.3s steady dwell
      const TICK_MS = 50;
      let accumulatedDwellMs = 0;
      let sampledFeature = null;
      let isSamplingBusy = false;

      timerRef.current = setInterval(async () => {
        // 1. Strict check: Face MUST be in frame
        const isPresent =
          typeof isFaceInFrameRef.current === "function"
            ? isFaceInFrameRef.current()
            : isFaceInFrameRef.current !== false;

        if (!isPresent) {
          setIsFaceMissing(true);
          setStatusMessage(t("faceOutOfFrameCenterSelf"));
          // PAUSE! Do not increment dwell time when face is out of frame
          return;
        }

        setIsFaceMissing(false);
        setStatusMessage(target.hint);
        accumulatedDwellMs += TICK_MS;

        const pPct = Math.min(100, Math.round((accumulatedDwellMs / DWELL_TARGET_MS) * 100));
        setPointProgress(pPct);
        setProgress(baseProgress + Math.round(pPct * 0.2));

        // 2. Sample live frame at 500ms of steady gaze
        if (accumulatedDwellMs >= 500 && !sampledFeature && !isSamplingBusy) {
          isSamplingBusy = true;
          try {
            const { captureFrameBlob: capture, userId: uid } = optionsRef.current;
            if (capture) {
              const blob = await capture(0.85, 320);
              if (blob) {
                const telemData = await biometricsApi.sendBiometricTelemetry(uid, blob, "opencv");
                if (
                  telemData &&
                  telemData.face_detected !== false &&
                  telemData.gaze_features &&
                  Array.isArray(telemData.gaze_features) &&
                  telemData.gaze_features.length >= 7
                ) {
                  sampledFeature = telemData.gaze_features;
                }
              }
            }
          } catch (err) {
            console.warn("Gaze point sample capture error:", err);
          } finally {
            isSamplingBusy = false;
          }
        }

        // 3. Point dwell complete
        if (accumulatedDwellMs >= DWELL_TARGET_MS) {
          if (sampledFeature) {
            clearTimers();
            collectedSamplesRef.current.push({
              features: sampledFeature,
              target_norm: target.norm,
            });
            setPointProgress(100);
            setProgress((stepIndex + 1) * 20);

            // Brief pause before smooth transition to next target
            setTimeout(() => {
              processTarget(stepIndex + 1);
            }, 350);
          } else {
            // Frame lacked clear face landmarks; prompt user and retry smoothly
            setStatusMessage(t("holdingGazeHoldSteady"));
            accumulatedDwellMs = 500;
          }
        }
      }, TICK_MS);
    },
    [clearTimers, finalizeCalibration]
  );

  const startCalibration = useCallback(() => {
    clearTimers();
    setIsCalibrating(true);
    setCurrentStep(0);
    setProgress(0);
    setPointProgress(0);
    setIsFaceMissing(false);
    collectedSamplesRef.current = [];
    processTarget(0);
  }, [processTarget, clearTimers]);

  const resetCalibration = useCallback(() => {
    clearTimers();
    setIsCalibrated(false);
    setCurrentStep(0);
    setProgress(0);
    setPointProgress(0);
    setCurrentTarget(null);
    setStatusMessage(t("calibrationResetSuccess"));
    collectedSamplesRef.current = [];
  }, [clearTimers]);

  return {
    isCalibrating,
    currentStep,
    totalSteps: CALIBRATION_TARGETS.length,
    currentTarget,
    pointProgress,
    isCalibrated,
    statusMessage,
    progress,
    isFaceMissing,
    startCalibration,
    resetCalibration,
    checkCalibrationStatus,
  };
}

export default useGazeCalibration;

