/**
 * @file useBiometricTelemetry.js
 * @description React Hook for Continuous Biometric & Affect Telemetry Streaming.
 * Dispatches frame snapshots at a controlled rate (e.g. 1 FPS / 1000ms)
 * with strict concurrency guards to avoid request stacking.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { biometricsApi } from "@/api/new/biometrics.api";

export function useBiometricTelemetry(options = {}) {
  const {
    intervalMs = 1000,
    userId = "default",
    detector = "skip",
    captureFrameBlob,
    onTelemetryUpdate,
    onError,
    enabled = false,
  } = options;

  const [isStreaming, setIsStreaming] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const [error, setError] = useState(null);

  const isBusyRef = useRef(false);
  const timerRef = useRef(null);

  const sendTelemetryPulse = useCallback(async () => {
    if (isBusyRef.current || !captureFrameBlob) return;

    try {
      // Downscale frame to 320x240 @ 0.65 quality (only ~15KB per pulse)
      const blob = await captureFrameBlob(0.65, 320, 240);
      if (!blob) return;

      isBusyRef.current = true;
      const startTime = performance.now();

      const data = await biometricsApi.sendBiometricTelemetry(userId, blob, detector);
      const elapsed = Math.round(performance.now() - startTime);

      setTelemetry(data);
      setLatencyMs(elapsed);
      setError(null);
      if (onTelemetryUpdate) onTelemetryUpdate(data);
    } catch (err) {
      setError(err?.message || "ارسال تله‌متری با خطا مواجه شد");
      if (onError) onError(err);
    } finally {
      isBusyRef.current = false;
    }
  }, [userId, detector, captureFrameBlob, onTelemetryUpdate, onError]);

  const startTelemetry = useCallback(() => {
    if (isStreaming) return;
    setIsStreaming(true);
    sendTelemetryPulse();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(sendTelemetryPulse, intervalMs);
  }, [isStreaming, sendTelemetryPulse, intervalMs]);

  const stopTelemetry = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const toggleTelemetry = useCallback(() => {
    if (isStreaming) {
      stopTelemetry();
    } else {
      startTelemetry();
    }
  }, [isStreaming, startTelemetry, stopTelemetry]);

  useEffect(() => {
    if (enabled) {
      startTelemetry();
    } else {
      stopTelemetry();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, startTelemetry, stopTelemetry]);

  return {
    isStreaming,
    telemetry,
    latencyMs,
    error,
    startTelemetry,
    stopTelemetry,
    toggleTelemetry,
    sendTelemetryPulse,
  };
}

export default useBiometricTelemetry;
