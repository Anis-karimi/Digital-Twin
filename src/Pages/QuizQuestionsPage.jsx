import { useEffect, useState, useRef } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import background from "@/assets/images/Quiz-Background.jpg";
import CloseIcon from "@/assets/icons/X.svg?react";
import { quizApi } from "@/api";

export const QuizQuestionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

 const handleExitQuiz = () => {
    // Flag to the back handler that this is an intentional exit
    isExitingQuizRef.current = true;

    const savedReturn = sessionStorage.getItem("quizReturnToChat");

    if (savedReturn) {
      try {
        const returnData = JSON.parse(savedReturn);

        // Standard flow: Home -> TeacherLessons -> Chat -> QuizQuestions -> Guard
        // With history.go(-2): Guard -> QuizQuestions -> Chat
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

  

  const isPersianText = (text) => {
    return /[\u0600-\u06FF]/.test(String(text || ""));
  };

  // Retrieve generated questions passed from QuizFirstPage
  const quizData = location.state?.quizData || [];

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

  const totalQuestions = quizData.length;

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const isHandlingBackRef = useRef(false);
  const isExitingQuizRef = useRef(false);
  const isFinishingQuizRef = useRef(false);
  const pendingResultRef = useRef(null);

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
      <main className="w-full md:w-[360px] min-h-dvh mx-auto relative">
        <section className="relative w-full min-h-dvh bg-white overflow-x-hidden">
          <img
            className="absolute inset-0 w-full h-full object-cover"
            alt=""
            src={background}
            aria-hidden="true"
          />

          <div className="relative z-10 min-h-dvh flex items-center justify-center px-5">
            <p className="en-body text-black text-center">
              No quiz questions found.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const currentQuestion = quizData[currentQuestionIndex];

  // Selected option for current question (preserves answer when navigating between questions)
  const selectedAnswer = selectedAnswers[currentQuestionIndex] || "";

  // Has "Show Answer" been clicked for the current question
  const showAnswer = answeredQuestions[currentQuestionIndex] || false;

  // Should explanation be visible for current question
  const showExplanation = showExplanations[currentQuestionIndex] || false;

  // Explanation text for current question
  const explanation = explanations[currentQuestionIndex] || "";

  // Loading state for current question explanation
  const loadingExplanation = loadingExplanations[currentQuestionIndex] || false;

  // Normalize options array from API into structured { id, letter, text } objects
  const normalizedAnswers = (currentQuestion.options || []).map(
    (option, index) => {
      // If API returned an object
      if (typeof option === "object" && option !== null) {
        return {
          id: option.id || String(index),
          letter: option.letter || String.fromCharCode(65 + index),
          text: option.text || option.answer || "",
        };
      }

      // If API returned a plain string
      const optionText = String(option);

      // Detect prefix letter patterns like A) / A. / A- / A:
      const letterMatch = optionText.match(/^\s*([A-Da-d])\s*[)\.\-:]\s*/);

      if (letterMatch) {
        return {
          id: String(index),
          letter: letterMatch[1].toUpperCase(),
          text: optionText.replace(letterMatch[0], "").trim(),
        };
      }

      // Fallback if no prefix exists
      return {
        id: String(index),
        letter: String.fromCharCode(65 + index),
        text: optionText,
      };
    },
  );

  // Convert API correct answer representation to A/B/C/D letter
  const getCorrectAnswerLetter = () => {
    const rawAnswer = currentQuestion.answer;

    if (!rawAnswer) return "";

    const answerString = String(rawAnswer).trim();

    // If answer is already a direct letter (e.g., 'A', 'B')
    const letterMatch = answerString.match(/^([A-Da-d])(?:[)\.\-:]|\s|$)/);

    if (letterMatch) {
      return letterMatch[1].toUpperCase();
    }

    // If answer is the full string text of the matching option
    const matchingOption = normalizedAnswers.find(
      (option) =>
        option.text.trim().toLowerCase() === answerString.toLowerCase(),
    );

    if (matchingOption) {
      return matchingOption.letter;
    }

    // Fallback
    return answerString.charAt(0).toUpperCase();
  };

  const correctAnswer = getCorrectAnswerLetter();

  const progress =
    totalQuestions > 0
      ? ((currentQuestionIndex + 1) / totalQuestions) * 100
      : 0;

  const handleSelectAnswer = (answerLetter) => {
    // Prevent changing answer if already submitted via Show Answer
    if (showAnswer) return;

    // Save answer at current question index
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answerLetter,
    }));
  };

  const handleShowAnswer = () => {
    if (!selectedAnswer) return;

    // Mark current question as answered
    setAnsweredQuestions((prev) => ({
      ...prev,
      [currentQuestionIndex]: true,
    }));
  };

  const handleShowExplanation = async () => {
    if (!showAnswer) return;

    // Toggle visibility if explanation was already fetched
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

      const explanation = await quizApi.explainAnswer(currentQuestion.question);

      setExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: explanation || "No explanation available.",
      }));
    } catch (err) {
      console.error("Explain error:", err);

      setExplanations((prev) => ({
        ...prev,
        [currentQuestionIndex]: "⚠️ Error getting explanation.",
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
        const selectedAnswer = selectedAnswers[index];

        if (!selectedAnswer) return;

        // Determine correct answer for this question
        const rawAnswer = question.answer;

        if (!rawAnswer) return;

        const answerString = String(rawAnswer).trim();

        // Normalize options for this question
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

        let correctAnswer = "";

        // Check if answer is directly A/B/C/D
        const letterMatch = answerString.match(/^([A-Da-d])(?:[)\.\-:]|\s|$)/);

        if (letterMatch) {
          correctAnswer = letterMatch[1].toUpperCase();
        } else {
          // If answer is the full option text
          const matchingOption = normalizedOptions.find(
            (option) =>
              option.text.trim().toLowerCase() === answerString.toLowerCase(),
          );

          if (matchingOption) {
            correctAnswer = matchingOption.letter;
          } else {
            // fallback
            correctAnswer = answerString.charAt(0).toUpperCase();
          }
        }

        if (selectedAnswer === correctAnswer) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      });

      // Temporarily store quiz statistics in ref
      pendingResultRef.current = {
        correctCount,
        incorrectCount,
        totalQuestions,
        selectedAnswers,
        quizData,
      };

      // Signal back handler that this is not an exit, just clearing the extra history entry
      isFinishingQuizRef.current = true;

      // Pop guard and navigate to Quiz-result via popstate
      window.history.back();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const getAnswerClassName = (answerLetter) => {
    const isSelected = selectedAnswer === answerLetter;
    const isCorrect = correctAnswer === answerLetter;

    // Prior to Show Answer
    if (!showAnswer) {
      if (isSelected) {
        return "border-[#6aaee8] bg-[#f3f8fd]";
      }

      return "border-neutral-scale200 bg-neutral-scale100";
    }

    // After Show Answer - Correct option
    if (isCorrect) {
      return "border-[#63b867] bg-[#f2fbf2]";
    }

    // After Show Answer - Incorrect option selected
    if (isSelected && !isCorrect) {
      return "border-[#e57373] bg-[#fff5f5]";
    }

    return "border-neutral-scale200 bg-neutral-scale100";
  };

  return (
    <main
      className="w-full md:w-[360px] min-h-dvh mx-auto relative"
      aria-labelledby="quiz-question-title"
    >
      <section
        className="relative w-full min-h-dvh bg-white overflow-x-hidden"
        aria-label="Quiz question"
      >
        {/* Background */}
        <img
          className="absolute inset-0 w-full h-full object-cover"
          alt=""
          src={background}
          aria-hidden="true"
        />

        {/* Header / Progress */}
        <header className="absolute top-[30px] left-5 right-5 flex items-center gap-2.5">
          {/* Close */}
          <button
            type="button"
            className="relative w-3 h-[15px] flex-shrink-0"
            aria-label="Close quiz"
            onClick={() => setShowExitConfirmation(true)}
          >
            <CloseIcon className="w-[12px] h-[20px]" />
          </button>

          {/* Progress Bar */}
          <div
            className="relative flex-1 h-1.5 bg-[#d9d9d9] rounded-md overflow-hidden"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#4db151] rounded-md transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Percentage */}
          <span className="flex-shrink-0 en-caption-1 text-black whitespace-nowrap">
            {Math.round(progress)}%
          </span>
        </header>

        {/* Question + Answers */}
        <div className="absolute top-[100px] pb-[100px] left-5 right-5">
          {/* Question */}
          <div className="relative">
            <h1
              id="quiz-question-title"
              className={`text-black ${
                isPersianText(currentQuestion.question)
                  ? "fa-title-1 text-right"
                  : "en-title-1 text-left"
              }`}
              dir={isPersianText(currentQuestion.question) ? "rtl" : "ltr"}
            >
              {currentQuestion.question}{" "}
              <span
                className={
                  isPersianText(currentQuestion.question)
                    ? "fa-body text-[#000000b2] whitespace-nowrap"
                    : "en-body text-[#000000b2] whitespace-nowrap"
                }
              >
                {currentQuestionIndex + 1}/{totalQuestions}
              </span>
            </h1>
          </div>

          {/* Answers */}
          <fieldset
            className="mt-[45px] w-full flex flex-col gap-[15px]"
            aria-label="Answer choices"
          >
            <legend className="sr-only">Select an answer</legend>

            {normalizedAnswers.map((answer) => (
              <label
                key={answer.id}
                className={`flex w-full min-h-[42px] items-center gap-2.5 px-2 py-2 border rounded-[7px] cursor-pointer transition-all duration-200 ${getAnswerClassName(
                  answer.letter,
                )}`}
              >
                <input
                  type="radio"
                  name={`quiz-question-${
                    currentQuestion.id || currentQuestionIndex
                  }`}
                  value={answer.letter}
                  checked={selectedAnswer === answer.letter}
                  onChange={() => handleSelectAnswer(answer.letter)}
                  disabled={showAnswer}
                  className="sr-only"
                />

                {/* Letter */}
                <span
                  className={`flex flex-shrink-0 w-5 h-5 items-center justify-center bg-white rounded-[3px] ${
                    isPersianText(answer.text) ? "order-last" : "order-first"
                  }`}
                >
                  <span className="en-title-3 text-center">
                    {answer.letter}
                  </span>
                </span>

                {/* Answer Text */}
                <span
                  className={`flex-1 text-black ${
                    isPersianText(answer.text)
                      ? "fa-body text-right"
                      : "en-body text-left"
                  }`}
                  dir={isPersianText(answer.text) ? "rtl" : "ltr"}
                >
                  {answer.text}
                </span>

                {/* Correct indicator */}
                {showAnswer && answer.letter === correctAnswer && (
                  <span className="text-[#4db151] text-[12px] font-bold">
                    ✓
                  </span>
                )}

                {/* Wrong indicator */}
                {showAnswer &&
                  selectedAnswer === answer.letter &&
                  answer.letter !== correctAnswer && (
                    <span className="text-[#d9534f] text-[12px] font-bold">
                      ✕
                    </span>
                  )}
              </label>
            ))}
          </fieldset>

          {/* Answer Buttons */}
          <div className="flex items-center justify-center gap-3 mt-[25px]">
            <button
              type="button"
              onClick={handleShowAnswer}
              disabled={!selectedAnswer || showAnswer}
              className={`h-[38px] px-4 rounded-[8px] text-[13px] font-medium transition-all ${
                selectedAnswer && !showAnswer
                  ? "bg-primery-700 text-white cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Show Answer
            </button>

            <button
              type="button"
              onClick={handleShowExplanation}
              disabled={!showAnswer}
              className={`h-[38px] px-4 rounded-[8px] text-[13px] font-medium transition-all ${
                showAnswer
                  ? "bg-white border border-primery-700 text-primery-700 cursor-pointer"
                  : "bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed"
              }`}
            >
              {loadingExplanation ? "Loading..." : "Explain Answer"}
            </button>
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-[18px] px-3 py-3 bg-[#f5f9fc] border border-[#d8e8f1] rounded-[8px]">
              <p
                className={`text-black text-[13px] leading-[1.5] text-center ${
                  isPersianText(
                    loadingExplanation ? "Getting explanation..." : explanation,
                  )
                    ? "fa-body"
                    : "en-body"
                }`}
              >
                {loadingExplanation ? "Getting explanation..." : explanation}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="fixed bottom-5 left-5 right-5 flex items-center justify-between">
            {/* Previous */}
            {currentQuestionIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex min-w-[85px] h-[38px] items-center justify-center px-3 bg-primery-700 rounded-[10px] text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-primery-700 focus-visible:ring-offset-2"
                aria-label="Go to previous question"
              >
                <span className="en-body-medium">Previous</span>
              </button>
            ) : (
              <div />
            )}

            {/* Next / Finish */}
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedAnswer}
              className={`flex min-w-[70px] h-[38px] items-center justify-center px-3 rounded-[10px] cursor-pointer focus-visible:ring-2 focus-visible:ring-primery-700 focus-visible:ring-offset-2 ${
                selectedAnswer
                  ? "bg-primery-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              aria-label={
                currentQuestionIndex === totalQuestions - 1
                  ? "Finish quiz"
                  : "Go to next question"
              }
            >
              <span className="en-body-medium">
                {currentQuestionIndex === totalQuestions - 1
                  ? "Finish"
                  : "Next"}
              </span>
            </button>
          </div>
        </div>

        {showExitConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-5">
            <div className="w-full max-w-[320px] rounded-[12px] bg-white px-5 py-5 shadow-lg">
              <p className="en-title-3 text-center text-black">
                Are you sure you want to finish the quiz?
              </p>

              <p className="en-caption-1 text-center text-[#000000b2] mt-2">
                Your progress will be lost!
              </p>

              <div className="flex items-center justify-center gap-3 mt-5">
                {/* No */}
                <button
                  type="button"
                  onClick={() => setShowExitConfirmation(false)}
                  className="h-[38px] min-w-[80px] px-4 rounded-[8px] bg-gray-200 text-gray-700 text-[13px] font-medium"
                >
                  No
                </button>

                {/* Yes */}
                <button
                  type="button"
                  onClick={handleExitQuiz}
                  className="h-[38px] min-w-[80px] px-4 rounded-[8px] bg-primery-700 text-white text-[13px] font-medium"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
