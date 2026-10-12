/**
 * @file StudentBiometricsPage.jsx
 * @description Modern Liquid Glass Biometric Experience:
 * - Auto-detecting & auto-scanning face framework (Apple Face ID aesthetic)
 * - Premium Liquid Glass rounded capsule frame (no harsh boxes, no laser line)
 * - Liquid Glass floating error notification when face is not centered
 * - Full live camera bounded strictly to the 360px application frame
 */

import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Target,
  Smile,
  Check,
  Camera,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { biometricsApi } from "@/api/new/biometrics.api";
import { useBiometricCamera } from "@/features/biometrics/hooks/useBiometricCamera";
import { useGazeCalibration } from "@/features/biometrics/hooks/useGazeCalibration";
import { useNeutralCalibration } from "@/features/biometrics/hooks/useNeutralCalibration";
import { detectClientFace, detectFaceWithFallback } from "@/features/biometrics/utils/clientFaceDetector";

const WIZARD_STEPS = [
  { id: 1, title: "۱. ثبت چهره", short: "ثبت چهره" },
  { id: 2, title: "۲. کالیبراسیون نگاه", short: "نگاه" },
  { id: 3, title: "۳. مبنای خنثی احساسات", short: "حالت خنثی" },
  { id: 4, title: "۴. تایید نهایی", short: "تایید نهایی" },
];

