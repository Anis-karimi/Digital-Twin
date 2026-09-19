import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import background from "@/assets/images/Quiz-Background.jpg";
import { ArrowLeft } from "lucide-react";

export const ReviewAnswers = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHandlingBackRef = useRef(false);
  useEffect(() => {
    const handlePopState = () => {
      if (isHandlingBackRef.current) {
        isHandlingBackRef.current = false;
        return;
      }

      // Back گوشی / مرورگر در Review
      // → برگرد به Quiz Result
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
  }, [navigate, location.state]);

  const isPersianText = (text) => {
    return /[\u0600-\u06FF]/.test(String(text || ""));
  };

  const quizData = location.state?.quizData || [];
  const selectedAnswers = location.state?.selectedAnswers || {};

  // ذخیره وضعیت باز/بسته بودن Explanation برای هر سوال
  const [openExplanations, setOpenExplanations] = useState({});

  const toggleExplanation = (questionIndex) => {
    setOpenExplanations((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  // تبدیل گزینه‌های API به فرمت استاندارد
  const normalizeOptions = (options = []) => {
    return options.map((option, index) => {
      // اگر API آبجکت برگرداند
      if (typeof option === "object" && option !== null) {
        return {
          letter: option.letter || String.fromCharCode(65 + index),
          text: option.text || option.answer || "",
        };
      }

      const optionText = String(option);

      // تشخیص A) / A. / A- / A:
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

  // پیدا کردن جواب صحیح
  const getCorrectAnswerLetter = (question, options) => {
    const rawAnswer = question.answer;

    if (!rawAnswer) return "";

    const answerString = String(rawAnswer).trim();

    // اگر answer خودش A/B/C/D باشد
    const letterMatch = answerString.match(/^([A-Da-d])(?:[\)\.\-:]|\s|$)/);

    if (letterMatch) {
      return letterMatch[1].toUpperCase();
    }

    // اگر answer متن کامل گزینه باشد
    const matchingOption = options.find(
      (option) =>
        option.text.trim().toLowerCase() === answerString.toLowerCase(),
    );

    if (matchingOption) {
      return matchingOption.letter;
    }

    return answerString.charAt(0).toUpperCase();
  };

  // اگر سوالی وجود نداشت
  if (quizData.length === 0) {
    return (
      <main className="w-full md:w-[360px] min-h-dvh mx-auto relative">
        <section className="relative w-full min-h-dvh overflow-hidden">
          <img
            src={background}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />

          <div className="relative z-10 min-h-dvh flex flex-col items-center justify-center px-5">
            <p className="en-body text-black text-center">
              No quiz answers found.
            </p>

            <button
              type="button"
              onClick={() => navigate("/Quiz-result")}
              className="mt-5 h-[40px] px-5 rounded-[10px] bg-primery-700 text-white"
            >
              Back
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className="w-full md:w-[360px] min-h-dvh mx-auto relative"
      aria-labelledby="review-answers-title"
    >
      <section className="relative w-full min-h-dvh bg-white overflow-hidden">
        {/* Background */}
        <img
          src={background}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />

        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 h-[60px] flex items-center px-5 bg-white/70 backdrop-blur-[4px] border-b border-[#d8e8f1]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-[32px] h-[32px] flex items-center justify-center rounded-full hover:bg-white/70 transition"
            aria-label="Go back"
          >
            <ArrowLeft
              size={22}
              strokeWidth={2}
              className="text-neutral-scale1300"
            />
          </button>

          <h1
            id="review-answers-title"
            className="ml-4 en-title-1 leading-none text-primery-900"
          >
            Review Answers
          </h1>
        </header>

        {/* Questions */}
        <div className="relative z-10 pt-[80px] pb-[30px] px-5 h-dvh overflow-y-auto">
          <div className="flex flex-col gap-[20px]">
            {quizData.map((question, questionIndex) => {
              const options = normalizeOptions(question.options || []);

              const selectedAnswer = selectedAnswers[questionIndex] || "";

              const correctAnswer = getCorrectAnswerLetter(question, options);

              const explanationOpen = openExplanations[questionIndex] || false;

              return (
                <article
                  key={question.id || questionIndex}
                  className="w-full rounded-[14px] bg-white/90 backdrop-blur-[3px] border border-[#d8e8f1] shadow-[0_3px_12px_rgba(0,0,0,0.08)] px-[15px] py-[17px]"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3">
                    <h2
                      className={`flex-1 text-black leading-[1.4] ${
                        isPersianText(question.question)
                          ? "fa-title-3 text-right"
                          : "en-title-3 text-left"
                      }`}
                      dir={isPersianText(question.question) ? "rtl" : "ltr"}
                    >
                      {questionIndex + 1}. {question.question}
                    </h2>

                    <span className="flex-shrink-0 text-[11px] text-[#00000080] mt-[3px]">
                      {questionIndex + 1}/{quizData.length}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-[9px] mt-[18px]">
                    {options.map((option) => {
                      const isSelected = option.letter === selectedAnswer;
                      const isCorrectOption = option.letter === correctAnswer;
                      const isPersian = isPersianText(option.text);

                      let optionClass =
                        "border-neutral-scale200 bg-neutral-scale100";

                      if (isCorrectOption) {
                        optionClass = "border-[#63b867] bg-[#f2fbf2]";
                      } else if (isSelected && !isCorrectOption) {
                        optionClass = "border-[#e57373] bg-[#fff5f5]";
                      }

                      return (
                        <div
                          key={option.letter}
                          className={`flex items-center gap-2.5 min-h-[40px] px-2.5 py-2 border rounded-[7px] ${optionClass}`}
                        >
                          {/* Letter */}
                          <span
                            className={`flex flex-shrink-0 w-[21px] h-[21px] items-center justify-center bg-white rounded-[4px] border border-[#e5e5e5] ${
                              isPersian ? "order-last" : "order-first"
                            }`}
                          >
                            <span className="text-[12px] font-semibold text-black">
                              {option.letter}
                            </span>
                          </span>

                          {/* Text */}
                          <span
                            className={`flex-1 text-black leading-[1.4] ${
                              isPersian
                                ? "fa-body text-right"
                                : "en-body text-left"
                            }`}
                          >
                            {option.text}
                          </span>

                          {/* Correct / Wrong */}
                          {isCorrectOption && (
                            <span
                              className={`text-[#4db151] text-[13px] font-bold ${
                                isPersian ? "order-first" : "order-last"
                              }`}
                            >
                              ✓
                            </span>
                          )}

                          {isSelected && !isCorrectOption && (
                            <span
                              className={`text-[#d9534f] text-[13px] font-bold ${
                                isPersian ? "order-first" : "order-last"
                              }`}
                            >
                              ✕
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explain Button */}
                  <button
                    type="button"
                    onClick={() => toggleExplanation(questionIndex)}
                    className="w-full h-[38px] mt-[15px] rounded-[8px] bg-white border border-primery-700 text-primery-700 text-[13px] font-medium transition hover:bg-[#f4f9fc]"
                  >
                    {explanationOpen ? "Hide Explanation" : "Explain Answer"}
                  </button>

                  {/* Temporary Explanation */}
                  {explanationOpen && (
                    <div className="mt-[12px] px-3 py-3 rounded-[8px] bg-[#f5f9fc] border border-[#d8e8f1]">
                      <p
                        className={`text-[13px] text-black leading-[1.5] text-center ${
                          isPersianText(
                            "This is a temporary explanation for preview purposes. The real explanation will be provided by the AI when the explanation API is connected.",
                          )
                            ? "fa-body"
                            : "en-body"
                        }`}
                      >
                        This is a temporary explanation for preview purposes.
                        The real explanation will be provided by the AI when the
                        explanation API is connected.
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};
