/**
 * @file StudentBiometricsPage.jsx
 * @description Modern Liquid Glass Biometric Experience:
 * - Auto-detecting & auto-scanning face framework (Apple Face ID aesthetic)
 * - Premium Liquid Glass rounded capsule frame (no harsh boxes, no laser line)
 * - Liquid Glass floating error notification when face is not centered
 * - Full live camera bounded strictly to the 360px application frame
 */

import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
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

// Pure client-side, zero-network contrast-aware face & head detector
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

  // Scan central head-framing corridor (where student's face is naturally positioned)
  const minX = Math.floor(sw * 0.12);
  const maxX = Math.floor(sw * 0.88);
  const minY = Math.floor(sh * 0.10);
  const maxY = Math.floor(sh * 0.82);

  const skinPixels = [];
  let totalEdgeEnergy = 0;
  let edgeSampleCount = 0;

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const idx = (y * sw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // YCbCr skin chrominance representation
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Realistic skin chromaticity: strict separation from flat beige / yellow wall paint
      const isSkinHue =
        Y > 40 &&
        Y < 235 &&
        Cb >= 85 &&
        Cb <= 130 &&
        Cr >= 135 &&
        Cr <= 175 &&
        r > g &&
        g > b &&
        r - g >= 10 &&
        r - b >= 18;

      if (isSkinHue) {
        // Measure horizontal luminance difference to test for facial features (eyes, eyebrows, nose, mouth)
        if (x < maxX - 1) {
          const nextIdx = (y * sw + (x + 1)) * 4;
          const nextY = 0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2];
          totalEdgeEnergy += Math.abs(Y - nextY);
          edgeSampleCount++;
        }
        skinPixels.push({ x, y });
      }
    }
  }

  const totalScanned = (maxX - minX) * (maxY - minY);
  const skinRatio = skinPixels.length / totalScanned;

  // Rejection 1: Absence of skin (< 4% of region)
  if (skinRatio < 0.04) {
    return null;
  }

  // Rejection 2: Homogeneous background / beige wall filling frame (> 52% of entire corridor)
  if (skinRatio > 0.52) {
    return null;
  }

  // Rejection 3: Flat texture / Wall check (faces have facial contours with avg gradient > 3.5)
  const avgEdge = edgeSampleCount > 0 ? totalEdgeEnergy / edgeSampleCount : 0;
  if (avgEdge < 3.0) {
    return null;
  }

  // Centroid and trimmed cluster bounding box (15th-85th percentile to discard stray clothing/shoulders)
  skinPixels.sort((a, b) => a.x - b.x);
  const p15X = skinPixels[Math.floor(skinPixels.length * 0.15)].x;
  const p85X = skinPixels[Math.floor(skinPixels.length * 0.85)].x;

  skinPixels.sort((a, b) => a.y - b.y);
  const p15Y = skinPixels[Math.floor(skinPixels.length * 0.15)].y;
  const p85Y = skinPixels[Math.floor(skinPixels.length * 0.85)].y;

  const clusterW = Math.max(sw * 0.22, p85X - p15X);
  const cx = (p15X + p85X) / 2;
  const cy = (p15Y + p85Y) / 2;

  // Stably bounded anthropometric face box (tightly hugs the face)
  const faceW = Math.max(sw * 0.28, Math.min(sw * 0.48, clusterW * 1.15));
  const faceH = faceW * 1.30;
  const faceX = cx - faceW / 2;
  const faceY = cy - faceH * 0.42;

  return {
    normX: Math.max(0, Math.min(1.0 - faceW / sw, faceX / sw)),
    normY: Math.max(0, Math.min(1.0 - faceH / sh, faceY / sh)),
    normW: faceW / sw,
    normH: faceH / sh,
    sharpness: avgEdge,
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
  const errorTimeoutRef = useRef(null);

  // Auto-scan & Face centering detection state
  const containerRef = useRef(null);
  const [faceBox, setFaceBox] = useState(null); // { x, y, width, height } in px
  const [faceStatus, setFaceStatus] = useState("no_face"); // "no_face" | "face_locked"
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [scanFeedback, setScanFeedback] = useState("");
  const autoEnrollTriggeredRef = useRef(false);
  const consecutiveQualityFramesRef = useRef(0);
  const bestFrameBlobRef = useRef(null);
  const bestSharpnessRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const offscreenCanvasRef = useRef(null);

  // Step 2 Gaze Tracking Face Verification Refs
  const autoGazeTriggeredRef = useRef(false);
  const consecutiveGazeFramesRef = useRef(0);

  // Sync refs for live face tracking without stale closures
  const faceStatusRef = useRef(faceStatus);
  const faceBoxRef = useRef(faceBox);
  useEffect(() => {
    faceStatusRef.current = faceStatus;
  }, [faceStatus]);
  useEffect(() => {
    faceBoxRef.current = faceBox;
  }, [faceBox]);

  // Helper to show error in the bottom island and automatically return back to normal
  const showBottomError = useCallback((msg, durationMs = 3500) => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    setErrorMsg(msg);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMsg("");
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    autoGazeTriggeredRef.current = false;
    consecutiveGazeFramesRef.current = 0;
    setErrorMsg("");
  }, [currentStep]);

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
    progress: gazeHookProgress,
    startCalibration: startGazeCalibration,
  } = useGazeCalibration({
    userId: studentId,
    captureFrameBlob,
    onCalibrationComplete: () => {
      loadProfile();
      setTimeout(() => {
        setCurrentStep(3);
      }, 1200);
    },
  });

  // Calculate dynamic progress for each step:
  // Step 2 gaze targets: 20%, 40%, 60%, 80%, 90% (stays 90% until server confirms, then 100%)
  const gazeProgress = isGazeCalibrated
    ? 100
    : isGazeCalibrating
    ? (gazeHookProgress || (gazeSubStep === 5 ? 90 : Math.min(80, gazeSubStep * 20)))
    : 0;

  // 3. Neutral Calibration Hook (synchronized with verified face-in-frame presence)
  const {
    isCalibrating: isNeutralCalibrating,
    countdownSec: neutralCountdown,
    progress: neutralHookProgress,
    isFaceMissing: isNeutralFaceMissing,
    isNeutralCalibrated,
    statusText: neutralStatusMsg,
    startNeutralCalibration,
  } = useNeutralCalibration({
    userId: studentId,
    captureFrameBlob,
    isFaceInFrame: () => faceStatusRef.current === "face_locked" && Boolean(faceBoxRef.current),
    onCalibrationComplete: () => {
      loadProfile();
    },
  });

  const neutralProgress = isNeutralCalibrated
    ? 100
    : isNeutralCalibrating
    ? (neutralHookProgress ?? 0)
    : 0;

  const currentActiveProgress =
    currentStep === 1
      ? scanProgress
      : currentStep === 2
      ? gazeProgress
      : currentStep === 3
      ? neutralProgress
      : 100;

  const isEnrolledSuccess = currentStep === 1 && enrollStatus.success;
  const isCurrentStepFinished =
    isEnrolledSuccess ||
    (currentStep === 2 && isGazeCalibrated) ||
    (currentStep === 3 && isNeutralCalibrated);

  // Manual start handler for gaze calibration with face verification prerequisite
  const handleStartGaze = () => {
    if (faceStatus === "no_face" || !faceBox) {
      showBottomError("برای شروع کالیبراسیون، لطفاً ابتدا صورت خود را در مرکز کادر قرار دهید");
      return;
    }
    startGazeCalibration();
  };

  // Manual start handler for neutral baseline calibration with face verification prerequisite
  const handleStartNeutral = () => {
    if (faceStatus === "no_face" || !faceBox) {
      showBottomError("برای شروع کالیبراسیون، لطفاً ابتدا صورت خود را در مرکز کادر قرار دهید");
      return;
    }
    startNeutralCalibration();
  };

  // Load profile from backend
  const loadProfile = async () => {
    try {
      const data = await biometricsApi.getStudentBiometricProfile(studentId);
      if (data) {
        setProfileStatus(data);
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
    const isStepNeedsFace =
      (currentStep === 1 && !enrollStatus.success) ||
      (currentStep === 2 && !isGazeCalibrated) ||
      (currentStep === 3 && !isNeutralCalibrated);
    if (!isCameraActive || !isStepNeedsFace) {
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
          // Constrain box width strictly to realistic human head dimensions (38% to 58% of container width)
          const maxFaceW = Math.round(cw * 0.58);
          const minFaceW = Math.round(cw * 0.38);
          const targetW = Math.max(minFaceW, Math.min(maxFaceW, detectedBox.w * 1.15));
          const targetH = Math.round(targetW * 1.30);

          const cx = detectedBox.x + detectedBox.w / 2;
          const cy = detectedBox.y + detectedBox.h * 0.45;
          const targetX = Math.max(12, Math.min(cw - targetW - 12, cx - targetW / 2));
          const targetY = Math.max(76, Math.min(ch - targetH - 120, cy - targetH * 0.45));

          let frameMovement = 0;
          setFaceBox((prev) => {
            if (!prev) return { x: targetX, y: targetY, width: targetW, height: targetH };

            const dx = Math.abs(targetX - prev.x);
            const dy = Math.abs(targetY - prev.y);
            const dw = Math.abs(targetW - prev.width);
            const dh = Math.abs(targetH - prev.height);
            frameMovement = Math.max(dx, dy);

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

          // === Progressive Continuous Face Scanning over ~2 seconds ===
          if (currentStep === 1 && !enrollStatus.success && !isLoading) {
            // Check if user is in cooldown after an error
            if (Date.now() < cooldownUntilRef.current) {
              // Wait for cooldown to expire before starting new analysis
            } else {
              // Smooth, steady accumulation when face is tracked
              consecutiveQualityFramesRef.current = Math.min(46, consecutiveQualityFramesRef.current + 1);
              const prog = Math.min(100, Math.round((consecutiveQualityFramesRef.current / 42) * 100));
              setScanProgress(prog);
              setScanFeedback(`در حال تطبیق و اسکن چهره (${prog}%)...`);

              // Capture crisp high-res frame at 60-75% progress
              if (prog >= 60 && !bestFrameBlobRef.current) {
                captureFrameBlob(0.92, 960, 960).then((blob) => {
                  if (blob) bestFrameBlobRef.current = blob;
                });
              }

              // When 100% genuine frames completed, trigger enrollment
              if (prog >= 100 && !autoEnrollTriggeredRef.current) {
                autoEnrollTriggeredRef.current = true;
                handleEnrollFace(bestFrameBlobRef.current);
              }
            }
          }

          // === Step 2: Gaze Calibration Face Presence Verification & Auto-Start ===
          if (currentStep === 2 && !isGazeCalibrated && !isGazeCalibrating) {
            if (Date.now() < cooldownUntilRef.current) {
              // Cooldown active
            } else {
              consecutiveGazeFramesRef.current++;
              // Once face is steadily tracked for 18 frames (~900ms), auto-start calibration!
              if (consecutiveGazeFramesRef.current >= 18 && !autoGazeTriggeredRef.current) {
                autoGazeTriggeredRef.current = true;
                startGazeCalibration();
              }
            }
          }
        } else if (isMounted) {
          noFaceCounter++;
          // Generous hold: do not drop box unless face is absent for at least 8 frames (~400ms)
          if (noFaceCounter >= 8) {
            setFaceBox(null);
            setFaceStatus("no_face");
            consecutiveQualityFramesRef.current = Math.max(0, consecutiveQualityFramesRef.current - 2);
            consecutiveGazeFramesRef.current = 0;
            const prog = Math.min(100, Math.round((consecutiveQualityFramesRef.current / 42) * 100));
            setScanProgress(prog);
            bestFrameBlobRef.current = null;
            bestSharpnessRef.current = 0;
            setScanFeedback("صورت خود را در کادر قرار دهید");
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
  }, [isCameraActive, currentStep, enrollStatus.success, isGazeCalibrated, isGazeCalibrating, studentId, isLoading, startGazeCalibration]);

  // Automatic Face Enrollment Action with candidate blob
  const handleEnrollFace = async (candidateBlob = null) => {
    if (isLoading) return;
    setErrorMsg("");
    setIsLoading(true);
    setScanFeedback("در حال ارسال و ثبت نهایی...");
    try {
      const blob = candidateBlob || (await captureFrameBlob(0.92, 960, 960));
      if (!blob) {
        throw new Error("خطا در تصویر دوربین. لطفاً دسترسی دوربین را بررسی فرمایید.");
      }
      const res = await biometricsApi.enrollStudentFace(studentId, blob, "balanced", "opencv");
      if (res?.status === "enrolled" || res?.user_id) {
        setEnrollStatus({
          success: true,
          message: "چهره و بردار اصالت با موفقیت تایید شد",
        });
        setScanFeedback("تأیید شد");
        await loadProfile();
      } else {
        const msg = res?.detail || "خطا در ثبت چهره. لطفاً مستقیم به دوربین نگاه کنید.";
        showBottomError(msg, 3500);
        setScanFeedback(msg);
        cooldownUntilRef.current = Date.now() + 3500;
        consecutiveQualityFramesRef.current = 0;
        setScanProgress(0);
        bestFrameBlobRef.current = null;
        bestSharpnessRef.current = 0;
        autoEnrollTriggeredRef.current = false;
      }
    } catch (err) {
      const msg = err?.message || "خطای ارتباط با سامانه در ثبت چهره.";
      showBottomError(msg, 3500);
      setScanFeedback(msg);
      cooldownUntilRef.current = Date.now() + 3500;
      consecutiveQualityFramesRef.current = 0;
      setScanProgress(0);
      bestFrameBlobRef.current = null;
      bestSharpnessRef.current = 0;
      autoEnrollTriggeredRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescanFace = () => {
    setEnrollStatus({ success: false, message: "" });
    setProfileStatus((prev) => (prev ? { ...prev, face_enrolled: false } : null));
    setScanProgress(0);
    setScanFeedback("");
    consecutiveQualityFramesRef.current = 0;
    bestFrameBlobRef.current = null;
    bestSharpnessRef.current = 0;
    cooldownUntilRef.current = 0;
    autoEnrollTriggeredRef.current = false;
    setFaceStatus("no_face");
    setFaceBox(null);
  };

  const isStepDone = (stepId) => {
    if (stepId === 1) return profileStatus?.face_enrolled || enrollStatus.success;
    if (stepId === 2) return profileStatus?.gaze_calibrated || isGazeCalibrated;
    if (stepId === 3) return profileStatus?.neutral_calibrated || isNeutralCalibrated;
    if (stepId === 4) return profileStatus?.ready_for_exam;
    return false;
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const isDoneFinal = currentStep === 4 && (profileStatus?.ready_for_exam || isStepDone(1));
  const isLockedOnFace = (faceStatus === "face_locked" && faceBox) || isEnrolledSuccess;

  // Dynamic coordinates: When idle/no face, 4 corner brackets stay at the far screen corners.
  // When face is detected, they dynamically adjust their position, width, and height to frame the face!
  const bracketSize = 56;
  const cw = containerRef.current?.clientWidth || 360;
  const ch = containerRef.current?.clientHeight || 640;

  // Natural resting face guide in the center of viewport - spacious wide framing
  const guideW = Math.round(cw * 0.84);
  const guideH = Math.min(Math.round(ch * 0.60), Math.round(guideW * 1.34));
  const guideX = Math.round((cw - guideW) / 2);
  const guideY = Math.round((ch - guideH) / 2 - 15);

  const activeBox = (isLockedOnFace && faceBox) ? faceBox : {
    x: guideX,
    y: guideY,
    width: guideW,
    height: guideH,
  };

  const bracketPositions = {
    topLeft: {
      top: `${Math.round(activeBox.y)}px`,
      left: `${Math.round(activeBox.x)}px`,
    },
    topRight: {
      top: `${Math.round(activeBox.y)}px`,
      left: `${Math.round(activeBox.x + activeBox.width - bracketSize)}px`,
    },
    bottomLeft: {
      top: `${Math.round(activeBox.y + activeBox.height - bracketSize)}px`,
      left: `${Math.round(activeBox.x)}px`,
    },
    bottomRight: {
      top: `${Math.round(activeBox.y + activeBox.height - bracketSize)}px`,
      left: `${Math.round(activeBox.x + activeBox.width - bracketSize)}px`,
    },
  };

  // Three progressive color states:
  // 1. White: Waiting for face
  // 2. Blue: Face locked and tracking
  // 3. Green: Biometrics enrolled and verified
  const bracketStroke = isEnrolledSuccess
    ? "#34d399"
    : isLockedOnFace
    ? "#38bdf8"
    : "rgba(255, 255, 255, 0.92)";

  const bracketFilter = isEnrolledSuccess
    ? "drop-shadow(0 0 16px rgba(52, 211, 153, 0.95))"
    : isLockedOnFace
    ? "drop-shadow(0 0 14px rgba(56, 189, 248, 0.9))"
    : "drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))";

  const reticleStroke = isEnrolledSuccess
    ? "rgba(52, 211, 153, 0.55)"
    : isLockedOnFace
    ? "rgba(56, 189, 248, 0.50)"
    : "rgba(255, 255, 255, 0.35)";

  const centerTickStroke = isEnrolledSuccess
    ? "#34d399"
    : isLockedOnFace
    ? "#38bdf8"
    : "rgba(255, 255, 255, 0.65)";

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
      <header className="relative z-30 w-full pt-4 px-4 pb-2 shrink-0 flex items-center justify-between">
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
                isCurrentStepFinished
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
                  strokeDashoffset={132 - (132 * (currentActiveProgress || 0)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                  style={{
                    filter:
                      currentActiveProgress > 0
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
                    faceStatus === "face_locked"
                      ? "scale-105 opacity-100 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                      : "scale-90 opacity-60"
                  }`}
                />
              </div>
            </div>

            {/* Back Face: Apple Emerald Face ID Checkmark with 3D Flip */}
            {isCurrentStepFinished && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full animate-faceid-back-flip bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border border-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.95)]">
                <Check className="w-5 h-5 text-white stroke-[3.5] drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
              </div>
            )}
          </div>

          {/* Subtitle / Status Label */}
          <span className="text-[10px] font-vazir mt-0.5 tracking-tight transition-colors duration-300 drop-shadow">
            {isCurrentStepFinished ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>تأیید شد</span>
              </span>
            ) : currentActiveProgress > 0 ? (
              <span className="text-sky-300 font-mono font-bold">
                {Math.round(currentActiveProgress)}%
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

      {/* ================= 4 Face ID Corner Brackets ================= */}
      <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden">
        {/* Top-Left Corner Bracket (Curved Border Radius) */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.topLeft,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 5 52 L 5 21 A 16 16 0 0 1 21 5 L 52 5"
              stroke={bracketStroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Top-Right Corner Bracket (Curved Border Radius) */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.topRight,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 4 5 L 35 5 A 16 16 0 0 1 51 21 L 51 52"
              stroke={bracketStroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Bottom-Left Corner Bracket (Curved Border Radius) */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.bottomLeft,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 5 4 L 5 35 A 16 16 0 0 0 21 51 L 52 51"
              stroke={bracketStroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>

        {/* Bottom-Right Corner Bracket (Curved Border Radius) */}
        <div
          className="absolute bracket-smooth-transition"
          style={{
            ...bracketPositions.bottomRight,
            filter: bracketFilter,
          }}
        >
          <svg className="w-14 h-14 overflow-visible" viewBox="0 0 56 56" fill="none">
            <path
              d="M 4 51 L 35 51 A 16 16 0 0 0 51 35 L 51 4"
              stroke={bracketStroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-colors duration-300"
            />
          </svg>
        </div>
      </div>

      {/* ================= 3. Center: Biometric Face Viewport & Feedback ================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pointer-events-none">
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
              <Check className="w-10 h-10 text-emerald-100 stroke-[3.5] drop-shadow-[0_0_12px_rgba(236,253,245,0.95)]" />
            </div>
          </div>
        )}
      </div>

      {/* ================= 4. Bottom Sleek Floating Dock ================= */}
      <footer className="relative z-30 w-full pb-6 px-4 pt-2 shrink-0 max-w-sm mx-auto flex flex-col items-center gap-3">
        {/* ================= Modern Liquid Glass Dynamic Biometrics Island (Positioned at Bottom) ================= */}
        <div className="w-full flex justify-center transition-all duration-300 pointer-events-none">
          {/* Priority 1: Error State (Liquid Glass Danger Pill, auto-clears after 3.5s) */}
          {errorMsg ? (
            <div className="liquid-glass-danger liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-shake duration-300">
              <div className="w-4 h-4 rounded-full bg-rose-500/25 flex items-center justify-center shrink-0 border border-rose-400/50">
                <AlertTriangle className="w-2.5 h-2.5 text-rose-300 stroke-[2.5]" />
              </div>
              <span className="text-xs font-semibold font-vazir text-rose-100 tracking-wide">
                {errorMsg}
              </span>
            </div>
          ) : currentStep === 1 ? (
            /* Step 1 Face Enrollment States */
            isEnrolledSuccess ? (
              <div className="liquid-glass-success liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 border border-emerald-400">
                  <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                </div>
                <span className="text-xs font-semibold font-vazir text-emerald-100 tracking-wide">
                  چهره و بردار اصالت با موفقیت ثبت شد
                </span>
              </div>
            ) : faceStatus === "no_face" ? (
              <div className="liquid-glass-warning liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-liquid-float">
                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </div>
                <span className="text-xs font-semibold font-vazir text-amber-100 tracking-wide">
                  صورت خود را در مرکز کادر قرار دهید
                </span>
              </div>
            ) : (
              <div className="liquid-glass-info liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl">
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
            )
          ) : currentStep === 2 ? (
            /* Step 2 Gaze Calibration States */
            isGazeCalibrated ? (
              <div className="liquid-glass-success liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 border border-emerald-400">
                  <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                </div>
                <span className="text-xs font-semibold font-vazir text-emerald-100 tracking-wide">
                  کالیبراسیون نگاه با موفقیت انجام شد
                </span>
              </div>
            ) : isGazeCalibrating ? (
              <div className="liquid-glass-info liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl">
                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                </div>
                <span className="text-xs font-semibold font-vazir text-sky-100 tracking-wide">
                  {`در حال کالیبراسیون نگاه (${gazeTarget?.label || "نقطه " + gazeSubStep})`}
                </span>
                <span className="text-[11px] font-mono font-bold text-sky-300 mr-1 bg-sky-950/60 px-1.5 py-0.5 rounded-md border border-sky-400/30">
                  {Math.round(gazeProgress)}%
                </span>
              </div>
            ) : faceStatus === "no_face" ? (
              <div className="liquid-glass-warning liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-liquid-float">
                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </div>
                <span className="text-xs font-semibold font-vazir text-amber-100 tracking-wide">
                  برای شروع کالیبراسیون، صورت خود را در مرکز کادر قرار دهید
                </span>
              </div>
            ) : (
              <div className="liquid-glass-info liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl">
                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
                </div>
                <span className="text-xs font-semibold font-vazir text-sky-100 tracking-wide">
                  چهره شناسایی شد. در حال آغاز کالیبراسیون نگاه...
                </span>
              </div>
            )
          ) : currentStep === 3 ? (
            /* Step 3 Neutral Emotion States */
            isNeutralCalibrated ? (
              <div className="liquid-glass-success liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 border border-emerald-400">
                  <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
                </div>
                <span className="text-xs font-semibold font-vazir text-emerald-100 tracking-wide">
                  مبنای خنثی احساسات با موفقیت ثبت شد
                </span>
              </div>
            ) : isNeutralCalibrating ? (
              isNeutralFaceMissing ? (
                <div className="liquid-glass-warning liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-shake">
                  <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </div>
                  <span className="text-xs font-semibold font-vazir text-amber-100 tracking-wide">
                    چهره از کادر خارج شد! لطفاً روبه‌روی دوربین قرار بگیرید
                  </span>
                </div>
              ) : (
                <div className="liquid-glass-info liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl">
                  <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                  </div>
                  <span className="text-xs font-semibold font-vazir text-cyan-100 tracking-wide">
                    {`در حال ثبت مبنای خنثی... چهره را ثابت نگه دارید (${neutralCountdown} ثانیه)`}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-cyan-300 mr-1 bg-cyan-950/60 px-1.5 py-0.5 rounded-md border border-cyan-400/30">
                    {Math.round(neutralProgress)}%
                  </span>
                </div>
              )
            ) : faceStatus === "no_face" ? (
              <div className="liquid-glass-warning liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-liquid-float">
                <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </div>
                <span className="text-xs font-semibold font-vazir text-amber-100 tracking-wide">
                  برای شروع، صورت خود را در مرکز کادر قرار دهید
                </span>
              </div>
            ) : (
              <div className="liquid-glass-info liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <span className="text-xs font-semibold font-vazir text-cyan-100 tracking-wide">
                  حالت چهره را کاملاً آرام و خنثی نگه دارید و دکمه شروع را بزنید
                </span>
              </div>
            )
          ) : (
            /* Step 4 State */
            <div className="liquid-glass-success liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl">
              <div className="w-4 h-4 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 border border-emerald-400">
                <Check className="w-2.5 h-2.5 text-emerald-300 stroke-[3]" />
              </div>
              <span className="text-xs font-semibold font-vazir text-emerald-100 tracking-wide">
                {profileStatus?.ready_for_exam
                  ? "تمامی اطلاعات بیومتریک با موفقیت تایید شد"
                  : "بررسی نهایی وضعیت و ورود به آزمون"}
              </span>
            </div>
          )}
        </div>
        {/* Step Dots */}
        <div className="flex items-center gap-2">
          {WIZARD_STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={s.id > currentStep && !isStepDone(s.id - 1)}
              onClick={() => {
                if (s.id <= currentStep || isStepDone(s.id - 1)) {
                  setCurrentStep(s.id);
                }
              }}
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
            isStepDone(1) ? (
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRescanFace}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="اسکن مجدد چهره"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>مرحله بعد: کالیبراسیون نگاه</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleEnrollFace}
                className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال احراز و ثبت چهره...</span>
                  </>
                ) : (
                  <>
                    <img
                      src="/face_logo.png"
                      alt="Face"
                      className="w-4 h-4 object-contain brightness-0 invert"
                    />
                    <span>
                      {scanProgress > 0
                        ? `در حال اسکن خودکار (${Math.round(scanProgress)}%)...`
                        : "در انتظار موقعیت چهره..."}
                    </span>
                  </>
                )}
              </button>
            )
          )}

          {/* Step 2: Auto-calibrating indicator (step button removed as requested) */}
          {currentStep === 2 && (
            <div className="flex-1 h-10 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-white/80 text-xs font-vazir">
              {isGazeCalibrated ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-300 font-bold">کالیبراسیون نگاه با موفقیت انجام شد</span>
                </>
              ) : isGazeCalibrating ? (
                <>
                  <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                  <span className="text-sky-300">در حال کالیبراسیون نگاه ({Math.round(gazeProgress)}%)...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 text-sky-400" />
                  <span>کالیبراسیون خودکار نگاه با تشخیص چهره</span>
                </>
              )}
            </div>
          )}

          {/* Step 3 Action Button */}
          {currentStep === 3 && (
            isStepDone(3) ? (
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartNeutral}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                  title="ضبط مجدد مبنای خنثی"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>مرحله بعد: تایید نهایی</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isNeutralCalibrating || !isCameraActive}
                onClick={handleStartNeutral}
                className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isNeutralCalibrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ثبت مبنا ({neutralCountdown} ثانیه)...</span>
                  </>
                ) : (
                  <>
                    <Smile className="w-4 h-4" />
                    <span>
                      {faceStatus === "no_face"
                        ? "در انتظار چهره..."
                        : "شروع کالیبراسیون حالت خنثی (۳ ثانیه)"}
                    </span>
                  </>
                )}
              </button>
            )
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
            disabled={currentStep === 4 || !isStepDone(currentStep)}
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
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 select-none pointer-events-none">
          <div className="absolute top-20 text-center px-4">
            <span className="text-xs px-3.5 py-1 rounded-full bg-sky-600/90 text-white font-bold backdrop-blur-md shadow-md border border-white/20">
              مرحله {gazeSubStep} از {gazeTotalSteps}
            </span>
            <h3 className="text-base font-bold text-white mt-2 font-vazir drop-shadow-md">
              {gazeTarget.label}
            </h3>
            <p className="text-xs text-sky-200 mt-0.5 font-vazir drop-shadow">
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
