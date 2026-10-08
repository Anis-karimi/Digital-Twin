/**
 * @file StudentBiometricsPage.jsx
 * @description Modern Liquid Glass Biometric Experience:
 * - Auto-detecting & auto-scanning face framework (Apple Face ID aesthetic)
 * - Premium Liquid Glass rounded capsule frame (no harsh boxes, no laser line)
 * - Liquid Glass floating error notification when face is not centered
 * - Full live camera bounded strictly to the 360px application frame
 */

import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Target,
  Smile,
  Check,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { biometricsApi } from "@/api/new/biometrics.api";
import { useBiometricCamera } from "@/features/biometrics/hooks/useBiometricCamera";
import { useGazeCalibration } from "@/features/biometrics/hooks/useGazeCalibration";
import { useNeutralCalibration } from "@/features/biometrics/hooks/useNeutralCalibration";

const WIZARD_STEPS = [
  { id: 1, title: "۱. ثبت چهره و اصالت", short: "ثبت چهره" },
  { id: 2, title: "۲. کالیبراسیون نگاه (نه نه)", short: "نگاه (نه نه)" },
  { id: 3, title: "۳. مبنای خنثی احساسات", short: "حالت خنثی" },
  { id: 4, title: "۴. تایید نهایی", short: "تایید نهایی" },
];

// Pure client-side, zero-network fast face & head detector using canvas chrominance clustering
function detectClientFace(video, canvas) {
  if (!video || video.readyState < 2) return null;
  const sw = 96;
  const sh = 72;
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, sw, sh);
  const imgData = ctx.getImageData(0, 0, sw, sh);
  const data = imgData.data;

  let skinCount = 0;
  let sumX = 0;
  let sumY = 0;
  let sumSqX = 0;

  // Scan central/upper 85% where student's head is positioned
  const minScanY = Math.floor(sh * 0.08);
  const maxScanY = Math.floor(sh * 0.85);

  for (let y = minScanY; y < maxScanY; y++) {
    for (let x = 0; x < sw; x++) {
      const idx = (y * sw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Robust skin color condition in YCbCr & RGB space
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      if (Y > 35 && Cb >= 75 && Cb <= 135 && Cr >= 130 && Cr <= 180 && r > g && g > b) {
        skinCount++;
        sumX += x;
        sumY += y;
        sumSqX += x * x;
      }
    }
  }

  // Require human skin presence (>2.5% of pixels)
  const totalPixels = sw * sh;
  if (skinCount < totalPixels * 0.025) {
    return null;
  }

  // 1. Centroid (Center of Mass)
  const cx = sumX / skinCount;
  const cy = sumY / skinCount;

  // 2. Variance & standard deviation (immune to noise & outliers)
  const varX = Math.max(1, (sumSqX / skinCount) - (cx * cx));
  const stdX = Math.sqrt(varX);

  // 3. Stably bounded face width and height
  const faceW = Math.max(sw * 0.28, Math.min(sw * 0.52, stdX * 2.75));
  const faceH = faceW * 1.30; // Anthropometric head aspect ratio

  // 4. Centered head box
  const faceX = cx - faceW / 2;
  const faceY = cy - faceH * 0.42;

  return {
    normX: Math.max(0, Math.min(1.0 - faceW / sw, faceX / sw)),
    normY: Math.max(0, Math.min(1.0 - faceH / sh, faceY / sh)),
    normW: faceW / sw,
    normH: faceH / sh,
  };
}

