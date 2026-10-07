/**
 * @file useBiometricCamera.js
 * @description React Hook for Managing Webcam Hardware, Video Feed, and Frame Capture.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export function useBiometricCamera(options = {}) {
  const {
    width = 640,
    height = 480,
    facingMode = "user",
    autoStart = false,
    existingVideoRef = null,
  } = options;

  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const videoRef = existingVideoRef || localVideoRef;
  const offscreenCanvasRef = useRef(null);

  // Discover available video inputs
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn("Unable to enumerate media devices:", e);
    }
  }, [selectedDeviceId]);

  // Start webcam stream
  const startCamera = useCallback(
    async (deviceIdOverride) => {
      setError(null);
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia is not supported by your browser");
        }

        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }

        const devId = deviceIdOverride || selectedDeviceId;
        const constraints = {
          video: {
            width: { ideal: width },
            height: { ideal: height },
            ...(devId ? { deviceId: { exact: devId } } : { facingMode }),
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        setIsActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {});
        }

        await refreshDevices();
      } catch (err) {
        const msg =
          err.name === "NotAllowedError"
            ? "دسترسی به دوربین توسط مرورگر مسدود شده است. لطفاً اجازه دسترسی را تایید نمایید."
            : `خطای دوربین: ${err.message || err}`;
        setError(msg);
        setIsActive(false);
      }
    },
    [selectedDeviceId, width, height, facingMode, stream, refreshDevices, videoRef]
  );

  // Stop webcam stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, [stream, videoRef]);

  // Capture current frame as Blob (JPEG downscaled for minimal payload)
  const captureFrameBlob = useCallback(
    (quality = 0.75, targetWidth = 320, targetHeight = 240) => {
      return new Promise((resolve) => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          return resolve(null);
        }

        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement("canvas");
        }

        const canvas = offscreenCanvasRef.current;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      });
    },
    [videoRef]
  );

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    isActive,
    devices,
    selectedDeviceId,
    setSelectedDeviceId: (id) => {
      setSelectedDeviceId(id);
      if (isActive) startCamera(id);
    },
    error,
    startCamera,
    stopCamera,
    captureFrameBlob,
    refreshDevices,
  };
}

export default useBiometricCamera;
