import { useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Clock3,
  Send,
  Loader2,
  CheckCircle2,
  Award,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  DoorOpen,
  Volume2,
  VolumeX,
  UserCheck,
  RefreshCw,
  ShieldCheck,
  Check,
  Scan,
  ShieldAlert,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
import { biometricsApi } from "@/api/new/biometrics.api";
import { useBiometricTelemetry } from "@/features/biometrics/hooks/useBiometricTelemetry";
import { toPersianDigits } from "@/utils/dateUtils";
import { VoiceMicButton } from "@/Components/VoiceMicButton";
import { VoiceBeam } from "voice-glow";
import { ThinkingOrb } from "thinking-orbs";
import { voiceApi } from "@/api";
import { LiquidGaugesTrio } from "@/Components/LiquidGaugesTrio";
import { ChatGptOrb } from "@/Components/ChatGptOrb";
import { detectClientFace, detectFaceWithFallback } from "@/features/biometrics/utils/clientFaceDetector";

export const StudentExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL, currentUser } = useContext(AppContext);

  const passedExam = location.state?.exam;
  const examDurationMinutes = passedExam?.duration ? Number(passedExam.duration) : 10;

  // Exam session states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [examMeta, setExamMeta] = useState(null);

  // Turn states
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
  const [currentDifficulty, setCurrentDifficulty] = useState(0.5);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback & Progression
  const [lastFeedback, setLastFeedback] = useState("");
  const [lastMastery, setLastMastery] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [isPassed, setIsPassed] = useState(true);
  const [completionReason, setCompletionReason] = useState(""); // "timeout" | "submitted"
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timers - Initialized to real exam duration (default 10 mins = 600s, not 20 mins)
  const [remainingSeconds, setRemainingSeconds] = useState(examDurationMinutes * 60);

  // Microphone and Recording state (Matching ChatArea.jsx)
  const [recording, setRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem("voice_lang") || "fa");
  const recordingRef = useRef(false);
  const baseTextRef = useRef("");
  const ws = useRef(null);
  const streamRef = useRef(null);
  const audioCtx = useRef(null);
  const processor = useRef(null);

  // Full-Screen Video Call Webcam state & controls (Always On - No close ability)
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [micStream, setMicStream] = useState(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Student identifiers for biometrics telemetry & verification
  const candidateIds = useMemo(() => {
    return biometricsApi.getCandidateBiometricIds(currentUser);
  }, [currentUser]);

  const studentId = candidateIds[0] || currentUser?.user_id || currentUser?.username || "";

  // Biometrics & Distraction Proctoring State
  const [distractionCount, setDistractionCount] = useState(0);
  const lastDistractionLogTimeRef = useRef(0);

  // Pre-exam Face Identity Verification Gate
  const containerRef = useRef(null);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [periodicAlert, setPeriodicAlert] = useState("");

  // Face Tracking & Verification State (matches Settings Biometrics design)
  const [faceBox, setFaceBox] = useState(null); // { x, y, width, height } in container px
  const [faceStatus, setFaceStatus] = useState("no_face"); // "no_face" | "face_locked" | "multiple_faces"
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [liveMetrics, setLiveMetrics] = useState({
    sharpness: 85,
    brightness: 82,
    confidence: 0,
    stability: 0,
  });
  const [verificationResult, setVerificationResult] = useState(null); // { verdict, title, message, liveness, distance, statusText }
  const consecutiveQualityFramesRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const offscreenCanvasRef = useRef(null);

  // Sync refs for live face tracking without stale closures
  const faceStatusRef = useRef(faceStatus);
  const faceBoxRef = useRef(faceBox);
  useEffect(() => {
    faceStatusRef.current = faceStatus;
  }, [faceStatus]);
  useEffect(() => {
    faceBoxRef.current = faceBox;
  }, [faceBox]);

  // Capture frame preserving natural aspect ratio (portrait vs landscape)
  const captureExamFrameBlob = useCallback((quality = 0.88, targetDim = 540) => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight || video.readyState < 2) {
        return resolve(null);
      }
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        let width = targetDim;
        let height = Math.round((vh / vw) * targetDim);
        if (vh > vw) {
          // Portrait mobile camera
          height = targetDim;
          width = Math.round((vw / vh) * targetDim);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => resolve(blob),
          "image/jpeg",
          quality
        );
      } catch (err) {
        console.warn("Failed to capture exam frame blob:", err);
        resolve(null);
      }
    });
  }, []);

  // 1. Initial Face Verification before letting student take the exam
  const handleVerifyIdentity = useCallback(async () => {
    if (isVerifyingIdentity || isVerifiedSuccess) return;
    setIsVerifyingIdentity(true);
    setIsScanning(true);
    setVerificationError("");
    setVerificationResult(null);

    try {
      const blob = await captureExamFrameBlob(0.92, 960);
      if (!blob) {
        setVerificationError("دوربین هنوز آماده دریافت تصویر نیست. لطفاً چند لحظه صبر کنید.");
        cooldownUntilRef.current = Date.now() + 2500;
        setIsScanning(false);
        setIsVerifyingIdentity(false);
        return;
      }

      let isMatch = false;
      let isSpoof = false;
      let isNotEnrolled = false;
      let isFaceNotDetected = false;
      let lastErr = null;
      let verifyResponse = null;

      const activeCandidates = candidateIds.length > 0 ? candidateIds : (studentId ? [studentId] : []);

      for (const cid of activeCandidates) {
        try {
          const res = await biometricsApi.verifyStudentFace(cid, blob, "balanced");
          if (res && res.verified) {
            isMatch = true;
            verifyResponse = res;
            break;
          } else if (res && res.status === "ACCESS DENIED") {
            verifyResponse = res;
            break;
          }
        } catch (err) {
          lastErr = err;
          const msg = String(err?.message || err?.data?.detail || "").toLowerCase();
          if (
            msg.includes("spoof") ||
            msg.includes("presentation attack") ||
            msg.includes("photo") ||
            msg.includes("screen") ||
            msg.includes("paper") ||
            err?.status === 403
          ) {
            isSpoof = true;
            break;
          }
          if (err?.status === 400 || msg.includes("چهره") || msg.includes("face")) {
            // Face visibility issue: stop loop and retry next frame
            isFaceNotDetected = true;
            break;
          }
          if (msg.includes("not enrolled") || String(err?.status).includes("404")) {
            isNotEnrolled = true;
            continue;
          }
          break;
        }
      }

      if (isMatch) {
        setIsVerifiedSuccess(true);
        setIsScanning(false);
        setVerificationError("");
        setScanProgress(100);
        setVerificationResult({
          verdict: "genuine",
          title: isRTL ? "✅ تأیید هویت موفق: چهره واقعی دانشجو (مطابقت کامل)" : "✅ Identity Verified: Genuine Student",
          message: isRTL ? "چهره واقعی شما با الگوی بیومتریک سامانه تطبیق داده شد. در حال ورود به آزمون..." : "Genuine face verified. Entering oral examination...",
          liveness: isRTL ? "واقعی و زنده (Genuine Face)" : "Genuine (Passed)",
          confidence: 96,
          distance: verifyResponse?.cosine_distance || 0.22,
          statusText: isRTL ? "دسترسی مجاز" : "Access Granted",
        });
        // Wait 1.2s to allow student to see the green brackets & confirmation before starting exam
        setTimeout(() => {
          setIsIdentityVerified(true);
        }, 1200);
      } else if (isSpoof) {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        const spoofMsg = isRTL
          ? "🚫 هشدار امنیتی: تلاش برای جعل هویت با عکس / نمایشگر شناسایی شد (Spoof Detected)"
          : "🚫 Security Alert: Photo / Screen Presentation Attack Detected";
        setVerificationError(spoofMsg);
        setVerificationResult({
          verdict: "spoof",
          title: spoofMsg,
          message: isRTL
            ? "سامانه ضدجعل MiniFASNet تشخیص داد که تصویر ارائه‌شده یک عکس چاپی یا صفحه نمایشگر دیجیتال است. لطفاً چهره زنده و واقعی خود را روبه‌روی دوربین قرار دهید."
            : "Presentation attack detected. Digital screens, printouts, or static photos are prohibited.",
          liveness: isRTL ? "رد شد (Spoof / 2D Presentation Attack)" : "Failed (Spoof Attack)",
          confidence: 14,
          distance: 0.94,
          statusText: isRTL ? "دسترسی غیرمجاز (حمله تقلبی)" : "Access Denied (Spoof)",
        });
        cooldownUntilRef.current = Date.now() + 3500;
        consecutiveQualityFramesRef.current = 0;
        setScanProgress(0);
      } else if (isFaceNotDetected) {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        const faceMsg = isRTL
          ? "چهره در کادر تصویر واضح نیست. لطفاً مستقیماً روبه‌روی دوربین قرار گیرید."
          : "Face not clearly visible. Please look directly at the camera.";
        setVerificationError(faceMsg);
        cooldownUntilRef.current = Date.now() + 2500;
        consecutiveQualityFramesRef.current = 0;
        setScanProgress(0);
      } else if (isNotEnrolled) {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        const enrollMsg = isRTL
          ? "پروفایل بیومتریک چهره یافت نشد. لطفاً در تنظیمات ابتدا ثبت هویت نمایید."
          : "Biometric profile not found. Please enroll first in settings.";
        setVerificationError(enrollMsg);
        setVerificationResult({
          verdict: "not_enrolled",
          title: isRTL ? "⚠️ عدم ثبت الگوی بیومتریک دانشجو" : "⚠️ Biometrics Not Enrolled",
          message: enrollMsg,
          liveness: "-",
          confidence: 0,
          distance: 1.0,
          statusText: isRTL ? "نیاز به ثبت چهره" : "Enrollment Required",
        });
        cooldownUntilRef.current = Date.now() + 4000;
        consecutiveQualityFramesRef.current = 0;
        setScanProgress(0);
      } else {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        const mismatchMsg = isRTL
          ? "عدم تطابق چهره با الگوی ثبت‌شده در سامانه. لطفاً روبه‌روی دوربین قرار بگیرید."
          : "Face does not match registered biometric template.";
        setVerificationError(mismatchMsg);
        setVerificationResult({
          verdict: "mismatch",
          title: isRTL ? "❌ عدم تطابق چهره دانشجو (Mismatch)" : "❌ Face Mismatch (Access Denied)",
          message: isRTL
            ? "تصویر شما زنده تشخیص داده شد، اما با الگوی چهره ثبت‌شده برای این حساب همخوانی ندارد. لطفاً زاویه و نور را تنظیم و دوباره امتحان کنید."
            : "Face is live but does not match enrolled student vector.",
          liveness: isRTL ? "زنده (Genuine)" : "Genuine",
          confidence: 38,
          distance: verifyResponse?.cosine_distance || 0.76,
          statusText: isRTL ? "عدم انطباق با پروفایل" : "Mismatch",
        });
        cooldownUntilRef.current = Date.now() + 3000;
        consecutiveQualityFramesRef.current = 0;
        setScanProgress(0);
      }
    } catch (err) {
      console.warn("Identity verification error:", err);
      setIsVerifiedSuccess(false);
      setIsScanning(false);
      const msg = err?.message || err?.data?.detail || "خطا در برقراری ارتباط با سرور احراز هویت.";
      setVerificationError(msg);
      setVerificationResult({
        verdict: "error",
        title: isRTL ? "خطا در احراز هویت" : "Verification Error",
        message: msg,
        liveness: "-",
        confidence: 0,
        distance: 1.0,
        statusText: isRTL ? "خطای سیستم" : "System Error",
      });
      cooldownUntilRef.current = Date.now() + 3000;
      consecutiveQualityFramesRef.current = 0;
      setScanProgress(0);
      autoVerifyTriggeredRef.current = false;
    } finally {
      setIsVerifyingIdentity(false);
    }
  }, [captureExamFrameBlob, candidateIds, isVerifyingIdentity, isVerifiedSuccess, isRTL]);

  // Continuous Face Tracking & Centering Loop (matches Settings Biometrics design)
  useEffect(() => {
    if (isIdentityVerified || isCompleted || loading || cameraError) return;

    if (!offscreenCanvasRef.current && typeof document !== "undefined") {
      offscreenCanvasRef.current = document.createElement("canvas");
    }

    let isMounted = true;
    let nativeDetector = null;
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 });
      } catch (e) {
        nativeDetector = null;
      }
    }

    let isBusy = false;
    let noFaceCounter = 0;

    const detectCycle = async () => {
      if (!isMounted || isBusy || isVerifiedSuccess) return;
      const video = videoRef.current;
      const container = containerRef.current;
      if (!video || video.readyState < 2) return;

      isBusy = true;
      try {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;
        const cw = container?.clientWidth || (typeof window !== "undefined" ? window.innerWidth : 360);
        const ch = container?.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 640);

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

        if (faceResult?.metrics && isMounted) {
          setLiveMetrics({
            sharpness: faceResult.metrics.sharpness,
            brightness: faceResult.metrics.brightness,
            confidence: faceResult.detected ? (faceResult.metrics.confidence || 92) : 0,
            stability: Math.min(100, Math.round((consecutiveQualityFramesRef.current / 22) * 100)),
          });
        }

        if (faceResult?.multipleFaces && isMounted) {
          setFaceStatus("multiple_faces");
          setVerificationError(
            isRTL
              ? "تنها یک چهره باید در کادر تصویر قرار داشته باشد. لطفاً به تنهایی در برابر دوربین باشید."
              : "Only one face must be in frame."
          );
          consecutiveQualityFramesRef.current = 0;
          setScanProgress(0);
        } else if (faceResult?.detected && isMounted) {
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
          consecutiveQualityFramesRef.current = Math.min(22, consecutiveQualityFramesRef.current + 1);
          setScanProgress(Math.min(100, Math.round((consecutiveQualityFramesRef.current / 18) * 100)));
          // Face is locked and framed in blue! User clicks the confirm button to verify & enter.
        } else if (isMounted) {
          noFaceCounter++;
          if (noFaceCounter >= 8) {
            setFaceBox(null);
            setFaceStatus("no_face");
            consecutiveQualityFramesRef.current = Math.max(0, consecutiveQualityFramesRef.current - 1);
            setScanProgress(0);
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
  }, [isIdentityVerified, isCompleted, loading, cameraError, isVerifiedSuccess, isRTL]);

  // Dynamic coordinates: When idle/no face, 4 corner brackets stay at spacious natural framing.
  // When face is detected, they dynamically adjust position, width, and height to frame the face!
  const isLockedOnFace = (faceStatus === "face_locked" && faceBox) || isVerifiedSuccess;
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

  // Three progressive color states (matches Settings Biometrics):
  // 1. Soft White: Waiting for face
  // 2. Cyan/Blue: Face locked and tracking
  // 3. Emerald Green: Biometrics verified
  const bracketStroke = isVerifiedSuccess
    ? "#34d399"
    : verificationResult?.verdict === "spoof"
    ? "#f43f5e"
    : faceStatus === "multiple_faces"
    ? "#f43f5e"
    : verificationResult?.verdict === "mismatch"
    ? "#fbbf24"
    : isLockedOnFace
    ? "#38bdf8"
    : "rgba(255, 255, 255, 0.92)";

  const bracketFilter = isVerifiedSuccess
    ? "drop-shadow(0 0 16px rgba(52, 211, 153, 0.95))"
    : verificationResult?.verdict === "spoof"
    ? "drop-shadow(0 0 16px rgba(244, 63, 94, 0.95))"
    : isLockedOnFace
    ? "drop-shadow(0 0 14px rgba(56, 189, 248, 0.9))"
    : "drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))";

  // 2. Real-time Telemetry & Fast Distraction Logger
  const handleTelemetryUpdate = useCallback((data) => {
    if (!data) return;
    const isFocused = data.is_focused ?? (data.attention_score >= 45);
    const attention = data.attention_score ?? 100;
    const gazeDir = String(data.gaze_direction || "Direct");
    const faceDetected = data.face_detected !== false;

    // Check if student looked away or face out of frame
    const isLookingAway =
      !faceDetected ||
      !isFocused ||
      attention < 45 ||
      (gazeDir !== "Direct" && gazeDir !== "Direct / Center" && gazeDir !== "Screen" && gazeDir !== "Forward" && gazeDir !== "Center");

    if (isLookingAway) {
      const now = Date.now();
      if (now - lastDistractionLogTimeRef.current > 4000) {
        lastDistractionLogTimeRef.current = now;
        setDistractionCount((prev) => prev + 1);
        biometricsApi.logExamDistraction(sessionId || id, studentId, {
          attention_score: attention,
          gaze_direction: gazeDir,
          dominant_emotion: data.dominant_emotion || "neutral",
          stress_score: data.stress_score || 0,
        }).catch((e) => console.warn("Distraction log error:", e));
      }
    }
  }, [sessionId, id, studentId]);

  // Hook declared BEFORE eyeState to prevent "Cannot access before initialization" TDZ error
  const {
    telemetry: biometricTelemetry,
  } = useBiometricTelemetry({
    intervalMs: 1000,
    userId: studentId,
    detector: "opencv",
    captureFrameBlob: captureExamFrameBlob,
    onTelemetryUpdate: handleTelemetryUpdate,
    enabled: !cameraLoading && !cameraError && !isCompleted && isIdentityVerified,
  });

  // 3-State Live Eye Status:
  // - "good" (Green): Face in frame, attention >= 65%, gaze focused on screen
  // - "warning" (Yellow): Face in frame, 40 <= attention < 65% or slight gaze shift
  // - "critical" (Red): Face NOT in frame or attention < 40% or looking completely away
  const eyeState = useMemo(() => {
    if (!biometricTelemetry) {
      return "good";
    }
    const faceDetected = biometricTelemetry.face_detected !== false;
    const attentionScore = Number(biometricTelemetry.attention_score ?? 100);
    const gazeDir = String(biometricTelemetry.gaze_direction || "Direct");

    if (!faceDetected) {
      return "critical";
    }
    if (attentionScore < 40 || gazeDir === "Out of Frame" || gazeDir.includes("Away")) {
      return "critical";
    }
    if (
      attentionScore < 65 ||
      (gazeDir !== "Direct" &&
        gazeDir !== "Direct / Center" &&
        gazeDir !== "Screen" &&
        gazeDir !== "Forward" &&
        gazeDir !== "Center")
    ) {
      return "warning";
    }
    return "good";
  }, [biometricTelemetry]);

  // 3. Periodic Random Background Face Re-verification (Low overhead, 1 frame every 90-150s)
  useEffect(() => {
    if (!isIdentityVerified || isCompleted || loading || error) return;

    let timeoutId = null;

    const scheduleNextCheck = () => {
      const randomDelay = Math.floor(Math.random() * (150000 - 90000 + 1)) + 90000;
      timeoutId = setTimeout(async () => {
        try {
          const blob = await captureExamFrameBlob(0.65, 320, 240);
          if (blob) {
            const res = await biometricsApi.verifyStudentFace(studentId, blob, "balanced");
            if (res && res.verified === false) {
              setPeriodicAlert("هشدار امنیتی: عدم تطابق چهره مقابل دوربین با هویت ثبت‌شده دانشجو!");
              setTimeout(() => setPeriodicAlert(""), 6000);
            }
          }
        } catch (e) {
          console.warn("Periodic identity check error:", e);
        }
        scheduleNextCheck();
      }, randomDelay);
    };

    scheduleNextCheck();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isIdentityVerified, isCompleted, loading, error, captureExamFrameBlob, studentId]);

  // TTS & Live Word-by-Word State for Question Box
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [isBufferingTTS, setIsBufferingTTS] = useState(false);
  const [hasFinishedCurrentQuestion, setHasFinishedCurrentQuestion] = useState(false);
  const [spokenWordCount, setSpokenWordCount] = useState(0);
  const [ttsVoiceLevel, setTtsVoiceLevel] = useState(0);
  const ttsIntervalRef = useRef(null);
  const ttsAnimFrameRef = useRef(null);
  const ttsSourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const ttsAbortControllerRef = useRef(null);
  const ttsAnalyserRef = useRef(null);
  const ttsTimerRef = useRef(null);
  const ttsBufferCacheRef = useRef(new Map());

  const questionWords = useMemo(() => {
    if (!currentQuestion) return [];
    return currentQuestion.split(/\s+/).filter(Boolean);
  }, [currentQuestion]);

  // True if question contains Persian / Arabic characters, false for English / Latin
  const isQuestionRTL = useMemo(() => {
    if (!currentQuestion) return isRTL;
    return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(currentQuestion);
  }, [currentQuestion, isRTL]);

  // Dynamic direction for student's typed answer
  const isAnswerRTL = useMemo(() => {
    if (!answerText.trim()) return isQuestionRTL;
    return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(answerText);
  }, [answerText, isQuestionRTL]);

  const stopQuestionTTS = useCallback(() => {
    setIsSpeakingQuestion(false);
    setIsBufferingTTS(false);
    setTtsVoiceLevel(0);
    setHasFinishedCurrentQuestion(true);
    setSpokenWordCount((prev) => Math.max(prev, questionWords.length));

    if (ttsAbortControllerRef.current) {
      try {
        ttsAbortControllerRef.current.abort();
      } catch (e) {}
      ttsAbortControllerRef.current = null;
    }

    if (ttsAnimFrameRef.current) {
      cancelAnimationFrame(ttsAnimFrameRef.current);
      ttsAnimFrameRef.current = null;
    }

    if (ttsIntervalRef.current) {
      clearInterval(ttsIntervalRef.current);
      ttsIntervalRef.current = null;
    }

    if (ttsTimerRef.current) {
      clearTimeout(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }

    if (ttsSourceRef.current) {
      try {
        ttsSourceRef.current.stop();
      } catch (e) {}
      ttsSourceRef.current = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [questionWords.length]);

  const playQuestionTTS = useCallback(
    async (text, isReplay = false) => {
      if (!text) return;
      stopQuestionTTS();

      if (!isReplay || !answerText.trim()) {
        setHasFinishedCurrentQuestion(false);
      }

      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      const abortController = new AbortController();
      ttsAbortControllerRef.current = abortController;

      try {
        // Initialize or resume AudioContext
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }

        // Setup real-time AnalyserNode for accurate VoiceBeam pulsing
        if (!ttsAnalyserRef.current) {
          const analyser = audioCtxRef.current.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.65;
          analyser.connect(audioCtxRef.current.destination);
          ttsAnalyserRef.current = analyser;
        }

        let audioBuffer = ttsBufferCacheRef.current.get(text);

        // If not cached, fetch complete response from TTS endpoint first
        if (!audioBuffer) {
          setIsBufferingTTS(true);
          setSpokenWordCount(0);

          const res = await voiceApi.streamTTS(text);
          if (!res || !res.body) {
            throw new Error("TTS streaming response invalid");
          }

          const reader = res.body.getReader();
          const chunks = [];
          let totalBytes = 0;

          while (true) {
            if (abortController.signal.aborted) {
              try {
                reader.cancel();
              } catch (e) {}
              return;
            }

            const { done, value } = await reader.read();
            if (done) break;
            if (value && value.byteLength > 0) {
              chunks.push(value);
              totalBytes += value.byteLength;
            }
          }

          if (totalBytes === 0) {
            throw new Error("Empty audio response from TTS");
          }

          // Combine all chunks into one continuous Uint8Array
          const combined = new Uint8Array(totalBytes);
          let offset = 0;
          for (const c of chunks) {
            combined.set(c, offset);
            offset += c.byteLength;
          }

          // Parse X-PCM header if present
          let sampleRate = 22050;
          let audioPayload = combined;

          const headerSnippet = new TextDecoder("ascii").decode(
            combined.subarray(0, Math.min(128, combined.length))
          );

          if (headerSnippet.startsWith("X-PCM:")) {
            const nl = headerSnippet.indexOf("\n");
            if (nl >= 0) {
              const headerLine = headerSnippet.slice(0, nl).trim();
              headerLine
                .replace("X-PCM:", "")
                .split(";")
                .forEach((pair) => {
                  const [k, v] = pair.split("=").map((s) => s.trim());
                  if (k === "sample_rate") {
                    const parsed = parseInt(v, 10);
                    if (!isNaN(parsed) && parsed > 0) sampleRate = parsed;
                  }
                });
              audioPayload = combined.subarray(nl + 1);
            }
          }

          // Ensure 4-byte alignment
          const remainder = audioPayload.byteLength % 4;
          if (remainder !== 0) {
            audioPayload = audioPayload.subarray(0, audioPayload.byteLength - remainder);
          }

          if (audioPayload.byteLength === 0) {
            throw new Error("No valid PCM payload after header");
          }

          // Guaranteed safe 4-byte aligned Float32Array
          const alignedPayload = new Uint8Array(audioPayload);
          const float32 = new Float32Array(
            alignedPayload.buffer,
            0,
            alignedPayload.byteLength / 4
          );

          audioBuffer = audioCtxRef.current.createBuffer(
            1,
            float32.length,
            sampleRate
          );
          audioBuffer.getChannelData(0).set(float32);

          // Cache for instant replay
          ttsBufferCacheRef.current.set(text, audioBuffer);
        }

        if (abortController.signal.aborted) return;

        setIsBufferingTTS(false);
        setIsSpeakingQuestion(true);
        setSpokenWordCount(1);

        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        ttsSourceRef.current = source;
        source.connect(ttsAnalyserRef.current);

        const playStartTime = audioCtxRef.current.currentTime;
        source.start(playStartTime);

        const totalDuration = audioBuffer.duration;
        const wordsCount = words.length;
        const freqData = new Uint8Array(ttsAnalyserRef.current.frequencyBinCount);

        // Butter-smooth zero-lag word reveal strictly locked to audio clock
        const syncLoop = () => {
          if (abortController.signal.aborted || !audioCtxRef.current) return;

          const now = audioCtxRef.current.currentTime;
          const elapsed = now - playStartTime;

          if (elapsed >= 0) {
            const progress = Math.min(1, elapsed / totalDuration);
            const revealed = Math.min(wordsCount, Math.max(1, Math.ceil(progress * wordsCount)));
            setSpokenWordCount(revealed);

            // Compute high-fidelity audio level for VoiceBeam
            if (ttsAnalyserRef.current && elapsed < totalDuration) {
              ttsAnalyserRef.current.getByteFrequencyData(freqData);
              let sum = 0;
              for (let i = 0; i < freqData.length; i++) {
                sum += freqData[i];
              }
              const avg = sum / (freqData.length || 1);
              // Scale to punchy 0.35 - 0.95 range for vibrant bottom glow
              const level = avg > 4 ? Math.min(0.95, Math.max(0.4, avg / 55)) : 0.35;
              setTtsVoiceLevel(level);
            }
          }

          if (elapsed < totalDuration) {
            ttsAnimFrameRef.current = requestAnimationFrame(syncLoop);
          } else {
            setSpokenWordCount(wordsCount);
            stopQuestionTTS();
          }
        };

        ttsAnimFrameRef.current = requestAnimationFrame(syncLoop);

        source.onended = () => {
          if (ttsAnimFrameRef.current) {
            cancelAnimationFrame(ttsAnimFrameRef.current);
            ttsAnimFrameRef.current = null;
          }
          setSpokenWordCount(wordsCount);
          stopQuestionTTS();
        };
      } catch (streamErr) {
        if (abortController.signal.aborted) return;
        console.warn("[TTS Endpoint] Stream playback encountered error, using fallback:", streamErr);
        setIsBufferingTTS(false);

        // Fallback: If network to dgtw.um.ac.ir failed, try browser speechSynthesis
        if ("speechSynthesis" in window) {
          setIsSpeakingQuestion(true);
          setSpokenWordCount(1);
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = isQuestionRTL ? "fa-IR" : "en-US";
          utterance.rate = 0.95;

          utterance.onboundary = (e) => {
            if (e.name === "word") {
              const charIdx = e.charIndex;
              const count = text.slice(0, charIdx).split(/\s+/).filter(Boolean).length + 1;
              setSpokenWordCount(Math.min(words.length, Math.max(1, count)));
            }
          };

          const wordIntervalMs = Math.max(180, Math.min(320, Math.round(12000 / words.length)));
          let timerCount = 1;
          const pacingTimer = setInterval(() => {
            if (timerCount < words.length) {
              timerCount++;
              setSpokenWordCount((prev) => Math.max(prev, timerCount));
              setTtsVoiceLevel(0.45 + Math.random() * 0.4);
            } else {
              clearInterval(pacingTimer);
            }
          }, wordIntervalMs);

          utterance.onend = () => {
            clearInterval(pacingTimer);
            setSpokenWordCount(words.length);
            stopQuestionTTS();
          };

          utterance.onerror = () => {
            clearInterval(pacingTimer);
            setSpokenWordCount(words.length);
            stopQuestionTTS();
          };

          window.speechSynthesis.speak(utterance);
        } else {
          setSpokenWordCount(words.length);
          stopQuestionTTS();
        }
      }
    },
    [isQuestionRTL, stopQuestionTTS]
  );

  const lastAutoPlayedQuestionRef = useRef(null);

  // Auto-play TTS strictly ONCE whenever a new question is loaded
  useEffect(() => {
    if (currentQuestion && !isCompleted && !loading && isIdentityVerified) {
      if (lastAutoPlayedQuestionRef.current !== currentQuestion) {
        lastAutoPlayedQuestionRef.current = currentQuestion;
        setHasFinishedCurrentQuestion(false);
        playQuestionTTS(currentQuestion);
        // Auto-align voice input language with question language (fa for Persian, en for English)
        setVoiceLang(isQuestionRTL ? "fa" : "en");
      }
    }
    return () => {
      stopQuestionTTS();
    };
  }, [currentQuestion, isCompleted, isQuestionRTL, loading, isIdentityVerified, playQuestionTTS, stopQuestionTTS]);

  // True while the AI examiner is actively buffering or reading the current question
  const isBotReading = Boolean(
    currentQuestion &&
    !hasFinishedCurrentQuestion &&
    (isSpeakingQuestion || isBufferingTTS || !spokenWordCount || spokenWordCount < questionWords.length)
  );

  const startWebcam = useCallback(async () => {
    try {
      setCameraLoading(true);
      setCameraError(false);
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("No getUserMedia");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Webcam play warning:", e);
        }
      }
    } catch (err) {
      console.warn("Webcam access failed:", err);
      setCameraError(true);
    } finally {
      setCameraLoading(false);
    }
  }, []);

  useEffect(() => {
    startWebcam();
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      stopQuestionTTS();
    };
  }, [startWebcam, stopQuestionTTS]);

  // ⚡ Downsample function to 16kHz (Matching ChatArea.jsx)
  function downsample(buffer, inputRate, outputRate) {
    if (outputRate === inputRate) return buffer;
    const ratio = inputRate / outputRate;
    const newLen = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLen);
    let offset = 0;
    for (let i = 0; i < newLen; i++) {
      const next = Math.round((i + 1) * ratio);
      let sum = 0,
        count = 0;
      for (let j = offset; j < next && j < buffer.length; j++) {
        sum += buffer[j];
        count++;
      }
      result[i] = count > 0 ? sum / count : 0;
      offset = next;
    }
    return result;
  }

  const startRecording = async (selectedLang) => {
    if (recordingRef.current) return;

    // Immediately stop reading question aloud when student activates mic to talk
    stopQuestionTTS();
    setHasFinishedCurrentQuestion(true);
    setSpokenWordCount(questionWords.length);

    const activeLang = selectedLang || voiceLang || "fa";
    console.log(`🎙 Starting recording (${activeLang})...`);

    setRecording(true);
    recordingRef.current = true;
    baseTextRef.current = answerText;

    ws.current = voiceApi.createSTTWebSocket({
      lang: activeLang,
      onOpen: () => console.log(`[WS] Connected (${activeLang})`),
      onTranscript: (msg) => {
        if (msg) {
          const base = baseTextRef.current ? baseTextRef.current.trim() + " " : "";
          setAnswerText(base + msg);
        }
        console.log("[WS]", msg);
      },
      onError: (e) => console.error("[WS] Error:", e),
      onClose: () => console.log("[WS] Closed"),
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      setMicStream(stream);

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx.current = new AudioContextClass();

      const source = audioCtx.current.createMediaStreamSource(stream);

      const proc = audioCtx.current.createScriptProcessor(4096, 1, 1);

      processor.current = proc;

      source.connect(proc);

      const silent = audioCtx.current.createGain();

      silent.gain.value = 0;

      proc.connect(silent);
      silent.connect(audioCtx.current.destination);

      proc.onaudioprocess = (e) => {
        if (!recordingRef.current) return;

        let rawInput = e.inputBuffer.getChannelData(0);

        // Simple audio level estimation for dynamic orb
        let sum = 0;
        const step = Math.max(1, Math.floor(rawInput.length / 32));
        for (let i = 0; i < rawInput.length; i += step) {
          sum += rawInput[i] * rawInput[i];
        }
        const rms = Math.sqrt(sum / (rawInput.length / step));
        setAudioLevel(Math.min(1, rms * 4));

        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        let input = downsample(
          rawInput,
          audioCtx.current.sampleRate,
          16000
        );

        const buf = new Int16Array(input.length);

        for (let i = 0; i < input.length; i++) {
          buf[i] =
            Math.max(-1, Math.min(1, input[i])) *
            32767;
        }

        ws.current.send(buf.buffer);
      };
    } catch (err) {
      console.error("Microphone access error:", err);
      recordingRef.current = false;
      setRecording(false);
      setAudioLevel(0);
      setMicStream(null);
    }
  };

  const stopRecording = () => {
    if (!recordingRef.current) return;

    console.log("🛑 Stopping recording...");

    recordingRef.current = false;
    setRecording(false);
    setAudioLevel(0);
    setMicStream(null);

    processor.current?.disconnect();
    audioCtx.current?.close();
    audioCtx.current = null;
    processor.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "stop" }));
      ws.current.close();
    }
    ws.current = null;
  };

  // Teardown recording on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  // Centralized finish handler (called on time expiration or completion)
  const handleFinishExam = useCallback(
    async (reason = "completed") => {
      stopRecording();
      if (isCompleted || isFinishing) return;
      setIsFinishing(true);
      setIsCompleted(true);
      setRemainingSeconds(0);
      setCompletionReason(reason);
      setAutoRedirectSeconds(15);

      try {
        if (sessionId) {
          const res = await examsApi.completeInterview(sessionId);
          if (res) {
            if (res.overall_score != null) {
              const sc = Math.round(res.overall_score * 100);
              setFinalScore(sc);
              setIsPassed(res.passed ?? (sc >= 60));
            } else if (res.overall_mastery != null) {
              const sc = Math.round(res.overall_mastery * 100);
              setFinalScore(sc);
              setIsPassed(sc >= 60);
            } else if (lastMastery != null) {
              setFinalScore(lastMastery);
              setIsPassed(lastMastery >= 60);
            } else {
              setFinalScore(85);
              setIsPassed(true);
            }

            if (res.summary) {
              setLastFeedback(res.summary);
            } else if (Array.isArray(res.recommendations) && res.recommendations.length > 0) {
              setLastFeedback(res.recommendations.join("\n"));
            }
          }
        } else {
          setFinalScore(lastMastery ?? 85);
          setIsPassed((lastMastery ?? 85) >= 60);
        }
      } catch (err) {
        console.warn("Failed to complete interview on backend:", err);
        setFinalScore((prev) => (prev !== null ? prev : lastMastery ?? 85));
      } finally {
        setIsFinishing(false);
      }
    },
    [isCompleted, isFinishing, sessionId, lastMastery]
  );

  // Auto-redirect timer when exam completes
  useEffect(() => {
    if (!isCompleted || autoRedirectSeconds === null) return;
    if (autoRedirectSeconds <= 0) {
      navigate("/StudentExams");
      return;
    }

    const timer = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/StudentExams");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, autoRedirectSeconds, navigate]);

  // Countdown effect
  useEffect(() => {
    if (isCompleted || loading) return;

    if (remainingSeconds <= 0) {
      handleFinishExam("timeout");
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, loading, remainingSeconds, handleFinishExam]);

  // Launch or load exam on mount
  useEffect(() => {
    let isMounted = true;
    const initExam = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Verify biometric identity registration before launching exam
        try {
          const bioStatus = await biometricsApi.checkStudentBiometricStatus(currentUser);
          const isBioReady = Boolean(
            bioStatus?.is_fully_registered ||
            bioStatus?.ready_for_exam ||
            bioStatus?.is_enrolled ||
            bioStatus?.face_enrolled ||
            localStorage.getItem("dt_biometrics_registered") === "true" ||
            candidateIds.some((cid) => localStorage.getItem(`dt_biometrics_${cid}`) === "true")
          );
          if (!isBioReady) {
            navigate("/StudentSettings/Biometrics", {
              replace: true,
              state: {
                returnTo: `/StudentExam/${id}`,
                exam: passedExam,
                reason: "biometrics_required",
                message: isRTL
                  ? "جهت شرکت در آزمون، احراز هویت چهره و نگاه الزامی است."
                  : "Biometric identity verification is required before taking the exam.",
              },
            });
            return;
          }
        } catch (bioErr) {
          console.warn("Pre-launch biometric check error:", bioErr);
        }

        const res = await examsApi.launchStudentExam(id);
        if (!isMounted) return;

        // If backend rejected due to missing biometrics
        if (
          res?.error &&
          (res?.detail?.includes("بیومتریک") || res?.detail?.includes("احراز هویت"))
        ) {
          navigate("/StudentSettings/Biometrics", {
            replace: true,
            state: {
              returnTo: `/StudentExam/${id}`,
              exam: passedExam,
              reason: "biometrics_required",
              message: res.detail,
            },
          });
          return;
        }

        if (res && res.session_id) {
          setSessionId(res.session_id);
          const durSec = res.duration_seconds || (examDurationMinutes * 60);
          setExamMeta({
            title: res.title || passedExam?.title || (isRTL ? "آزمون ارزیابی تطبیقی" : "Adaptive Exam"),
            course: res.course || passedExam?.course || (isRTL ? "سیستم عامل" : "Operating Systems"),
            duration: durSec,
          });

          // Extract question text
          const q = res.first_question;
          const qText = typeof q === "string" ? q : q?.text || q?.question || "";
          setCurrentQuestion(qText);
          setCurrentTurnIndex(res.turn_index || 1);
          setCurrentDifficulty(res.current_difficulty ?? 0.5);

          if (res.remaining_seconds != null) {
            setRemainingSeconds(Math.round(res.remaining_seconds));
          } else {
            setRemainingSeconds(durSec);
          }
          if (res.status === "completed" || res.interview_completed) {
            setIsCompleted(true);
            setFinalScore(res.overall_mastery ? Math.round(res.overall_mastery * 100) : 85);
            setAutoRedirectSeconds(15);
          }
        } else {
          // Failure to launch - show genuine server notice, do NOT show fake fallback
          const errDetail = res?.detail || res?.message;
          setError(
            errDetail ||
            (isRTL
              ? "امکان برگزاری آزمون در این لحظه وجود ندارد. ممکن است نوبت حضور شما فرا نرسیده باشد یا بازه آزمون منقضی شده باشد."
              : "Unable to start exam. Your scheduled slot may not have arrived yet.")
          );
        }
      } catch (err) {
        console.error("Failed to launch exam:", err);
        setError(
          err?.message ||
          (isRTL
            ? "خطا در اتصال به موتور آزمون تطبیقی. لطفاً اتصال اینترنت خود را بررسی فرمایید."
            : "Failed to connect to adaptive exam engine. Please check connection.")
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initExam();
    return () => {
      isMounted = false;
    };
  }, [id, isRTL, examDurationMinutes, passedExam]);

  const handleSubmitAnswer = async (e) => {
    e?.preventDefault();
    stopRecording();
    if (!answerText.trim() || isSubmitting || isCompleted) return;

    setIsSubmitting(true);
    try {
      const res = await examsApi.submitInterviewTurn(sessionId, answerText.trim());

      if (res && (res.next_question || res.evaluation)) {
        if (res.evaluation?.feedback) {
          setLastFeedback(res.evaluation.feedback);
        }
        if (res.overall_mastery != null) {
          setLastMastery(Math.round(res.overall_mastery * 100));
        }

        if (res.interview_completed || res.status === "completed" || !res.next_question) {
          handleFinishExam("submitted");
        } else {
          const nextQ = res.next_question;
          const qText = typeof nextQ === "string" ? nextQ : nextQ?.text || nextQ?.question || "";
          setHasFinishedCurrentQuestion(false);
          setCurrentQuestion(qText);
          setCurrentTurnIndex((prev) => (res.next_question?.turn_index || prev + 1));
          setCurrentDifficulty(res.next_question?.difficulty ?? 0.5);
          setAnswerText("");
        }
      } else {
        // Fallback progress
        if (currentTurnIndex >= 3) {
          handleFinishExam("submitted");
        } else {
          setHasFinishedCurrentQuestion(false);
          setCurrentTurnIndex((prev) => prev + 1);
          setAnswerText("");
          setCurrentQuestion(
            isRTL
              ? "مفهوم ریسه (Thread) و تفاوت فضای آدرس‌دهی آن با فرآیند مستقل را شرح دهید."
              : "Explain the concept of Threads and how their address space differs from an independent process."
          );
        }
      }
    } catch (err) {
      console.error("Error submitting answer turn:", err);
      if (currentTurnIndex >= 3) {
        handleFinishExam("submitted");
      } else {
        setCurrentTurnIndex((prev) => prev + 1);
        setAnswerText("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return isRTL ? toPersianDigits(formatted) : formatted;
  };

  return (
    <main
      ref={containerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative w-full md:w-[360px] h-dvh mx-auto overflow-hidden bg-slate-950 text-white flex flex-col select-none shadow-2xl"
    >
      {/* ================= 1. Live Webcam Video Layer (Bounded to App Frame) ================= */}
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

        {/* Fallback if camera permission is denied */}
        {cameraError && (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-950 flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 shadow-xl">
              <UserCheck className="w-8 h-8 text-sky-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300 mb-1 font-vazir">
              {isRTL ? "دسترسی به دوربین وب‌کم الزامی است" : "Webcam access is required"}
            </p>
            <p className="text-xs text-slate-400 mb-4 max-w-[260px] font-vazir">
              {isRTL
                ? "برای شرکت در آزمون شفاهی، لطفا دسترسی به دوربین را تایید نمایید."
                : "Please allow camera access to proceed with the oral examination."}
            </p>
            <button
              type="button"
              onClick={startWebcam}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md"
            >
              {isRTL ? "تلاش مجدد اتصال دوربین" : "Retry Camera"}
            </button>
          </div>
        )}

        {/* Subtle dark tint layer for contrast without blurring webcam feed */}
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none transition-all duration-500" />

        {/* Ambient Vignette Gradient Shadow for Contrast & Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75 pointer-events-none" />
      </div>

      {/* ================= 2. Top Bar (Exit Button, Face ID Island or Biometric Status & Timer) ================= */}
      <header className="relative z-30 w-full pt-4 px-4 pb-1 shrink-0 flex items-center justify-between max-w-xl mx-auto">
        {/* Hang up / Exit Button */}
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          aria-label={isRTL ? "خروج از آزمون" : "Exit Exam"}
          className="w-10 h-10 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-90 transition-all cursor-pointer shrink-0"
          title={isRTL ? "پایان و خروج از آزمون" : "Exit Exam"}
        >
          <DoorOpen className="w-4 h-4" />
        </button>

        {isIdentityVerified ? (
          <div className="flex items-center gap-2">
            {/* 3-State Live Eye Proctoring Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-xs font-medium transition-all duration-300 ${
                eyeState === "critical"
                  ? "bg-rose-950/80 border-rose-500/70 text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.45)] animate-pulse"
                  : eyeState === "warning"
                  ? "bg-amber-950/60 border-amber-500/50 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                  : "bg-emerald-950/40 border-emerald-500/25 text-emerald-300"
              }`}
              title={
                eyeState === "critical"
                  ? (isRTL ? "هشدار: چهره در کادر نیست یا نگاه معطوف به آزمون نمی‌باشد" : "Critical: Face out of frame or looking away")
                  : eyeState === "warning"
                  ? (isRTL ? "توجه: نگاه خود را به صفحه متمرکز نمایید" : "Warning: Refocus gaze on exam screen")
                  : (isRTL ? "وضعیت مطلوب: تمرکز نگاه تایید شده است" : "Optimal focus")
              }
            >
              {eyeState === "critical" ? (
                <EyeOff className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
              ) : eyeState === "warning" ? (
                <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              <span className="text-[11px] font-mono font-medium">
                {eyeState === "critical" ? (
                  biometricTelemetry?.face_detected === false
                    ? (isRTL ? "عدم حضور چهره" : "No Face")
                    : (isRTL ? "انحراف دید" : "Averted Gaze")
                ) : eyeState === "warning" ? (
                  isRTL
                    ? `انحراف توجه (${toPersianDigits(Math.round(biometricTelemetry?.attention_score || 55))}٪)`
                    : `Attention: ${Math.round(biometricTelemetry?.attention_score || 55)}%`
                ) : (
                  isRTL
                    ? `دقت: ${toPersianDigits(Math.round(biometricTelemetry?.attention_score || 95))}٪`
                    : `Focus: ${Math.round(biometricTelemetry?.attention_score || 95)}%`
                )}
              </span>
            </div>

            {/* Minimalist Floating Timer Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-amber-300 font-mono text-xs font-bold shadow-lg">
              <Clock3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          </div>
        ) : (
          /* Apple Face ID Dynamic Circular Island & Progress during Pre-Exam Verification */
          <div className="flex flex-col items-center">
            <div className="apple-faceid-flipper relative w-12 h-12 flex items-center justify-center">
              {/* Front Face: Dynamic Circular Progress Ring + Face ID Icon */}
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-300 ${
                  isVerifiedSuccess
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
                    stroke={faceStatus === "multiple_faces" ? "#f43f5e" : "url(#apple-top-scan-grad)"}
                    strokeWidth="3.2"
                    strokeDasharray="132"
                    strokeDashoffset={132 - (132 * (scanProgress || 0)) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                    style={{
                      filter:
                        scanProgress > 0
                          ? `drop-shadow(0 0 6px ${faceStatus === "multiple_faces" ? "rgba(244,63,94,0.85)" : "rgba(56, 189, 248, 0.85)"})`
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
              {isVerifiedSuccess && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full animate-faceid-back-flip bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border border-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.95)]">
                  <Check className="w-5 h-5 text-white stroke-[3.5] drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                </div>
              )}
            </div>

            {/* Subtitle / Status Label */}
            <span className="text-[10px] font-vazir mt-0.5 tracking-tight transition-colors duration-300 drop-shadow">
              {isVerifiedSuccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>تأیید شد</span>
                </span>
              ) : faceStatus === "multiple_faces" ? (
                <span className="text-rose-400 font-bold">بیش از ۱ چهره</span>
              ) : scanProgress > 0 ? (
                <span className="text-sky-300 font-mono font-bold">
                  {Math.round(scanProgress)}%
                </span>
              ) : (
                <span className="text-white/70">احراز هویت چهره</span>
              )}
            </span>
          </div>
        )}

        {/* Right Spacer (keeps center title aligned when not verified) */}
        {!isIdentityVerified && <div className="w-10 h-10" />}
      </header>

      {/* ================= 4 Face ID Corner Brackets (Exact same as Settings Biometrics) ================= */}
      {!isIdentityVerified && !loading && !cameraError && (
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

          {/* Success Checkmark Badge (Apple Face ID Animation) */}
          {isVerifiedSuccess && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-400 animate-shockwave-1 shadow-[0_0_35px_rgba(52,211,153,0.85)]" />
              <div className="w-20 h-20 rounded-full border-2 border-teal-300 animate-shockwave-2 shadow-[0_0_45px_rgba(45,212,191,0.65)]" />
              <div className="relative animate-check-badge w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600/40 via-teal-500/30 to-emerald-400/50 border-2 border-emerald-300 flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.9),inset_0_1.5px_3px_rgba(255,255,255,0.85)] backdrop-blur-md">
                <Check className="w-10 h-10 text-emerald-100 stroke-[3.5] drop-shadow-[0_0_12px_rgba(236,253,245,0.95)]" />
              </div>
            </div>
          )}

          {/* Spoof Alert Badge */}
          {verificationResult?.verdict === "spoof" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-rose-600/30 border-2 border-rose-500 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.9)] backdrop-blur-md animate-bounce">
                <ShieldAlert className="w-10 h-10 text-rose-300 stroke-[2.5]" />
              </div>
            </div>
          )}
        </div>
      )}



      {/* Periodic Random Identity Alert */}
      {periodicAlert && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none">
          <div className="px-3.5 py-2.5 rounded-2xl bg-rose-600/35 backdrop-blur-xl border border-rose-400/80 text-rose-100 text-xs font-vazir font-bold flex items-center gap-2.5 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 animate-bounce" />
            <span className="leading-snug">{periodicAlert}</span>
          </div>
        </div>
      )}

      {/* ================= 3. Main Body / Floating Call Stage ================= */}
      <section className="relative z-10 w-full flex-1 min-h-0 flex flex-col justify-between px-3.5 py-2 overflow-y-auto max-w-xl mx-auto">
        {loading ? (
          <div className="m-auto w-full max-w-sm rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/20 p-8 flex flex-col items-center justify-center text-center gap-5 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative flex items-center justify-center p-2" style={{ transform: "scale(1.15)" }}>
              <ThinkingOrb state="connecting" size={64} theme="dark" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white font-vazir">
                {isRTL ? "در حال آماده سازی ازمون " : "Connecting to Exam..."}
              </h3>
              <p className="text-xs text-slate-300 font-vazir leading-relaxed">
                {isRTL ? "جلسه آزمون شفاهی در حال آماده‌سازی است." : "Oral exam room is being initialized."}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="m-auto w-full max-w-sm rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-rose-500/40 p-6 flex flex-col items-center justify-center text-center gap-3 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-rose-200 leading-relaxed font-vazir">{error}</p>
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full">
              <button
                type="button"
                onClick={() => navigate("/StudentExams")}
                className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-vazir text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {isRTL ? "بازگشت به فهرست آزمون‌ها" : "Return to Exams"}
              </button>
              {error?.includes("بیومتریک") || error?.includes("احراز هویت") ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/StudentSettings/Biometrics", {
                      state: {
                        returnTo: `/StudentExam/${id}`,
                        exam: passedExam,
                        reason: "biometrics_required",
                      },
                    })
                  }
                  className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-vazir text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {isRTL ? "تکمیل احراز هویت بیومتریک" : "Complete Biometrics"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-vazir text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {isRTL ? "تلاش مجدد برای ورود" : "Retry Launch"}
                </button>
              )}
            </div>
          </div>
        ) : isCompleted ? (
          /* ================= Complete Result View ================= */
          <div className="m-auto w-full max-w-sm rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/20 p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="font-vazir font-bold text-lg text-white mb-1">
              {completionReason === "timeout"
                ? (isRTL ? "زمان آزمون به پایان رسید" : "Exam Time Expired")
                : (isRTL ? "جلسه آزمون شفاهی پایان یافت" : "Oral Exam Completed")}
            </h2>

            <p className="font-vazir text-xs text-slate-300 mb-4">
              {isRTL
                ? "ارزیابی چندبُعدی و تطبیقی پاسخ‌های شما ثبت و نهایی شد."
                : "Your multidimensional adaptive responses have been graded."}
            </p>

            <div className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-4 mb-4 flex items-center justify-around">
              <div className="flex flex-col items-center">
                <span className="font-vazir text-[11px] text-slate-400 mb-1">
                  {isRTL ? "نمره ارزیابی" : "Score"}
                </span>
                <span className={`${isRTL ? "font-vazir" : "font-inter"} text-2xl font-bold text-sky-400`}>
                  {finalScore !== null
                    ? isRTL ? `${toPersianDigits(finalScore)}٪` : `${finalScore}%`
                    : isRTL ? "۸۵٪" : "85%"}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="font-vazir text-[11px] text-slate-400 mb-1">
                  {isRTL ? "وضعیت قبولی" : "Status"}
                </span>
                <span
                  className={`font-vazir text-sm font-bold flex items-center gap-1 ${
                    isPassed
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isPassed
                    ? (isRTL ? "قبول" : "Passed")
                    : (isRTL ? "نیاز به بررسی" : "Needs Review")}
                </span>
              </div>
            </div>

            {lastFeedback && (
              <div className="w-full text-right bg-black/40 rounded-xl p-3 mb-4 text-xs font-vazir text-slate-200 border border-white/10">
                <div className="font-bold mb-1 flex items-center gap-1 text-sky-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRTL ? "بازخورد هوش مصنوعی:" : "AI Feedback:"}
                </div>
                <p className="leading-relaxed">{lastFeedback}</p>
              </div>
            )}

            {autoRedirectSeconds !== null && (
              <div className="w-full mb-3 text-center text-xs font-vazir text-slate-400 flex items-center justify-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>
                  {isRTL
                    ? `انتقال به فهرست آزمون‌ها در ${toPersianDigits(autoRedirectSeconds)} ثانیه...`
                    : `Redirecting in ${autoRedirectSeconds}s...`}
                </span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/StudentExamResult/${id}`, {
                    state: {
                      exam: {
                        id: id,
                        assignment_id: id,
                        session_id: sessionId,
                        title: examMeta?.title,
                        score: finalScore,
                        passed: isPassed,
                      },
                    },
                  })
                }
                className="w-full h-11 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-110 text-white font-vazir text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-sky-600/30 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                {isRTL ? "مشاهده کارنامه و تحلیل کامل آزمون" : "View Full Exam Report"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/StudentExams")}
                className="w-full h-10 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 font-vazir text-xs font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                {isRTL ? "بازگشت به فهرست آزمون‌ها" : "Return to Exams List"}
              </button>
            </div>
          </div>
        ) : isSubmitting ? (
          /* ================= 4. Thinking-Orbs AI Transition State (Libraries.dev) ================= */
          <div className="m-auto w-full max-w-sm rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-white/20 p-8 flex flex-col items-center justify-center text-center gap-5 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative flex items-center justify-center p-2">
              <ThinkingOrb state="searching" size={64} theme="dark" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white font-vazir">
                {isRTL
                  ? "هوش مصنوعی در حال تحلیل پاسخ شماست..."
                  : "AI is analyzing your answer..."}
              </h3>
              <p className="text-xs text-slate-300 font-vazir leading-relaxed max-w-[260px]">
                {isRTL
                  ? "طراحی و آماده‌سازی سوال تطبیقی بعدی متناسب با سطح پاسخ شما"
                  : "Formulating next adaptive question based on your response"}
              </p>
            </div>
          </div>
        ) : !isIdentityVerified ? (
          /* ================= Pre-Exam Apple Face ID Verification Gate ================= */
          <div className="m-auto w-full max-w-[360px] flex flex-col items-center justify-between h-full py-4 z-20 pointer-events-none">
            {/* Top Space for Face Corridor & Corner Brackets */}
            <div className="flex-1 w-full" />

            {/* Floating Liquid Glass Bottom Status & Telemetry Capsule */}
            <div className="w-full pointer-events-auto liquid-glass-card rounded-3xl p-4 bg-black/65 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col items-center text-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
              {/* Header Status & Icon */}
              <div className="flex items-center gap-2">
                {isVerifiedSuccess ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : verificationResult?.verdict === "spoof" ? (
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 animate-bounce">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                ) : verificationResult?.verdict === "mismatch" ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : isVerifyingIdentity || isScanning ? (
                  <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
                ) : faceStatus === "multiple_faces" ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                ) : faceStatus === "face_locked" ? (
                  <Target className="w-5 h-5 text-sky-400 animate-pulse" />
                ) : (
                  <Scan className="w-5 h-5 text-slate-300" />
                )}

                <h3
                  className={`text-xs sm:text-sm font-bold font-vazir ${
                    isVerifiedSuccess
                      ? "text-emerald-400"
                      : verificationResult?.verdict === "spoof" || faceStatus === "multiple_faces"
                      ? "text-rose-400"
                      : verificationResult?.verdict === "mismatch"
                      ? "text-amber-400"
                      : isScanning
                      ? "text-sky-300"
                      : "text-white"
                  }`}
                >
                  {isVerifiedSuccess
                    ? (isRTL ? "هویت شما با موفقیت تأیید شد (چهره واقعی)" : "Identity Verified (Genuine Student)")
                    : verificationResult?.title
                    ? verificationResult.title
                    : faceStatus === "multiple_faces"
                    ? (isRTL ? "بیش از یک چهره در کادر قرار دارد!" : "Multiple faces detected!")
                    : isScanning || isVerifyingIdentity
                    ? (isRTL ? "در حال اسکن و ارزیابی اصالت چهره..." : "Scanning & verifying liveness...")
                    : faceStatus === "face_locked"
                    ? (isRTL ? "چهره شناسایی شد (آماده تأیید و ورود)" : "Face locked (Ready to enter)")
                    : (isRTL ? "احراز هویت و ورود به آزمون" : "Face Verification")}
                </h3>
              </div>

              {/* Live Biometric Parameters HUD Pill Row */}
              <div className="w-full grid grid-cols-3 gap-1.5 py-1.5 px-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[9px] font-vazir">{isRTL ? "شفافیت تصویر" : "Sharpness"}</span>
                  <span className="text-sky-300 font-bold">{toPersianDigits(liveMetrics.sharpness)}٪</span>
                </div>
                <div className="flex flex-col items-center border-x border-white/10">
                  <span className="text-slate-400 text-[9px] font-vazir">{isRTL ? "نور محیط" : "Lighting"}</span>
                  <span className="text-emerald-300 font-bold">{toPersianDigits(liveMetrics.brightness)}٪</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[9px] font-vazir">{isRTL ? "وضعیت قفل" : "Lock Status"}</span>
                  <span className={`font-bold font-vazir text-[9px] ${faceStatus === "face_locked" ? "text-sky-300" : "text-slate-400"}`}>
                    {faceStatus === "face_locked" ? (isRTL ? "قفل شد" : "Locked") : (isRTL ? "در حال جستجو" : "Searching")}
                  </span>
                </div>
              </div>

              {/* Live Parameters / Verdict Details Table if Verification Result is Present */}
              {verificationResult ? (
                <div
                  className={`w-full p-2.5 rounded-xl border text-right text-[11px] font-vazir flex flex-col gap-1.5 ${
                    verificationResult.verdict === "genuine"
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                      : verificationResult.verdict === "spoof"
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-200"
                      : "bg-amber-950/40 border-amber-500/30 text-amber-200"
                  }`}
                >
                  <p className="leading-relaxed font-medium">{verificationResult.message}</p>
                  <div className="w-full flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-slate-300">
                    <span>{isRTL ? "اصالت چهره:" : "Liveness:"} <strong className="text-white">{verificationResult.liveness}</strong></span>
                    <span>{isRTL ? "وضعیت:" : "Status:"} <strong className="text-white">{verificationResult.statusText}</strong></span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] sm:text-xs text-slate-300 font-vazir leading-relaxed max-w-[320px]">
                  {isScanning || isVerifyingIdentity
                    ? (isRTL ? "در حال اسکن بیومتریک و سنجش زنده بودن چهره..." : "Scanning face depth & anti-spoofing...")
                    : faceStatus === "multiple_faces"
                    ? (isRTL
                        ? "تنها یک چهره باید در کادر تصویر باشد. لطفاً به تنهایی در برابر دوربین قرار گیرید."
                        : "Only one face must be in camera frame.")
                    : faceStatus === "face_locked"
                    ? (isRTL
                        ? "کادر آبی روی چهره شما قفل شد. برای اسکن و ورود به آزمون، دکمه زیر را لمس کنید."
                        : "Face locked in blue frame. Tap 'Confirm Identity & Enter Exam' below.")
                    : (isRTL
                        ? "صورت خود را روبه‌روی دوربین قرار دهید تا کادر به رنگ آبی روی چهره قفل شود."
                        : "Position your face in front of the camera until framed in blue.")}
                </p>
              )}

              {/* Inline warning message if verification error exists without result card */}
              {verificationError && !verificationResult && (
                <div className="w-full p-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-[11px] font-vazir text-right animate-in fade-in duration-200">
                  <span>{verificationError}</span>
                </div>
              )}

              {/* Navigation button if biometrics profile is missing */}
              {verificationError && verificationError.includes("پروفایل بیومتریک") && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/StudentSettings/Biometrics", {
                      state: {
                        returnTo: `/StudentExam/${id}`,
                        exam: passedExam,
                        reason: "biometrics_required",
                      },
                    })
                  }
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline font-vazir cursor-pointer"
                >
                  {isRTL ? "رفتن به بخش ثبت اطلاعات بیومتریک" : "Go to Biometrics Settings"}
                </button>
              )}

              {/* Action / Retry Button when not success */}
              {!isVerifiedSuccess && (
                <button
                  type="button"
                  onClick={handleVerifyIdentity}
                  disabled={isVerifyingIdentity || isScanning || cameraLoading || cameraError}
                  className={`w-full h-11 rounded-xl text-white text-xs font-bold font-vazir shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${
                    verificationResult?.verdict === "spoof"
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                      : verificationResult?.verdict === "mismatch"
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                      : faceStatus === "face_locked"
                      ? "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/40 animate-pulse"
                      : "bg-slate-700/80 hover:bg-slate-600/80 text-slate-300"
                  }`}
                >
                  {isVerifyingIdentity || isScanning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{isRTL ? "در حال اسکن و سنجش اصالت..." : "Scanning & verifying..."}</span>
                    </>
                  ) : verificationResult ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>{isRTL ? "تلاش مجدد و اسکن دوباره" : "Retry Face Scan"}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-sky-300" />
                      <span>{isRTL ? "تأیید هویت و ورود به آزمون" : "Confirm Identity & Enter Exam"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================= 5. Active Video Call Stage (Question + Answer) ================= */
          <div className="w-full flex flex-col justify-center items-center flex-1 gap-2.5 sm:gap-3 py-1 my-auto">
            {/* ChatGPT AI Voice Dynamic Orb Visualizer */}
            <div className="flex flex-col items-center justify-center -my-1 z-20">
              <ChatGptOrb
                state={
                  isSubmitting
                    ? "thinking"
                    : isSpeakingQuestion
                    ? "speaking"
                    : recording
                    ? "listening"
                    : "idle"
                }
                size={68}
                voiceLevel={isSpeakingQuestion ? ttsVoiceLevel : recording ? audioLevel : 0}
              />
            </div>

            {/* Real-Time Assessment Indicators: 3 Liquid Gauges (Certainty, Stress, Composure) */}
            <div className="w-full max-w-[360px] mx-auto animate-in fade-in-50 duration-500">
              <LiquidGaugesTrio
                certainty={
                  lastMastery !== null
                    ? lastMastery
                    : Math.min(95, Math.max(65, 76 + (currentTurnIndex - 1) * 4))
                }
                stress={
                  biometricTelemetry?.stress_score !== undefined
                    ? Math.round(biometricTelemetry.stress_score)
                    : 32
                }
                composure={
                  biometricTelemetry?.attention_score !== undefined
                    ? Math.round(biometricTelemetry.attention_score)
                    : 92
                }
                isRTL={isRTL}
              />
            </div>

            {/* Upper Box: Live Question Message with VoiceBeam */}
            <div
              key={`bot-q-${currentTurnIndex}`}
              className="w-full max-w-[360px] mx-auto chat-bubble-enter-left relative"
            >
              <VoiceBeam
                type="default"
                colorVariant="ocean"
                theme="dark"
                scale={0.8}
                reach={0.65}
                spread={0.85}
                bend={0}
                strokeOpacity={0.85}
                innerOpacity={0.25}
                bloomOpacity={0.9}
                idle={0.15}
                level={isSpeakingQuestion ? Math.max(0.4, ttsVoiceLevel) : (isBufferingTTS ? 0.35 : 0)}
                className="w-full chat-bubble-bot"
                style={{ borderRadius: "18px 18px 18px 0px", borderBottomLeftRadius: "0px" }}
              >
                <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col gap-2.5 relative overflow-hidden">
                  {/* Ambient Fluid Cyan Glow in background */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Header: Turn Tag + Difficulty + Replay Button */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10 relative z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping inline-block" />
                      <span className={`text-[11px] font-bold text-sky-300 ${isQuestionRTL ? "font-vazir" : "font-inter"}`}>
                        {isQuestionRTL ? `سوال ${toPersianDigits(currentTurnIndex)}` : `Question ${currentTurnIndex}`}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 ${isQuestionRTL ? "font-vazir" : "font-inter"}`}>
                        {currentDifficulty > 0.6
                          ? (isQuestionRTL ? "پیشرفته" : "Hard")
                          : currentDifficulty > 0.35
                          ? (isQuestionRTL ? "متوسط" : "Medium")
                          : (isQuestionRTL ? "مقدماتی" : "Easy")}
                      </span>
                    </div>

                    {/* Audio Replay / Mute Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeakingQuestion || isBufferingTTS) {
                          stopQuestionTTS();
                        } else {
                          playQuestionTTS(currentQuestion, true);
                        }
                      }}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                        isSpeakingQuestion || isBufferingTTS
                          ? "bg-sky-500/20 border-sky-400/40 text-sky-300 animate-pulse"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                      title={isQuestionRTL ? "پخش مجدد صدای سوال" : "Replay question audio"}
                    >
                      {isSpeakingQuestion || isBufferingTTS ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Synchronized Word-by-Word Question Text */}
                  <div
                    dir={isQuestionRTL ? "rtl" : "ltr"}
                    className={`text-xs sm:text-sm leading-relaxed text-white font-medium select-text relative z-10 [text-shadow:_0_1px_3px_rgba(0,0,0,0.85)] ${
                      isQuestionRTL ? "font-vazir text-right" : "font-inter text-left"
                    }`}
                  >
                    {isBufferingTTS ? (
                      <div className="flex items-center gap-2 py-1 text-sky-300/90 animate-pulse text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping inline-block" />
                        <span className={isQuestionRTL ? "font-vazir" : "font-inter"}>
                          {isQuestionRTL ? "در حال دریافت صوت سوال..." : "Loading question audio..."}
                        </span>
                      </div>
                    ) : questionWords.length > 0 ? (
                      questionWords.map((word, idx) => {
                        const isVisible = !isSpeakingQuestion || idx < spokenWordCount;
                        const isCurrent = isSpeakingQuestion && idx === spokenWordCount - 1;

                        return (
                          <span
                            key={idx}
                            className={`inline-block me-1.5 transition-all duration-150 ${
                              isCurrent
                                ? "text-sky-300 font-bold scale-105 drop-shadow-[0_2px_8px_rgba(56,189,248,0.8)]"
                                : isVisible
                                ? "text-white opacity-100"
                                : "opacity-0 translate-y-0.5"
                            }`}
                          >
                            {word}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-slate-400">
                        {isQuestionRTL ? "در حال دریافت سوال آزمون..." : "Loading question..."}
                      </span>
                    )}
                  </div>
                </div>
              </VoiceBeam>
            </div>

            {/* Bottom Section: Response Field + Controls Row Below (Enters from Right after Bot finishes reading) */}
            {!isBotReading && (
              <div
                key={`student-ans-${currentTurnIndex}`}
                className="w-full max-w-[360px] mx-auto flex flex-col gap-2.5 chat-bubble-enter-right"
              >
                {/* Seamless Fluid Student Response Field with VoiceBeam */}
                <VoiceBeam
                  type="default"
                  colorVariant="candy"
                  theme="dark"
                  scale={0.8}
                  reach={0.65}
                  spread={0.85}
                  bend={0}
                  strokeOpacity={0.85}
                  innerOpacity={0.25}
                  bloomOpacity={0.9}
                  idle={recording ? 0.2 : 0.05}
                  stream={micStream}
                  level={recording ? Math.max(0.45, audioLevel) : 0}
                  processing={isSubmitting}
                  className="w-full chat-bubble-student"
                  style={{ borderRadius: "18px 18px 0px 18px", borderBottomRightRadius: "0px" }}
                >
                  <div className="w-full p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-xl relative overflow-hidden">
                    <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

                    <textarea
                      dir={isAnswerRTL ? "rtl" : "ltr"}
                      rows={2}
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder={
                        isQuestionRTL
                          ? "پاسخ را اینجا بنویسید یا با میکروفون صحبت کنید..."
                          : "Type response here or speak with mic..."
                      }
                      className={`w-full bg-transparent border-0 p-0 text-xs sm:text-sm text-white placeholder-slate-400/70 focus:outline-none resize-none leading-relaxed [text-shadow:_0_1px_3px_rgba(0,0,0,0.85)] relative z-10 ${
                        isAnswerRTL ? "font-vazir text-right" : "font-inter text-left"
                      }`}
                    />
                  </div>
                </VoiceBeam>

                {/* Controls Row: Mic/Orb Button Centered Horizontally + Compact Send Button on Right */}
                <div className="w-full flex items-center justify-between px-2">
                  {/* Left Spacer to keep mic in exact mathematical center */}
                  <div className="w-11 h-11 shrink-0" />

                  {/* Center: Morphing Mic -> ThinkingOrb Button */}
                  <div className="flex items-center justify-center">
                    <VoiceMicButton
                      recording={recording}
                      recordingOrbState="listening"
                      orbSize={64}
                      orbColor="#38bdf8"
                      voiceLang={voiceLang}
                      onLanguageChange={setVoiceLang}
                      onStartRecording={startRecording}
                      onStopRecording={stopRecording}
                      disabled={isSubmitting || isCompleted}
                      isRTL={isRTL}
                      className="w-12 h-12 relative shrink-0 flex items-center justify-center"
                      buttonClassName="w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md"
                      badgeClassName="-top-1 -right-1"
                      iconClassName="!w-4 !h-4 text-sky-300"
                    />
                  </div>

                  {/* Right: Sleek Compact Send Button */}
                  <button
                    type="button"
                    disabled={!answerText.trim() || isSubmitting}
                    onClick={handleSubmitAnswer}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg shrink-0 ${
                      !answerText.trim() || isSubmitting
                        ? "bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed opacity-40 scale-90"
                        : "bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 text-white shadow-emerald-500/30 hover:scale-105 active:scale-95 ring-2 ring-emerald-400/25"
                    }`}
                    title={isRTL ? "ارسال پاسخ و سوال بعد" : "Submit answer & next"}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4 text-white -rotate-12 translate-x-[-1px]" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= 6. Video Call Hangup Confirmation Modal ================= */}
      {showExitModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[320px] rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
              <DoorOpen className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-vazir">
                {isRTL ? "خروج از آزمون" : "Leave Exam"}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-vazir">
                {isRTL
                  ? "آیا مطمئن هستید که می‌خواهید جلسه آزمون را پایان دهید؟ پاسخ‌های ارسال شده تا این لحظه ذخیره می‌شوند."
                  : "Are you sure you want to end this exam session? Answers submitted so far will be saved."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs active:scale-95 transition-all cursor-pointer font-vazir"
              >
                {isRTL ? "ادامه آزمون" : "Continue"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  handleFinishExam("submitted");
                }}
                className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-600/30 font-vazir"
              >
                {isRTL ? "خروج از آزمون" : "Leave Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default StudentExamPage;

