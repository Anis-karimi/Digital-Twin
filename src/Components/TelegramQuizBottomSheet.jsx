import { useState, useRef, useEffect, useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { ChevronDown, X } from "lucide-react";
import { QuizFirstPage } from "@/Pages/QuizFirstPage";
import { QuizQuestionsPage } from "@/Pages/QuizQuestionsPage";
import { QuizResultPage } from "@/Pages/QuizResultPage";
import { ReviewAnswers } from "@/Pages/ReviewAnswersPage";
import "@/styles/fonts.css";

/**
 * TelegramQuizBottomSheet
 * 
 * Telegram Mini App (TMA) styled Bottom Sheet for interactive quizzes.
 * Provides Telegram-like slide up/down transitions, minimize/collapse physics,
 * gesture drag handling, and preserves quiz state seamlessly across minimization.
 */
export const TelegramQuizBottomSheet = ({
  isOpen,
  isMinimized,
  onMinimize,
  onExpand,
  onClose,
  courseTitle = "",
}) => {
  const { isRTL, t } = useContext(AppContext);

  // Sub-view step: 'setup' | 'questions' | 'result' | 'review'
  const [step, setStep] = useState("setup");
  const [quizData, setQuizData] = useState([]);
  const [resultData, setResultData] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Drag physics state
  const [dragOffset, setDragOffset] = useState(0);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);

  // Compute clean quiz title (defaults to "کوییز سیستم عامل")
  const cleanTitle = (courseTitle || "").replace(/گفت‌وگو\s*(با)?\s*/g, "").trim();
  const quizTitle = cleanTitle ? `کوییز ${cleanTitle}` : (t("osQuiz") || "کوییز سیستم عامل");

  // Reset internal state if closed completely
  useEffect(() => {
    if (!isOpen) {
      setStep("setup");
      setQuizData([]);
      setResultData(null);
      setShowExitConfirm(false);
      setDragOffset(0);
    }
  }, [isOpen]);

  const handleAttemptClose = () => {
    if (step === "questions") {
      setShowExitConfirm(true);
      return;
    }
    onClose?.();
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onClose?.();
  };

  // Drag-to-minimize touch gestures
  const handleTouchStart = (e) => {
    dragStartYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartYRef.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragOffset > 90) {
      onMinimize?.();
    }
    setDragOffset(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ----------------- Backdrop Overlay ----------------- */}
      <div
        className={`fixed inset-0 md:absolute z-[60] bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isMinimized ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
        }`}
        onClick={onMinimize}
        aria-hidden="true"
      />

      {/* ----------------- Telegram Mini App Bottom Sheet ----------------- */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label={quizTitle}
        dir={isRTL ? "rtl" : "ltr"}
        className={`fixed inset-x-0 bottom-0 md:absolute md:inset-x-0 md:bottom-0 top-[20px] z-[70] flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 rounded-t-[26px] shadow-2xl overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isMinimized
            ? "translate-y-full pointer-events-none"
            : "translate-y-0 pointer-events-auto"
        }`}
        style={{
          transform: isMinimized
            ? "translateY(100%)"
            : dragOffset > 0
            ? `translateY(${dragOffset}px)`
            : "translateY(0)",
        }}
      >
        {/* Telegram Top Drag Pill & Header */}
        <header
          className="w-full bg-white dark:bg-neutral-scale1300 border-b border-neutral-200 dark:border-neutral-scale1100 flex flex-col shrink-0 select-none shadow-xs"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Grab Handle */}
          <div className="w-full flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600 transition-colors" />
          </div>

          {/* Telegram TMA Navigation Bar */}
          <div className="h-[46px] px-3 flex items-center justify-between">
            {/* Minimize / Collapse Button ("دکمه جمع شدن") */}
            <button
              type="button"
              onClick={onMinimize}
              aria-label={t("minimizeQuiz") || "کوچک کردن"}
              title={t("minimizeQuiz") || "کوچک کردن"}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-scale1200 hover:bg-neutral-200 dark:hover:bg-neutral-scale1100 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
            >
              <ChevronDown className="w-5 h-5" />
            </button>

            {/* Title in Center: کوییز سیستم عامل */}
            <div className="flex flex-col items-center justify-center min-w-0 px-2">
              <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate font-vazir">
                {quizTitle}
              </h2>
              <span className="text-[10px] text-primery-600 dark:text-sky-400 font-medium truncate">
                {t("aiAssistant") || "هوش مصنوعی"}
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleAttemptClose}
              aria-label={t("closeQuiz") || "بستن"}
              title={t("closeQuiz") || "بستن"}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-scale1200 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-700 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ----------------- Sub-View Content Container ----------------- */}
        <div className="flex-1 overflow-y-auto relative flex flex-col">
          {/* Step 1: Quiz Topic & Parameters Setup */}
          {step === "setup" && (
            <QuizFirstPage
              isModal={true}
              initialTopic={cleanTitle}
              onStartQuiz={(generatedData) => {
                setQuizData(generatedData);
                setStep("questions");
              }}
              onClose={handleAttemptClose}
            />
          )}

          {/* Step 2: Interactive Questions Answering */}
          {step === "questions" && (
            <QuizQuestionsPage
              isModal={true}
              modalQuizData={quizData}
              onFinishQuiz={(evaluatedResult) => {
                setResultData(evaluatedResult);
                setStep("result");
              }}
              onExitQuiz={handleAttemptClose}
            />
          )}

          {/* Step 3: Score Report & Performance Result */}
          {step === "result" && (
            <QuizResultPage
              isModal={true}
              modalResultData={resultData}
              onRetryQuiz={() => {
                setStep("setup");
              }}
              onReviewAnswers={() => {
                setStep("review");
              }}
              onBackToChat={handleAttemptClose}
            />
          )}

          {/* Step 4: Review Answers & AI Explanations */}
          {step === "review" && (
            <ReviewAnswers
              isModal={true}
              modalReviewData={{
                quizData: resultData?.quizData || quizData,
                selectedAnswers: resultData?.selectedAnswers || {},
              }}
              onBackToResult={() => {
                setStep("result");
              }}
            />
          )}
        </div>

        {/* ----------------- Exit Confirmation Modal ----------------- */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
            <div className="w-full max-w-[320px] rounded-3xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="space-y-1.5 pt-1">
                <h3
                  className={`text-sm font-bold text-neutral-900 dark:text-neutral-100 ${
                    isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
                  }`}
                >
                  {t("exitQuizTitle") || "آیا از خروج از آزمون اطمینان دارید؟"}
                </h3>
                <p
                  className={`text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed ${
                    isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
                  }`}
                >
                  {t("exitQuizSubtitle") ||
                    "پیشرفت شما در این آزمون ثبت نخواهد شد و از دست می‌رود."}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-scale1200 hover:bg-neutral-200 dark:hover:bg-neutral-scale1100 text-neutral-700 dark:text-neutral-300 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  {t("cancel") || "ادامه آزمون"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-sm shadow-rose-500/25"
                >
                  {t("confirmExit") || "خروج از آزمون"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default TelegramQuizBottomSheet;
