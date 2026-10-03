import { useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Clock3,
  Brain,
  Send,
  Loader2,
  CheckCircle2,
  Award,
  Sparkles,
  AlertCircle,
  BookOpen,
  Mic,
  PhoneOff,
  Volume2,
  VolumeX,
  UserCheck,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
import { toPersianDigits } from "@/utils/dateUtils";
import { VoiceMicButton } from "@/Components/VoiceMicButton";
import { VoiceBeam } from "voice-glow";
import { ThinkingOrb } from "thinking-orbs";
import AI from "@/assets/images/AI.png";
import { voiceApi } from "@/api";

export const StudentExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL, t } = useContext(AppContext);

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

  const concatUint8 = (a, b) => {
    const out = new Uint8Array(a.byteLength + b.byteLength);
    out.set(a, 0);
    out.set(b, a.byteLength);
    return out;
  };

  // TTS & Live Word-by-Word State for Question Box
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [spokenWordCount, setSpokenWordCount] = useState(0);
  const [ttsVoiceLevel, setTtsVoiceLevel] = useState(0);
  const ttsIntervalRef = useRef(null);
  const ttsSourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sampleRateRef = useRef(22050);
  const leftoverRef = useRef(new Uint8Array(0));
  const nextStartRef = useRef(0);
  const activeSourcesRef = useRef([]);
  const ttsAbortControllerRef = useRef(null);
  const ttsAnalyserRef = useRef(null);
  const ttsTimerRef = useRef(null);

  const questionWords = useMemo(() => {
    if (!currentQuestion) return [];
    return currentQuestion.split(/\s+/).filter(Boolean);
  }, [currentQuestion]);

  const stopQuestionTTS = useCallback(() => {
    setIsSpeakingQuestion(false);
    setTtsVoiceLevel(0);

    if (ttsAbortControllerRef.current) {
      try {
        ttsAbortControllerRef.current.abort();
      } catch (e) {}
      ttsAbortControllerRef.current = null;
    }

    if (ttsIntervalRef.current) {
      clearInterval(ttsIntervalRef.current);
      ttsIntervalRef.current = null;
    }

    if (ttsTimerRef.current) {
      clearTimeout(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }

    if (activeSourcesRef.current && activeSourcesRef.current.length > 0) {
      activeSourcesRef.current.forEach((src) => {
        try {
          src.stop();
        } catch (e) {}
      });
      activeSourcesRef.current = [];
    }

    if (ttsSourceRef.current) {
      try {
        ttsSourceRef.current.stop();
      } catch (e) {}
      ttsSourceRef.current = null;
    }

    leftoverRef.current = new Uint8Array(0);
    nextStartRef.current = 0;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const playQuestionTTS = useCallback(
    async (text) => {
      if (!text) return;
      stopQuestionTTS();

      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      setIsSpeakingQuestion(true);
      setSpokenWordCount(1);

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

        nextStartRef.current = audioCtxRef.current.currentTime + 0.08;
        leftoverRef.current = new Uint8Array(0);
        sampleRateRef.current = 22050;
        activeSourcesRef.current = [];

        // Start listening to analyser frequency for VoiceBeam level
        const freqData = new Uint8Array(ttsAnalyserRef.current.frequencyBinCount);
        ttsIntervalRef.current = setInterval(() => {
          if (!ttsAnalyserRef.current) return;
          ttsAnalyserRef.current.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < freqData.length; i++) {
            sum += freqData[i];
          }
          const avg = sum / (freqData.length || 1);
          // Scale to 0.18 - 0.90 range for VoiceBeam
          const normalized = avg > 6 ? Math.min(0.9, Math.max(0.2, avg / 90)) : 0;
          setTtsVoiceLevel(normalized);
        }, 40);

        // Fetch TTS stream from backend endpoint (https://dgtw.um.ac.ir/tts_router_stream)
        const res = await voiceApi.streamTTS(text);
        if (!res || !res.body) {
          throw new Error("TTS streaming response invalid");
        }

        const reader = res.body.getReader();
        let leftover = leftoverRef.current;
        let seq = 0;
        let totalScheduledDuration = 0;
        const streamStartTime = Date.now();

        // Progressive word reveal pacing based on scheduled audio
        const pacingInterval = setInterval(() => {
          if (abortController.signal.aborted) {
            clearInterval(pacingInterval);
            return;
          }
          const elapsed = (Date.now() - streamStartTime) / 1000;
          if (totalScheduledDuration > 0) {
            const progress = Math.min(1, elapsed / (totalScheduledDuration + 0.3));
            const revealed = Math.max(1, Math.min(words.length, Math.ceil(progress * words.length)));
            setSpokenWordCount(revealed);
          }
        }, 110);

        while (true) {
          if (abortController.signal.aborted) {
            try {
              reader.cancel();
            } catch (e) {}
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;
          seq += 1;

          let chunkBytes = value ? new Uint8Array(value) : new Uint8Array(0);
          if (leftover.byteLength > 0) {
            chunkBytes = concatUint8(leftover, chunkBytes);
            leftover = new Uint8Array(0);
          }

          // Process X-PCM header on initial chunk
          if (seq === 1) {
            const txt = new TextDecoder("ascii").decode(
              chunkBytes.subarray(0, Math.min(128, chunkBytes.length))
            );
            if (txt.startsWith("X-PCM:")) {
              const nl = txt.indexOf("\n");
              if (nl >= 0) {
                const headerLine = txt.slice(0, nl).trim();
                headerLine
                  .replace("X-PCM:", "")
                  .split(";")
                  .forEach((pair) => {
                    const [k, v] = pair.split("=").map((s) => s.trim());
                    if (k === "sample_rate") sampleRateRef.current = parseInt(v, 10);
                  });
                chunkBytes = chunkBytes.subarray(nl + 1);
              } else {
                leftover = chunkBytes;
                continue;
              }
            }
          }

          // Ensure 4-byte alignment for 32-bit float audio buffer
          const rem = chunkBytes.byteLength % 4;
          if (rem !== 0) {
            leftover = chunkBytes.subarray(chunkBytes.byteLength - rem);
            chunkBytes = chunkBytes.subarray(0, chunkBytes.byteLength - rem);
          }
          if (chunkBytes.byteLength === 0) continue;

          const floatBuf = new Float32Array(
            chunkBytes.buffer,
            chunkBytes.byteOffset,
            chunkBytes.byteLength / 4
          );

          const buffer = audioCtxRef.current.createBuffer(
            1,
            floatBuf.length,
            sampleRateRef.current
          );
          buffer.getChannelData(0).set(floatBuf);

          const source = audioCtxRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(ttsAnalyserRef.current);

          const scheduledTime = Math.max(
            nextStartRef.current,
            audioCtxRef.current.currentTime + 0.04
          );
          source.start(scheduledTime);
          nextStartRef.current = scheduledTime + buffer.duration;
          totalScheduledDuration += buffer.duration;
          activeSourcesRef.current.push(source);
        }

        // Wait until all scheduled audio has finished playing
        const remainingPlayTimeMs = Math.max(
          150,
          (nextStartRef.current - audioCtxRef.current.currentTime) * 1000
        );

        ttsTimerRef.current = setTimeout(() => {
          clearInterval(pacingInterval);
          setSpokenWordCount(words.length);
          stopQuestionTTS();
        }, remainingPlayTimeMs + 200);
      } catch (streamErr) {
        if (abortController.signal.aborted) return;
        console.warn("[TTS Endpoint] Stream playback encountered error, using fallback:", streamErr);

        // Fallback: If network to dgtw.um.ac.ir failed, try browser speechSynthesis or reveal words
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = isRTL ? "fa-IR" : "en-US";
          utterance.rate = 0.95;

          utterance.onboundary = (e) => {
            if (e.name === "word") {
              const charIdx = e.charIndex;
              const count = text.slice(0, charIdx).split(/\s+/).filter(Boolean).length + 1;
              setSpokenWordCount(Math.min(words.length, Math.max(1, count)));
            }
          };

          const wordIntervalMs = Math.max(200, Math.min(360, Math.round(14000 / words.length)));
          let timerCount = 1;
          const pacingTimer = setInterval(() => {
            if (timerCount < words.length) {
              timerCount++;
              setSpokenWordCount((prev) => Math.max(prev, timerCount));
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
    [isRTL, stopQuestionTTS]
  );

  // Auto-play TTS and sync word-by-word reveal whenever a new question is loaded
  useEffect(() => {
    if (currentQuestion && !isCompleted && !loading) {
      playQuestionTTS(currentQuestion);
    }
    return () => {
      stopQuestionTTS();
    };
  }, [currentQuestion, isCompleted, loading, playQuestionTTS, stopQuestionTTS]);

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
          width: { ideal: 720 },
          height: { ideal: 1280 },
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
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        let input = e.inputBuffer.getChannelData(0);

        input = downsample(
          input,
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
      setMicStream(null);
    }
  };

  const stopRecording = () => {
    if (!recordingRef.current) return;

    console.log("🛑 Stopping recording...");

    recordingRef.current = false;
    setRecording(false);
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
        const res = await examsApi.launchStudentExam(id);
        if (!isMounted) return;

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
      dir={isRTL ? "rtl" : "ltr"}
      className="relative w-full md:w-[420px] h-dvh mx-auto overflow-hidden bg-slate-950 text-white flex flex-col select-none"
    >
      {/* ================= 1. Full-Screen Live Webcam Video Layer ================= */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
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

        {/* 2. Frosted Blur Layer over Webcam Feed (Reduced blur) */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-all duration-500 pointer-events-none" />

        {/* Vignette Gradient Shadow for Contrast & Depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75 pointer-events-none" />
      </div>

      {/* ================= 2. Top Bar (Only Exit Button & Timer) ================= */}
      <header className="relative z-20 w-full pt-4 px-4 pb-1 shrink-0 flex items-center justify-between">
        {/* Hang up / Exit Button */}
        <button
          type="button"
          onClick={() => setShowExitModal(true)}
          aria-label={isRTL ? "خروج از آزمون" : "Exit Exam"}
          className="w-10 h-10 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-90 transition-all cursor-pointer shrink-0"
          title={isRTL ? "پایان و خروج از آزمون" : "Exit Exam"}
        >
          <PhoneOff className="w-4 h-4" />
        </button>

        {/* Minimalist Floating Timer Pill */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-amber-300 font-mono text-xs font-bold shadow-lg">
          <Clock3 className="w-3.5 h-3.5 text-amber-400" />
          <span>{formatTimer(remainingSeconds)}</span>
        </div>
      </header>

      {/* ================= 3. Main Body / Floating Call Stage ================= */}
      <section className="relative z-10 w-full flex-1 min-h-0 flex flex-col justify-between px-3.5 py-2 overflow-y-auto">
        {loading ? (
          <div className="m-auto w-full max-w-sm rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-white/20 p-8 flex flex-col items-center justify-center text-center gap-4 shadow-2xl">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center animate-pulse">
                <Brain className="w-8 h-8 text-sky-400 animate-bounce" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-slate-900">
                <Sparkles className="w-3 h-3 text-white" />
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-vazir">
                {isRTL ? "در حال برقراری تماس با استاد هوش مصنوعی..." : "Connecting to AI Examiner..."}
              </h3>
              <p className="text-xs text-slate-400 font-vazir">
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
            <button
              type="button"
              onClick={() => navigate("/StudentExams")}
              className="mt-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-vazir text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {isRTL ? "بازگشت به فهرست آزمون‌ها" : "Return to Exams"}
            </button>
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
                  {isRTL ? "بازخورد استاد هوش مصنوعی:" : "AI Feedback:"}
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
                  ? "استاد هوش مصنوعی در حال تحلیل پاسخ شماست..."
                  : "AI Examiner is analyzing your answer..."}
              </h3>
              <p className="text-xs text-slate-300 font-vazir leading-relaxed max-w-[260px]">
                {isRTL
                  ? "طراحی و آماده‌سازی سوال تطبیقی بعدی متناسب با سطح پاسخ شما"
                  : "Formulating next adaptive question based on your response"}
              </p>
            </div>
          </div>
        ) : (
          /* ================= 5. Active Video Call Stage (Question + Answer) ================= */
          <div className="w-full flex flex-col justify-center items-center flex-1 gap-3.5 sm:gap-5 py-2 my-auto">
            {/* Upper Box: Compact Live Question Box with Voice-Glow & Word-by-Word sync */}
            <div className="w-full max-w-[360px] mx-auto">
              <VoiceBeam
                type="mobile"
                level={isSpeakingQuestion ? ttsVoiceLevel : 0}
                processing={false}
                className="w-full rounded-2xl"
              >
                <div className="w-full rounded-2xl bg-black/65 backdrop-blur-xl border border-white/15 p-3 sm:p-3.5 shadow-2xl flex flex-col gap-2 transition-all">
                  {/* Sleek Minimal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping inline-block" />
                      <span className="text-[11px] font-bold text-sky-300 font-vazir">
                        {isRTL ? `سوال ${toPersianDigits(currentTurnIndex)}` : `Question ${currentTurnIndex}`}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-vazir">
                        {currentDifficulty > 0.6
                          ? (isRTL ? "پیشرفته" : "Hard")
                          : currentDifficulty > 0.35
                          ? (isRTL ? "متوسط" : "Medium")
                          : (isRTL ? "مقدماتی" : "Easy")}
                      </span>
                    </div>

                    {/* Audio Replay / Mute Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isSpeakingQuestion) {
                          stopQuestionTTS();
                        } else {
                          playQuestionTTS(currentQuestion);
                        }
                      }}
                      className={`p-1 rounded-md border transition-all cursor-pointer ${
                        isSpeakingQuestion
                          ? "bg-sky-500/20 border-sky-400/40 text-sky-300 animate-pulse"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                      title={isRTL ? "پخش مجدد صدای سوال" : "Replay question audio"}
                    >
                      {isSpeakingQuestion ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Synchronized Word-by-Word Question Text */}
                  <div
                    dir={isRTL ? "rtl" : "ltr"}
                    className={`text-xs sm:text-sm leading-relaxed text-white font-medium select-text ${
                      isRTL ? "font-vazir text-right" : "font-inter text-left"
                    }`}
                  >
                    {questionWords.length > 0 ? (
                      questionWords.map((word, idx) => {
                        const isVisible = !isSpeakingQuestion || idx < spokenWordCount;
                        const isCurrent = isSpeakingQuestion && idx === spokenWordCount - 1;

                        return (
                          <span
                            key={idx}
                            className={`inline-block mr-1 transition-all duration-150 ${
                              isCurrent
                                ? "text-sky-300 font-bold scale-105"
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
                        {isRTL ? "در حال دریافت سوال آزمون..." : "Loading question..."}
                      </span>
                    )}
                  </div>
                </div>
              </VoiceBeam>
            </div>

            {/* Bottom Box: Writing & Voice Centered, Cleaned of Text Clutter */}
            <div className="w-full max-w-[360px] mx-auto">
              <VoiceBeam
                type="mobile"
                stream={micStream}
                level={recording ? 0.8 : 0}
                processing={isSubmitting}
                className="w-full rounded-2xl"
              >
                <div className="w-full rounded-2xl bg-black/65 backdrop-blur-xl border border-white/15 p-3 sm:p-3.5 shadow-2xl flex flex-col gap-2.5 transition-all">
                  {/* Text Input Area */}
                  <textarea
                    dir={isRTL ? "rtl" : "ltr"}
                    rows={2}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder={
                      isRTL
                        ? "با میکروفون صحبت کنید یا پاسخ را اینجا بنویسید..."
                        : "Speak with mic or type your response here..."
                    }
                    className="w-full rounded-xl bg-black/40 border border-white/10 p-2.5 text-xs font-vazir text-white placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 resize-none transition-all leading-relaxed"
                  />

                  {/* Controls Row: VoiceMicButton + Submit Button */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <VoiceMicButton
                      recording={recording}
                      voiceLang={voiceLang}
                      onLanguageChange={setVoiceLang}
                      onStartRecording={startRecording}
                      onStopRecording={stopRecording}
                      disabled={isSubmitting || isCompleted}
                      isRTL={isRTL}
                      className="w-11 h-11 relative shrink-0"
                      buttonClassName={`w-full h-full rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                        recording
                          ? "bg-red-600 text-white shadow-red-500/50"
                          : "bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md"
                      }`}
                      badgeClassName="-top-1 -right-1"
                      iconClassName="!w-4 !h-4"
                    />

                    {/* Submit / Next Button */}
                    <button
                      type="button"
                      disabled={!answerText.trim() || isSubmitting}
                      onClick={handleSubmitAnswer}
                      className={`flex-1 h-11 rounded-xl font-vazir text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg cursor-pointer ${
                        !answerText.trim() || isSubmitting
                          ? "bg-white/10 text-slate-500 border border-white/10 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:brightness-110 text-white shadow-emerald-500/25"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isRTL ? "ارسال پاسخ و سوال بعد" : "Submit Answer & Next"}</span>
                    </button>
                  </div>
                </div>
              </VoiceBeam>
            </div>
          </div>
        )}
      </section>

      {/* ================= 6. Video Call Hangup Confirmation Modal ================= */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[320px] rounded-3xl bg-slate-900 border border-white/20 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/20">
              <PhoneOff className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white font-vazir">
                {isRTL ? "قطع تماس و خروج از آزمون" : "Leave Exam Call"}
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
                {isRTL ? "قطع تماس" : "End Call"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

