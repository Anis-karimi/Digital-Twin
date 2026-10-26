import { useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
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
  Clock3,
  Users,
  UserX,
  EyeOff,
  Camera,
  ZoomIn,
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
import { voiceApi } from "@/api";
import { ThinkingOrb } from "thinking-orbs";
import {
  normalizeTextForTTS,
  warmupQuestionNormalization,
  detectTextLanguage,
  useWebRtcVAD,
} from "@/features/voice";
import { LiquidGaugesTrio } from "@/Components/LiquidGaugesTrio";
import { ChatGptOrb } from "@/Components/ChatGptOrb";
import { FlipDownClock } from "@/Components/FlipDownClock";
import { LiquidGlassPaperPlane } from "@/Components/LiquidGlassPaperPlane";
import {
  detectClientFace,
  detectFaceWithFallback,
} from "@/features/biometrics/utils/clientFaceDetector";

/**
 * LiveProctoringEye
 *
 * Standalone GPU-accelerated interactive icon-style eye that tracks
 * the student's real-time gaze coordinates and draws a smooth diagonal
 * strike-through line when in the "critical" (Red) state.
 */
const LiveProctoringEye = ({ telemetry, eyeState = "good" }) => {
  const { dx, dy, isBlinking } = useMemo(() => {
    if (!telemetry || telemetry.face_detected === false) {
      return { dx: 0, dy: 0, isBlinking: false };
    }

    const normX = telemetry.gaze_point?.norm_x;
    const normY = telemetry.gaze_point?.norm_y;
    const gxRatio = telemetry.gaze_x_ratio;
    const yaw = Number(telemetry.yaw || 0);
    const pitch = Number(telemetry.pitch || 0);
    const dir = String(telemetry.gaze_direction || "Direct");

    let rawX = 0;
    let rawY = 0;

    if (typeof normX === "number") {
      rawX = (normX - 0.5) * 2.2;
    } else if (typeof gxRatio === "number") {
      rawX = (gxRatio - 0.5) * 2.6;
    } else {
      rawX = yaw / 25;
    }

    if (typeof normY === "number") {
      rawY = (normY - 0.48) * 2.2;
    } else {
      rawY = -pitch / 20;
    }

    if (dir.includes("Left")) rawX = Math.min(rawX, -0.68);
    if (dir.includes("Right")) rawX = Math.max(rawX, 0.68);
    if (dir.includes("Down")) rawY = Math.max(rawY, 0.68);
    if (dir.includes("Up")) rawY = Math.min(rawY, -0.68);

    const clampedX = Math.max(-1, Math.min(1, rawX));
    const clampedY = Math.max(-1, Math.min(1, rawY));
    const mag = Math.hypot(clampedX, clampedY);
    const scale = mag > 1 ? 1 / mag : 1;

    const finalDx = Number((clampedX * scale * 3.5).toFixed(2));
    const finalDy = Number((clampedY * scale * 1.7).toFixed(2));

    const blinkVal = Number(
      telemetry.action_units?.AU45_blink_closure ?? 0
    );

    return {
      dx: eyeState === "critical" ? 0 : finalDx,
      dy: eyeState === "critical" ? 0 : finalDy,
      isBlinking: blinkVal > 0.55,
    };
  }, [telemetry, eyeState]);

  const strokeColor =
    eyeState === "critical"
      ? "#fb7185" // Rose-400
      : eyeState === "warning"
      ? "#fbbf24" // Amber-400
      : "#34d399"; // Emerald-400

  const glowFilter =
    eyeState === "critical"
      ? "drop-shadow(0 0 6px rgba(244, 63, 94, 0.85))"
      : eyeState === "warning"
      ? "drop-shadow(0 0 5px rgba(245, 158, 11, 0.75))"
      : "drop-shadow(0 0 5px rgba(52, 211, 153, 0.75))";

  return (
    <span className="relative inline-flex items-center justify-center w-5 h-5 shrink-0">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5 overflow-visible"
        style={{ filter: glowFilter }}
      >
        {/* Outer Icon Eye Contour */}
        <path
          d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transformOrigin: "12px 12px",
            transform: isBlinking ? "scaleY(0.18)" : "scaleY(1)",
            transition: "transform 0.16s ease-out, stroke 0.3s ease",
          }}
        />

        {/* Moving Iris & Pupil Group */}
        <g
          style={{
            transform: `translate3d(${dx}px, ${dy}px, 0) scale(${
              eyeState === "critical" ? 0.78 : isBlinking ? 0.2 : 1
            })`,
            transformOrigin: "12px 12px",
            transition:
              "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease",
            willChange: "transform",
            opacity: eyeState === "critical" ? 0.45 : 1,
          }}
        >
          <circle
            cx="12"
            cy="12"
            r="3.2"
            stroke={strokeColor}
            strokeWidth="1.8"
            fill="rgba(15, 23, 42, 0.55)"
          />
          <circle cx="12" cy="12" r="1.35" fill={strokeColor} />
          <circle cx="11.1" cy="11.1" r="0.55" fill="#ffffff" />
        </g>

        {/* Animated Strike-Through Line on Critical (Red) State */}
        <line
          x1="3"
          y1="3"
          x2="21"
          y2="21"
          stroke="#0f172a"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeDasharray="26"
          strokeDashoffset={eyeState === "critical" ? "0" : "26"}
          style={{
            transition:
              "stroke-dashoffset 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: eyeState === "critical" ? 0.9 : 0,
          }}
        />
        <line
          x1="3"
          y1="3"
          x2="21"
          y2="21"
          stroke="#fb7185"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="26"
          strokeDashoffset={eyeState === "critical" ? "0" : "26"}
          style={{
            transition:
              "stroke-dashoffset 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: eyeState === "critical" ? 1 : 0,
          }}
        />
      </svg>
    </span>
  );
};

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

  const assignmentId =
    id ||
    passedExam?.assignment_id ||
    passedExam?.id ||
    passedExam?.quiz_id ||
    examMeta?.id ||
    examMeta?.assignment_id ||
    null;

  // Turn states
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentTurnIndex, setCurrentTurnIndex] = useState(1);
  const [currentDifficulty, setCurrentDifficulty] = useState(0.5);
  const [answerText, setAnswerTextState] = useState("");
  const answerTextRef = useRef("");
  const baseTextRef = useRef("");
  const activeTranscriptRef = useRef("");
  const isSpeechSessionActiveRef = useRef(false);

  const setAnswerText = useCallback((textOrUpdater) => {
    setAnswerTextState((prev) => {
      const next = typeof textOrUpdater === "function" ? textOrUpdater(prev) : textOrUpdater;
      answerTextRef.current = next || "";
      return next;
    });
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback & Progression
  const [lastFeedback, setLastFeedback] = useState("");
  const [lastMastery, setLastMastery] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [isPassed, setIsPassed] = useState(true);
  const [completionReason, setCompletionReason] = useState("");
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timers
  const [remainingSeconds, setRemainingSeconds] = useState(examDurationMinutes * 60);

  // Microphone and Recording state
  const [voiceLang, setVoiceLang] = useState(() => localStorage.getItem("voice_lang") || "fa");

  // Full-Screen Video Call Webcam state
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Student identifiers for biometrics telemetry & verification
  const candidateIds = useMemo(() => {
    return biometricsApi.getCandidateBiometricIds(currentUser);
  }, [currentUser]);

  const studentId = candidateIds[0] || currentUser?.user_id || currentUser?.username || "";

  // Biometrics & Distraction Proctoring State
  const [distractionCount, setDistractionCount] = useState(0);
  const lastDistractionLogTimeRef = useRef(0);

  // 3-Strike Proctoring Violation & Incident Documentation State
  const [strikesCount, setStrikesCount] = useState(0);
  const strikesCountRef = useRef(0);
  useEffect(() => {
    strikesCountRef.current = strikesCount;
  }, [strikesCount]);

  const [activeStrikeModal, setActiveStrikeModal] = useState(null);
  const [incidentsList, setIncidentsList] = useState([]);
  const [isEjected, setIsEjected] = useState(false);
  const isEjectedRef = useRef(false);
  useEffect(() => {
    isEjectedRef.current = isEjected;
  }, [isEjected]);

  const strikeCooldownUntilRef = useRef(0);
  const handleFinishExamRef = useRef(null);

  // Consecutive counters for debouncing transient movements (in seconds)
  const noFaceDurationRef = useRef(0);
  const gazeAwayDurationRef = useRef(0);
  const multipleFacesDurationRef = useRef(0);

  const playWarningBeep = useCallback((isCritical = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCritical ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(isCritical ? 880 : 587, ctx.currentTime);
      if (isCritical) {
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      }
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isCritical ? 0.6 : 0.35));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isCritical ? 0.6 : 0.35));
    } catch {}
  }, []);

  // Pre-exam Face Identity Verification Gate
  const containerRef = useRef(null);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [isVerifyingIdentity, setIsVerifyingIdentity] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [periodicAlert, setPeriodicAlert] = useState("");

  // Face Tracking & Verification State
  const [faceBox, setFaceBox] = useState(null);
  const [faceStatus, setFaceStatus] = useState("no_face");
  const [scanProgress, setScanProgress] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState({
    sharpness: 85,
    brightness: 82,
    confidence: 0,
    stability: 0,
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const consecutiveQualityFramesRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const offscreenCanvasRef = useRef(null);

  const faceStatusRef = useRef(faceStatus);
  const faceBoxRef = useRef(faceBox);
  useEffect(() => {
    faceStatusRef.current = faceStatus;
  }, [faceStatus]);
  useEffect(() => {
    faceBoxRef.current = faceBox;
  }, [faceBox]);

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
    setScanProgress(15);

    let scanVal = 15;
    const scanInterval = setInterval(() => {
      scanVal = Math.min(90, scanVal + Math.floor(Math.random() * 8) + 6);
      setScanProgress(scanVal);
    }, 120);

    try {
      const blob = await captureExamFrameBlob(0.92, 960);
      if (!blob) {
        clearInterval(scanInterval);
        setVerificationError("دوربین هنوز آماده دریافت تصویر نیست. لطفاً چند لحظه صبر کنید.");
        cooldownUntilRef.current = Date.now() + 2500;
        setIsScanning(false);
        setIsVerifyingIdentity(false);
        setScanProgress(0);
        return;
      }

      let isMatch = false;
      let isSpoof = false;
      let isNotEnrolled = false;
      let isFaceNotDetected = false;
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
          }
        } catch (err) {
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
            isFaceNotDetected = true;
            break;
          }
          if (msg.includes("not enrolled") || String(err?.status).includes("404")) {
            isNotEnrolled = true;
            continue;
          }
        }
      }

      clearInterval(scanInterval);

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
        setTimeout(() => {
          setIsIdentityVerified(true);
        }, 1200);
      } else if (isSpoof) {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        setScanProgress(0);
        const spoofMsg = isRTL
          ? "🚫 هشدار امنیتی: تلاش برای جعل هویت با عکس / نمایشگر شناسایی شد (Spoof Detected)"
          : "🚫 Security Alert: Photo / Screen Presentation Attack Detected";
        setVerificationError(spoofMsg);
        setVerificationResult({
          verdict: "spoof",
          title: spoofMsg,
          message: isRTL
            ? "سامانه ضدجعل MiniFASNet تشخیص داد که تصویر ارائهشده یک عکس چاپی یا صفحه نمایشگر دیجیتال است. لطفاً چهره زنده و واقعی خود را روبهروی دوربین قرار دهید."
            : "Presentation attack detected. Digital screens, printouts, or static photos are prohibited.",
          liveness: isRTL ? "رد شد (Spoof / 2D Presentation Attack)" : "Failed (Spoof Attack)",
          confidence: 14,
          distance: 0.94,
          statusText: isRTL ? "دسترسی غیرمجاز (حمله تقلبی)" : "Access Denied (Spoof)",
        });
        cooldownUntilRef.current = Date.now() + 3500;
        consecutiveQualityFramesRef.current = 0;
      } else if (isFaceNotDetected) {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        setScanProgress(0);
        const faceMsg = isRTL
          ? "چهره در کادر تصویر واضح نیست. لطفاً مستقیماً روبهروی دوربین قرار گیرید."
          : "Face not clearly visible. Please look directly at the camera.";
        setVerificationError(faceMsg);
        cooldownUntilRef.current = Date.now() + 2500;
        consecutiveQualityFramesRef.current = 0;
      } else if (isNotEnrolled) {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        setScanProgress(0);
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
      } else {
        setIsVerifiedSuccess(false);
        setIsScanning(false);
        setScanProgress(0);
        const mismatchMsg = isRTL
          ? "عدم تطابق چهره با الگوی ثبتشده در سامانه. لطفاً روبهروی دوربین قرار بگیرید."
          : "Face does not match registered biometric template.";
        setVerificationError(mismatchMsg);
        setVerificationResult({
          verdict: "mismatch",
          title: isRTL ? "❌ عدم تطابق چهره دانشجو (Mismatch)" : "❌ Face Mismatch (Access Denied)",
          message: isRTL
            ? "تصویر شما زنده تشخیص داده شد، اما با الگوی چهره ثبتشده برای این حساب همخوانی ندارد. لطفاً زاویه و نور را تنظیم و دوباره امتحان کنید."
            : "Face is live but does not match enrolled student vector.",
          liveness: isRTL ? "زنده (Genuine)" : "Genuine",
          confidence: 38,
          distance: verifyResponse?.cosine_distance || 0.76,
          statusText: isRTL ? "عدم انطباق با پروفایل" : "Mismatch",
        });
        cooldownUntilRef.current = Date.now() + 3000;
        consecutiveQualityFramesRef.current = 0;
      }
    } catch (err) {
      clearInterval(scanInterval);
      console.warn("Identity verification error:", err);
      setIsVerifiedSuccess(false);
      setIsScanning(false);
      setScanProgress(0);
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
    } finally {
      setIsVerifyingIdentity(false);
    }
  }, [captureExamFrameBlob, candidateIds, studentId, isVerifyingIdentity, isVerifiedSuccess, isRTL]);

  // Continuous Face Tracking & Centering Loop
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
          const mirroredNormX = 1.0 - (faceResult.normX + faceResult.normW);
          const detectedBox = {
            x: offsetX + mirroredNormX * renderedW,
            y: offsetY + faceResult.normY * renderedH,
            w: faceResult.normW * renderedW,
            h: faceResult.normH * renderedH,
          };

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
        } else if (isMounted) {
          noFaceCounter++;
          if (noFaceCounter >= 8) {
            setFaceBox(null);
            setFaceStatus("no_face");
            consecutiveQualityFramesRef.current = Math.max(0, consecutiveQualityFramesRef.current - 1);
            if (!isVerifyingIdentity) {
              setScanProgress(0);
            }
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
  }, [isIdentityVerified, isCompleted, loading, cameraError, isVerifiedSuccess, isRTL, isVerifyingIdentity]);

  const isLockedOnFace = (faceStatus === "face_locked" && faceBox) || isVerifiedSuccess;
  const bracketSize = 56;
  const cw = containerRef.current?.clientWidth || 360;
  const ch = containerRef.current?.clientHeight || 640;

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

  // 3-Strike Proctoring Violation Dispatcher
  const triggerProctorViolation = useCallback(
    async (violationType, violationDetails = {}) => {
      if (isCompleted || isEjectedRef.current) return;
      const now = Date.now();
      if (now < strikeCooldownUntilRef.current) {
        return;
      }
      // Apply 6.5s grace period between strikes to allow student to re-align
      strikeCooldownUntilRef.current = now + 6500;

      const currentStrikes = strikesCountRef.current;
      const newStrike = Math.min(3, currentStrikes + 1);
      setStrikesCount(newStrike);

      // Play alert tone
      playWarningBeep(newStrike >= 2);

      // 1. Capture snapshot immediately at moment of violation
      const blob = await captureExamFrameBlob(0.88, 640);
      const localPreviewUrl = blob ? URL.createObjectURL(blob) : null;

      let title = "";
      let reasonText = "";
      if (violationType === "multiple_faces") {
        title = isRTL ? "حضور بیش از یک نفر در کادر دوربین" : "Multiple Faces in Camera Frame";
        reasonText = isRTL
          ? "سیستم هوشمند آزمون حضور بیش از یک نفر را در کادر تصویر تشخیص داد. آزمون باید منحصراً و به صورت فردی توسط شما انجام شود."
          : "Multiple people detected in frame. The exam must be taken strictly alone.";
      } else if (violationType === "no_face") {
        title = isRTL ? "عدم حضور چهره در کادر دوربین" : "No Face Detected in Frame";
        reasonText = isRTL
          ? "چهره شما در برابر دوربین مشاهده نشد. لطفاً مستقیماً در برابر وبکم قرار بگیرید تا تصویر شما به درستی ثبت شود."
          : "Your face is not visible to the camera. Please stay centered in frame.";
      } else if (violationType === "gaze_out_of_bounds") {
        title = isRTL ? "انحراف مکرر دید / نگاه به خارج از کادر" : "Looking Away from Exam Screen";
        reasonText = isRTL
          ? "نگاه شما مکرراً به خارج از صفحه آزمون یا به سمت پایین منحرف شده است. لطفاً تمام توجه خود را به سوالات معطوف کنید."
          : "Your gaze was repeatedly directed away from the screen. Please look directly at the exam.";
      } else if (violationType === "face_mismatch") {
        title = isRTL ? "عدم تطابق هویت با چهره ثبت‌شده" : "Identity Verification Mismatch";
        reasonText = isRTL
          ? "چهره حاضر در برابر دوربین با هویت و الگوی بیومتریک احراز شده دانشجو مطابقت ندارد."
          : "The person in front of the camera does not match the enrolled student identity.";
      }

      const incidentEntry = {
        strikeNumber: newStrike,
        violationType,
        title,
        reasonText,
        snapshotUrl: localPreviewUrl,
        timestamp: new Date().toLocaleTimeString(isRTL ? "fa-IR" : "en-US"),
        details: violationDetails,
      };

      setIncidentsList((prev) => [...prev, incidentEntry]);

      // Upload snapshot and incident to backend
      const resolvedSessionId = sessionId || id;
      if (resolvedSessionId && studentId) {
        biometricsApi
          .reportExamIncident(resolvedSessionId, studentId, violationType, newStrike, blob, {
            ...violationDetails,
            assignment_id: assignmentId || examMeta?.id || null,
            title,
            reasonText,
          })
          .then((res) => {
            if (res?.image_url) {
              incidentEntry.serverImageUrl = res.image_url;
            }
          })
          .catch((err) => console.warn("Incident upload warning:", err));
      }

      // Display active strike modal
      setActiveStrikeModal({
        isOpen: true,
        strikeNumber: newStrike,
        violationType,
        title,
        reasonText,
        snapshotUrl: localPreviewUrl,
      });

      // Strike 3: Eject and Terminate
      if (newStrike >= 3) {
        setIsEjected(true);
        setTimeout(() => {
          if (handleFinishExamRef.current) {
            handleFinishExamRef.current("ejected_violations");
          }
        }, 4000);
      }
    },
    [
      isCompleted,
      playWarningBeep,
      captureExamFrameBlob,
      sessionId,
      id,
      studentId,
      assignmentId,
      examMeta?.id,
      isRTL,
    ]
  );

  // 2. Real-time Telemetry & Fast Multi-Violation Proctoring
  const handleTelemetryUpdate = useCallback(
    (data) => {
      if (!data || isCompleted || isEjectedRef.current) return;
      const isFocused = data.is_focused ?? (data.attention_score >= 45);
      const attention = data.attention_score ?? 100;
      const gazeDir = String(data.gaze_direction || "Direct");
      const faceDetected = data.face_detected !== false;
      const hasMultipleFaces = Boolean(data.multiple_faces || (data.face_count && data.face_count > 1));

      // A. Check Multiple Faces Violation (>= 2 consecutive ticks)
      if (hasMultipleFaces) {
        multipleFacesDurationRef.current += 1;
        if (multipleFacesDurationRef.current >= 2) {
          multipleFacesDurationRef.current = 0;
          triggerProctorViolation("multiple_faces", {
            face_count: data.face_count || 2,
          });
        }
      } else {
        multipleFacesDurationRef.current = 0;
      }

      // B. Check Absence of Face Violation (>= 3 consecutive ticks)
      if (!faceDetected) {
        noFaceDurationRef.current += 1;
        if (noFaceDurationRef.current >= 3) {
          noFaceDurationRef.current = 0;
          triggerProctorViolation("no_face", {
            status: data.status || "Face Not Detected",
          });
        }
      } else {
        noFaceDurationRef.current = 0;
      }

      // C. Check Gaze Out of Bounds / Looking Away (>= 3 consecutive ticks)
      const isLookingAway =
        faceDetected &&
        !hasMultipleFaces &&
        (attention < 40 ||
          gazeDir === "Out of Frame" ||
          gazeDir.includes("Away") ||
          (gazeDir === "Looking Down" && attention < 45) ||
          (!isFocused && attention < 45));

      if (isLookingAway) {
        gazeAwayDurationRef.current += 1;
        if (gazeAwayDurationRef.current >= 3) {
          gazeAwayDurationRef.current = 0;
          triggerProctorViolation("gaze_out_of_bounds", {
            attention_score: attention,
            gaze_direction: gazeDir,
            yaw: data.yaw,
            pitch: data.pitch,
          });
        }

        const now = Date.now();
        if (now - lastDistractionLogTimeRef.current > 4000) {
          lastDistractionLogTimeRef.current = now;
          setDistractionCount((prev) => prev + 1);
          biometricsApi
            .logExamDistraction(sessionId || id, studentId, {
              attention_score: attention,
              gaze_direction: gazeDir,
              dominant_emotion: data.dominant_emotion || "neutral",
              stress_score: data.stress_score || 0,
            })
            .catch((e) => console.warn("Distraction log error:", e));
        }
      } else {
        gazeAwayDurationRef.current = 0;
      }
    },
    [isCompleted, triggerProctorViolation, sessionId, id, studentId]
  );

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

  // 3-State Live Eye Status
  const eyeState = useMemo(() => {
    if (!biometricTelemetry) {
      return "good";
    }
    const faceDetected = biometricTelemetry.face_detected !== false;
    const hasMultipleFaces = Boolean(biometricTelemetry.multiple_faces || (biometricTelemetry.face_count && biometricTelemetry.face_count > 1));
    const attentionScore = Number(biometricTelemetry.attention_score ?? 100);
    const gazeDir = String(biometricTelemetry.gaze_direction || "Direct");

    if (!faceDetected || hasMultipleFaces) {
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

  // 3. Periodic Random Background Face Re-verification
  useEffect(() => {
    if (!isIdentityVerified || isCompleted || loading || error) return;

    let timeoutId = null;

    const scheduleNextCheck = () => {
      const randomDelay = Math.floor(Math.random() * (150000 - 90000 + 1)) + 90000;
      timeoutId = setTimeout(async () => {
        try {
          const blob = await captureExamFrameBlob(0.85, 480, 360);
          if (blob) {
            const res = await biometricsApi.verifyStudentFace(studentId, blob, "balanced");
            if (res && res.verified === false) {
              setPeriodicAlert("هشدار امنیتی: عدم تطابق چهره مقابل دوربین با هویت ثبتشده دانشجو!");
              triggerProctorViolation("face_mismatch", {
                cosine_distance: res.cosine_distance,
                threshold: res.threshold,
              });
              setTimeout(() => setPeriodicAlert(""), 6000);
            }
          }
        } catch (e) {
          console.warn("Periodic identity check error:", e);
          const msg = e?.message || "";
          if (msg.includes("بیش از یک چهره") || msg.includes("تنها یک چهره")) {
            triggerProctorViolation("multiple_faces", { error: msg });
          } else if (msg.includes("هیچ چهره‌ای")) {
            triggerProctorViolation("no_face", { error: msg });
          }
        }
        scheduleNextCheck();
      }, randomDelay);
    };

    scheduleNextCheck();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isIdentityVerified, isCompleted, loading, error, captureExamFrameBlob, studentId, triggerProctorViolation]);

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

  const isQuestionRTL = useMemo(() => {
    if (!currentQuestion) return isRTL;
    return detectTextLanguage(currentQuestion) === "fa";
  }, [currentQuestion, isRTL]);

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
      let speechText = text;

      try {
        if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }

        if (!ttsAnalyserRef.current) {
          const analyser = audioCtxRef.current.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.65;
          analyser.connect(audioCtxRef.current.destination);
          ttsAnalyserRef.current = analyser;
        }

        let audioBuffer = ttsBufferCacheRef.current.get(text);

        if (!audioBuffer) {
          setIsBufferingTTS(true);
          setSpokenWordCount(0);

          const courseName =
            examMeta?.course || passedExam?.course || "سیستمهای عامل";
          try {
            speechText = await normalizeTextForTTS(text, courseName);
          } catch (normErr) {
            console.warn("[StudentExamPage] Normalization warning:", normErr);
          }

          const res = await voiceApi.streamTTS(speechText, courseName);
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

          const combined = new Uint8Array(totalBytes);
          let offset = 0;
          for (const c of chunks) {
            combined.set(c, offset);
            offset += c.byteLength;
          }

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

          const remainder = audioPayload.byteLength % 4;
          if (remainder !== 0) {
            audioPayload = audioPayload.subarray(0, audioPayload.byteLength - remainder);
          }

          if (audioPayload.byteLength === 0) {
            throw new Error("No valid PCM payload after header");
          }

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

        const syncLoop = () => {
          if (abortController.signal.aborted || !audioCtxRef.current) return;

          const now = audioCtxRef.current.currentTime;
          const elapsed = now - playStartTime;

          if (elapsed >= 0) {
            const progress = Math.min(1, elapsed / totalDuration);
            const revealed = Math.min(wordsCount, Math.max(1, Math.ceil(progress * wordsCount)));
            setSpokenWordCount(revealed);

            if (ttsAnalyserRef.current && elapsed < totalDuration) {
              ttsAnalyserRef.current.getByteFrequencyData(freqData);
              let sum = 0;
              for (let i = 0; i < freqData.length; i++) {
                sum += freqData[i];
              }
              const avg = sum / (freqData.length || 1);
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

        if ("speechSynthesis" in window) {
          setIsSpeakingQuestion(true);
          setSpokenWordCount(1);
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(speechText || text);
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
    [isQuestionRTL, stopQuestionTTS, answerText, examMeta?.course, passedExam?.course]
  );

  const lastAutoPlayedQuestionRef = useRef(null);

  useEffect(() => {
    if (currentQuestion && !isCompleted && !loading && isIdentityVerified) {
      if (lastAutoPlayedQuestionRef.current !== currentQuestion) {
        lastAutoPlayedQuestionRef.current = currentQuestion;
        setHasFinishedCurrentQuestion(false);
        const courseName =
          examMeta?.course || passedExam?.course || "سیستمهای عامل";
        if (isQuestionRTL) {
          warmupQuestionNormalization(currentQuestion, courseName);
        }
        playQuestionTTS(currentQuestion);
        setVoiceLang(isQuestionRTL ? "fa" : "en");
      }
    }
    return () => {
      stopQuestionTTS();
    };
  }, [currentQuestion, isCompleted, isQuestionRTL, loading, isIdentityVerified, playQuestionTTS, stopQuestionTTS, examMeta?.course, passedExam?.course, isRTL]);

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

  // When speech recognition begins (Auto-VAD detection or manual mic toggle)
  const handleSpeechStarted = useCallback(() => {
    stopQuestionTTS();
    setHasFinishedCurrentQuestion(true);
    setSpokenWordCount(questionWords.length);
    isSpeechSessionActiveRef.current = true;
    // Snapshot current text in answer box as the base text for this utterance
    baseTextRef.current = (answerTextRef.current || "").trim();
    activeTranscriptRef.current = "";
  }, [stopQuestionTTS, questionWords.length]);

  // When speech recognition returns transcription text
  const handleTranscript = useCallback((msg) => {
    if (typeof msg === "string") {
      activeTranscriptRef.current = msg;
      const base = (baseTextRef.current || "").trim();
      const currentSpeech = msg.trim();
      const combined = base
        ? (currentSpeech ? `${base} ${currentSpeech}` : base)
        : currentSpeech;
      setAnswerText(combined);
    }
  }, [setAnswerText]);

  // When speech session ends (silence timeout or user turns mic off)
  const handleSpeechEnded = useCallback(() => {
    isSpeechSessionActiveRef.current = false;
    // Lock in the combined result so any subsequent speech or typing appends to it
    baseTextRef.current = (answerTextRef.current || "").trim();
    activeTranscriptRef.current = "";
  }, []);

  // WebRTC Voice Activity Detection (VAD) & Hands-Free Auto-Activation
  const {
    isAutoVADEnabled,
    toggleAutoVAD,
    recording,
    audioLevel,
    isVoiceActive,
    micStream,
    startManualRecording,
    stopManualRecording,
  } = useWebRtcVAD({
    enabled: isIdentityVerified && !isCompleted,
    voiceLang,
    isBotSpeaking: isBotReading || isSpeakingQuestion || isBufferingTTS,
    onSpeechStarted: handleSpeechStarted,
    onTranscript: handleTranscript,
    onSpeechEnded: handleSpeechEnded,
  });

  const startRecording = useCallback((selectedLang) => {
    if (selectedLang) setVoiceLang(selectedLang);
    handleSpeechStarted();
    startManualRecording();
  }, [handleSpeechStarted, startManualRecording]);

  const stopRecording = useCallback(() => {
    stopManualRecording();
    handleSpeechEnded();
  }, [stopManualRecording, handleSpeechEnded]);

  const handleFinishExam = useCallback(
    async (reason = "completed") => {
      stopRecording();
      if (isCompleted || isFinishing) return;
      setIsFinishing(true);
      setIsCompleted(true);
      setRemainingSeconds(0);
      setCompletionReason(reason);
      setAutoRedirectSeconds(15);

      if (reason === "ejected_violations") {
        setFinalScore(0);
        setIsPassed(false);
        setLastFeedback(
          isRTL
            ? "آزمون شما به دلیل دریافت ۳ اخطار امنیتی متوقف گردید. مستندات ثبت‌شده توسط دوربین برای بررسی نهایی به استاد ارجاع داده شد."
            : "Your exam was terminated due to 3 security violations. Camera evidence has been submitted to the instructor."
        );
      }

      try {
        if (sessionId) {
          const res = await examsApi.completeInterview(sessionId);
          if (res && reason !== "ejected_violations") {
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
        } else if (reason !== "ejected_violations") {
          setFinalScore(lastMastery ?? 85);
          setIsPassed((lastMastery ?? 85) >= 60);
        }
      } catch (err) {
        console.warn("Failed to complete interview on backend:", err);
        if (reason !== "ejected_violations") {
          setFinalScore((prev) => (prev !== null ? prev : lastMastery ?? 85));
        }
      } finally {
        setIsFinishing(false);
      }
    },
    [isCompleted, isFinishing, sessionId, lastMastery, isRTL]
  );

  useEffect(() => {
    handleFinishExamRef.current = handleFinishExam;
  }, [handleFinishExam]);

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

  useEffect(() => {
    let isMounted = true;
    const initExam = async () => {
      setLoading(true);
      setError("");
      try {
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
        const errMsg = err?.data?.detail || err?.message;
        if (
          errMsg &&
          typeof errMsg === "string" &&
          (errMsg.includes("بیومتریک") || errMsg.includes("احراز هویت"))
        ) {
          navigate("/StudentSettings/Biometrics", {
            replace: true,
            state: {
              returnTo: `/StudentExam/${id}`,
              exam: passedExam,
              reason: "biometrics_required",
              message: errMsg,
            },
          });
          return;
        }
        setError(
          errMsg ||
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

  const resetAnswerTurn = useCallback(() => {
    setAnswerText("");
    baseTextRef.current = "";
    activeTranscriptRef.current = "";
    isSpeechSessionActiveRef.current = false;
  }, [setAnswerText]);

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
          resetAnswerTurn();
        }
      } else {
        if (currentTurnIndex >= 3) {
          handleFinishExam("submitted");
        } else {
          setHasFinishedCurrentQuestion(false);
          setCurrentTurnIndex((prev) => prev + 1);
          resetAnswerTurn();
          setCurrentQuestion(
            isRTL
              ? "مفهوم ریسه (Thread) و تفاوت فضای آدرسدهی آن با فرآیند مستقل را شرح دهید."
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
        resetAnswerTurn();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSend = Boolean(answerText.trim() && !isSubmitting);

  return (
    <main
      ref={containerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative w-full md:w-[360px] h-dvh mx-auto overflow-hidden bg-slate-950 text-white flex flex-col select-none shadow-2xl"
    >
      {/* ================= 1. Live Webcam Video Layer ================= */}
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

        {cameraError && (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-950 flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-3 shadow-xl">
              <UserCheck className="w-8 h-8 text-sky-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300 mb-1 font-vazir">
              {isRTL ? "دسترسی به دوربین وبکم الزامی است" : "Webcam access is required"}
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

        <div className="absolute inset-0 bg-slate-950/15 pointer-events-none transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 pointer-events-none" />
      </div>

      {/* ================= 2. Top Bar (Exit Button, Exactly Centered Live Eye & Flip-Down Clock) ================= */}
      <header className="relative z-30 w-full py-2.5 px-3.5 shrink-0 flex items-center justify-between max-w-xl mx-auto min-h-[52px]">
        {/* Hang up / Exit Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            aria-label={isRTL ? "خروج از آزمون" : "Exit Exam"}
            className="w-9 h-9 rounded-full bg-rose-600/85 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-90 transition-all cursor-pointer shrink-0 border border-rose-400/30"
            title={isRTL ? "پایان و خروج از آزمون" : "Exit Exam"}
          >
            <DoorOpen className="w-4 h-4" />
          </button>

          {/* 3-Strike Security Status Pill */}
          {isIdentityVerified && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] font-vazir shadow-sm transition-all duration-300 ${
                strikesCount >= 2
                  ? "bg-rose-950/80 border-rose-500/80 text-rose-300 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  : strikesCount === 1
                  ? "bg-amber-950/70 border-amber-500/60 text-amber-300"
                  : "bg-slate-900/65 border-white/10 text-slate-300"
              }`}
              title={
                strikesCount > 0
                  ? isRTL
                    ? `تعداد اخطارهای ثبت‌شده: ${toPersianDigits(strikesCount)} از ۳`
                    : `Strikes: ${strikesCount}/3`
                  : isRTL
                  ? "امنیت فعال - بدون اخطار"
                  : "Security optimal - 0 strikes"
              }
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((num) => (
                  <span
                    key={num}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      strikesCount >= num
                        ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)] animate-pulse"
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-[10px]">
                {isRTL
                  ? `${toPersianDigits(strikesCount)} از ۳ اخطار`
                  : `${strikesCount}/3 strikes`}
              </span>
            </div>
          )}
        </div>

        {/* Exactly Centered Live Eye on the same horizontal line */}
        {isIdentityVerified && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-300 ${
                eyeState === "critical"
                  ? "bg-rose-950/65 border-rose-500/75 shadow-[0_0_18px_rgba(244,63,94,0.55),inset_0_1px_1px_rgba(255,255,255,0.25)] animate-pulse"
                  : eyeState === "warning"
                  ? "bg-amber-950/45 border-amber-400/55 shadow-[0_0_14px_rgba(245,158,11,0.35),inset_0_1px_1px_rgba(255,255,255,0.22)]"
                  : "bg-white/10 border-emerald-400/35 shadow-[0_4px_14px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.22)]"
              }`}
              title={
                eyeState === "critical"
                  ? isRTL
                    ? "هشدار: چهره در کادر نیست یا نگاه معطوف به آزمون نمیباشد"
                    : "Critical: Face out of frame or looking away"
                  : eyeState === "warning"
                  ? isRTL
                    ? "توجه: نگاه خود را به صفحه متمرکز نمایید"
                    : "Warning: Refocus gaze on exam screen"
                  : isRTL
                  ? "وضعیت مطلوب: تمرکز نگاه تایید شده است"
                  : "Optimal focus"
              }
            >
              <LiveProctoringEye
                telemetry={biometricTelemetry}
                eyeState={eyeState}
              />
            </div>
          </div>
        )}

        {isIdentityVerified ? (
          /* 3D Mechanical Flip-Down Countdown Clock on Right */
          <div className="flex items-center shrink-0">
            <FlipDownClock seconds={remainingSeconds} size="md" usePersianDigits={isRTL} />
          </div>
        ) : (
          /* Apple Face ID Dynamic Circular Island during Pre-Exam Verification */
          <div className="flex flex-col items-center">
            <div className="apple-faceid-flipper relative w-12 h-12 flex items-center justify-center">
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
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    fill="rgba(15, 23, 42, 0.75)"
                    stroke="rgba(255, 255, 255, 0.14)"
                    strokeWidth="2.8"
                    className="backdrop-blur-md"
                  />
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

              {isVerifiedSuccess && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full animate-faceid-back-flip bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 border border-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.95)]">
                  <Check className="w-5 h-5 text-white stroke-[3.5] drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                </div>
              )}
            </div>

            <span className="text-[10px] font-vazir mt-0.5 tracking-tight transition-colors duration-300 drop-shadow">
              {isVerifiedSuccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>تأیید شد</span>
                </span>
              ) : faceStatus === "multiple_faces" ? (
                <span className="text-rose-400 font-bold">بیش از ۱ چهره</span>
              ) : isScanning ? (
                <span className="text-sky-300 font-mono font-bold">
                  {Math.round(scanProgress)}%
                </span>
              ) : faceStatus === "face_locked" ? (
                <span className="text-sky-300 font-bold">آماده تأیید</span>
              ) : (
                <span className="text-white/70">احراز هویت چهره</span>
              )}
            </span>
          </div>
        )}

        {!isIdentityVerified && <div className="w-9 h-9" />}
      </header>

      {/* ================= 4 Face ID Corner Brackets ================= */}
      {!isIdentityVerified && !loading && !cameraError && (
        <div className="absolute inset-0 pointer-events-none z-[15] overflow-hidden">
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

          {isVerifiedSuccess && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-400 animate-shockwave-1 shadow-[0_0_35px_rgba(52,211,153,0.85)]" />
              <div className="w-20 h-20 rounded-full border-2 border-teal-300 animate-shockwave-2 shadow-[0_0_45px_rgba(45,212,191,0.65)]" />
              <div className="relative animate-check-badge w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600/40 via-teal-500/30 to-emerald-400/50 border-2 border-emerald-300 flex items-center justify-center shadow-[0_0_50px_rgba(52,211,153,0.9),inset_0_1.5px_3px_rgba(255,255,255,0.85)] backdrop-blur-md">
                <Check className="w-10 h-10 text-emerald-100 stroke-[3.5] drop-shadow-[0_0_12px_rgba(236,253,245,0.95)]" />
              </div>
            </div>
          )}

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
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none">
          <div className="px-3.5 py-2.5 rounded-2xl bg-rose-600/35 backdrop-blur-xl border border-rose-400/80 text-rose-100 text-xs font-vazir font-bold flex items-center gap-2.5 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 animate-bounce" />
            <span className="leading-snug">{periodicAlert}</span>
          </div>
        </div>
      )}

      {/* ================= 3. Main Body / Exam Stage Container ================= */}
      <section className="relative z-10 w-full flex-1 min-h-0 flex flex-col px-3.5 py-1.5 overflow-y-auto max-w-xl mx-auto">
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
                {isRTL ? "جلسه آزمون شفاهی در حال آمادهسازی است." : "Oral exam room is being initialized."}
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
                {isRTL ? "بازگشت به فهرست آزمونها" : "Return to Exams"}
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
          completionReason === "ejected_violations" ? (
            <div className="m-auto w-full max-w-md rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-rose-500/30 p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-3 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <h2 className="font-vazir font-bold text-lg text-white mb-1">
                {isRTL ? "خاتمه و ابطال آزمون به دلیل تخلف امنیتی" : "Exam Disqualified - Security Violations"}
              </h2>

              <p className="font-vazir text-xs text-rose-300/90 mb-4 leading-relaxed">
                {isRTL
                  ? "سیستم هوشمند نظارت تصویری ۳ اخطار تخلف در این آزمون ثبت کرده است. به دلیل نقض مکرر قوانین، آزمون شما متوقف و با نمره صفر خاتمه یافت."
                  : "The proctoring system recorded 3 security violations. The session has been terminated and disqualified."}
              </p>

              {/* 3 Strikes Evidence Grid */}
              {incidentsList && incidentsList.length > 0 && (
                <div className="w-full bg-slate-950/70 border border-white/10 rounded-2xl p-3 mb-4 text-right">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
                    <span className="font-vazir text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-rose-400" />
                      {isRTL ? "مستندات و تصاویر تخلفات ثبت‌شده:" : "Recorded Violation Snapshots:"}
                    </span>
                    <span className="font-vazir text-[11px] text-rose-400 font-semibold">
                      {isRTL ? `${toPersianDigits(incidentsList.length)} از ۳ اخطار` : `${incidentsList.length}/3 Strikes`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {incidentsList.map((inc, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden bg-black/60 border border-rose-500/30 group"
                      >
                        {inc.snapshotUrl || inc.serverImageUrl ? (
                          <img
                            src={inc.snapshotUrl || inc.serverImageUrl}
                            alt={`Strike ${inc.strikeNumber}`}
                            className="w-full h-20 object-cover"
                          />
                        ) : (
                          <div className="w-full h-20 flex items-center justify-center text-slate-500">
                            <Camera className="w-6 h-6" />
                          </div>
                        )}
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-rose-600/90 text-white font-vazir text-[9px] font-bold shadow">
                          {isRTL ? `اخطار ${toPersianDigits(inc.strikeNumber || idx + 1)}` : `Strike ${inc.strikeNumber || idx + 1}`}
                        </div>
                        <div className="p-1 bg-slate-900/90 text-center">
                          <p className="font-vazir text-[9px] text-slate-300 truncate">
                            {inc.violationType === "multiple_faces"
                              ? (isRTL ? "بیش از ۱ نفر" : "Multiple Faces")
                              : inc.violationType === "no_face"
                              ? (isRTL ? "عدم حضور" : "No Face")
                              : inc.violationType === "gaze_out_of_bounds"
                              ? (isRTL ? "انحراف دید" : "Looking Away")
                              : (isRTL ? "عدم انطباق" : "Mismatch")}
                          </p>
                          <span className="font-mono text-[8px] text-slate-500 block">
                            {inc.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status summary */}
              <div className="w-full bg-slate-950/60 border border-white/10 rounded-2xl p-3.5 mb-4 flex items-center justify-around">
                <div className="flex flex-col items-center">
                  <span className="font-vazir text-[11px] text-slate-400 mb-0.5">
                    {isRTL ? "نمره نهایی" : "Final Score"}
                  </span>
                  <span className={`${isRTL ? "font-vazir" : "font-inter"} text-2xl font-bold text-rose-400`}>
                    {isRTL ? "۰٪" : "0%"}
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="font-vazir text-[11px] text-slate-400 mb-0.5">
                    {isRTL ? "وضعیت نهایی" : "Status"}
                  </span>
                  <span className="font-vazir text-xs font-bold text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isRTL ? "مردود (اخراج امنیتی)" : "Disqualified"}
                  </span>
                </div>
              </div>

              {lastFeedback && (
                <div className="w-full text-right bg-black/40 rounded-xl p-3 mb-4 text-xs font-vazir text-slate-200 border border-white/10">
                  <div className="font-bold mb-1 flex items-center gap-1 text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {isRTL ? "توضیحات و گزارش تخلف:" : "Violation Report:"}
                  </div>
                  <p className="leading-relaxed text-slate-300">{lastFeedback}</p>
                </div>
              )}

              {autoRedirectSeconds !== null && (
                <div className="w-full mb-3 text-center text-xs font-vazir text-slate-400 flex items-center justify-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>
                    {isRTL
                      ? `انتقال به فهرست آزمونها در ${toPersianDigits(autoRedirectSeconds)} ثانیه...`
                      : `Redirecting in ${autoRedirectSeconds}s...`}
                  </span>
                </div>
              )}

              <div className="w-full flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/StudentExams")}
                  className="w-full h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-vazir text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  <DoorOpen className="w-4 h-4" />
                  {isRTL ? "خروج و بازگشت به فهرست آزمونها" : "Return to Exams List"}
                </button>
              </div>
            </div>
          ) : (
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
                ? "ارزیابی چندبُعدی و تطبیقی پاسخهای شما ثبت و نهایی شد."
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
                    ? `انتقال به فهرست آزمونها در ${toPersianDigits(autoRedirectSeconds)} ثانیه...`
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
                {isRTL ? "بازگشت به فهرست آزمونها" : "Return to Exams List"}
              </button>
            </div>
          </div>
        )
        ) : isSubmitting ? (
          /* ================= 4. Thinking-Orbs AI Transition State ================= */
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
                  ? "طراحی و آمادهسازی سوال تطبیقی بعدی متناسب با سطح پاسخ شما"
                  : "Formulating next adaptive question based on your response"}
              </p>
            </div>
          </div>
        ) : !isIdentityVerified ? (
          /* ================= Pre-Exam Apple Face ID Verification Gate ================= */
          <div className="m-auto w-full max-w-[360px] flex flex-col items-center justify-between h-full py-4 z-20 pointer-events-none">
            <div className="flex-1 w-full" />

            <div className="w-full pointer-events-auto liquid-glass-card rounded-3xl p-4 bg-black/65 backdrop-blur-2xl border border-white/20 shadow-2xl flex flex-col items-center text-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
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
                        ? "صورت خود را روبهروی دوربین قرار دهید تا کادر به رنگ آبی روی چهره قفل شود."
                        : "Position your face in front of the camera until framed in blue.")}
                </p>
              )}

              {verificationError && !verificationResult && (
                <div className="w-full p-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-[11px] font-vazir text-right animate-in fade-in duration-200">
                  <span>{verificationError}</span>
                </div>
              )}

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
          /* ================= 5. Active Video Call Stage (Top: Emotions & Question, Center: Clear Face Area, Bottom: Answer & Controls) ================= */
          <div className="w-full flex-1 flex flex-col justify-between items-center py-1 min-h-0">
            {/* Upper Cluster: Volumetric 3-Gauges Dock (Emotions) + Bot Question Box */}
            <div className="w-full flex flex-col items-center gap-2 shrink-0 z-20">
              {/* Dynamic AI Voice Orb (Temporarily commented out per user request) */}
              {/*
              <div className="flex items-center justify-center">
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
                  size={60}
                  voiceLevel={isSpeakingQuestion ? ttsVoiceLevel : recording ? audioLevel : 0}
                />
              </div>
              */}

              {/* Translucent Volumetric 3-Gauges Dock (Emotions) */}
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

              {/* Bot Question Box (Moved higher up directly below gauges) */}
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
                  style={{ borderRadius: "18px" }}
                >
                  <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 shadow-xl flex flex-col gap-2 relative overflow-hidden">
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

                    {/* Centered Word-by-Word Question Text */}
                    <div
                      dir={isQuestionRTL ? "rtl" : "ltr"}
                      className={`text-xs sm:text-sm leading-relaxed text-white font-medium select-text text-center relative z-10 [text-shadow:_0_1px_3px_rgba(0,0,0,0.85)] ${
                        isQuestionRTL ? "font-vazir" : "font-inter"
                      }`}
                    >
                      {isBufferingTTS ? (
                        <div className="flex items-center justify-center gap-2 py-1 text-sky-300/90 animate-pulse text-xs">
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
                              className={`inline-block mx-0.5 transition-all duration-150 ${
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
            </div>

            {/* Clear Center Area: Completely open and transparent so student sees their own face */}
            <div className="flex-1 w-full min-h-[50px] pointer-events-none" />

            {/* Bottom Section: Student Response Field + Controls Row */}
            <div className="w-full max-w-[360px] mx-auto flex flex-col gap-2 shrink-0 z-20 pb-1">
              {!isBotReading && (
                <div
                  key={`student-ans-${currentTurnIndex}`}
                  className="w-full flex flex-col gap-2 chat-bubble-enter-right"
                >
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
                    style={{ borderRadius: "18px" }}
                  >
                    <div className="w-full p-3 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/15 shadow-xl relative overflow-hidden">
                      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

                      <textarea
                        dir={isAnswerRTL ? "rtl" : "ltr"}
                        rows={2}
                        value={answerText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAnswerText(val);
                          if (!isSpeechSessionActiveRef.current) {
                            baseTextRef.current = val.trim();
                          }
                        }}
                        placeholder={
                          isQuestionRTL
                            ? (isAutoVADEnabled ? "پاسخ را بنویسید یا کافیست صحبت کنید..." : "پاسخ را اینجا بنویسید یا با میکروفون صحبت کنید...")
                            : (isAutoVADEnabled ? "Type response or simply speak..." : "Type response here or speak with mic...")
                        }
                        className={`w-full bg-transparent border-0 p-0 text-xs sm:text-sm text-white placeholder-slate-400/75 focus:outline-none resize-none leading-relaxed text-center [text-shadow:_0_1px_3px_rgba(0,0,0,0.85)] relative z-10 ${
                          isAnswerRTL ? "font-vazir" : "font-inter"
                        }`}
                      />
                    </div>
                  </VoiceBeam>

                  {/* Controls Row: Auto-VAD Toggle (Left) + Mic/Orb (Center, White when pressed) + 3D Liquid Glass Plane (Right) */}
                  <div className="w-full flex items-center justify-between px-2">
                    {/* Left: Auto-VAD Voice-Activated Speech Detection Toggle */}
                    <div className="w-[52px] h-[52px] flex items-center justify-center shrink-0">
                      <button
                        type="button"
                        onClick={toggleAutoVAD}
                        className={`group relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 cursor-pointer backdrop-blur-md border ${
                          isAutoVADEnabled
                            ? "bg-white/20 border-white/60 text-white shadow-md shadow-white/20 active:scale-95 hover:bg-white/30"
                            : "bg-white/10 border-white/15 text-slate-400 hover:text-white hover:bg-white/15 active:scale-95"
                        } ${isVoiceActive ? "ring-2 ring-white/80 shadow-lg shadow-white/40" : ""}`}
                        title={
                          isAutoVADEnabled
                            ? (isRTL ? "تشخیص خودکار گفتار فعال است (میکروفون با صحبت شما خودکار روشن می‌شود)" : "Auto Voice-Activation ON (Speak to answer)")
                            : (isRTL ? "فعال‌سازی حالت خودکار گفتار (Hands-Free)" : "Enable Auto Voice-Activation")
                        }
                      >
                        <Sparkles className={`w-4 h-4 transition-transform duration-300 ${isAutoVADEnabled ? "scale-110 text-white" : "opacity-60"}`} />
                        {isAutoVADEnabled && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Center: Morphing Mic -> ThinkingOrb Button (Turns White When Pressed/Recording) */}
                    <div className="flex items-center justify-center">
                      <VoiceMicButton
                        recording={recording}
                        recordingOrbState="listening"
                        orbSize={60}
                        orbColor="#ffffff"
                        voiceLang={voiceLang}
                        onLanguageChange={setVoiceLang}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        disabled={isSubmitting || isCompleted}
                        isRTL={isRTL}
                        className="w-11 h-11 relative shrink-0 flex items-center justify-center"
                        buttonClassName={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 backdrop-blur-md ${
                          recording
                            ? "bg-white/35 text-white border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                            : "bg-white/15 hover:bg-white/25 text-white border border-white/20"
                        }`}
                        badgeClassName="-top-1 -right-1"
                        iconClassName={`!w-4 !h-4 ${recording ? "text-white" : "text-white/90"}`}
                      />
                    </div>

                    {/* Right: Real-time WebGL 3D Liquid Glass Paper Airplane */}
                    <LiquidGlassPaperPlane
                      disabled={!answerText.trim() || isSubmitting}
                      loading={isSubmitting}
                      onClick={handleSubmitAnswer}
                      isRTL={isRTL}
                      size={52}
                      title={isRTL ? "ارسال پاسخ و سوال بعد" : "Submit answer & next"}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ================= 5.5 Active Strike Warning Modal ================= */}
      {activeStrikeModal && activeStrikeModal.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-[380px] rounded-3xl bg-slate-900/95 border ${
              activeStrikeModal.strikeNumber >= 3
                ? "border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.4)]"
                : activeStrikeModal.strikeNumber === 2
                ? "border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.35)]"
                : "border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.3)]"
            } p-5 text-center space-y-3.5 animate-in zoom-in-95 duration-200`}
          >
            {/* Strike indicator badge & Icon */}
            <div className="flex flex-col items-center">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mb-2.5 shadow-lg ${
                  activeStrikeModal.strikeNumber >= 3
                    ? "bg-rose-500/20 border-2 border-rose-500 text-rose-400 shadow-rose-500/30 animate-pulse"
                    : activeStrikeModal.strikeNumber === 2
                    ? "bg-orange-500/20 border-2 border-orange-500 text-orange-400 shadow-orange-500/30"
                    : "bg-amber-400/20 border-2 border-amber-400 text-amber-300 shadow-amber-400/20"
                }`}
              >
                {activeStrikeModal.violationType === "multiple_faces" ? (
                  <Users className="w-7 h-7" />
                ) : activeStrikeModal.violationType === "no_face" ? (
                  <UserX className="w-7 h-7" />
                ) : activeStrikeModal.violationType === "gaze_out_of_bounds" ? (
                  <EyeOff className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-vazir font-bold tracking-tight shadow-md ${
                  activeStrikeModal.strikeNumber >= 3
                    ? "bg-rose-600 text-white"
                    : activeStrikeModal.strikeNumber === 2
                    ? "bg-orange-600 text-white"
                    : "bg-amber-500 text-slate-950"
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>
                  {isRTL
                    ? activeStrikeModal.strikeNumber === 1
                      ? "اخطار اول (۱ از ۳)"
                      : activeStrikeModal.strikeNumber === 2
                      ? "اخطار دوم (۲ از ۳) - هشدار جدی"
                      : "اخطار سوم (۳ از ۳) - خاتمه آزمون"
                    : `Strike ${activeStrikeModal.strikeNumber} of 3`}
                </span>
              </div>
            </div>

            {/* Violation Title & Description */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-vazir">
                {activeStrikeModal.title}
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed font-vazir">
                {activeStrikeModal.reasonText}
              </p>
            </div>

            {/* Captured Evidence Snapshot */}
            {activeStrikeModal.snapshotUrl && (
              <div className="w-full bg-slate-950/80 border border-white/10 rounded-2xl p-2 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="font-vazir text-[10px] text-slate-400 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-sky-400" />
                    {isRTL ? "تصویر ثبت‌شده در لحظه تخلف (مستندات آزمون)" : "Recorded Violation Snapshot"}
                  </span>
                  <span className="font-mono text-[9px] text-rose-400 font-bold">
                    REC ●
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black max-h-40 flex items-center justify-center">
                  <img
                    src={activeStrikeModal.snapshotUrl}
                    alt="Violation Evidence Snapshot"
                    className="w-full h-auto max-h-40 object-cover"
                  />
                  <div className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-black/75 text-[9px] font-vazir text-slate-300 backdrop-blur-xs">
                    {isRTL ? "مستند تخلف ارسال‌شده برای استاد" : "Reported to instructor"}
                  </div>
                </div>
              </div>
            )}

            {/* Warning rule note */}
            <div
              className={`rounded-xl p-2.5 text-right text-[11px] font-vazir leading-relaxed border ${
                activeStrikeModal.strikeNumber >= 3
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-200/90"
              }`}
            >
              {activeStrikeModal.strikeNumber >= 3 ? (
                <p>
                  {isRTL
                    ? "به علت دریافت ۳ اخطار پیاپی، آزمون شما متوقف شده و با نمره صفر پایان یافت. تصاویر و لاگ تخلفات برای بررسی استاد ارسال گردید."
                    : "Due to 3 strikes, your exam has been terminated. The incident evidence was sent to the instructor."}
                </p>
              ) : (
                <p>
                  {isRTL
                    ? `قانون نظارت هوشمند: در صورت دریافت ۳ اخطار، جلسه بلافاصله قطع شده و نمره صفر لحاظ می‌گردد. (شما تاکنون ${toPersianDigits(
                        activeStrikeModal.strikeNumber
                      )} اخطار دریافت کرده‌اید)`
                    : `Proctoring Policy: 3 strikes will immediately disqualify the exam. You have received ${activeStrikeModal.strikeNumber} strike(s).`}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-1">
              {activeStrikeModal.strikeNumber >= 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStrikeModal(null);
                    handleFinishExam("ejected_violations");
                  }}
                  className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-600/30 font-vazir flex items-center justify-center gap-1.5"
                >
                  <DoorOpen className="w-4 h-4" />
                  {isRTL ? "خروج از آزمون و ثبت مستندات" : "Exit Exam"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveStrikeModal(null)}
                  className="w-full h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-sky-600/30 font-vazir"
                >
                  {isRTL ? "متوجه شدم و بازگشت به آزمون" : "Understood, Return to Exam"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                  ? "آیا مطمئن هستید که میخواهید جلسه آزمون را پایان دهید؟ پاسخهای ارسال شده تا این لحظه ذخیره میشوند."
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
