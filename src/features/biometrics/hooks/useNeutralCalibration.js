/**
 * @file useNeutralCalibration.js
 * @description React Hook for 3-Second Personalized Neutral Baseline Emotion Calibration.
 * Captures facial feature dynamics while the user maintains a resting neutral face,
 * neutralizing natural physiological morphology biases (e.g., natural brow furrows or lip corners).
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { biometricsApi } from "@/api/new/biometrics.api";

export function useNeutralCalibration(options = {}) {
  const {
    userId = "default",
    captureFrameBlob,
    onCalibrationComplete,
  } = options;

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [countdownSec, setCountdownSec] = useState(3);
  const [isNeutralCalibrated, setIsNeutralCalibrated] = useState(false);
  const [statusText, setStatusText] = useState("کالیبره‌نشده");
  const [sampleCount, setSampleCount] = useState(0);

  const samplesBufferRef = useRef([]);
  const timerRef = useRef(null);

  // Check current neutral status
  const checkStatus = useCallback(async () => {
    try {
      const data = await biometricsApi.getNeutralCalibrationStatus(userId);
      setIsNeutralCalibrated(data?.is_calibrated || false);
      setStatusText(data?.is_calibrated ? "کالیبراسیون حالت خنثی فعال است" : "کالیبره‌نشده");
    } catch (e) {
      console.warn("Could not check neutral calibration status:", e);
    }
  }, [userId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start 3-second neutral calibration
  const startNeutralCalibration = useCallback(async () => {
    if (isCalibrating) return;

    setIsCalibrating(true);
    setCountdownSec(3);
    setStatusText("لطفاً چهره خود را در حالت کاملاً آرام و طبیعی (خنثی) نگه دارید...");
    samplesBufferRef.current = [];
    setSampleCount(0);

    let remaining = 3.0;

    timerRef.current = setInterval(async () => {
      // Capture a low-res sample every 500ms
      try {
        if (captureFrameBlob) {
          const blob = await captureFrameBlob(0.75, 320, 240);
          if (blob) {
            const telemData = await biometricsApi.sendBiometricTelemetry(userId, blob, "skip");
            const au = telemData?.action_units || {};
            // 7D Feature vector: [Valence, Arousal, AU1, AU2, AU4, AU12, AU15]
            const feat = [
              telemData?.continuous_valence ?? 0.0,
              telemData?.continuous_arousal ?? 0.0,
              au["AU01_inner_brow_raiser"] ?? 0.05,
              au["AU02_outer_brow_raiser"] ?? 0.05,
              au["AU04_brow_lowerer"] ?? 0.05,
              au["AU12_lip_corner_puller"] ?? 0.05,
              au["AU15_lip_corner_depress"] ?? 0.05,
            ];
            samplesBufferRef.current.push(feat);
            setSampleCount(samplesBufferRef.current.length);
          }
        }
      } catch (err) {
        console.warn("Error sampling neutral frame:", err);
      }

      remaining -= 0.5;
      setCountdownSec(Math.max(0, Math.ceil(remaining)));

      if (remaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Submit collected samples
        setStatusText("در حال محاسبه بردار مبنای احساسات خنثی...");
        try {
          const res = await biometricsApi.calibrateNeutralBaseline(
            userId,
            samplesBufferRef.current
          );

          if (res?.is_calibrated || res?.status === "success") {
            setIsNeutralCalibrated(true);
            setStatusText("کالیبراسیون احساسات خنثی با موفقیت ثبت شد");
            if (onCalibrationComplete) {
              onCalibrationComplete();
            }
          } else {
            setStatusText("خطا در ثبت کالیبراسیون خنثی");
          }
        } catch (err) {
          console.error("Failed to calibrate neutral baseline:", err);
          setStatusText("خطای ارتباط با سرور");
        } finally {
          setIsCalibrating(false);
        }
      }
    }, 500);
  }, [isCalibrating, userId, captureFrameBlob, onCalibrationComplete]);

  // Reset neutral calibration
  const resetNeutralCalibration = useCallback(async () => {
    setIsNeutralCalibrated(false);
    setStatusText("کالیبره‌نشده");
    samplesBufferRef.current = [];
    setSampleCount(0);
  }, []);

  return {
    isCalibrating,
    countdownSec,
    sampleCount,
    isNeutralCalibrated,
    statusText,
    startNeutralCalibration,
    resetNeutralCalibration,
    checkStatus,
  };
}

export default useNeutralCalibration;
