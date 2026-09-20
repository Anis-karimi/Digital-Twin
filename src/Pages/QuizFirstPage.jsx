import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import background from "@/assets/images/Quiz-Background.jpg";
import CloseIcon from "@/assets/icons/X.svg?react";
import { quizApi } from "@/api";
import "@/styles/fonts.css";

const fieldClassName =
  "relative self-stretch w-full h-[41px] bg-white rounded-[10px] border-[3px] border-solid border-primery-700 px-3 text-black focus:ring-2 focus:ring-primery-300";

const labelClassName =
  "relative self-stretch mt-[-1.00px] bg-[linear-gradient(90deg,rgba(20,96,133,1)_0%,rgba(0,0,0,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] en-title-2 text-transparent";

export const QuizFirstPage = ({ language }) => {
  const { selectedResources } = useContext(AppContext);

  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("0");
  const [difficulty, setDifficulty] = useState(50);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();

  const isPersianText = (text) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  const generateQuiz = async () => {
    if (!topic.trim() || !questionCount || Number(questionCount) === 0) {
      setSubmissionMessage("Please enter a topic and number of questions.");
      return;
    }

    setProcessing(true);
    setSubmissionMessage("⏳ Generating quiz...");

    try {
      const contextsString =
        selectedResources && selectedResources.length > 0
          ? selectedResources.join(",")
          : "";

      // Convert slider value to target API difficulty
      const quizDifficulty =
        difficulty <= 33 ? "easy" : difficulty >= 67 ? "hard" : "normal";

      const rawQuiz = await quizApi.generateQuiz({
        topic,
        count: parseInt(questionCount, 10),
        difficulty: quizDifficulty,
        contexts: contextsString,
        language: language || "en",
        llmModel: "gemma4",
      });

      if (!Array.isArray(rawQuiz) || rawQuiz.length === 0) {
        throw new Error("No quiz questions were generated.");
      }

      setSubmissionMessage(
        `✅ Quiz generated successfully! (${rawQuiz.length} questions)`,
      );

      // Navigate to QuizQuestionsPage with real questions
      navigate("/QuizQuestionsPage", {
        replace: true,
        state: {
          quizData: rawQuiz,
        },
      });
    } catch (err) {
      console.error("❌ Error fetching quiz:", err);

       setSubmissionMessage(
         "Something went wrong while generating the quiz. Please try again.",
       );
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await generateQuiz();
  };

  return (
    <main
      className="w-full md:w-[360px] min-h-dvh justify-center mx-auto"
      aria-labelledby="quiz-title"
    >
      <section className="w-full min-h-dvh relative bg-white overflow-y-auto overflow-x-hidden">
        <img
          src={background}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />

        <h1
          id="quiz-title"
          className="absolute top-[100px] right-10  w-full text-center font-bold text-[48px] leading-[1.05] bg-[linear-gradient(90deg,rgba(144,207,238,1)_0%,rgba(27,128,177,1)_30%,rgba(163,100,253,1)_65%,rgba(252,72,255,1)_90%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] text-transparent"
        >
          <span className="block mق-[130px]">AI Quiz</span>
          <span className="block mt-[15px] ml-[130px]">Generator</span>
        </h1>

        <form
          className="flex flex-col w-[83.33%] max-w-[300px] items-start gap-[25px] absolute top-[299px] left-1/2 -translate-x-1/2"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="text-left flex flex-col items-start gap-[5px] relative self-stretch w-full flex-[0_0_auto]">
            <label className={labelClassName} htmlFor="quiz-topic">
              Topic
            </label>

            <input
              id="quiz-topic"
              className={`${fieldClassName} ${
                isPersianText(topic)
                  ? "fa-body-large text-right"
                  : "en-body-large text-left"
              }`}
              type="text"
              dir={isPersianText(topic) ? "rtl" : "ltr"}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              aria-describedby="form-status"
            />
          </div>

          <div className="text-left flex flex-col items-start gap-[5px] relative self-stretch w-full flex-[0_0_auto]">
            <label className={labelClassName} htmlFor="question-count">
              Number
            </label>

            <div className="relative w-full">
              <input
                id="question-count"
                className={fieldClassName}
                type="number"
                min="0"
                step="1"
                value={questionCount}
                onChange={(event) => {
                  const value = event.target.value;

                  if (value === "" || Number(value) >= 0) {
                    setQuestionCount(value);
                  }
                }}
                aria-describedby="form-status"
              />

              <div className="absolute right-3 top-5 -translate-y-1/2 flex flex-row gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setQuestionCount((prev) => String(Number(prev || 0) + 1))
                  }
                  className="w-5 h-5 flex items-center justify-center text-neutral-scale1400 text-[11px] leading-none bg-neutral-scale200 rounded-[4px] hover:bg-neutral-scale400"
                  aria-label="Increase number of questions"
                >
                  ▲
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuestionCount((prev) =>
                      String(Math.max(0, Number(prev || 0) - 1)),
                    )
                  }
                  className="w-5 h-5 flex items-center justify-center text-neutral-scale1400 text-[11px] leading-none bg-neutral-scale200 rounded-[4px] hover:bg-neutral-scale400"
                  aria-label="Decrease number of questions"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          <fieldset className="relative self-stretch w-full h-[89px] border-0 p-0 m-0">
            <legend className="absolute text-left top-1.5 left-0 w-[300px] bg-[linear-gradient(90deg,rgba(20,96,133,1)_0%,rgba(0,0,0,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] font-EN-inter-titles-2 font-[number:var(--EN-inter-titles-2-font-weight)] text-transparent text-[length:var(--EN-inter-titles-2-font-size)] tracking-[var(--EN-inter-titles-2-letter-spacing)] leading-[var(--EN-inter-titles-2-line-height)] [font-style:var(--EN-inter-titles-2-font-style)]">
              Difficulty
            </legend>

            <div className="absolute top-10 left-0 w-[300px] h-2.5 rounded-[10px] bg-[linear-gradient(90deg,rgba(30,255,0,1)_0%,rgba(0,178,255,1)_50%,rgba(255,0,72,1)_100%)]" />

            <input
              className="absolute top-[34px] left-0 z-10 w-[300px] h-[22px] cursor-pointer opacity-0"
              type="range"
              min="0"
              max="100"
              step="50"
              value={difficulty}
              onChange={(event) => setDifficulty(Number(event.target.value))}
              aria-label="Quiz difficulty"
            />

            <div
              className="absolute top-[34px] w-[22px] h-[22px]  bg-[#fffcfc] rounded-[23px] border border-solid border-black pointer-events-none"
              style={{ left: `calc(${difficulty}% - 11px)` }}
              aria-hidden="true"
            />

            <span className="absolute top-[60px] left-0 en-caption-3 text-black whitespace-nowrap">
              Easy
            </span>

            <span className="absolute top-[60px] left-[133px] en-caption-3 text-black whitespace-nowrap">
              Normal
            </span>

            <span className="absolute top-[60px] left-[277px] en-caption-3 text-black whitespace-nowrap">
              Hard
            </span>
          </fieldset>

          <button
            className="flex w-[81.67%] h-[45px] mt-[15px] self-center items-center justify-center gap-2.5 px-0 py-2.5 bg-primery-700 rounded-[10px]"
            type="submit"
            disabled={processing}
          >
            <span className="relative w-fit mt-[-3.00px] mix-blend-hard-light en-title-1 text-white whitespace-nowrap">
              Generate Quiz
            </span>
          </button>

          {submissionMessage && !processing && (
            <div className="w-[81.67%] self-center mt-[-10px] px-3 py-2 rounded-[8px] border border-[#f0d6d6] bg-[#fff8f8]">
              <p className="en-caption-3 text-[#b94a48] text-center leading-[1.4]">
                {submissionMessage}
              </p>
            </div>
          )}
        </form>

        <p id="form-status" className="sr-only" aria-live="polite">
          {submissionMessage}
        </p>

        <button
          type="button"
          onClick={() => {
            const savedReturn = sessionStorage.getItem("quizReturnToChat");

            if (savedReturn) {
              try {
                const returnData = JSON.parse(savedReturn);

                navigate(returnData.chatPath, {
                  state: {
                    backTo: returnData.chatBackTo,
                  },
                  replace: true,
                });

                return;
              } catch (error) {
                console.error("Invalid quiz return data:", error);

                // Fallback for backward compatibility with legacy return data
                navigate(savedReturn, { replace: true });
                return;
              }
            }

            navigate("/", { replace: true });
          }}
          className="absolute top-[20px] left-[20px] z-50 w-[32px] h-[32px] flex items-center justify-center"
          aria-label="Close quiz"
        >
          <CloseIcon className="w-[12px] h-[20px]" />
        </button>

        {/* Generating Quiz Loading */}
        {processing && (
          <div
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]"
            aria-live="polite"
            aria-label="Generating quiz"
          >
            <div className="w-[55px] h-[55px] rounded-full border-[5px] border-neutral-scale300 border-t-primery-700 animate-spin" />

            <span className="mt-[18px] en-title-2 text-primery-700">
              Generating quiz...
            </span>

            <span className="mt-[5px] en-caption-3 text-neutral-scale1000">
              Please wait
            </span>
          </div>
        )}
      </section>
    </main>
  );
};