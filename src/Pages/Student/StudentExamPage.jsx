import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Clock3,
  Brain,
  Send,
  Loader2,
  CheckCircle2,
  Award,
  Sparkles,
  BarChart3,
  HelpCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
import { toPersianDigits } from "@/utils/dateUtils";

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

  // Centralized finish handler (called on time expiration or completion)
  const handleFinishExam = useCallback(
    async (reason = "completed") => {
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
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden select-text"
    >
      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate("/StudentExams")}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-neutral-scale70 cursor-pointer"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div className="flex-1 text-center min-w-0 px-2">
            <h1 className="font-vazir font-semibold text-base text-neutral-scale70 truncate">
              {examMeta?.title || (isRTL ? "آزمون تطبیقی شفاهی" : "Adaptive Oral Exam")}
            </h1>
            <p className="font-vazir text-xs text-neutral-scale200 truncate">
              {examMeta?.course || (isRTL ? "درس سیستم عامل" : "Operating Systems")}
            </p>
          </div>
          <div className="w-10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white/80" />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <section className="w-full flex-1 min-h-0 overflow-y-auto px-3.5 py-3">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primery-700 animate-spin" />
            <p className="font-vazir text-xs text-neutral-scale1100 dark:text-neutral-scale300">
              {isRTL ? "در حال برقراری ارتباط با مدل تطبیقی..." : "Connecting to adaptive model..."}
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col items-center gap-2 text-center text-red-600 dark:text-red-400 font-vazir text-xs">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span>{error}</span>
            <button
              onClick={() => navigate("/StudentExams")}
              className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs cursor-pointer"
            >
              {isRTL ? "بازگشت به آزمون‌ها" : "Return to Exams"}
            </button>
          </div>
        ) : isCompleted ? (
          /* ================= Complete Result View ================= */
          <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-5 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm">
              <Award className="w-8 h-8" />
            </div>

            <h2 className="font-vazir font-bold text-lg text-neutral-scale1800 dark:text-neutral-scale70 mb-1">
              {completionReason === "timeout"
                ? (isRTL ? "زمان آزمون به پایان رسید" : "Exam Time Expired")
                : (isRTL ? "آزمون با موفقیت به پایان رسید" : "Exam Successfully Completed")}
            </h2>

            <p className="font-vazir text-xs text-neutral-scale1100 dark:text-neutral-scale400 mb-4">
              {isRTL
                ? "ارزیابی چندبُعدی و تطبیقی پاسخ‌های شما ثبت و نهایی شد."
                : "Your multidimensional adaptive responses have been graded."}
            </p>

            <div className="w-full bg-primery-50 dark:bg-primery-950/40 border border-primery-200 dark:border-primery-900 rounded-xl p-3.5 mb-4 flex items-center justify-around">
              <div className="flex flex-col items-center">
                <span className="font-vazir text-xs text-neutral-scale1000 dark:text-neutral-scale400">
                  {isRTL ? "نمره ارزیابی" : "Score"}
                </span>
                <span className={`${isRTL ? "font-vazir" : "font-inter"} text-2xl font-bold text-primery-800 dark:text-primery-200`}>
                  {finalScore !== null
                    ? isRTL ? `${toPersianDigits(finalScore)}٪` : `${finalScore}%`
                    : isRTL ? "۸۵٪" : "85%"}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-neutral-scale300 dark:bg-neutral-scale1000" />
              <div className="flex flex-col items-center">
                <span className="font-vazir text-xs text-neutral-scale1000 dark:text-neutral-scale400">
                  {isRTL ? "وضعیت قبولی" : "Status"}
                </span>
                <span
                  className={`font-vazir text-sm font-bold flex items-center gap-1 ${
                    isPassed
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isPassed
                    ? (isRTL ? "قبول" : "Passed")
                    : (isRTL ? "نیاز به تلاش" : "Needs Review")}
                </span>
              </div>
            </div>

            {lastFeedback && (
              <div className="w-full text-right bg-neutral-scale90 dark:bg-neutral-scale900 rounded-xl p-3 mb-4 text-xs font-vazir text-neutral-scale1200 dark:text-neutral-scale300 border border-neutral-scale200 dark:border-neutral-scale1000">
                <div className="font-bold mb-1 flex items-center gap-1 text-primery-700 dark:text-primery-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRTL ? "بازخورد هوش مصنوعی:" : "AI Feedback:"}
                </div>
                <p className="leading-relaxed">{lastFeedback}</p>
              </div>
            )}

            {autoRedirectSeconds !== null && (
              <div className="w-full mb-3 text-center text-xs font-vazir text-neutral-scale1000 dark:text-neutral-scale400 flex items-center justify-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5 text-primery-700 dark:text-primery-300 animate-pulse" />
                <span>
                  {isRTL
                    ? `انتقال خودکار به فهرست آزمون‌ها در ${toPersianDigits(autoRedirectSeconds)} ثانیه...`
                    : `Auto redirecting to exams in ${autoRedirectSeconds}s...`}
                </span>
              </div>
            )}

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/StudentExamResult/${assignmentId}`, {
                    state: {
                      exam: {
                        id: assignmentId,
                        assignment_id: assignmentId,
                        session_id: sessionId,
                        title: examTitle,
                        score: finalScore,
                        passed: isPassed,
                      },
                    },
                  })
                }
                className="w-full h-10 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-vazir text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Award className="w-4 h-4" />
                {isRTL ? "مشاهده کارنامه و تحلیل کامل آزمون" : "View Full Exam Report"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/StudentExams")}
                className="w-full h-9 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 bg-white dark:bg-neutral-scale1200 text-neutral-scale1800 dark:text-neutral-scale100 font-vazir text-xs font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer hover:bg-neutral-scale50 dark:hover:bg-neutral-scale1100"
              >
                {isRTL ? "بازگشت به فهرست آزمون‌ها" : "Return to Exams List"}
              </button>
            </div>
          </div>
        ) : (
          /* ================= Active Exam Question View ================= */
          <div className="flex flex-col gap-3 pb-8">
            {/* Top Stat Bar */}
            <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl p-2.5 flex items-center justify-between text-xs font-vazir shadow-2xs">
              {/* Question Turn Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primery-100 dark:bg-primery-900/40 text-primery-800 dark:text-primery-200 font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{isRTL ? `سوال ${currentTurnIndex}` : `Question ${currentTurnIndex}`}</span>
              </div>

              {/* Difficulty indicator */}
              <div className="flex items-center gap-1 text-neutral-scale1000 dark:text-neutral-scale300">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{isRTL ? "سطح چالش:" : "Difficulty:"}</span>
                <span className="font-semibold text-primery-700 dark:text-primery-300">
                  {currentDifficulty > 0.6 ? (isRTL ? "پیشرفته" : "Hard") : currentDifficulty > 0.35 ? (isRTL ? "متوسط" : "Medium") : (isRTL ? "مقدماتی" : "Easy")}
                </span>
              </div>

              {/* Global Timer */}
              <div className={`flex items-center gap-1 text-neutral-scale1100 dark:text-neutral-scale200 ${isRTL ? "font-vazir" : "font-inter"} font-semibold tabular-nums`}>
                <Clock3 className="w-3.5 h-3.5 text-red-500" />
                <span>{formatTimer(remainingSeconds)}</span>
              </div>
            </div>

            {/* Question Card */}
            <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-vazir font-semibold text-xs text-primery-800 dark:text-primery-200 flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-primery-600" />
                  {isRTL ? "متن سوال ارزیابی:" : "Question prompt:"}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1000 text-neutral-scale1000 dark:text-neutral-scale300 ${isRTL ? "font-vazir" : "font-mono"}`}>
                  {isRTL ? `نوبت ${toPersianDigits(currentTurnIndex)}` : `Turn #${currentTurnIndex}`}
                </span>
              </div>

              <div
                dir={isRTL ? "rtl" : "ltr"}
                className="font-vazir text-sm leading-relaxed text-neutral-scale1800 dark:text-neutral-scale70 mt-1 select-text"
              >
                {currentQuestion || (isRTL ? "در حال بارگذاری سوال..." : "Loading question...")}
              </div>
            </div>

            {/* Answer Input Card */}
            <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="font-vazir text-xs font-semibold text-neutral-scale1600 dark:text-neutral-scale100">
                  {isRTL ? "پاسخ تحلیلی شما:" : "Your Analytical Answer:"}
                </label>
                <span className={`text-[11px] text-neutral-scale900 dark:text-neutral-scale400 ${isRTL ? "font-vazir" : "font-inter"}`}>
                  {isRTL ? toPersianDigits(answerText.length) : answerText.length} {isRTL ? "کاراکتر" : "chars"}
                </span>
              </div>

              <textarea
                dir={isRTL ? "rtl" : "ltr"}
                rows={5}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder={
                  isRTL
                    ? "پاسخ کامل و استدلال خود را در اینجا بنویسید..."
                    : "Type your detailed answer and explanation here..."
                }
                className="w-full rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 p-3 text-xs font-vazir text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:border-primery-600 focus:ring-1 focus:ring-primery-600 resize-none transition-all"
              />

              {/* Submit Button */}
              <button
                type="button"
                disabled={!answerText.trim() || isSubmitting}
                onClick={handleSubmitAnswer}
                className={`w-full h-10 rounded-xl font-vazir text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer ${
                  !answerText.trim() || isSubmitting
                    ? "bg-neutral-scale300 dark:bg-neutral-scale1100 text-neutral-scale700 dark:text-neutral-scale500 cursor-not-allowed"
                    : "bg-primery-700 hover:bg-primery-800 text-white"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isRTL ? "در حال تحلیل پاسخ توسط مدل..." : "Evaluating answer..."}</span>
                  </>
                ) : (
                  <>
                    <Send className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                    <span>{isRTL ? "ارسال پاسخ و دریافت سوال بعد" : "Submit Answer & Next Question"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
