import { useEffect, useRef, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AppContext } from "@/Context/AppContext";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Download,
  MessageSquare,
  ListChecks,
  Award,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "@/styles/fonts.css";

export const QuizResultPage = ({ onAction }) => {
  const { isRTL, t } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isHandlingBackRef = useRef(false);
  const isLeavingResultRef = useRef(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const isPersianText = (text) => /[\u0600-\u06FF]/.test(String(text || ""));

  useEffect(() => {
    // Create a new history entry to intercept browser Back button
    navigate(location.pathname + location.search + location.hash, {
      state: location.state,
    });

    const handlePopState = () => {
      // If exiting through "Back to Chat", allow standard navigation
      if (isLeavingResultRef.current) {
        isLeavingResultRef.current = false;
        return;
      }

      // When history.forward() was triggered programmatically
      if (isHandlingBackRef.current) {
        isHandlingBackRef.current = false;
        return;
      }

      // Keep user on the result page
      isHandlingBackRef.current = true;
      window.history.forward();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleBackToChat = () => {
    isLeavingResultRef.current = true;

    const savedReturn = sessionStorage.getItem("quizReturnToChat");

    if (savedReturn) {
      try {
        // Remove Result + Result Guard from history and navigate back to Chat
        window.history.go(-2);
        sessionStorage.removeItem("quizReturnToChat");
        return;
      } catch (error) {
        console.error("Invalid quiz return data:", error);
        navigate("/", { replace: true });
        return;
      }
    }

    navigate("/", { replace: true });
  };

  // Retrieve quiz evaluation stats from location state
  const {
    correctCount = 0,
    incorrectCount = 0,
    totalQuestions = 0,
    quizData = [],
    selectedAnswers = {},
  } = location.state || {};

  const totalAnswers = correctCount + incorrectCount;
  const unansweredCount = Math.max(0, totalQuestions - totalAnswers);

  const correctPercentage =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const incorrectPercentage =
    totalQuestions > 0
      ? Math.round((incorrectCount / totalQuestions) * 100)
      : 0;

  // Performance assessment message
  const getAssessment = () => {
    if (correctPercentage >= 80) {
      return {
        text: t("resultExcellent"),
        color: "text-emerald-600 dark:text-emerald-400",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40",
        ringColor: "#10b981",
      };
    }
    if (correctPercentage >= 50) {
      return {
        text: t("resultGood"),
        color: "text-sky-600 dark:text-sky-400",
        badgeBg: "bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40",
        ringColor: "#0284c7",
      };
    }
    return {
      text: t("resultNeedPractice"),
      color: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40",
      ringColor: "#f59e0b",
    };
  };

  const assessment = getAssessment();

  const handleDownload = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);

    try {
      const getOptionLetter = (option, optionIndex) => {
        if (typeof option === "object" && option !== null) {
          return option.letter || String.fromCharCode(65 + optionIndex);
        }
        const match = String(option).match(/^\s*([A-Da-d])[\)\.\-:]\s*/);
        if (match) {
          return match[1].toUpperCase();
        }
        return String.fromCharCode(65 + optionIndex);
      };

      const getOptionText = (option) => {
        if (typeof option === "object" && option !== null) {
          return option.text || option.answer || "";
        }
        return String(option).replace(/^\s*[A-Da-d][\)\.\-:]\s*/, "");
      };

      const getCorrectAnswerLetter = (question, options) => {
        const rawAnswer = question.answer ? String(question.answer).trim() : "";
        if (!rawAnswer) return "";

        const letterMatch = rawAnswer.match(/^([A-Da-d])(?:[\)\.\-:]|\s|$)/);
        if (letterMatch) {
          return letterMatch[1].toUpperCase();
        }

        const matchingOption = options.find(
          (opt) => opt.text.trim().toLowerCase() === rawAnswer.toLowerCase(),
        );
        if (matchingOption) {
          return matchingOption.letter;
        }

        return rawAnswer.charAt(0).toUpperCase();
      };

      // Temporary off-screen container for PDF capture
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "794px";
      container.style.background = "#ffffff";
      container.style.padding = "40px";
      container.style.boxSizing = "border-box";
      container.style.fontFamily = "Inter, Arial, sans-serif";
      container.style.color = "#000000";

      // Header
      const title = document.createElement("h1");
      title.textContent = t("quizResultTitle");
      title.style.fontSize = "22px";
      title.style.margin = "0 0 20px 0";
      title.style.fontWeight = "700";
      title.style.textAlign = isRTL ? "right" : "left";
      title.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
      title.dir = isRTL ? "rtl" : "ltr";
      container.appendChild(title);

      // Summary
      const summary = document.createElement("div");
      summary.style.fontSize = "13px";
      summary.style.marginBottom = "25px";
      summary.style.lineHeight = "1.9";
      summary.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
      summary.dir = isRTL ? "rtl" : "ltr";

      summary.innerHTML = `<div><strong>${t("totalQuestions")}:</strong> ${totalQuestions}</div>
           <div><strong>${t("correctCount")}:</strong> ${correctCount}</div>
           <div><strong>${t("incorrectCount")}:</strong> ${incorrectCount}</div>
           <div><strong>${t("accuracyRate")}:</strong> ${correctPercentage}%</div>`;

      container.appendChild(summary);

      // Table
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.tableLayout = "fixed";
      table.style.fontSize = "11px";
      table.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";

      // Table Header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      const headers = isRTL
        ? [t("result"), t("correctAnswer"), t("yourAnswer"), t("question")]
        : [t("question"), t("yourAnswer"), t("correctAnswer"), t("result")];

      headers.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.border = "1px solid #cccccc";
        th.style.padding = "8px";
        th.style.background = "#f2f2f2";
        th.style.fontWeight = "700";
        th.style.textAlign = isRTL ? "right" : "left";
        th.style.verticalAlign = "middle";
        headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Table Body
      const tbody = document.createElement("tbody");

      quizData.forEach((question, index) => {
        const options = (question.options || []).map((opt, optIndex) => ({
          letter: getOptionLetter(opt, optIndex),
          text: getOptionText(opt),
        }));

        const selectedAnswer = selectedAnswers[index] || t("unanswered");
        const correctAnswer = getCorrectAnswerLetter(question, options);

        const selectedOption = options.find((opt) => opt.letter === selectedAnswer);
        const correctOption = options.find((opt) => opt.letter === correctAnswer);

        const selectedAnswerText = selectedOption
          ? `${selectedAnswer}) ${selectedOption.text}`
          : selectedAnswer;

        const correctAnswerText = correctOption
          ? `${correctAnswer}) ${correctOption.text}`
          : correctAnswer;

        const questionText = `${index + 1}. ${question.question || ""}`;
        const isCorrect = selectedAnswer === correctAnswer;
        const resultText = isCorrect ? t("correct") : t("incorrect");

        const row = document.createElement("tr");
        const cells = isRTL
          ? [resultText, correctAnswerText, selectedAnswerText, questionText]
          : [questionText, selectedAnswerText, correctAnswerText, resultText];

        cells.forEach((text, cellIndex) => {
          const td = document.createElement("td");
          td.textContent = text;
          td.style.border = "1px solid #cccccc";
          td.style.padding = "8px";
          td.style.verticalAlign = "middle";
          td.style.lineHeight = "1.6";
          td.style.wordBreak = "break-word";

          if (isPersianText(text)) {
            td.dir = "rtl";
            td.style.textAlign = "right";
            td.style.fontFamily = "Vazirmatn, Arial, sans-serif";
          } else {
            td.dir = "ltr";
            td.style.textAlign = "left";
            td.style.fontFamily = "Inter, Arial, sans-serif";
          }

          const resultCellIndex = isRTL ? 0 : 3;
          if (cellIndex === resultCellIndex) {
            td.style.fontWeight = "700";
            td.style.color = isCorrect ? "#15803d" : "#be123c";
          }

          row.appendChild(td);
        });

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      container.appendChild(table);

      document.body.appendChild(container);

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imageHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      document.body.removeChild(container);
      pdf.save("quiz-result.pdf");
      setStatusMessage(t("pdfDownloadedSuccess"));
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleAction = (actionId) => {
    if (actionId === "download") {
      handleDownload();
      return;
    }
    if (actionId === "chat") {
      handleBackToChat();
      return;
    }
    if (actionId === "retry") {
      navigate("/QuizFirstPage");
      return;
    }
    if (actionId === "review") {
      navigate("/Review-Answers", {
        state: {
          quizData,
          selectedAnswers,
        },
      });
      return;
    }
    onAction?.(actionId);
  };

  const actionItems = [
    {
      id: "review",
      title: t("reviewAnswers"),
      subtitle: t("reviewAnswersSubtitle"),
      icon: ListChecks,
      iconBg: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40",
      primary: true,
    },
    {
      id: "retry",
      title: t("tryAgain"),
      subtitle: t("tryAgainSubtitle"),
      icon: RotateCcw,
      iconBg: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40",
      primary: false,
    },
    {
      id: "download",
      title: isDownloadingPdf ? t("downloadingPdf") : t("downloadPdf"),
      subtitle: t("downloadPdfSubtitle"),
      icon: isDownloadingPdf ? Loader2 : Download,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40",
      primary: false,
      loading: isDownloadingPdf,
    },
    {
      id: "chat",
      title: t("backToChat"),
      subtitle: t("backToChatSubtitle"),
      icon: MessageSquare,
      iconBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40",
      primary: false,
    },
  ];

  return (
    <main
      className="w-full md:w-[420px] min-h-dvh mx-auto flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 transition-colors duration-200 select-none overflow-x-hidden relative"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* ----------------- Telegram App Header ----------------- */}
      <header className="sticky top-0 z-40 w-full bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1100 text-white shadow-sm flex items-center justify-between px-3 h-[60px]">
        {/* Back / Return to Chat */}
        <button
          type="button"
          onClick={handleBackToChat}
          aria-label={t("backToChat")}
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
            {t("quizResultTitle")}
          </h1>
          <span className="text-[11px] text-white/80 font-medium">
            {totalQuestions} {t("questionsSuffix")}
          </span>
        </div>

        {/* Top Trophy Badge */}
        <div className="w-9 h-9 flex items-center justify-center text-amber-300">
          <Award className="w-5 h-5" />
        </div>
      </header>

      {/* ----------------- Body Content ----------------- */}
      <section className="flex-1 px-4 py-5 flex flex-col gap-4 overflow-y-auto pb-10">
        {/* Score & Evaluation Hero Card */}
        <div className="w-full bg-white dark:bg-neutral-scale1300 rounded-3xl border border-neutral-scale200 dark:border-neutral-scale1100 p-6 shadow-sm flex flex-col items-center text-center space-y-4 transition-all animate-in fade-in duration-300">
          {/* Conic Progress Score Ring */}
          <div
            className="relative w-36 h-36 rounded-full flex items-center justify-center p-2.5 shadow-inner transition-transform hover:scale-105 duration-300"
            style={{
              background: `conic-gradient(${assessment.ringColor} 0% ${correctPercentage}%, #e2e8f0 ${correctPercentage}% 100%)`,
            }}
          >
            {/* Center Circle */}
            <div className="w-full h-full bg-white dark:bg-neutral-scale1300 rounded-full flex flex-col items-center justify-center shadow-md p-2">
              <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                {correctPercentage}%
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-400 mt-0.5">
                {t("accuracyRate")}
              </span>
            </div>
          </div>

          {/* Assessment Feedback Badge */}
          <div
            className={`w-full py-2.5 px-4 rounded-2xl border text-xs sm:text-sm font-bold leading-relaxed ${assessment.badgeBg} ${assessment.color} ${
              isRTL ? "fa-body font-vazir" : "en-body font-inter"
            }`}
          >
            {assessment.text}
          </div>

          {/* Performance Statistics Bar */}
          <div className="w-full space-y-2 pt-1">
            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-scale1200 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${correctPercentage}%` }}
                title={`${correctCount} Correct`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-700"
                style={{ width: `${incorrectPercentage}%` }}
                title={`${incorrectCount} Incorrect`}
              />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full pt-2">
            {/* Total */}
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-scale1200 border border-neutral-200/70 dark:border-neutral-scale1100 flex flex-col items-center justify-center">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                {t("totalQuestions")}
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {totalQuestions}
              </span>
            </div>

            {/* Correct */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("correct")}</span>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {correctCount}
              </span>
            </div>

            {/* Incorrect */}
            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1 text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                <XCircle className="w-3.5 h-3.5" />
                <span>{t("incorrect")}</span>
              </div>
              <span className="text-base font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                {incorrectCount}
              </span>
            </div>
          </div>
        </div>

        {/* ----------------- Action Options List (Telegram Style) ----------------- */}
        <div className="space-y-2.5 pt-1">
          <div className="px-1 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t("quizActions")}
          </div>

          <div className="flex flex-col gap-2.5">
            {actionItems.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleAction(action.id)}
                  disabled={action.loading}
                  className={`w-full p-4 rounded-2xl border text-right flex items-center justify-between gap-3.5 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-xs ${
                    action.primary
                      ? "bg-primery-700 hover:bg-primery-800 dark:bg-primery-600 dark:hover:bg-primery-700 text-white border-transparent shadow-primery-700/20"
                      : "bg-white hover:bg-neutral-50/80 dark:bg-neutral-scale1300 dark:hover:bg-neutral-scale1200 border-neutral-200 dark:border-neutral-scale1100 text-neutral-800 dark:text-neutral-200"
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Action Icon Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        action.primary
                          ? "bg-white/20 text-white"
                          : action.iconBg
                      }`}
                    >
                      <ActionIcon
                        className={`w-5 h-5 ${
                          action.loading ? "animate-spin" : ""
                        }`}
                      />
                    </div>

                    {/* Action Details */}
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span
                        className={`text-xs sm:text-sm font-bold truncate ${
                          action.primary
                            ? "text-white"
                            : "text-neutral-900 dark:text-neutral-100"
                        } ${isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter"}`}
                      >
                        {action.title}
                      </span>
                      <span
                        className={`text-[11px] truncate mt-0.5 ${
                          action.primary
                            ? "text-white/80"
                            : "text-neutral-400 dark:text-neutral-400"
                        } ${isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"}`}
                      >
                        {action.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Directional Chevron */}
                  <div
                    className={`shrink-0 ${
                      action.primary ? "text-white/80" : "text-neutral-400"
                    }`}
                  >
                    {isRTL ? (
                      <ChevronLeft className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick status message toast if available */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center animate-in fade-in">
            {statusMessage}
          </div>
        )}
      </section>
    </main>
  );
};
