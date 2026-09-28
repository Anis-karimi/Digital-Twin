import { useEffect, useRef, useState, useCallback, useContext } from "react";
import {
  Camera,
  CameraOff,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import { toPersianDigits } from "@/utils/dateUtils";

/**
 * ExamProctoringCamera
 * 
 * Features:
 * 1. Automatic front-facing webcam streaming with mirror display.
 * 2. Visual face positioning guide to assist students in centering their face.
 * 3. Collapsible UI (expand/minimize) to preserve screen real estate on mobile devices.
 * 4. Ultra-optimized WebSocket architecture (Standby mode):
 *    - Offscreen Canvas frame capture downsampled to 320x240 (JPEG 0.65 quality).
 *    - Low frame rate (0.5 FPS = 1 frame every 2 seconds) to avoid CPU/network congestion.
 *    - Page Visibility listener to pause transmission when tab is inactive.
 * 5. Full media track teardown on component unmount.
 */
export const ExamProctoringCamera = ({
  sessionId,
  enableWs = false,
  wsEndpoint = null,
  onFaceStatusChange,
  className = "",
}) => {
  const { isRTL } = useContext(AppContext);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  const canvasRef = useRef(null);
  const frameIntervalRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRequesting, setIsRequesting] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [faceVerified, setFaceVerified] = useState(true); // Default true until model flags absence

  // 1. Initialize Camera Stream
  const startCamera = useCallback(async () => {
    setIsRequesting(true);
    setCameraError("");

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(
          isRTL
            ? "مرورگر شما از وب‌کم پشتیبانی نمی‌کند یا اتصال امن (HTTPS) نیاز است."
            : "Browser does not support camera or HTTPS is required."
        );
      }

      // Request front-facing camera with optimized resolution to save power
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 20 },
        },
        audio: false, // Audio is managed separately by speech-to-text
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("[ProctoringCamera] Auto-play warning:", playErr);
        }
      }

      setIsCameraActive(true);
      setIsRequesting(false);
    } catch (err) {
      console.error("[ProctoringCamera] Camera access failed:", err);
      setIsRequesting(false);
      setIsCameraActive(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError(
          isRTL
            ? "دسترسی به دوربین مسدود شده است. لطفاً برای تأیید حضور در آزمون، دسترسی وب‌کم را در بالای مرورگر فعال کنید."
            : "Camera permission denied. Please grant webcam access to verify attendance."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError(
          isRTL
            ? "هیچ دوربینی بر روی دستگاه شما پیدا نشد."
            : "No camera device found on this system."
        );
      } else {
        setCameraError(
          err.message ||
            (isRTL
              ? "امکان راه‌اندازی دوربین وجود ندارد."
              : "Unable to start camera preview.")
        );
      }
    }
  }, [isRTL]);

  // Stop Camera Tracks
  const stopCamera = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "close_session", session_id: sessionId }));
          wsRef.current.close();
        }
      } catch (e) {
        // Ignore WS close errors
      }
      wsRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("[ProctoringCamera] Error stopping track:", e);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, [sessionId]);

  // 2. High-Performance WebSocket Frame Streaming (Standby Ready)
  const setupWebSocketAndStreaming = useCallback(() => {
    // If not enabled or no endpoint provided, remain in clean preview standby mode
    if (!enableWs || !wsEndpoint) {
      return;
    }

    try {
      console.log("[ProctoringCamera WS] Initializing socket connection:", wsEndpoint);
      const ws = new WebSocket(wsEndpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ProctoringCamera WS] Connected to face verification service");
        ws.send(
          JSON.stringify({
            event: "init_proctoring",
            session_id: sessionId,
            timestamp: Date.now(),
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.face_detected !== undefined) {
            setFaceVerified(Boolean(payload.face_detected));
            if (onFaceStatusChange) {
              onFaceStatusChange(payload);
            }
          }
        } catch (parseErr) {
          console.warn("[ProctoringCamera WS] Non-JSON response:", event.data);
        }
      };

      ws.onerror = (err) => {
        console.warn("[ProctoringCamera WS] Socket error:", err);
      };

      ws.onclose = () => {
        console.log("[ProctoringCamera WS] Socket closed");
      };

      // Create offscreen canvas for downsampled frame extraction
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
        canvasRef.current.width = 320;
        canvasRef.current.height = 240;
      }

      // Throttled frame transmission: 1 frame every 2 seconds (0.5 FPS)
      frameIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        // Pause streaming when tab is in background
        if (document.visibilityState !== "visible") {
          return;
        }

        try {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          // Highly compressed JPEG (0.65 quality -> ~10-15KB per frame)
          const base64Data = canvas.toDataURL("image/jpeg", 0.65);

          wsRef.current.send(
            JSON.stringify({
              event: "face_frame",
              session_id: sessionId,
              timestamp: Date.now(),
              image: base64Data,
            })
          );
        } catch (drawErr) {
          console.warn("[ProctoringCamera] Frame capture error:", drawErr);
        }
      }, 2000);
    } catch (wsInitErr) {
      console.warn("[ProctoringCamera] WS setup error:", wsInitErr);
    }
  }, [enableWs, wsEndpoint, sessionId, onFaceStatusChange]);

  // Initial mount: Start camera and streaming
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Setup WS when camera becomes active
  useEffect(() => {
    if (isCameraActive) {
      setupWebSocketAndStreaming();
    }
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [isCameraActive, setupWebSocketAndStreaming]);

  // Connect video element to stream if re-rendered
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCollapsed, isCameraActive]);

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full transition-all duration-300 ${className}`}
    >
      {cameraError ? (
        /* Camera Error State */
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs font-vazir text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={startCamera}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-medium hover:bg-amber-700 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isRTL ? "تلاش مجدد برای دوربین" : "Retry Camera"}</span>
            </button>
          </div>
        </div>
      ) : isCollapsed ? (
        /* Collapsed / Compact Mini-Bar View */
        <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-xl px-3 py-2 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-emerald-500 shadow-2xs bg-black">
              {/* Keep video rendered in DOM so stream stays active */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
            </div>

            <div className="flex flex-col">
              <span className="font-vazir font-semibold text-xs text-neutral-scale1600 dark:text-neutral-scale100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {isRTL ? "دوربین تأیید هویت فعال است" : "Proctoring Camera Active"}
              </span>
              <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                {isRTL ? "حضور شما در آزمون احراز گردید" : "Attendance presence monitored"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label={isRTL ? "بزرگ‌نمایی کادر تصویر" : "Expand preview"}
            className="p-1 rounded-lg hover:bg-neutral-scale200 dark:hover:bg-neutral-scale1000 text-neutral-scale1100 dark:text-neutral-scale300 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-vazir"
          >
            <span>{isRTL ? "نمایش" : "View"}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* Expanded Camera Preview View */
        <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl p-2.5 shadow-sm flex flex-col gap-2">
          {/* Header Row */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-vazir font-semibold text-xs text-neutral-scale1600 dark:text-neutral-scale100">
                {isRTL ? "تصویر احراز حضور در آزمون" : "Exam Presence Verification"}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-vazir font-medium flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>{isRTL ? "تأیید حضور" : "Present"}</span>
              </span>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title={isRTL ? "کوچک‌سازی پیش‌نمایش" : "Minimize"}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-neutral-scale200 dark:hover:bg-neutral-scale1100 text-neutral-scale1100 dark:text-neutral-scale300 transition-all cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video Viewport */}
          <div className="relative w-full h-[135px] rounded-xl overflow-hidden bg-neutral-900 border border-neutral-scale200 dark:border-neutral-scale1000 flex items-center justify-center">
            {isRequesting ? (
              <div className="flex flex-col items-center gap-2 text-white/80 font-vazir text-xs">
                <RefreshCw className="w-5 h-5 animate-spin text-primery-400" />
                <span>{isRTL ? "در حال اتصال به دوربین..." : "Starting camera..."}</span>
              </div>
            ) : (
              <>
                {/* Mirrored Camera Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Aesthetic Face Alignment Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-28 border border-white/35 rounded-[50%] ring-1 ring-white/15 animate-pulse flex items-center justify-center">
                    <span className="text-[9px] font-vazir text-white/60 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                      {isRTL ? "محل چهره" : "Face"}
                    </span>
                  </div>
                </div>

                {/* Subtitle Badge */}
                <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] font-vazir text-white/90 bg-black/55 backdrop-blur-xs px-2 py-0.5 rounded-md">
                    {isRTL ? "تصویر شما به صورت زنده نمایش داده می‌شود" : "Live front view"}
                  </span>
                  <span className="text-[10px] font-vazir text-emerald-400 bg-black/55 backdrop-blur-xs px-1.5 py-0.5 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    LIVE
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamProctoringCamera;
