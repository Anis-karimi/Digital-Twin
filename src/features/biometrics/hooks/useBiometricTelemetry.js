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
    detector = "opencv",
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
  const optionsRef = useRef({
    intervalMs,
    userId,
    detector,
    captureFrameBlob,
    onTelemetryUpdate,
    onError,
  });

  // Keep optionsRef fresh on every render without restarting intervals
  useEffect(() => {
    optionsRef.current = {
      intervalMs,
      userId,
      detector,
      captureFrameBlob,
      onTelemetryUpdate,
      onError,
    };
  }, [intervalMs, userId, detector, captureFrameBlob, onTelemetryUpdate, onError]);

  const sendTelemetryPulse = useCallback(async () => {
    const opts = optionsRef.current;
    if (isBusyRef.current || !opts.captureFrameBlob) return;

    try {
      // Downscale frame to 320px targetDim @ 0.65 quality (~15KB per pulse)
      const blob = await opts.captureFrameBlob(0.65, 320);
      if (!blob) return;

      isBusyRef.current = true;
      const startTime = performance.now();

      const data = await biometricsApi.sendBiometricTelemetry(
        opts.userId,
        blob,
        opts.detector || "opencv"
      );
      const elapsed = Math.round(performance.now() - startTime);

      setTelemetry(data);
      setLatencyMs(elapsed);
      setError(null);
      if (opts.onTelemetryUpdate) {
        opts.onTelemetryUpdate(data);
      }
    } catch (err) {
      setError(err?.message || "ارسال تله‌متری با خطا مواجه شد");
      if (opts.onError) opts.onError(err);
    } finally {
      isBusyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsStreaming(false);
      return;
    }

    setIsStreaming(true);
    // Send initial pulse immediately
    sendTelemetryPulse();

    const timer = setInterval(() => {
      sendTelemetryPulse();
    }, intervalMs);

    return () => {
      clearInterval(timer);
      setIsStreaming(false);
    };
  }, [enabled, intervalMs, sendTelemetryPulse]);

  const startTelemetry = useCallback(() => {
    sendTelemetryPulse();
  }, [sendTelemetryPulse]);

  const stopTelemetry = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const toggleTelemetry = useCallback(() => {
    setIsStreaming((prev) => !prev);
  }, []);

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
