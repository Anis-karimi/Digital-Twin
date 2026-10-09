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
    isFaceInFrame,
  } = options;

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [countdownSec, setCountdownSec] = useState(3);
  const [progress, setProgress] = useState(0);
  const [isFaceMissing, setIsFaceMissing] = useState(false);
  const [isNeutralCalibrated, setIsNeutralCalibrated] = useState(false);
  const [statusText, setStatusText] = useState("کالیبره‌نشده");
  const [sampleCount, setSampleCount] = useState(0);

  const pendingPromisesRef = useRef([]);
  const timerRef = useRef(null);
  const isFaceInFrameRef = useRef(isFaceInFrame);

  useEffect(() => {
    isFaceInFrameRef.current = isFaceInFrame;
  }, [isFaceInFrame]);

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

  // Start 3-second neutral calibration based on actual in-frame presence
  const startNeutralCalibration = useCallback(async () => {
    if (isCalibrating) return;

    // Prerequisite: verify face is in frame
    const faceCheck = typeof isFaceInFrameRef.current === "function"
      ? isFaceInFrameRef.current()
      : isFaceInFrameRef.current;

    if (faceCheck === false) {
      setStatusText("لطفاً ابتدا صورت خود را در مرکز کادر قرار دهید");
      return;
    }

    setIsCalibrating(true);
    setIsFaceMissing(false);
    setProgress(0);
    setCountdownSec(3);
    setStatusText("لطفاً چهره خود را در حالت کاملاً آرام و طبیعی (خنثی) نگه دارید...");
    pendingPromisesRef.current = [];
    setSampleCount(0);

    const TOTAL_MS = 3000;
    const TICK_MS = 50;
    let accumulatedMs = 0;
    let lastSampleMs = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(async () => {
      const isPresent = typeof isFaceInFrameRef.current === "function"
        ? isFaceInFrameRef.current()
        : isFaceInFrameRef.current;

      if (!isPresent) {
        setIsFaceMissing(true);
        setStatusText("چهره از کادر خارج شد! لطفاً روبه‌روی دوربین قرار بگیرید");
        return;
      }

      setIsFaceMissing(false);
      accumulatedMs += TICK_MS;

      const pct = Math.min(100, Math.round((accumulatedMs / TOTAL_MS) * 100));
      setProgress(pct);

      const remSec = Math.max(0, Math.ceil((TOTAL_MS - accumulatedMs) / 1000));
      setCountdownSec(remSec);

      // Send telemetry sample every 300ms of valid in-frame presence (starting at tick 1)
      if (accumulatedMs === TICK_MS || accumulatedMs - lastSampleMs >= 300) {
        lastSampleMs = accumulatedMs;
        const p = (async () => {
          try {
            if (captureFrameBlob) {
              const blob = await captureFrameBlob(0.75, 320, 240);
              if (blob) {
                // Server extracts 7D features and buffers directly in Redis session with TTL
                await biometricsApi.sendBiometricTelemetry(userId, blob, "skip");
                setSampleCount((prev) => prev + 1);
              }
            }
          } catch (err) {
            console.warn("Error streaming neutral frame:", err);
          }
        })();
        pendingPromisesRef.current.push(p);
      }

      // Reached full 3 seconds of verified in-frame face presence
      if (accumulatedMs >= TOTAL_MS) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        setStatusText("در حال محاسبه و ثبت بردار مبنا در دیتابیس...");
        try {
          // Wait for pending sample inferences to complete
          if (pendingPromisesRef.current.length > 0) {
            await Promise.race([
              Promise.allSettled(pendingPromisesRef.current),
              new Promise((resolve) => setTimeout(resolve, 2000)),
            ]);
          }

          // Trigger server-side calibration from Redis session buffer directly into PostgreSQL
          const res = await biometricsApi.calibrateNeutralBaseline(userId);

          if (res?.is_calibrated || res?.status === "success") {
            setIsNeutralCalibrated(true);
            setProgress(100);
            setStatusText("کالیبراسیون احساسات خنثی با موفقیت در دیتابیس ثبت شد");
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
          setIsFaceMissing(false);
        }
      }
    }, TICK_MS);
  }, [isCalibrating, userId, captureFrameBlob, onCalibrationComplete]);

  // Reset neutral calibration
  const resetNeutralCalibration = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsCalibrating(false);
    setIsFaceMissing(false);
    setProgress(0);
    setCountdownSec(3);
    setIsNeutralCalibrated(false);
    setStatusText("کالیبره‌نشده");
    setSampleCount(0);
  }, []);

  return {
    isCalibrating,
    countdownSec,
    progress,
    isFaceMissing,
    sampleCount,
    isNeutralCalibrated,
    statusText,
    startNeutralCalibration,
    resetNeutralCalibration,
    checkStatus,
  };
}

export default useNeutralCalibration;
