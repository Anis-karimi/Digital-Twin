import { useEffect, useState, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { quizApi } from "@/api";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  HelpCircle,
  Check,
  Award,
} from "lucide-react";
import "@/styles/fonts.css";

export const QuizQuestionsPage = () => {
  const { language, isRTL, t } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isPersianText = (text) => /[\u0600-\u06FF]/.test(String(text || ""));

  // Retrieve generated questions passed from QuizFirstPage
  const quizData = location.state?.quizData || [];
  const totalQuestions = quizData.length;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Store user-selected option per question index
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Track whether "Show Answer" was clicked per question
  const [answeredQuestions, setAnsweredQuestions] = useState({});

  // Track whether explanation accordion is expanded per question
  const [showExplanations, setShowExplanations] = useState({});

  // Store AI explanation text per question
  const [explanations, setExplanations] = useState({});

  // Store AI explanation loading state per question
  const [loadingExplanations, setLoadingExplanations] = useState({});

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const isHandlingBackRef = useRef(false);
  const isExitingQuizRef = useRef(false);
  const isFinishingQuizRef = useRef(false);
  const pendingResultRef = useRef(null);

  const handleExitQuiz = () => {
    isExitingQuizRef.current = true;
    const savedReturn = sessionStorage.getItem("quizReturnToChat");

    if (savedReturn) {
      try {
        const returnData = JSON.parse(savedReturn);
        // Exiting quiz navigates straight back to previous Chat
        window.history.go(-2);
        sessionStorage.removeItem("quizReturnToChat");
        return;
      } catch (error) {
        console.error("Invalid quiz return data:", error);
      }
    }

    // fallback
    navigate("/", { replace: true });
  };

  useEffect(() => {
    // Push a new history entry while retaining the existing quizData state
    navigate(location.pathname + location.search + location.hash, {
      state: location.state,
    });

    const handlePopState = () => {
      // If user is finishing the quiz normally, pass guard and replace with Result
      if (isFinishingQuizRef.current) {
        isFinishingQuizRef.current = false;

        if (pendingResultRef.current) {
          navigate("/Quiz-result", {
            replace: true,
            state: pendingResultRef.current,
          });
          pendingResultRef.current = null;
        }
        return;
      }

      // If user confirmed exiting, skip the back guard
      if (isExitingQuizRef.current) {
        return;
      }

      // When history.forward() was triggered programmatically
      if (isHandlingBackRef.current) {
        isHandlingBackRef.current = false;
        return;
      }

      // Mobile or browser Back button was pressed -> show exit confirmation
      setShowExitConfirmation(true);

      // Keep the user on QuizQuestionsPage
      isHandlingBackRef.current = true;
      window.history.forward();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Empty state if no questions are available
  if (totalQuestions === 0) {
    return (
      <main
        className="w-full md:w-[420px] min-h-dvh mx-auto flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 transition-colors duration-200 select-none items-center justify-center p-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-sm bg-white dark:bg-neutral-scale1300 rounded-3xl border border-neutral-scale200 dark:border-neutral-scale1100 p-8 shadow-sm text-center flex flex-col items-center gap-4">
          <h2
            className={`text-base font-bold text-neutral-900 dark:text-neutral-100 ${
              isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
            }`}
          >
            {t("noQuizQuestionsFound")}
          </h2>
          <button
            type="button"
            onClick={() => navigate("/QuizFirstPage", { replace: true })}
            className="w-full h-11 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            {t("goBackAndTryAgain")}
          </button>
        </div>
      </main>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];
  const selectedAnswer = selectedAnswers[currentQuestionIndex] || "";
  const showAnswer = answeredQuestions[currentQuestionIndex] || false;
  const showExplanation = showExplanations[currentQuestionIndex] || false;
  const explanation = explanations[currentQuestionIndex] || "";
  const loadingExplanation = loadingExplanations[currentQuestionIndex] || false;

  // Normalize options array from API into structured { id, letter, text } objects
  const normalizedAnswers = (currentQuestion?.options || []).map(
    (option, index) => {
      if (typeof option === "object" && option !== null) {
        return {
          id: option.id || String(index),
          letter: option.letter || String.fromCharCode(65 + index),
          text: option.text || option.answer || "",
        };
      }

      const optionText = String(option);
      const letterMatch = optionText.match(/^\s*([A-Da-d])\s*[)\.\-:]\s*/);

      if (letterMatch) {
        return {
          id: String(index),
          letter: letterMatch[1].toUpperCase(),
          text: optionText.replace(letterMatch[0], "").trim(),
        };
      }

      return {
        id: String(index),
        letter: String.fromCharCode(65 + index),
        text: optionText,
      };
    },
  );

  // Convert API correct answer representation to A/B/C/D letter
  const getCorrectAnswerLetter = () => {
    const rawAnswer = currentQuestion?.answer;
    if (!rawAnswer) return "";

    const answerString = String(rawAnswer).trim();
    const letterMatch = answerString.match(/^([A-Da-d])(?:[)\.\-:]|\s|$)/);

    if (letterMatch) {
      return letterMatch[1].toUpperCase();
    }

    const matchingOption = normalizedAnswers.find(
      (option) =>
        option.text.trim().toLowerCase() === answerString.toLowerCase(),
    );

    if (matchingOption) {
      return matchingOption.letter;
    }

    return answerString.charAt(0).toUpperCase();
  };

  const correctAnswer = getCorrectAnswerLetter();
  const progress =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  const handleSelectAnswer = (answerLetter) => {
    if (showAnswer) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answerLetter,
    }));
  };

  const handleShowAnswer = () => {
    if (!selectedAnswer) return;
    setAnsweredQuestions((prev) => ({
      ...prev,
      [currentQuestionIndex]: true,
    }));
  };

  const handleShowExplanation = async () => {
    if (!showAnswer) return;

    if (explanation) {
      setShowExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: !prev[currentQuestionIndex],
      }));
      return;
    }

    try {
      setLoadingExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: true,
      }));
      setShowExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: true,
      }));

      const exp = await quizApi.explainAnswer(currentQuestion.question);

      setExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: exp || t("noExplanationAvailable"),
      }));
    } catch (err) {
      console.error("Explain error:", err);
      setExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: t("errorGettingExplanation"),
      }));
    } finally {
      setLoadingExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: false,
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      let correctCount = 0;
      let incorrectCount = 0;

      quizData.forEach((question, index) => {
        const selAns = selectedAnswers[index];
        if (!selAns) return;

        const rawAnswer = question.answer;
        if (!rawAnswer) return;

        const answerString = String(rawAnswer).trim();
        const normalizedOptions = (question.options || []).map(
          (option, optionIndex) => {
            if (typeof option === "object" && option !== null) {
              return {
                letter: option.letter || String.fromCharCode(65 + optionIndex),
                text: option.text || option.answer || "",
              };
            }
            const optionText = String(option);
            const letterMatch = optionText.match(/^\s*([A-Da-d])[)\.\-:]\s*/);
            if (letterMatch) {
              return {
                letter: letterMatch[1].toUpperCase(),
                text: optionText.replace(letterMatch[0], "").trim(),
              };
            }
            return {
              letter: String.fromCharCode(65 + optionIndex),
              text: optionText,
            };
          },
        );

        let corrAns = "";
        const letterMatch = answerString.match(/^([A-Da-d])(?:[)\.\-:]|\s|$)/);

        if (letterMatch) {
          corrAns = letterMatch[1].toUpperCase();
        } else {
          const matchingOption = normalizedOptions.find(
            (opt) => opt.text.trim().toLowerCase() === answerString.toLowerCase(),
          );
          if (matchingOption) {
            corrAns = matchingOption.letter;
          } else {
            corrAns = answerString.charAt(0).toUpperCase();
          }
        }

        if (selAns === corrAns) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });

      pendingResultRef.current = {
        correctCount,
        incorrectCount,
        totalQuestions,
        selectedAnswers,
        quizData,
      };

      isFinishingQuizRef.current = true;
      window.history.back();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  return (
    <main
      className="w-full md:w-[420px] min-h-dvh mx-auto flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 transition-colors duration-200 select-none overflow-x-hidden relative"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ----------------- Telegram App Header ----------------- */}
      <header className="sticky top-0 z-40 w-full bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1100 text-white shadow-sm flex flex-col">
        <div className="h-[60px] flex items-center justify-between px-3">
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setShowExitConfirmation(true)}
            aria-label={t("closeQuiz")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Question Index Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 shadow-xs ${
                isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter"
              }`}
            >
              {t("question")} {currentQuestionIndex + 1} {t("of")}{" "}
              {totalQuestions}
            </span>
          </div>

          {/* Percentage Indicator */}
          <div className="flex items-center gap-1 text-xs font-bold text-white/90 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15">
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div
          className="w-full h-1.5 bg-black/15 dark:bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-sky-300 to-amber-300 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ----------------- Question Content Body ----------------- */}
      <section className="flex-1 px-3.5 py-4 flex flex-col gap-4 overflow-y-auto pb-24">
        {/* Question Card */}
        <div
          key={`q-${currentQuestionIndex}`}
          className="w-full bg-white dark:bg-neutral-scale1300 rounded-3xl border border-neutral-scale200 dark:border-neutral-scale1100 p-6 sm:p-7 shadow-sm transition-all duration-300 transform animate-in fade-in"
        >
          {/* Question Meta Header */}
          <div className="flex items-center justify-between gap-2 pb-3.5 mb-2 border-b border-neutral-100 dark:border-neutral-scale1200">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primery-50 dark:bg-sky-950/40 text-primery-700 dark:text-sky-300 border border-primery-200/70 dark:border-sky-800/40">
              {t("question")} {currentQuestionIndex + 1}
            </span>

            {showAnswer && (
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  selectedAnswer === correctAnswer
                    ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                }`}
              >
                {selectedAnswer === correctAnswer ? t("correct") : t("incorrect")}
              </span>
            )}
          </div>

          {/* Question Text with Comfortable Padding & Spacing */}
          <div className="py-2.5 sm:py-3.5 px-1 sm:px-2">
            <h2
              className={`text-[15px] sm:text-base font-bold text-neutral-900 dark:text-neutral-100 leading-loose sm:leading-loose ${
                isPersianText(currentQuestion.question)
                  ? "fa-title-2 font-vazir text-right"
                  : "en-title-2 font-inter text-left"
              }`}
              dir={isPersianText(currentQuestion.question) ? "rtl" : "ltr"}
            >
              {currentQuestion.question}
            </h2>
          </div>
        </div>

        {/* Answer Choices (Telegram Poll/Quiz Style) */}
        <div className="flex flex-col gap-2.5">
          {normalizedAnswers.map((answer) => {
            const isSelected = selectedAnswer === answer.letter;
            const isCorrect = correctAnswer === answer.letter;

            let cardStyle =
              "bg-white dark:bg-neutral-scale1300 border-neutral-200 dark:border-neutral-scale1100 text-neutral-800 dark:text-neutral-200 hover:border-primery-400 dark:hover:border-sky-500/50 hover:bg-neutral-50/80 dark:hover:bg-neutral-scale1200";
            let badgeStyle =
              "bg-neutral-100 dark:bg-neutral-scale1200 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-scale1000";

            if (!showAnswer) {
              if (isSelected) {
                cardStyle =
                  "bg-primery-50/70 dark:bg-sky-950/40 border-primery-600 dark:border-sky-400 text-primery-900 dark:text-sky-100 shadow-sm shadow-primery-500/10 scale-[1.01]";
                badgeStyle =
                  "bg-primery-600 text-white shadow-xs scale-105";
              }
            } else {
              // After Show Answer is clicked
              if (isCorrect) {
                cardStyle =
                  "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm shadow-emerald-500/15 scale-[1.01]";
                badgeStyle =
                  "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-110";
              } else if (isSelected && !isCorrect) {
                cardStyle =
                  "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-100 shadow-sm shadow-rose-500/15";
                badgeStyle =
                  "bg-rose-500 text-white shadow-sm shadow-rose-500/30 scale-110";
              } else {
                cardStyle =
                  "opacity-50 bg-neutral-50/60 dark:bg-neutral-scale1300/40 border-neutral-200 dark:border-neutral-scale1100 text-neutral-400 dark:text-neutral-500";
              }
            }

            return (
              <button
                key={answer.id}
                type="button"
                onClick={() => handleSelectAnswer(answer.letter)}
                disabled={showAnswer}
                className={`w-full text-right p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:cursor-default ${cardStyle}`}
              >
                {/* Option Letter / Status Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${badgeStyle}`}
                >
                  {showAnswer && isCorrect ? (
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                  ) : showAnswer && isSelected && !isCorrect ? (
                    <X className="w-4 h-4 text-white stroke-[2.5]" />
                  ) : (
                    <span>{answer.letter}</span>
                  )}
                </div>

                {/* Option Text */}
                <span
                  className={`flex-1 text-xs sm:text-sm font-medium leading-relaxed ${
                    isPersianText(answer.text)
                      ? "fa-body font-vazir text-right"
                      : "en-body font-inter text-left"
                  }`}
                  dir={isPersianText(answer.text) ? "rtl" : "ltr"}
                >
                  {answer.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Show Answer & AI Explanation */}
        <div className="flex items-center gap-2.5 pt-1">
          {/* Show Answer Button */}
          <button
            type="button"
            onClick={handleShowAnswer}
            disabled={!selectedAnswer || showAnswer}
            className={`flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              selectedAnswer && !showAnswer
                ? "bg-white dark:bg-neutral-scale1300 border-2 border-primery-600 dark:border-sky-400 text-primery-700 dark:text-sky-300 hover:bg-primery-50 dark:hover:bg-sky-950/40 active:scale-95 shadow-xs"
                : "bg-neutral-100 dark:bg-neutral-scale1200 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-scale1000 cursor-not-allowed opacity-60"
            }`}
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span>{t("showAnswer")}</span>
          </button>

          {/* AI Explanation Button */}
          <button
            type="button"
            onClick={handleShowExplanation}
            disabled={!showAnswer}
            className={`flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              showAnswer
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 hover:brightness-105 active:scale-95"
                : "bg-neutral-100 dark:bg-neutral-scale1200 text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-scale1000 cursor-not-allowed opacity-60"
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>{loadingExplanation ? t("gettingExplanation") : t("explainAnswer")}</span>
          </button>
        </div>

        {/* AI Explanation Accordion (Smooth Grid Motion) */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showExplanation
              ? "grid-rows-[1fr] opacity-100 mt-1"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="bg-gradient-to-br from-amber-50/80 via-white to-sky-50/50 dark:from-neutral-scale1300 dark:via-neutral-scale1200 dark:to-neutral-scale1300 rounded-2xl border border-amber-200/80 dark:border-amber-500/25 p-4 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>{t("aiExplanationTitle")}</span>
              </div>

              {loadingExplanation ? (
                <div className="py-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <span>{t("gettingExplanation")}</span>
                </div>
              ) : (
                <p
                  className={`text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-200 pt-1 ${
                    isPersianText(explanation)
                      ? "fa-body font-vazir text-right"
                      : "en-body font-inter text-left"
                  }`}
                  dir={isPersianText(explanation) ? "rtl" : "ltr"}
                >
                  {explanation}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- Sticky Bottom Navigation ----------------- */}
      <footer className="sticky bottom-0 z-30 w-full bg-white/90 dark:bg-neutral-scale1300/90 backdrop-blur-md border-t border-neutral-scale200 dark:border-neutral-scale1100 p-3.5 flex items-center justify-between gap-3 shadow-lg">
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="h-11 px-4.5 rounded-xl border border-neutral-200 dark:border-neutral-scale1000 text-neutral-700 dark:text-neutral-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-scale1200 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isRTL ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          <span>{t("previous")}</span>
        </button>

        {/* Next / Finish Button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedAnswer}
          className={`flex-1 h-11 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md ${
            currentQuestionIndex === totalQuestions - 1
              ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/25"
              : "bg-primery-700 hover:bg-primery-800 dark:bg-primery-600 dark:hover:bg-primery-700 shadow-primery-700/20"
          }`}
        >
          <span>
            {currentQuestionIndex === totalQuestions - 1
              ? t("finishQuiz")
              : t("next")}
          </span>
          {currentQuestionIndex === totalQuestions - 1 ? (
            <Award className="w-4 h-4 shrink-0" />
          ) : (
            isRTL ? <ChevronLeft className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />
          )}
        </button>
      </footer>

      {/* ----------------- Telegram Exit Confirmation Dialog ----------------- */}
      {showExitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[320px] rounded-3xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="space-y-1 pt-1">
              <h3
                className={`text-sm font-bold text-neutral-900 dark:text-neutral-100 ${
                  isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
                }`}
              >
                {t("exitQuizTitle")}
              </h3>
              <p
                className={`text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed ${
                  isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
                }`}
              >
                {t("exitQuizSubtitle")}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirmation(false)}
                className="flex-1 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-scale1200 hover:bg-neutral-200 dark:hover:bg-neutral-scale1100 text-neutral-700 dark:text-neutral-300 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={handleExitQuiz}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs active:scale-95 transition-all cursor-pointer shadow-sm shadow-rose-500/25"
              >
                {t("confirmExit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
