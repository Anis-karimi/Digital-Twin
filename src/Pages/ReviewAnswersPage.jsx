import { useEffect, useState, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { quizApi } from "@/api";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import "@/styles/fonts.css";

export const ReviewAnswers = ({
  isModal = false,
  modalReviewData = null,
  onBackToResult,
}) => {
  const { isRTL, t } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isHandlingBackRef = useRef(false);

  useEffect(() => {
    if (isModal) {
      return;
    }

    const handlePopState = () => {
      if (isHandlingBackRef.current) {
        isHandlingBackRef.current = false;
        return;
      }

      // Mobile or browser Back button in Review -> Return to Quiz Result
      isHandlingBackRef.current = true;

      navigate("/Quiz-result", {
        replace: true,
        state: {
          quizData: location.state?.quizData || [],
          selectedAnswers: location.state?.selectedAnswers || {},
        },
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, location.state, isModal]);

  const isPersianText = (text) => /[\u0600-\u06FF]/.test(String(text || ""));

  const quizData = isModal && modalReviewData ? (modalReviewData.quizData || []) : (location.state?.quizData || []);
  const selectedAnswers = isModal && modalReviewData ? (modalReviewData.selectedAnswers || {}) : (location.state?.selectedAnswers || {});

  // Store open/close state for explanations per question
  const [openExplanations, setOpenExplanations] = useState({});
  const [explanations, setExplanations] = useState({});
  const [loadingExplanations, setLoadingExplanations] = useState({});

  const toggleExplanation = async (questionIndex, questionText) => {
    const nextState = !openExplanations[questionIndex];
    setOpenExplanations((prev) => ({
      ...prev,
      [questionIndex]: nextState,
    }));

    if (nextState && !explanations[questionIndex]) {
      try {
        setLoadingExplanations((prev) => ({ ...prev, [questionIndex]: true }));
        const res = await quizApi.explainAnswer(questionText);
        setExplanations((prev) => ({
          ...prev,
          [questionIndex]: res || t("noExplanationAvailable"),
        }));
      } catch (err) {
        console.error("Failed to load explanation:", err);
        setExplanations((prev) => ({
          ...prev,
          [questionIndex]: t("errorGettingExplanation"),
        }));
      } finally {
        setLoadingExplanations((prev) => ({ ...prev, [questionIndex]: false }));
      }
    }
  };

  // Convert API options into standard format
  const normalizeOptions = (options = []) => {
    return options.map((option, index) => {
      if (typeof option === "object" && option !== null) {
        return {
          letter: option.letter || String.fromCharCode(65 + index),
          text: option.text || option.answer || "",
        };
      }

      const optionText = String(option);
      const letterMatch = optionText.match(/^\s*([A-Da-d])[\)\.\-:]\s*/);

      if (letterMatch) {
        return {
          letter: letterMatch[1].toUpperCase(),
          text: optionText.replace(letterMatch[0], "").trim(),
        };
      }

      return {
        letter: String.fromCharCode(65 + index),
        text: optionText,
      };
    });
  };

  // Find correct answer option
  const getCorrectAnswerLetter = (question, options) => {
    const rawAnswer = question.answer;
    if (!rawAnswer) return "";

    const answerString = String(rawAnswer).trim();
    const letterMatch = answerString.match(/^([A-Da-d])(?:[\)\.\-:]|\s|$)/);

    if (letterMatch) {
      return letterMatch[1].toUpperCase();
    }

    const matchingOption = options.find(
      (opt) => opt.text.trim().toLowerCase() === answerString.toLowerCase(),
    );

    if (matchingOption) {
      return matchingOption.letter;
    }

    return answerString.charAt(0).toUpperCase();
  };

  const handleBackToResult = () => {
    if (isModal && onBackToResult) {
      onBackToResult();
      return;
    }

    navigate("/Quiz-result", {
      replace: true,
      state: {
        quizData,
        selectedAnswers,
      },
    });
  };

  // Empty state if no questions were provided
  if (quizData.length === 0) {
    return (
      <main
        className={`w-full ${
          isModal ? "h-full flex-1" : "md:w-[420px] min-h-dvh mx-auto"
        } flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 transition-colors duration-200 select-none items-center justify-center p-6`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-sm bg-white dark:bg-neutral-scale1300 rounded-3xl border border-neutral-scale200 dark:border-neutral-scale1100 p-8 shadow-sm text-center flex flex-col items-center gap-4">
          <p
            className={`text-sm font-bold text-neutral-800 dark:text-neutral-200 ${
              isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
            }`}
          >
            {t("noQuizAnswersFound")}
          </p>
          <button
            type="button"
            onClick={handleBackToResult}
            className="w-full h-11 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            {t("back")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`w-full ${
        isModal ? "h-full flex-1" : "md:w-[420px] min-h-dvh mx-auto"
      } flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 transition-colors duration-200 select-none overflow-x-hidden relative`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ----------------- Telegram App Header ----------------- */}
      <header className="sticky top-0 z-40 w-full bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1100 text-white shadow-sm flex items-center justify-between px-3 h-[60px]">
        {/* Back Button to Result */}
        <button
          type="button"
          onClick={handleBackToResult}
          aria-label={t("back")}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
        >
          {isRTL ? (
            <ArrowRight className="w-5 h-5" />
          ) : (
            <ArrowLeft className="w-5 h-5" />
          )}
        </button>

        {/* Header Title */}
        <div className="flex flex-col items-center justify-center">
          <h1
            className={`text-sm font-bold text-white leading-tight ${
              isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
            }`}
          >
            {t("reviewTitle")}
          </h1>
          <span className="text-[11px] text-white/80 font-medium">
            {quizData.length} {t("questionsSuffix")}
          </span>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center text-xs font-bold text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
          <span>{quizData.length}</span>
        </div>
      </header>

      {/* ----------------- Questions Review List ----------------- */}
      <section className="flex-1 px-3.5 py-4 flex flex-col gap-4 overflow-y-auto pb-4">
        {quizData.map((question, questionIndex) => {
          const options = normalizeOptions(question.options || []);
          const selectedAnswer = selectedAnswers[questionIndex] || "";
          const correctAnswer = getCorrectAnswerLetter(question, options);

          const isAnswered = Boolean(selectedAnswer);
          const isCorrect = isAnswered && selectedAnswer === correctAnswer;

          const explanationOpen = openExplanations[questionIndex] || false;
          const isLoadingExp = loadingExplanations[questionIndex] || false;
          const explanationText = explanations[questionIndex] || "";

          return (
            <article
              key={question.id || questionIndex}
              className="w-full bg-white dark:bg-neutral-scale1300 rounded-3xl border border-neutral-scale200 dark:border-neutral-scale1100 p-6 sm:p-7 shadow-sm space-y-4 transition-all duration-200"
            >
              {/* Question Header & Status Indicator */}
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-neutral-100 dark:border-neutral-scale1200">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primery-50 dark:bg-sky-950/40 text-primery-700 dark:text-sky-300 border border-primery-200/70 dark:border-sky-800/40">
                  {t("question")} {questionIndex + 1}
                </span>

                {/* Question Status Badge */}
                {isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("correct")}</span>
                  </span>
                ) : isAnswered ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t("incorrect")}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-scale1200 text-neutral-500 dark:text-neutral-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t("unansweredCount")}</span>
                  </span>
                )}
              </div>

              {/* Question Text with Comfortable Padding & Line-height */}
              <div className="py-2 px-1 sm:py-2.5 sm:px-2">
                <h2
                  className={`text-[15px] sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-loose sm:leading-loose ${
                    isPersianText(question.question)
                      ? "fa-title-2 font-vazir text-right"
                      : "en-title-2 font-inter text-left"
                  }`}
                  dir={isPersianText(question.question) ? "rtl" : "ltr"}
                >
                  {question.question}
                </h2>
              </div>

              {/* Options Review List */}
              <div className="flex flex-col gap-2.5">
                {options.map((option) => {
                  const isSelected = option.letter === selectedAnswer;
                  const isCorrectOption = option.letter === correctAnswer;

                  let cardStyle =
                    "border-neutral-200 dark:border-neutral-scale1100 bg-neutral-50/50 dark:bg-neutral-scale1200/40 text-neutral-600 dark:text-neutral-300 opacity-60";
                  let badgeStyle =
                    "bg-neutral-100 dark:bg-neutral-scale1100 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-scale1000";

                  if (isCorrectOption) {
                    cardStyle =
                      "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-sm shadow-emerald-500/15";
                    badgeStyle =
                      "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-105";
                  } else if (isSelected && !isCorrectOption) {
                    cardStyle =
                      "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 shadow-sm shadow-rose-500/15";
                    badgeStyle =
                      "bg-rose-500 text-white shadow-sm shadow-rose-500/30 scale-105";
                  }

                  return (
                    <div
                      key={option.letter}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3.5 transition-all duration-200 ${cardStyle}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Option Letter / Status Badge */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${badgeStyle}`}
                        >
                          {isCorrectOption ? (
                            <Check className="w-4 h-4 text-white stroke-[2.5]" />
                          ) : isSelected && !isCorrectOption ? (
                            <X className="w-4 h-4 text-white stroke-[2.5]" />
                          ) : (
                            <span>{option.letter}</span>
                          )}
                        </div>

                        {/* Option Text */}
                        <span
                          className={`text-xs sm:text-sm font-medium leading-relaxed flex-1 ${
                            isPersianText(option.text)
                              ? "fa-body font-vazir text-right"
                              : "en-body font-inter text-left"
                          }`}
                          dir={isPersianText(option.text) ? "rtl" : "ltr"}
                        >
                          {option.text}
                        </span>
                      </div>

                      {/* Tag badges for selected / correct */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <span
                            className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              isCorrectOption
                                ? "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                                : "bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200"
                            }`}
                          >
                            {t("yourAnswer")}
                          </span>
                        )}
                        {isCorrectOption && !isSelected && (
                          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                            {t("correctAnswer")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explain Button */}
              <button
                type="button"
                onClick={() => toggleExplanation(questionIndex, question.question)}
                className="w-full h-11 rounded-xl bg-white dark:bg-neutral-scale1300 border border-primery-600 dark:border-sky-400 text-primery-700 dark:text-sky-300 text-xs font-bold transition-all hover:bg-primery-50 dark:hover:bg-sky-950/40 active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
              >
                {isLoadingExp ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primery-700 dark:text-sky-300" />
                ) : (
                  <HelpCircle className="w-4 h-4" />
                )}
                <span>
                  {explanationOpen
                    ? t("hideExplanation")
                    : t("explainAnswer")}
                </span>
              </button>

              {/* AI Explanation Accordion */}
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  explanationOpen
                    ? "grid-rows-[1fr] opacity-100 mt-2"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="bg-gradient-to-br from-amber-50/80 via-white to-sky-50/50 dark:from-neutral-scale1300 dark:via-neutral-scale1200 dark:to-neutral-scale1300 rounded-2xl border border-amber-200/80 dark:border-amber-500/25 p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span>{t("aiExplanationTitle")}</span>
                    </div>

                    {isLoadingExp ? (
                      <div className="py-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>{t("gettingExplanation")}</span>
                      </div>
                    ) : (
                      <p
                        className={`text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 pt-1 ${
                          isPersianText(explanationText)
                            ? "fa-body font-vazir text-right"
                            : "en-body font-inter text-left"
                        }`}
                        dir={isPersianText(explanationText) ? "rtl" : "ltr"}
                      >
                        {explanationText}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* ----------------- Sticky Bottom Bar -----------------
      <footer className="sticky bottom-0 z-30 w-full bg-white/90 dark:bg-neutral-scale1300/90 backdrop-blur-md border-t border-neutral-scale200 dark:border-neutral-scale1100 p-3.5 flex items-center justify-center shadow-lg">
        <button
          type="button"
          onClick={handleBackToResult}
          className="w-full h-11 rounded-xl bg-primery-700 hover:bg-primery-800 dark:bg-primery-600 dark:hover:bg-primery-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md shadow-primery-700/20"
        >
          {isRTL ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <ArrowLeft className="w-4 h-4" />
          )}
          <span>{t("backToScoreReport")}</span>
        </button>
      </footer> */}
    </main>
  );
};

