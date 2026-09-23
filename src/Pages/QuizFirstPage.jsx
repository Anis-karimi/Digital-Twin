import { useState, useContext, useId } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { quizApi } from "@/api";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  ListOrdered,
  Plus,
  Minus,
  Gauge,
  FileText,
  Loader2,
  AlertCircle,
  BrainCircuit,
} from "lucide-react";
import "@/styles/fonts.css";

export const QuizFirstPage = ({ language: propLanguage }) => {
  const {
    language: contextLang,
    isRTL,
    t,
    selectedResources,
  } = useContext(AppContext);

  const activeLanguage = propLanguage || contextLang || "fa";
  const navigate = useNavigate();
  const inputId = useId();

  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState("normal"); // 'easy' | 'normal' | 'hard'
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  const isPersianText = (text) => /[\u0600-\u06FF]/.test(String(text || ""));

  const difficultyLevels = [
    {
      id: "easy",
      label: t("easy"),
      activeBg: "bg-emerald-500 shadow-emerald-500/25",
      dotColor: "bg-emerald-500",
    },
    {
      id: "normal",
      label: t("normal"),
      activeBg: "bg-blue-500 shadow-blue-500/25",
      dotColor: "bg-blue-500",
    },
    {
      id: "hard",
      label: t("hard"),
      activeBg: "bg-rose-500 shadow-rose-500/25",
      dotColor: "bg-rose-500",
    },
  ];

  const difficultyIndex =
    difficulty === "easy" ? 0 : difficulty === "normal" ? 1 : 2;
  const currentLevel = difficultyLevels[difficultyIndex] || difficultyLevels[1];

  const handleClose = () => {
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
        navigate(savedReturn, { replace: true });
        return;
      }
    }
    navigate("/", { replace: true });
  };

  const handleCountChange = (delta) => {
    const current = parseInt(questionCount, 10) || 0;
    const next = Math.max(1, Math.min(30, current + delta));
    setQuestionCount(String(next));
  };

  const generateQuiz = async () => {
    const parsedCount = parseInt(questionCount, 10);
    if (!topic.trim() || !parsedCount || parsedCount <= 0) {
      setSubmissionMessage(t("quizTopicRequired"));
      return;
    }

    setProcessing(true);
    setSubmissionMessage("");

    try {
      const contextsString =
        selectedResources && selectedResources.length > 0
          ? selectedResources.join(",")
          : "";

      // Preserved exact backend request signature & payload
      const rawQuiz = await quizApi.generateQuiz({
        topic: topic.trim(),
        count: parsedCount,
        difficulty,
        contexts: contextsString,
        language: activeLanguage || "en",
        llmModel: "gemma4",
      });

      if (!Array.isArray(rawQuiz) || rawQuiz.length === 0) {
        throw new Error("No quiz questions were generated.");
      }

      // Navigate to QuizQuestionsPage with identical payload state
      navigate("/QuizQuestionsPage", {
        replace: true,
        state: {
          quizData: rawQuiz,
        },
      });
    } catch (err) {
      console.error("❌ Error fetching quiz:", err);
      setSubmissionMessage(t("quizError"));
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await generateQuiz();
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <main
      className="w-full md:w-[420px] min-h-dvh mx-auto flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 transition-colors duration-200 select-none overflow-x-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ----------------- Telegram App Header ----------------- */}
      <header className="sticky top-0 z-40 w-full h-[60px] bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1100 flex items-center justify-between px-3 text-white shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handleClose}
            aria-label={t("closeQuiz")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer shrink-0"
          >
            <BackIcon className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <h1
              className={`text-sm font-semibold truncate ${
                isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
              }`}
            >
              {t("quizGenerator")}
            </h1>
            <span
              className={`text-[11px] text-white/70 truncate ${
                isRTL ? "fa-caption-4 font-vazir" : "en-caption-4 font-inter"
              }`}
            >
              {t("aiAssistant")}
            </span>
          </div>
        </div>


      </header>

      {/* ----------------- Content Body ----------------- */}
      <section className="flex-1 px-3.5 py-4 flex flex-col gap-3.5 overflow-y-auto">
        {/* Telegram Hero / Bot Card */}
        <div className="w-full bg-white dark:bg-neutral-scale1300 rounded-2xl border border-neutral-scale200 dark:border-neutral-scale1100 p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primery-700 via-primery-600 to-sky-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-primery-700/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2
              className={`text-sm font-bold text-neutral-900 dark:text-neutral-100 ${
                isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
              }`}
            >
              {t("quizGenerator")}
            </h2>
            <p
              className={`text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed ${
                isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
              }`}
            >
              {t("quizSubtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Card 1: Topic */}
          <div className="w-full bg-white dark:bg-neutral-scale1300 rounded-2xl border border-neutral-scale200 dark:border-neutral-scale1100 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor={inputId}
                className={`flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 ${
                  isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter"
                }`}
              >
                <BookOpen className="w-4 h-4 text-primery-700 dark:text-sky-400" />
                <span>{t("quizTopic")}</span>
              </label>

              {topic && (
                <button
                  type="button"
                  onClick={() => setTopic("")}
                  className="text-[11px] text-neutral-400 hover:text-red-500 cursor-pointer transition-colors"
                >
                  {isRTL ? "پاک کردن" : "Clear"}
                </button>
              )}
            </div>

            <div className="relative w-full">
              <input
                id={inputId}
                type="text"
                dir={isPersianText(topic) ? "rtl" : isRTL ? "rtl" : "ltr"}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t("quizTopicPlaceholder")}
                className={`w-full rounded-xl bg-neutral-50 dark:bg-neutral-scale1200 border border-neutral-200 dark:border-neutral-scale1000 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primery-500/30 focus:border-primery-600 transition-all ${
                  isPersianText(topic) || isRTL
                    ? "font-vazir text-right"
                    : "font-inter text-left"
                }`}
              />
            </div>
          </div>

          {/* Card 2: Question Count */}
          <div className="w-full bg-white dark:bg-neutral-scale1300 rounded-2xl border border-neutral-scale200 dark:border-neutral-scale1100 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 ${
                  isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter"
                }`}
              >
                <ListOrdered className="w-4 h-4 text-primery-700 dark:text-sky-400" />
                <span>{t("quizQuestionCount")}</span>
              </span>

              <span className="text-xs font-bold text-primery-700 dark:text-sky-400">
                {questionCount} {t("questionsSuffix")}
              </span>
            </div>

            {/* Telegram Counter Stepper */}
            <div className="flex items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-scale1200 p-2 rounded-xl border border-neutral-200 dark:border-neutral-scale1000">
              <button
                type="button"
                onClick={() => handleCountChange(-1)}
                className="w-9 h-9 rounded-lg bg-white dark:bg-neutral-scale1300 border border-neutral-200 dark:border-neutral-scale1000 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-scale1100 active:scale-95 transition-all shadow-xs cursor-pointer"
                aria-label="Decrease question count"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={questionCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || (Number(val) >= 1 && Number(val) <= 30)) {
                      setQuestionCount(val);
                    }
                  }}
                  className="w-16 text-center bg-transparent text-lg font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleCountChange(1)}
                className="w-9 h-9 rounded-lg bg-white dark:bg-neutral-scale1300 border border-neutral-200 dark:border-neutral-scale1000 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-scale1100 active:scale-95 transition-all shadow-xs cursor-pointer"
                aria-label="Increase question count"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Card 3: Difficulty Segmented Control (Telegram Poll Style with Sliding Motion) */}
          <div className="w-full bg-white dark:bg-neutral-scale1300 rounded-2xl border border-neutral-scale200 dark:border-neutral-scale1100 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 ${
                  isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter"
                }`}
              >
                <Gauge className="w-4 h-4 text-primery-700 dark:text-sky-400" />
                <span>{t("quizDifficulty")}</span>
              </span>
            </div>

            {/* Segmented Switcher with sliding motion indicator */}
            <div className="relative flex items-center bg-neutral-100 dark:bg-neutral-scale1200 p-1 rounded-xl border border-neutral-200 dark:border-neutral-scale1000 select-none">
              {/* Sliding Highlight Indicator Box */}
              <div
                className={`absolute top-1 bottom-1 w-[calc((100%-8px)/3)] rounded-lg transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${currentLevel.activeBg} shadow-sm pointer-events-none`}
                style={{
                  transform: isRTL
                    ? `translateX(${difficultyIndex * -100}%)`
                    : `translateX(${difficultyIndex * 100}%)`,
                  right: isRTL ? "4px" : "auto",
                  left: isRTL ? "auto" : "4px",
                }}
              />

              {difficultyLevels.map((lvl) => {
                const isSelected = difficulty === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setDifficulty(lvl.id)}
                    className={`relative z-10 flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                      isSelected
                        ? "text-white"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                        isSelected ? "bg-white" : lvl.dotColor
                      }`}
                    />
                    <span>{lvl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: Selected Resources (if any) */}
          {selectedResources && selectedResources.length > 0 && (
            <div className="w-full bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-900/50 p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-sky-900 dark:text-sky-200 block truncate">
                  {t("attachedResources")}
                </span>
                <span className="text-[11px] text-sky-700 dark:text-sky-400">
                  {selectedResources.length} {isRTL ? "مورد متصل" : "items attached"}
                </span>
              </div>
            </div>
          )}

          {/* Submission Error Message */}
          {submissionMessage && !processing && (
            <div className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submissionMessage}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2 pb-6">
            <button
              type="submit"
              disabled={processing || !topic.trim()}
              className="w-full h-12 rounded-xl bg-primery-700 hover:bg-primery-800 dark:bg-primery-600 dark:hover:bg-primery-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-primery-700/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t("generateQuiz")}</span>
            </button>
          </div>
        </form>
      </section>

      {/* ----------------- Telegram Loading Overlay ----------------- */}
      {processing && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          aria-live="polite"
        >
          <div className="w-[85%] max-w-[320px] bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-3.5">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primery-50 dark:bg-primery-950/40 text-primery-700 dark:text-sky-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <Sparkles className="w-4 h-4 absolute top-2 right-2 text-amber-400" />
            </div>

            <div className="flex flex-col gap-1">
              <h3
                className={`text-sm font-bold text-neutral-900 dark:text-neutral-100 ${
                  isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"
                }`}
              >
                {t("generatingQuiz")}
              </h3>
              <p
                className={`text-xs text-neutral-500 dark:text-neutral-400 ${
                  isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
                }`}
              >
                {t("pleaseWait")}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default QuizFirstPage;