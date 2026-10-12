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
  const streamRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [error, setError] = useState(null);

  const localVideoRef = useRef(null);
  const videoRef = existingVideoRef || localVideoRef;
  const offscreenCanvasRef = useRef(null);

  // Stop webcam stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {}
    }
  }, [videoRef]);

  // Start webcam stream with automatic fallback
  const startCamera = useCallback(
    async (deviceIdOverride) => {
      setError(null);
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia is not supported by your browser");
        }

        // Stop any old stream tracks first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => {
            try {
              t.stop();
            } catch {}
          });
          streamRef.current = null;
        }

        const devId = deviceIdOverride || selectedDeviceId;
        const videoConstraints = devId
          ? { deviceId: { exact: devId } }
          : { facingMode: { ideal: facingMode || "user" } };

        const primaryConstraints = {
          video: {
            ...videoConstraints,
            width: { ideal: width || 640 },
            height: { ideal: height || 480 },
          },
          audio: false,
        };

        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
        } catch (firstErr) {
          console.warn("Primary webcam constraints failed, falling back to generic video:", firstErr);
          // Fallback if overconstrained (e.g. facingMode ideal or resolution unsupported)
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(() => {});
          };
          try {
            await videoRef.current.play();
          } catch {}
        }

        // Discover video devices once permission granted
        try {
          if (navigator?.mediaDevices?.enumerateDevices) {
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
            setDevices(videoInputs);
          }
        } catch {}
      } catch (err) {
        console.warn("Camera start failed:", err);
        const msg =
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "دسترسی به دوربین توسط مرورگر مسدود شده است. لطفاً اجازه دسترسی را در مرورگر تایید فرمایید."
            : `خطای دسترسی به دوربین: ${err.message || err}`;
        setError(msg);
        setIsActive(false);
      }
    },
    [selectedDeviceId, width, height, facingMode, videoRef]
  );

  // Capture current frame as Blob (JPEG optimized for high biometric accuracy)
  const captureFrameBlob = useCallback(
    (quality = 0.92, targetWidth = 960, targetHeight = 960) => {
      return new Promise((resolve) => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          return resolve(null);
        }

        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement("canvas");
        }

        const canvas = offscreenCanvasRef.current;
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;

        const scale = Math.min(1.0, Math.min(targetWidth / vw, targetHeight / vh));
        const finalW = Math.max(160, Math.round(vw * scale));
        const finalH = Math.max(120, Math.round(vh * scale));

        canvas.width = finalW;
        canvas.height = finalH;

        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.drawImage(video, 0, 0, finalW, finalH);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      });
    },
    [videoRef]
  );

  // Re-bind stream to video DOM element if component updates
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream && video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
    }
  }, [stream, videoRef]);

  // Mount effect: start on mount if autoStart is true, and clean up only when component truly unmounts
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          try {
            t.stop();
          } catch {}
        });
        streamRef.current = null;
      }
    };
  }, [autoStart, startCamera]);

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
  };
}

export default useBiometricCamera;