export function StudentBiometricsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo;
  const returnExam = location.state?.exam;
  const isRequiredForExam = location.state?.reason === "biometrics_required" || Boolean(returnTo);
  const { currentUser, isRTL } = useContext(AppContext);

  const candidateIds = useMemo(() => {
    return biometricsApi.getCandidateBiometricIds(currentUser);
  }, [currentUser]);

  const studentId = candidateIds[0] || currentUser?.user_id || currentUser?.username || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [profileStatus, setProfileStatus] = useState(null);
  const [showReRegistrationModal, setShowReRegistrationModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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

  // Step 3 Neutral Emotion Face Verification Refs
  const autoNeutralTriggeredRef = useRef(false);
  const consecutiveNeutralFramesRef = useRef(0);

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
    autoNeutralTriggeredRef.current = false;
    consecutiveNeutralFramesRef.current = 0;
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

  // 2. Gaze Calibration Hook (synchronized with verified face-in-frame presence)
  const {
    isCalibrating: isGazeCalibrating,
    currentStep: gazeSubStep,
    totalSteps: gazeTotalSteps,
    currentTarget: gazeTarget,
    pointProgress: gazePointProgress,
    isFaceMissing: isGazeFaceMissing,
    isCalibrated: isGazeCalibrated,
    statusMessage: gazeStatusMsg,
    progress: gazeHookProgress,
    startCalibration: startGazeCalibration,
  } = useGazeCalibration({
    userId: studentId,
    captureFrameBlob,
    isFaceInFrame: () => faceStatusRef.current === "face_locked" && Boolean(faceBoxRef.current),
    onCalibrationComplete: () => {
      loadProfile(false);
      setTimeout(() => {
        setCurrentStep(3);
      }, 1200);
    },
  });

  // Calculate dynamic progress for each step:
  const gazeProgress = isGazeCalibrated
    ? 100
    : isGazeCalibrating
    ? (gazeHookProgress ?? 0)
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
      loadProfile(false);
      setTimeout(() => {
        setCurrentStep(4);
      }, 1200);
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

  // Manual start handler for gaze calibration
  const handleStartGaze = () => {
    if (!isCameraActive) {
      startCamera();
    }
    if (faceStatusRef.current !== "face_locked" || !faceBoxRef.current) {
      showBottomError("صورت خود را در مرکز کادر قرار دهید تا کالیبراسیون آغاز شود");
      return;
    }
    autoGazeTriggeredRef.current = true;
    startGazeCalibration();
  };

  // Manual start handler for neutral baseline calibration
  const handleStartNeutral = () => {
    if (!isCameraActive) {
      startCamera();
    }
    autoNeutralTriggeredRef.current = true;
    startNeutralCalibration();
  };

  // Load profile from backend
  const loadProfile = async (shouldShowRegistrationModal = false) => {
    try {
      const data = await biometricsApi.checkStudentBiometricStatus(currentUser);
      if (data) {
        setProfileStatus(data);
        const isEnrolled = Boolean(data.is_enrolled || data.face_enrolled);
        const isGazeDone = Boolean(data.is_gaze_calibrated || data.gaze_calibrated);
        const isNeutralDone = Boolean(data.is_neutral_calibrated || data.neutral_calibrated);
        const isAlreadyDone = Boolean(
          data.is_fully_registered ||
          (isEnrolled && isGazeDone && isNeutralDone)
        );
        if (isAlreadyDone) {
          try {
            localStorage.setItem("dt_biometrics_registered", "true");
            for (const cid of candidateIds) {
              localStorage.setItem(`dt_biometrics_${cid}`, "true");
            }
          } catch {}
          if (shouldShowRegistrationModal) {
            setCurrentStep(4);
            setShowReRegistrationModal(true);
          }
        } else {
          setShowReRegistrationModal(false);
          setCurrentStep(1);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch student biometric profile:", err);
    }
  };

  const handleResetBiometrics = async () => {
    setIsResetting(true);
    try {
      let resetSuccess = false;
      for (const cid of candidateIds) {
        try {
          const res = await biometricsApi.resetStudentBiometrics(cid);
          if (res?.status === "success") {
            resetSuccess = true;
          }
        } catch {}
      }
      try {
        localStorage.removeItem("dt_biometrics_registered");
        for (const cid of candidateIds) {
          localStorage.removeItem(`dt_biometrics_${cid}`);
        }
      } catch {}

      setEnrollStatus({ success: false, message: "" });
      setProfileStatus(null);
      setShowReRegistrationModal(false);
      setCurrentStep(1);
      setFaceBox(null);
      setScanProgress(0);
      showBottomError(
        resetSuccess
          ? "اطلاعات قبلی با موفقیت بازنشانی شد. می‌توانید فرآیند ثبت را انجام دهید."
          : "فرآیند ثبت مجدد فعال شد. می‌توانید اسکن جدید را انجام دهید.",
        4000
      );
    } catch (err) {
      showBottomError(err?.message || "امکان حذف اطلاعات وجود ندارد.");
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    loadProfile(true);
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

        const faceResult = await detectFaceWithFallback(
          video,
          offscreenCanvasRef.current,
          nativeDetector
        );

        if (faceResult?.detected && isMounted) {
          noFaceCounter = 0;
          // In mirrored mode, horizontal X is inverted:
          const mirroredNormX = 1.0 - (faceResult.normX + faceResult.normW);
          const detectedBox = {
            x: offsetX + mirroredNormX * renderedW,
            y: offsetY + faceResult.normY * renderedH,
            w: faceResult.normW * renderedW,
            h: faceResult.normH * renderedH,
          };

          // Constrain box width strictly to realistic human head dimensions
          const maxFaceW = Math.round(cw * 0.62);
          const minFaceW = Math.round(cw * 0.36);
          const targetW = Math.max(minFaceW, Math.min(maxFaceW, detectedBox.w * 1.15));
          const targetH = Math.round(targetW * 1.30);

          const cx = detectedBox.x + detectedBox.w / 2;
          const cy = detectedBox.y + detectedBox.h * 0.45;
          const targetX = Math.max(12, Math.min(cw - targetW - 12, cx - targetW / 2));
          const targetY = Math.max(76, Math.min(ch - targetH - 120, cy - targetH * 0.45));

          setFaceBox((prev) => {
            if (!prev) return { x: targetX, y: targetY, width: targetW, height: targetH };

            const dx = Math.abs(targetX - prev.x);
            const dy = Math.abs(targetY - prev.y);
            const dw = Math.abs(targetW - prev.width);
            const dh = Math.abs(targetH - prev.height);

            const smoothX = dx < 2.5 ? prev.x : prev.x * 0.78 + targetX * 0.22;
            const smoothY = dy < 2.5 ? prev.y : prev.y * 0.78 + targetY * 0.22;
            const smoothW = dw < 3.0 ? prev.width : prev.width * 0.88 + targetW * 0.12;
            const smoothH = dh < 3.0 ? prev.height : prev.height * 0.88 + targetH * 0.12;

            return {
              x: smoothX,
              y: smoothY,
              width: smoothW,
              height: smoothH,
            };
          });
          setFaceStatus("face_locked");

          // === Progressive Continuous Face Scanning over ~1 second ===
          if (currentStep === 1 && !enrollStatus.success && !isLoading) {
            // Check if user is in cooldown after an error
            if (Date.now() < cooldownUntilRef.current) {
              // Wait for cooldown to expire before starting new analysis
            } else {
              // Smooth, steady accumulation when face is tracked (18 frames ~800ms)
              consecutiveQualityFramesRef.current = Math.min(22, consecutiveQualityFramesRef.current + 1);
              const prog = Math.min(100, Math.round((consecutiveQualityFramesRef.current / 18) * 100));
              setScanProgress(prog);
              setScanFeedback(`در حال تطبیق و اسکن چهره (${prog}%)...`);

              // Capture crisp high-res frame at 50% progress
              if (prog >= 50 && !bestFrameBlobRef.current) {
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
              // Once face is steadily tracked for 10 frames (~500ms), auto-start calibration!
              if (consecutiveGazeFramesRef.current >= 10 && !autoGazeTriggeredRef.current) {
                autoGazeTriggeredRef.current = true;
                startGazeCalibration();
              }
            }
          }

          // === Step 3: Neutral Emotion Face Presence & Auto-Start ===
          if (currentStep === 3 && !isNeutralCalibrated && !isNeutralCalibrating) {
            if (Date.now() < cooldownUntilRef.current) {
              // Cooldown active
            } else {
              consecutiveNeutralFramesRef.current++;
              // Once face is steadily tracked for 12 frames (~600ms), auto-start neutral calibration!
              if (consecutiveNeutralFramesRef.current >= 12 && !autoNeutralTriggeredRef.current) {
                autoNeutralTriggeredRef.current = true;
                startNeutralCalibration();
              }
            }
          }
        } else if (isMounted) {
          noFaceCounter++;
          // Generous hold: do not drop box unless face is absent for at least 8 frames
          if (noFaceCounter >= 8) {
            setFaceBox(null);
            setFaceStatus("no_face");
            consecutiveQualityFramesRef.current = Math.max(0, consecutiveQualityFramesRef.current - 1);
            consecutiveGazeFramesRef.current = 0;
            consecutiveNeutralFramesRef.current = 0;
            const prog = Math.min(100, Math.round((consecutiveQualityFramesRef.current / 18) * 100));
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
        timer = setTimeout(runLoop, nativeDetector ? 50 : 35);
      }
    };
    runLoop();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [
    isCameraActive,
    currentStep,
    enrollStatus.success,
    isGazeCalibrated,
    isGazeCalibrating,
    isNeutralCalibrated,
    isNeutralCalibrating,
    studentId,
    isLoading,
    startGazeCalibration,
    startNeutralCalibration,
  ]);

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
        try {
          localStorage.setItem("dt_biometrics_registered", "true");
          for (const cid of candidateIds) {
            localStorage.setItem(`dt_biometrics_${cid}`, "true");
          }
        } catch {}
        setEnrollStatus({
          success: true,
          message: "چهره و بردار اصالت با موفقیت تایید شد",
        });
        setScanProgress(100);
        setScanFeedback("تأیید شد");
        await loadProfile(false);
        // Automatically transition to Step 2 after 1.2s
        setTimeout(() => {
          setCurrentStep(2);
        }, 1200);
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

  const handleManualStartScan = async () => {
    if (isLoading) return;
    autoEnrollTriggeredRef.current = true;
    setScanProgress(100);
    setScanFeedback("در حال تصویربرداری و ارسال چهره...");
    try {
      const blob = await captureFrameBlob(0.92, 960, 960);
      await handleEnrollFace(blob);
    } catch (err) {
      showBottomError("خطا در تصویربرداری از دوربین");
    }
  };

  const handleRescanFace = () => {
    setEnrollStatus({ success: false, message: "" });
    setProfileStatus((prev) => (prev ? { ...prev, face_enrolled: false, is_enrolled: false } : null));
    setScanProgress(0);
    setScanFeedback("");
    consecutiveQualityFramesRef.current = 0;
    bestFrameBlobRef.current = null;
    bestSharpnessRef.current = 0;
    cooldownUntilRef.current = 0;
    autoEnrollTriggeredRef.current = false;
    setFaceStatus("no_face");
    setFaceBox(null);
    setCurrentStep(1);
  };

  const isStepDone = (stepId) => {
    if (stepId === 1) return Boolean(profileStatus?.face_enrolled || profileStatus?.is_enrolled || enrollStatus.success);
    if (stepId === 2) return Boolean(profileStatus?.gaze_calibrated || profileStatus?.is_gaze_calibrated || isGazeCalibrated);
    if (stepId === 3) return Boolean(profileStatus?.neutral_calibrated || profileStatus?.is_neutral_calibrated || isNeutralCalibrated);
    if (stepId === 4) return Boolean(profileStatus?.ready_for_exam || profileStatus?.is_fully_registered || (isStepDone(1) && isStepDone(2) && isStepDone(3)));
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
          onClick={() => navigate(returnTo ? "/StudentExams" : "/StudentSettings")}
          className="liquid-glass-card liquid-glass-pill flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-vazir transition-all active:scale-95 cursor-pointer shadow-lg hover:border-white/40"
          aria-label={returnTo ? "بازگشت به آزمون‌ها" : "بازگشت به تنظیمات"}
        >
          <BackIcon className="w-4 h-4 text-white" />
          <span>{returnTo ? "آزمون‌ها" : "تنظیمات"}</span>
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

        {/* Header Right Spacer (Keeps center title aligned) */}
        <div className="w-10 h-10" />
      </header>

      {/* Header Notification if Biometrics Required for Exam */}
      {isRequiredForExam && !isStepDone(4) && (
        <div className="relative z-30 mx-3 mb-1 px-3 py-2 rounded-2xl liquid-glass-card border border-amber-400/40 bg-amber-500/15 backdrop-blur-md flex items-center gap-2 text-amber-200 text-xs font-vazir shadow-lg animate-in slide-in-from-top-2 duration-300">
          <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0 border border-amber-400/40">
            <AlertTriangle className="w-3 h-3 text-amber-300" />
          </div>
          <span className="leading-relaxed">
            {returnExam?.title
              ? `برای ورود به آزمون «${returnExam.title}»، ابتدا ۳ مرحله احراز هویت بیومتریک را تکمیل نمایید.`
              : "برای ورود به آزمون، تکمیل هر ۳ مرحله احراز هویت بیومتریک الزامی است."}
          </span>
        </div>
      )}

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

        {/* Step 4 Ultimate Registration Summary Card */}
        {currentStep === 4 && (
          <div className="liquid-glass-card w-full max-w-[280px] p-4 rounded-3xl space-y-3 pointer-events-auto border border-emerald-400/35 bg-black/50 backdrop-blur-xl shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-vazir text-white">
                پروفایل بیومتریک تکمیل شد
              </h3>
              <p className="text-[11px] font-vazir text-emerald-200/90 mt-0.5">
                تمامی الگوهای چهره، نگاه و حالت خنثی با موفقیت کالیبره شدند
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-right">
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-vazir">
                <span className="text-white/80">۱. ثبت بردار چهره</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <Check className="w-3 h-3 stroke-[3]" /> تایید شد
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-vazir">
                <span className="text-white/80">۲. کالیبراسیون نگاه</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <Check className="w-3 h-3 stroke-[3]" /> تایید شد
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-vazir">
                <span className="text-white/80">۳. مبنای خنثی احساسات</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                  <Check className="w-3 h-3 stroke-[3]" /> تایید شد
                </span>
              </div>
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
                  چهره با موفقیت ثبت شد
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
              isGazeFaceMissing ? (
                <div className="liquid-glass-warning liquid-glass-pill px-4 py-2 rounded-full flex items-center gap-2.5 shadow-2xl animate-pulse border border-rose-400/50 bg-rose-950/50">
                  <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400" />
                  </div>
                  <span className="text-xs font-semibold font-vazir text-rose-200 tracking-wide">
                    صورت در کادر نیست - کالیبراسیون موقتاً متوقف شد
                  </span>
                </div>
              ) : (
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
              )
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
            isStepDone(1) && !enrollStatus.success ? (
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRescanFace}
                  className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs font-vazir"
                  title="اسکن مجدد چهره"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>اسکن مجدد</span>
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
            ) : enrollStatus.success ? (
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-10 px-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold font-vazir flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  <span>چهره تایید شد</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>مرحله بعد</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleManualStartScan}
                className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ثبت چهره...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>
                      {scanProgress > 0
                        ? `در حال اسکن خودکار (${Math.round(scanProgress)}%)...`
                        : "شروع اسکن و ثبت چهره"}
                    </span>
                  </>
                )}
              </button>
            )
          )}

          {/* Step 2 Action Button */}
          {currentStep === 2 && (
            isStepDone(2) && !isGazeCalibrating ? (
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartGaze}
                  className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs font-vazir"
                  title="کالیبراسیون مجدد نگاه"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>کالیبراسیون مجدد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>مرحله بعد: مبنای خنثی</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isGazeCalibrating}
                onClick={handleStartGaze}
                className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isGazeCalibrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-sky-200 animate-spin" />
                    <span>در حال کالیبراسیون نگاه ({Math.round(gazeProgress)}%)...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>شروع کالیبراسیون نگاه</span>
                  </>
                )}
              </button>
            )
          )}

          {/* Step 3 Action Button */}
          {currentStep === 3 && (
            isStepDone(3) && !isNeutralCalibrating ? (
              <div className="flex-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartNeutral}
                  className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0 text-xs font-vazir"
                  title="ضبط مجدد مبنای خنثی"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>ثبت مجدد</span>
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
                disabled={isNeutralCalibrating}
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
                    <span>شروع کالیبراسیون حالت خنثی (۳ ثانیه)</span>
                  </>
                )}
              </button>
            )
          )}

          {/* Step 4 Action Button */}
          {currentStep === 4 && (
            <div className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRescanFace}
                className="h-10 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-vazir font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                title="شروع مجدد اسکن و ثبت چهره"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>اسکن مجدد</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(returnTo || "/StudentExams")}
                className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-white text-xs font-bold font-vazir shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{returnTo ? "تایید و ورود به آزمون" : "تایید و ورود به آزمون‌ها"}</span>
              </button>
            </div>
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
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 select-none pointer-events-none">
          <div className="absolute top-20 text-center px-4 max-w-xs">
            <span className="text-xs px-3.5 py-1 rounded-full bg-sky-600/90 text-white font-bold backdrop-blur-md shadow-md border border-white/20">
              مرحله {gazeSubStep} از {gazeTotalSteps}
            </span>
            <h3 className="text-base font-bold text-white mt-2 font-vazir drop-shadow-md">
              {gazeTarget.label}
            </h3>

            {isGazeFaceMissing ? (
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/35 border-2 border-rose-400 text-rose-100 text-xs font-bold font-vazir animate-pulse shadow-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                <span>چهره در کادر نیست - رو به دوربین باشید</span>
              </div>
            ) : (
              <p className="text-xs text-sky-200 mt-1 font-vazir drop-shadow">
                {gazeStatusMsg || gazeTarget.hint}
              </p>
            )}
          </div>

          {/* Animated Interactive Gaze Target Dot with Dynamic Fixation Progress */}
          <div
            className={`absolute w-11 h-11 rounded-full transition-all duration-300 ease-out border-2 pointer-events-none flex items-center justify-center ${
              isGazeFaceMissing
                ? "bg-rose-500/30 border-rose-400 shadow-[0_0_25px_#f43f5e] animate-pulse"
                : "bg-rose-500 shadow-[0_0_35px_#f43f5e] border-white"
            }`}
            style={{
              left: `${gazeTarget.x}%`,
              top: `${gazeTarget.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* SVG Ring Progress around the Dot */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke={isGazeFaceMissing ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.25)"}
                strokeWidth="2.5"
              />
              <circle
                cx="22"
                cy="22"
                r="19"
                fill="none"
                stroke={isGazeFaceMissing ? "#f43f5e" : "#38bdf8"}
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 19}
                strokeDashoffset={(2 * Math.PI * 19) * (1 - (gazePointProgress || 0) / 100)}
                strokeLinecap="round"
                className="transition-all duration-100 ease-linear"
              />
            </svg>
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isGazeFaceMissing ? "bg-rose-300" : "bg-white animate-ping"
              }`}
            />
          </div>
        </div>
      )}

      {/* ================= 6. Already Registered / Reset Confirmation Modal ================= */}
      {showReRegistrationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="liquid-glass-card max-w-sm w-full p-6 rounded-3xl text-center space-y-4 shadow-2xl border border-white/20 relative animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold font-vazir text-white drop-shadow">
                اطلاعات بیومتریک شما ثبت شده است
              </h3>
              <p className="text-xs font-vazir text-white/80 leading-relaxed px-1">
                {profileStatus?.can_edit !== false ? (
                  "اطلاعات چهره و کالیبراسیون شما موجود است. می‌توانید فرآیند اسکن و ثبت را مجدداً انجام دهید یا وارد صفحه آزمون شوید."
                ) : (
                  "تمامی اطلاعات بیومتریک شما در سامانه ثبت و تایید شده است."
                )}
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowReRegistrationModal(false);
                  handleRescanFace();
                }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-vazir text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/25 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>شروع اسکن و ثبت مجدد چهره</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReRegistrationModal(false);
                  navigate(returnTo || "/StudentExams");
                }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-vazir text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{returnTo ? "تایید و ورود به آزمون" : "تایید و ورود به صفحه آزمون‌ها"}</span>
              </button>

              {profileStatus?.can_edit !== false && (
                <button
                  type="button"
                  onClick={handleResetBiometrics}
                  disabled={isResetting}
                  className="w-full h-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/20 text-rose-300 hover:text-white font-vazir text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                  <span>{isResetting ? "در حال حذف..." : "حذف داده‌های ثبت‌شده از سرور"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowReRegistrationModal(false)}
                className="text-[11px] text-white/50 hover:text-white/80 transition-colors cursor-pointer pt-1 inline-block"
              >
                مشاهده وضعیت جزئیات ثبت‌شده
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default StudentBiometricsPage;