export function StudentBiometricsPage() {
  const navigate = useNavigate();
  const { currentUser, isRTL } = useContext(AppContext);

  const studentId = String(
    currentUser?.id ||
    currentUser?.student_id ||
    currentUser?.username ||
    "20000000-0000-4000-8000-000000000105"
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [profileStatus, setProfileStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState({ success: false, message: "" });
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-scan & Face centering detection state
  const containerRef = useRef(null);
  const [faceBox, setFaceBox] = useState(null); // { x, y, width, height } in px
  const [faceStatus, setFaceStatus] = useState("no_face"); // "no_face" | "face_locked"
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const autoEnrollTriggeredRef = useRef(false);
  const offscreenCanvasRef = useRef(null);

  // 1. Live Camera Hook
  const {
    videoRef,
    isActive: isCameraActive,
    error: cameraError,
    startCamera,
    captureFrameBlob,
  } = useBiometricCamera({ autoStart: true });

  // 2. Gaze Calibration Hook
  const {
    isCalibrating: isGazeCalibrating,
    currentStep: gazeSubStep,
    totalSteps: gazeTotalSteps,
    currentTarget: gazeTarget,
    isCalibrated: isGazeCalibrated,
    statusMessage: gazeStatusMsg,
    startCalibration: startGazeCalibration,
  } = useGazeCalibration({
    userId: studentId,
    captureFrameBlob,
    onCalibrationComplete: () => {
      loadProfile();
      setTimeout(() => {
        setCurrentStep(3);
      }, 1400);
    },
  });

  // 3. Neutral Calibration Hook
  const {
    isCalibrating: isNeutralCalibrating,
    countdownSec: neutralCountdown,
    isNeutralCalibrated,
    statusText: neutralStatusMsg,
    startNeutralCalibration,
  } = useNeutralCalibration({
    userId: studentId,
    captureFrameBlob,
    onCalibrationComplete: () => {
      loadProfile();
      setTimeout(() => {
        setCurrentStep(4);
      }, 1400);
    },
  });

  // Load profile from backend
  const loadProfile = async () => {
    try {
      const data = await biometricsApi.getStudentBiometricProfile(studentId);
      if (data) {
        setProfileStatus(data);
        if (data.face_enrolled) {
          setEnrollStatus({ success: true, message: "چهره شما با موفقیت ثبت شده است." });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch student biometric profile:", err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  // Real-time automatic face presence & tracking analyzer
  useEffect(() => {
    if (!isCameraActive || currentStep !== 1 || enrollStatus.success) {
      setFaceBox(null);
      setFaceStatus("no_face");
      return;
    }

    if (!offscreenCanvasRef.current && typeof document !== "undefined") {
      offscreenCanvasRef.current = document.createElement("canvas");
    }

    let isMounted = true;
    let nativeDetector = null;
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch (e) {
        nativeDetector = null;
      }
    }

    let isBusy = false;
    let noFaceCounter = 0;

    const detectCycle = async () => {
      if (!isMounted || isBusy) return;
      const video = videoRef.current;
      const container = containerRef.current;
      if (!video || video.readyState < 2 || !container) return;

      isBusy = true;
      try {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;
        const cw = container.clientWidth || 360;
        const ch = container.clientHeight || 640;

        // Container aspect-cover calculation for scaleX(-1) mirrored video
        const scale = Math.max(cw / vw, ch / vh);
        const renderedW = vw * scale;
        const renderedH = vh * scale;
        const offsetX = (cw - renderedW) / 2;
        const offsetY = (ch - renderedH) / 2;

        let detectedBox = null;

        // 1. Try Native Browser FaceDetector (instant hardware-accelerated tracking)
        if (nativeDetector) {
          try {
            const faces = await nativeDetector.detect(video);
            if (faces && faces.length > 0) {
              const bb = faces[0].boundingBox;
              if (bb && bb.width > 20 && bb.height > 20) {
                // In mirrored mode, horizontal X is inverted:
                const mirroredX = vw - (bb.x + bb.width);
                detectedBox = {
                  x: offsetX + mirroredX * scale,
                  y: offsetY + bb.y * scale,
                  w: bb.width * scale,
                  h: bb.height * scale,
                };
              }
            }
          } catch {
            // Fallback to client canvas tracker
          }
        }

        // 2. High-speed, zero-network Client Canvas Face & Head Tracker
        if (!detectedBox && offscreenCanvasRef.current) {
          const clientFace = detectClientFace(video, offscreenCanvasRef.current);
          if (clientFace) {
            const mirroredNormX = 1.0 - (clientFace.normX + clientFace.normW);
            detectedBox = {
              x: offsetX + mirroredNormX * renderedW,
              y: offsetY + clientFace.normY * renderedH,
              w: clientFace.normW * renderedW,
              h: clientFace.normH * renderedH,
            };
          }
        }

        if (detectedBox && isMounted) {
          noFaceCounter = 0;
          // Apply padding around face for comfortable framing
          const padX = detectedBox.w * 0.16;
          const padY = detectedBox.h * 0.20;
          const targetX = Math.max(8, detectedBox.x - padX);
          const targetY = Math.max(68, detectedBox.y - padY);
          const targetW = Math.min(cw - 16, detectedBox.w + padX * 2);
          const targetH = Math.min(ch - 140, detectedBox.h + padY * 2);

          setFaceBox((prev) => {
            if (!prev) return { x: targetX, y: targetY, width: targetW, height: targetH };

            const dx = Math.abs(targetX - prev.x);
            const dy = Math.abs(targetY - prev.y);
            const dw = Math.abs(targetW - prev.width);
            const dh = Math.abs(targetH - prev.height);

            // Deadband: Ignore micro-jitter (< 3px movement or < 3.5px size change)
            const smoothX = dx < 3.0 ? prev.x : prev.x * 0.82 + targetX * 0.18;
            const smoothY = dy < 3.0 ? prev.y : prev.y * 0.82 + targetY * 0.18;
            const smoothW = dw < 3.5 ? prev.width : prev.width * 0.90 + targetW * 0.10;
            const smoothH = dh < 3.5 ? prev.height : prev.height * 0.90 + targetH * 0.10;

            return {
              x: smoothX,
              y: smoothY,
              width: smoothW,
              height: smoothH,
            };
          });
          setFaceStatus("face_locked");
        } else if (isMounted) {
          noFaceCounter++;
          // Generous hold: do not drop box unless face is absent for at least 8 frames (~400ms)
          if (noFaceCounter >= 8) {
            setFaceBox(null);
            setFaceStatus("no_face");
          }
        }
      } catch (err) {
        console.warn("Face tracker pulse:", err);
      } finally {
        isBusy = false;
      }
    };

    let timer = null;
    const runLoop = async () => {
      if (!isMounted) return;
      await detectCycle();
      if (isMounted) {
        timer = setTimeout(runLoop, nativeDetector ? 60 : 40);
      }
    };
    runLoop();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [isCameraActive, currentStep, enrollStatus.success, studentId]);

  // Automatic Face Enrollment Action
  const handleEnrollFace = async () => {
    if (isLoading) return;
    setErrorMsg("");
    setIsLoading(true);
    try {
      const blob = await captureFrameBlob(0.9, 640, 480);
      if (!blob) {
        throw new Error("خطا در تصویر دوربین. لطفاً دسترسی دوربین را بررسی فرمایید.");
      }
      const res = await biometricsApi.enrollStudentFace(studentId, blob, "balanced", "opencv");
      if (res?.status === "enrolled" || res?.user_id) {
        setEnrollStatus({
          success: true,
          message: "چهره و بردار اصالت با موفقیت ثبت شد.",
        });
        await loadProfile();
        setTimeout(() => {
          setCurrentStep(2);
        }, 1500);
      } else {
        setErrorMsg(res?.detail || "خطا در ثبت چهره. لطفاً مستقیم به دوربین نگاه کنید.");
        autoEnrollTriggeredRef.current = false;
        setScanProgress(0);
      }
    } catch (err) {
      setErrorMsg(err?.message || "خطای ارتباط با سامانه در ثبت چهره.");
      autoEnrollTriggeredRef.current = false;
      setScanProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescanFace = () => {
    setEnrollStatus({ success: false, message: "" });
    setScanProgress(0);
    autoEnrollTriggeredRef.current = false;
    setFaceStatus("no_face");
    setFaceBox(null);
  };

  // Automatic Scanning Progress (Sequentially triggers enrollment once face is locked)
  useEffect(() => {
    if (currentStep !== 1 || enrollStatus.success || isLoading) return;

    let timer = null;

    if (faceStatus === "face_locked") {
      // Smooth automatic scan progress filling to 100% in ~1.1s
      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            if (!autoEnrollTriggeredRef.current) {
              autoEnrollTriggeredRef.current = true;
              handleEnrollFace();
            }
            return 100;
          }
          return prev + 4; // Reaches 100% in ~1.1s smoothly
        });
      }, 45);

      return () => {
        if (timer) clearInterval(timer);
      };
    } else {
      setScanProgress(0);
      autoEnrollTriggeredRef.current = false;
    }
  }, [faceStatus, currentStep, enrollStatus.success, isLoading]);

  // Automatic Sequential Wizard Flow: Auto-start gaze & neutral calibrations without manual button presses
  useEffect(() => {
    if (currentStep === 2 && !isGazeCalibrated && !isGazeCalibrating) {
      const timer = setTimeout(() => {
        startGazeCalibration();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isGazeCalibrated, isGazeCalibrating, startGazeCalibration]);

  useEffect(() => {
    if (currentStep === 3 && !isNeutralCalibrated && !isNeutralCalibrating) {
      const timer = setTimeout(() => {
        startNeutralCalibration();
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isNeutralCalibrated, isNeutralCalibrating, startNeutralCalibration]);

  const isStepDone = (stepId) => {
    if (stepId === 1) return profileStatus?.face_enrolled || enrollStatus.success;
    if (stepId === 2) return profileStatus?.gaze_calibrated || isGazeCalibrated;
    if (stepId === 3) return profileStatus?.neutral_calibrated || isNeutralCalibrated;
    if (stepId === 4) return profileStatus?.ready_for_exam;
    return false;
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const isEnrolledSuccess = currentStep === 1 && enrollStatus.success;
  const isDoneFinal = currentStep === 4 && (profileStatus?.ready_for_exam || isStepDone(1));
  const isLockedOnFace = (faceStatus === "face_locked" && faceBox) || isEnrolledSuccess;

  // Dynamic coordinates: When idle/no face, 4 corner brackets stay at the far screen corners.
  // When face is detected, they dynamically adjust their position, width, and height to frame the face!
  const bracketSize = 56;
  const cw = containerRef.current?.clientWidth || 360;
  const ch = containerRef.current?.clientHeight || 640;

  let bracketPositions;
  if (isLockedOnFace && faceBox) {
    bracketPositions = {
      topLeft: {
        top: `${Math.round(faceBox.y)}px`,
        left: `${Math.round(faceBox.x)}px`,
      },
      topRight: {
        top: `${Math.round(faceBox.y)}px`,
        left: `${Math.round(faceBox.x + faceBox.width - bracketSize)}px`,
      },
      bottomLeft: {
        top: `${Math.round(faceBox.y + faceBox.height - bracketSize)}px`,
        left: `${Math.round(faceBox.x)}px`,
      },
      bottomRight: {
        top: `${Math.round(faceBox.y + faceBox.height - bracketSize)}px`,
        left: `${Math.round(faceBox.x + faceBox.width - bracketSize)}px`,
      },
    };
  } else {
    bracketPositions = {
      topLeft: {
        top: "76px",
        left: "16px",
      },
      topRight: {
        top: "76px",
        left: `${Math.max(16, cw - 16 - bracketSize)}px`,
      },
      bottomLeft: {
        top: `${Math.max(120, ch - 120 - bracketSize)}px`,
        left: "16px",
      },
      bottomRight: {
        top: `${Math.max(120, ch - 120 - bracketSize)}px`,
        left: `${Math.max(16, cw - 16 - bracketSize)}px`,
      },
    };
  }

  const bracketStroke = isEnrolledSuccess
    ? "#34d399"
    : isLockedOnFace
    ? "#38bdf8"
    : "rgba(255, 255, 255, 0.4)";

  const bracketFilter = isEnrolledSuccess
    ? "drop-shadow(0 0 12px rgba(52, 211, 153, 0.9))"
    : isLockedOnFace
    ? "drop-shadow(0 0 10px rgba(56, 189, 248, 0.85))"
    : "drop-shadow(0 0 4px rgba(255, 255, 255, 0.2))";

  return (
    <main
      ref={containerRef}
      className="relative w-full md:w-[360px] h-dvh mx-auto overflow-hidden bg-black text-white flex flex-col justify-between select-none shadow-2xl"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ================= 1. Live Camera Layer (Bounded strictly to App Width) ================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none bg-slate-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            transform: "scaleX(-1)",
            transformOrigin: "center center",
          }}
          className="w-full h-full object-cover"
        />

        {/* Camera Permission / Error Fallback */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
            <AlertTriangle className="w-12 h-12 text-rose-400 mb-3" />
            <p className="text-sm font-bold text-white mb-1 font-vazir">
              دسترسی به دوربین برقرار نشد
            </p>
            <p className="text-xs text-slate-400 mb-4 font-vazir max-w-xs">
              برای احراز هویت و شرکت در آزمون، دسترسی دوربین الزامی است.
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all"
            >
              اتصال مجدد دوربین
            </button>
          </div>
        )}

        {/* Ambient Dark Tint & Vignette */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* ================= 2. Sleek Floating Header Bar ================= */}
      <header className="relative z-20 w-full pt-4 px-4 pb-2 shrink-0 flex items-center justify-between">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/StudentSettings")}
          className="liquid-glass-card liquid-glass-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-vazir transition-all active:scale-95 cursor-pointer shadow-lg hover:border-white/40"
          aria-label="بازگشت به تنظیمات"
        >
          <BackIcon className="w-4 h-4 text-white" />
          <span>تنظیمات</span>
        </button>

        {/* Center: Apple Face ID Dynamic Circular Island & Progress */}
        <div className="flex flex-col items-center">
          <div className="apple-faceid-flipper relative w-12 h-12 flex items-center justify-center">
            {/* Front Face: Dynamic Circular Progress Ring + Face ID Icon */}
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-300 ${
                isEnrolledSuccess
                  ? "animate-faceid-front-flip pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 48 48">
                <defs>
                  <linearGradient id="apple-top-scan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="60%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                {/* Background Ring Track */}
                <circle
                  cx="24"
                  cy="24"
                  r="21"
                  fill="rgba(15, 23, 42, 0.75)"
                  stroke="rgba(255, 255, 255, 0.14)"
                  strokeWidth="2.8"
                  className="backdrop-blur-md"
                />
                {/* Active Dynamic Progress Ring */}
                <circle
                  cx="24"
                  cy="24"
                  r="21"
                  fill="none"
                  stroke="url(#apple-top-scan-grad)"
                  strokeWidth="3.2"
                  strokeDasharray="132"
                  strokeDashoffset={132 - (132 * (scanProgress || 0)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-100 ease-linear"
                  style={{
                    filter:
                      scanProgress > 0
                        ? "drop-shadow(0 0 6px rgba(56, 189, 248, 0.85))"
                        : "none",
                  }}
                />
              </svg>

              {/* Center Face ID Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img
                  src="/face_logo.png"
                  alt="Face Scan"
                  className={`w-5 h-5 object-contain invert brightness-200 transition-all duration-300 ${
                    faceStatus === "face_centered"
                      ? "scale-105 opacity-100 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                      : "scale-90 opacity-60"
                  }`}
                />
              </div>
            </div>

            {/* Back Face: Apple Emerald Face ID Checkmark with 3D Flip */}
            {isEnrolledSuccess && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full animate-faceid-back-flip bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border border-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.95)]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M 5 12.5 L 9.5 17 L 19 7.5"
                    stroke="#ffffff"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-check-draw drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Subtitle / Status Label */}
          <span className="text-[10px] font-vazir mt-0.5 tracking-tight transition-colors duration-300 drop-shadow">
            {isEnrolledSuccess ? (
              <span className="text-emerald-400 font-bold">تأیید شد ✓</span>
            ) : scanProgress > 0 ? (
              <span className="text-sky-300 font-mono font-bold">
                {Math.round(scanProgress)}%
              </span>
            ) : (
              <span className="text-white/70">
                {WIZARD_STEPS[currentStep - 1]?.title}
              </span>
            )}
          </span>
        </div>

        {/* Camera Live Indicator */}
        <div className="liquid-glass-card liquid-glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-emerald-400 font-mono shadow-lg border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE</span>
        </div>
      </header>

      {/* ================= 4 Face ID Corner Brackets (Fly from Screen Edges onto Face) ================= */}
      <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden">
        {/* Top-Left Corner Bracket */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.topLeft,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 5 52 V 22 A 17 17 0 0 1 22 5 H 52"
              stroke={bracketStroke}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Top-Right Corner Bracket */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.topRight,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 4 5 H 34 A 17 17 0 0 1 51 22 V 52"
              stroke={bracketStroke}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Bottom-Left Corner Bracket */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.bottomLeft,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 52 51 H 22 A 17 17 0 0 1 5 34 V 4"
              stroke={bracketStroke}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Bottom-Right Corner Bracket */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.bottomRight,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 51 4 V 34 A 17 17 0 0 1 34 51 H 4"
              stroke={bracketStroke}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>
      </div>

      {/* ================= 3. Center: Biometric Face Viewport & Auto Scanner ================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pointer-events-none">
        {/* Global Error Banner */}
        {errorMsg && (
          <div className="absolute top-2 px-4 py-2 rounded-full liquid-glass-danger liquid-glass-pill text-white text-xs font-vazir shadow-2xl flex items-center gap-2 animate-bounce pointer-events-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Biometric Face Reticle Frame (Synchronized with 4 Corner Brackets) */}
        {faceBox && isLockedOnFace ? (
          <div
            className="absolute rounded-[22px] pointer-events-none transition-all duration-200"
            style={{
              top: `${Math.round(faceBox.y)}px`,
              left: `${Math.round(faceBox.x)}px`,
              width: `${Math.round(faceBox.width)}px`,
              height: `${Math.round(faceBox.height)}px`,
              filter: bracketFilter,
            }}
          >
            {/* Delicate Guide Dotted Line & Face Tracking Box */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              viewBox={`0 0 ${Math.round(faceBox.width)} ${Math.round(faceBox.height)}`}
              fill="none"
            >
              <rect
                x="3"
                y="3"
                width={Math.round(faceBox.width) - 6}
                height={Math.round(faceBox.height) - 6}
                rx="20"
                stroke={isEnrolledSuccess ? "rgba(52, 211, 153, 0.45)" : "rgba(56, 189, 248, 0.35)"}
                strokeWidth="1.5"
                strokeDasharray="4 6"
              />
              {/* Optical Alignment Center Ticks */}
              <path
                d={`M ${Math.round(faceBox.width / 2)} 4 V 14 M ${Math.round(faceBox.width / 2)} ${Math.round(faceBox.height - 14)} V ${Math.round(faceBox.height - 4)} M 4 ${Math.round(faceBox.height / 2)} H 14 M ${Math.round(faceBox.width - 14)} ${Math.round(faceBox.height / 2)} H ${Math.round(faceBox.width - 4)}`}
                stroke={isEnrolledSuccess ? "#34d399" : "#38bdf8"}
                strokeWidth="2"
                strokeLinecap="round"
                className="opacity-80"
              />
            </svg>

            {/* Sweeping Laser Scan Line (animates smoothly across face as progress increases) */}
            {scanProgress > 0 && !isEnrolledSuccess && (
              <div
                className="absolute inset-x-2 h-[2.5px] bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_16px_#38bdf8] pointer-events-none transition-all duration-75"
                style={{
                  top: `${Math.min(94, Math.max(6, scanProgress))}%`,
                }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-sky-400/40 blur-sm rounded-full" />
              </div>
            )}
          </div>
        ) : (
          /* Subtle Waiting Guide in Center when waiting for face */
          <div className="relative flex items-center justify-center pointer-events-none">
            <div className="relative flex items-center justify-center w-[230px] h-[280px] rounded-[24px] border border-dashed border-white/20 transition-all duration-500 scale-95 opacity-40">
              <span className="text-[11px] text-white/50 font-vazir text-center px-4">
                صورت خود را در این کادر قرار دهید
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Circular Neutral Countdown Indicator */}
        {currentStep === 3 && isNeutralCalibrating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse pointer-events-none">
            <span className="text-5xl font-black font-vazir text-sky-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.9)]">
              {neutralCountdown}
            </span>
            <span className="text-xs text-sky-200 mt-1.5 font-vazir bg-black/60 px-3 py-0.5 rounded-full backdrop-blur-md border border-white/10">
              ثانیه
            </span>
          </div>
        )}

        {/* Step 1 Ultimate Biometric Success Checkmark Animation */}
        {isEnrolledSuccess && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Shockwave 1 */}
            <div className="absolute w-20 h-20 rounded-full border-2 border-emerald-400 animate-shockwave-1 shadow-[0_0_35px_rgba(52,211,153,0.85)]" />

            {/* Shockwave 2 */}
            <div className="absolute w-20 h-20 rounded-full border-2 border-teal-300 animate-shockwave-2 shadow-[0_0_45px_rgba(45,212,191,0.65)]" />

            {/* Starburst Sparkle Rays (8 particles flashing outward 360°) */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#34d399] animate-starburst-particle"
                style={{ "--angle": `${angle}deg` }}
              />
            ))}

            {/* Core Spring Glass Badge */}
            <div className="relative animate-check-badge w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600/40 via-teal-500/30 to-emerald-400/50 border-2 border-emerald-300 flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.9),inset_0_1.5px_3px_rgba(255,255,255,0.85)] backdrop-blur-md">
              {/* Self-Drawing SVG Checkmark */}
              <svg
                className="w-12 h-12"
                viewBox="0 0 48 48"
                fill="none"
              >
                <path
                  d="M 12 24 L 21 33 L 36 15"
                  stroke="#ecfdf5"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-check-draw drop-shadow-[0_0_12px_rgba(236,253,245,0.95)]"
                />
              </svg>
            </div>
          </div>
        )}

        {/* ================= Modern Liquid Glass Dynamic Biometrics Island ================= */}
        <div className="mt-8 transition-all duration-300 pointer-events-none">
          {/* Case A: Warning - No Face / Not Centered */}
          {faceStatus === "no_face" && !isEnrolledSuccess && currentStep === 1 && (
            <div className="liquid-glass-warning liquid-glass-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl animate-liquid-float">
              <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </div>
              <span className="text-xs font-semibold font-vazir text-amber-100 tracking-wide">
                صورت خود را در مرکز کادر قرار دهید
              </span>
            </div>
          )}

          {/* Case B: Step 1 Active Scanning */}
          {faceStatus !== "no_face" && !isEnrolledSuccess && currentStep === 1 && (
            <div className="liquid-glass-info liquid-glass-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl">
              <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
              </div>
              <span className="text-xs font-semibold font-vazir text-sky-100 tracking-wide">
                {scanProgress > 0
                  ? "در حال آنالیز و اسکن بیومتریک چهره..."
                  : "صورت خود را در مرکز کادر قرار دهید"}
              </span>
              {scanProgress > 0 && (
                <span className="text-[11px] font-mono font-bold text-sky-300 mr-1 bg-sky-950/60 px-1.5 py-0.5 rounded-md border border-sky-400/30">
                  {Math.round(scanProgress)}%
                </span>
              )}
            </div>
          )}

          {/* Case C: Step 1 Success */}
          {isEnrolledSuccess && currentStep === 1 && (
            <div className="liquid-glass-success liquid-glass-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 border border-emerald-400">
                <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
              </div>
              <span className="text-xs font-semibold font-vazir text-emerald-100 tracking-wide">
                چهره و بردار اصالت با موفقیت ثبت شد ✓
              </span>
            </div>
          )}

          {/* Case D: Step 2 Gaze Calibration */}
          {currentStep === 2 && (
            <div className={`${isGazeCalibrated ? "liquid-glass-success" : "liquid-glass-info"} liquid-glass-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl`}>
              <div className={`w-2 h-2 rounded-full ${isGazeCalibrated ? "bg-emerald-400" : "bg-purple-400 animate-pulse"} shrink-0`} />
              <span className="text-xs font-semibold font-vazir text-white/95 tracking-wide">
                {isGazeCalibrating
                  ? gazeStatusMsg || "در حال ثبت زاویه نگاه..."
                  : isGazeCalibrated
                  ? "کالیبراسیون نگاه با موفقیت انجام شد ✓"
                  : "سر را آرام به چپ و راست حرکت دهید (نه نه)"}
              </span>
            </div>
          )}

          {/* Case E: Step 3 Neutral Emotion Calibration */}
          {currentStep === 3 && (
            <div className={`${isNeutralCalibrated ? "liquid-glass-success" : "liquid-glass-info"} liquid-glass-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl`}>
              <div className={`w-2 h-2 rounded-full ${isNeutralCalibrated ? "bg-emerald-400" : "bg-cyan-400 animate-pulse"} shrink-0`} />
              <span className="text-xs font-semibold font-vazir text-white/95 tracking-wide">
                {isNeutralCalibrating
                  ? `${neutralCountdown} ثانیه چهره را آرام و بی‌حرکت نگه دارید`
                  : isNeutralCalibrated
                  ? "مبنای خنثی احساسات ثبت شد ✓"
                  : "۳ ثانیه آرام روبه‌روی دوربین قرار بگیرید"}
              </span>
            </div>
          )}

          {/* Case F: Step 4 Ready for Exam */}
          {currentStep === 4 && (
            <div className="liquid-glass-success liquid-glass-pill px-4 py-2.5 rounded-full flex items-center gap-2.5 shadow-2xl">
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 border border-emerald-400">
                <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
              </div>
              <span className="text-xs font-semibold font-vazir text-emerald-100 tracking-wide">
                {profileStatus?.ready_for_exam
                  ? "تمامی اطلاعات بیومتریک تایید شد ✓"
                  : "بررسی نهایی وضعیت و ورود به آزمون"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ================= 4. Bottom Sleek Floating Dock ================= */}
      <footer className="relative z-20 w-full pb-6 px-4 pt-2 shrink-0 max-w-sm mx-auto flex flex-col items-center gap-3">
        {/* Step Dots */}
        <div className="flex items-center gap-2">
          {WIZARD_STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(s.id)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentStep === s.id
                  ? "w-7 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                  : isStepDone(s.id)
                  ? "w-2.5 bg-emerald-400"
                  : "w-2.5 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={s.title}
            />
          ))}
        </div>

        {/* Minimal Glass Dock */}
        <div className="liquid-glass-card w-full rounded-2xl p-2 flex items-center justify-between gap-2 shadow-2xl">
          {/* Previous Step */}
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            title="مرحله قبل"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Step 1 Action Button */}
          {currentStep === 1 && (
            <button
              type="button"
              disabled={isLoading}
              onClick={enrollStatus.success ? handleRescanFace : handleEnrollFace}
              className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت...</span>
                </>
              ) : (
                <>
                  <img
                    src="/face_logo.png"
                    alt="Face"
                    className="w-4 h-4 object-contain brightness-0 invert"
                  />
                  <span>{enrollStatus.success ? "اسکن مجدد چهره" : "اسکن هوشمند چهره"}</span>
                </>
              )}
            </button>
          )}

          {/* Step 2 Action Button */}
          {currentStep === 2 && (
            <button
              type="button"
              disabled={isGazeCalibrating || !isCameraActive}
              onClick={startGazeCalibration}
              className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isGazeCalibrating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>کالیبراسیون در حال اجرا...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>شروع کالیبراسیون نگاه</span>
                </>
              )}
            </button>
          )}

          {/* Step 3 Action Button */}
          {currentStep === 3 && (
            <button
              type="button"
              disabled={isNeutralCalibrating || !isCameraActive}
              onClick={startNeutralCalibration}
              className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isNeutralCalibrating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ضبط مبنا ({neutralCountdown}s)...</span>
                </>
              ) : (
                <>
                  <Smile className="w-4 h-4" />
                  <span>شروع ضبط خنثی (۳ ثانیه)</span>
                </>
              )}
            </button>
          )}

          {/* Step 4 Action Button */}
          {currentStep === 4 && (
            <button
              type="button"
              onClick={() => navigate("/StudentExams")}
              className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>تایید و ورود به آزمون‌ها</span>
            </button>
          )}

          {/* Next Step */}
          <button
            type="button"
            disabled={currentStep === 4}
            onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:pointer-events-none text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0"
            title="مرحله بعد"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ================= 5. Interactive Gaze Calibration Overlay Target ================= */}
      {isGazeCalibrating && gazeTarget && (
        <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-6 select-none pointer-events-none">
          <div className="absolute top-14 text-center px-4">
            <span className="text-xs px-3 py-1 rounded-full bg-sky-600/90 text-white font-bold backdrop-blur-md shadow-md">
              مرحله {gazeSubStep} از {gazeTotalSteps}
            </span>
            <h3 className="text-base font-bold text-white mt-2 font-vazir">
              {gazeTarget.label}
            </h3>
            <p className="text-xs text-sky-200 mt-0.5 font-vazir">
              {gazeTarget.hint}
            </p>
          </div>

          {/* Animated Interactive Gaze Target Dot */}
          <div
            className="absolute w-8 h-8 rounded-full bg-rose-500 shadow-[0_0_30px_#f43f5e] transition-all duration-500 ease-out border-2 border-white pointer-events-none flex items-center justify-center"
            style={{
              left: `${gazeTarget.x}%`,
              top: `${gazeTarget.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping" />
          </div>
        </div>
      )}
    </main>
  );
}

export default StudentBiometricsPage;
