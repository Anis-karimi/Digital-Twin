import { useEffect, useRef, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { AppContext } from "@/Context/AppContext";
import { quizApi } from "@/api";
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

export const QuizResultPage = ({
  onAction,
  isModal = false,
  modalResultData = null,
  onReviewAnswers,
  onRetryQuiz,
  onBackToChat,
}) => {
  const { isRTL, t } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isHandlingBackRef = useRef(false);
  const isLeavingResultRef = useRef(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const isPersianText = (text) => /[\u0600-\u06FF]/.test(String(text || ""));

  useEffect(() => {
    if (isModal) {
      return;
    }

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
  }, [isModal]);

  const handleBackToChat = () => {
    if (isModal && onBackToChat) {
      onBackToChat();
      return;
    }

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

  const stateData = (isModal && modalResultData ? modalResultData : location.state) || {};

  useEffect(() => {
    if (stateData?.exam) {
      const targetId = stateData.exam.assignment_id || stateData.exam.id;
      navigate(`/StudentExamResult/${targetId}`, { state: stateData, replace: true });
    }
  }, [stateData, navigate]);

  // Retrieve quiz evaluation stats from location state or modal props
  const {
    correctCount = 0,
    incorrectCount = 0,
    totalQuestions = 0,
    quizData = [],
    selectedAnswers = {},
  } = stateData;

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
    setStatusMessage(t("downloadingPdf") || "در حال آماده‌سازی کارنامه...");

    let fontFixStyle = null;
    try {
      // Fix html2canvas font metrics baseline calculation with Tailwind CSS
      // Tailwind's preflight forces img { display: block }, causing html2canvas to wrap its internal metric probe and inflate text baseline.
      fontFixStyle = document.createElement("style");
      fontFixStyle.id = "html2canvas-font-fix";
      fontFixStyle.innerHTML = `img { display: inline-block !important; }`;
      document.head.appendChild(fontFixStyle);

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

      // Lucide icon vector renderer for HTML5 Canvas (guarantees pixel-perfect rendering in html2canvas)
      const createLucideIconCanvas = (type, color) => {
        const iconCanvas = document.createElement("canvas");
        iconCanvas.width = 28;
        iconCanvas.height = 28;
        iconCanvas.style.width = "14px";
        iconCanvas.style.height = "14px";
        iconCanvas.style.verticalAlign = "middle";
        if (isRTL) {
          iconCanvas.style.marginLeft = "5px";
        } else {
          iconCanvas.style.marginRight = "5px";
        }
        const ctx = iconCanvas.getContext("2d");
        if (ctx) {
          ctx.scale(28 / 24, 28 / 24);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.8;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          if (type === "check") {
            ctx.moveTo(20, 6);
            ctx.lineTo(9, 17);
            ctx.lineTo(4, 12);
          } else if (type === "x") {
            ctx.moveTo(18, 6);
            ctx.lineTo(6, 18);
            ctx.moveTo(6, 6);
            ctx.lineTo(18, 18);
          } else {
            ctx.moveTo(5, 12);
            ctx.lineTo(19, 12);
          }
          ctx.stroke();
        }
        return iconCanvas;
      };

      // 1. Fetch AI explanations for any question missing one
      const fetchExplanation = async (question) => {
        const existing =
          question.explanation ||
          question.explain ||
          question.explain_answer ||
          question.reason ||
          question.ai_explanation;
        if (existing && typeof existing === "string" && existing.trim()) {
          return existing.trim();
        }
        const qText = question.question || "";
        if (!qText) return "";
        try {
          const timeoutPromise = new Promise((resolve) =>
            setTimeout(() => resolve(""), 6000)
          );
          const apiPromise = quizApi.explainAnswer(qText);
          const res = await Promise.race([apiPromise, timeoutPromise]);
          if (res && typeof res === "string" && res.trim()) {
            question.explanation = res.trim();
            return res.trim();
          }
        } catch (err) {
          console.warn("Could not fetch explanation for question:", err);
        }
        return "";
      };

      const explanations = await Promise.all(
        quizData.map((q) => fetchExplanation(q))
      );

      // 2. Off-screen container for Landscape PDF capture (A4 landscape ratio ~ 1.41)
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-10000px";
      container.style.top = "0";
      container.style.width = "1120px";
      container.style.background = "#ffffff";
      container.style.padding = "35px 40px";
      container.style.boxSizing = "border-box";
      container.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
      container.style.color = "#0f172a";
      container.dir = isRTL ? "rtl" : "ltr";

      // 3. Header
      const headerDiv = document.createElement("div");
      headerDiv.style.display = "flex";
      headerDiv.style.justifyContent = "space-between";
      headerDiv.style.alignItems = "center";
      headerDiv.style.marginBottom = "20px";
      headerDiv.style.paddingBottom = "15px";
      headerDiv.style.borderBottom = "2px solid #e2e8f0";

      const title = document.createElement("h1");
      title.textContent = t("quizResultTitle") || "کارنامه آزمون هوشمند";
      title.style.fontSize = "24px";
      title.style.margin = "0";
      title.style.fontWeight = "800";
      title.style.color = "#0f172a";
      title.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";

      const subtitle = document.createElement("div");
      subtitle.textContent = t("quizResultSubtitle") || "خلاصه عملکرد و درصد پاسخ‌های شما";
      subtitle.style.fontSize = "12px";
      subtitle.style.color = "#64748b";
      subtitle.style.marginTop = "4px";

      const titleBox = document.createElement("div");
      titleBox.appendChild(title);
      titleBox.appendChild(subtitle);
      headerDiv.appendChild(titleBox);

      const dateStamp = document.createElement("div");
      dateStamp.textContent = new Date().toLocaleDateString(isRTL ? "fa-IR" : "en-US");
      dateStamp.style.fontSize = "12px";
      dateStamp.style.color = "#64748b";
      dateStamp.style.fontWeight = "600";
      headerDiv.appendChild(dateStamp);

      container.appendChild(headerDiv);

      // 4. Summary cards grid in Landscape
      const summary = document.createElement("div");
      summary.style.display = "grid";
      summary.style.gridTemplateColumns = "repeat(4, 1fr)";
      summary.style.gap = "14px";
      summary.style.marginBottom = "24px";
      summary.dir = isRTL ? "rtl" : "ltr";

      const summaryCards = [
        {
          label: t("totalQuestions") || "کل سوالات",
          value: totalQuestions,
          bg: "#f8fafc",
          border: "#cbd5e1",
          color: "#334155",
        },
        {
          label: t("correctCount") || "پاسخ‌های صحیح",
          value: correctCount,
          bg: "#f0fdf4",
          border: "#86efac",
          color: "#15803d",
        },
        {
          label: t("incorrectCount") || "پاسخ‌های نادرست",
          value: incorrectCount,
          bg: "#fef2f2",
          border: "#fca5a5",
          color: "#b91c1c",
        },
        {
          label: t("accuracyRate") || "درصد موفقیت",
          value: `${correctPercentage}%`,
          bg: "#eff6ff",
          border: "#93c5fd",
          color: "#1d4ed8",
        },
      ];

      summaryCards.forEach((c) => {
        const card = document.createElement("div");
        card.style.background = c.bg;
        card.style.border = `1.5px solid ${c.border}`;
        card.style.borderRadius = "12px";
        card.style.padding = "12px 16px";
        card.style.textAlign = isRTL ? "right" : "left";

        const lbl = document.createElement("div");
        lbl.textContent = c.label;
        lbl.style.fontSize = "11px";
        lbl.style.color = "#64748b";
        lbl.style.fontWeight = "600";
        lbl.style.marginBottom = "4px";

        const val = document.createElement("div");
        val.textContent = String(c.value);
        val.style.fontSize = "22px";
        val.style.fontWeight = "800";
        val.style.color = c.color;

        card.appendChild(lbl);
        card.appendChild(val);
        summary.appendChild(card);
      });

      container.appendChild(summary);

      // 5. 5-Column Landscape Table
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "separate";
      table.style.borderSpacing = "0";
      table.style.tableLayout = "fixed";
      table.style.fontSize = "11px";
      table.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
      table.dir = isRTL ? "rtl" : "ltr";
      table.style.borderRadius = "8px";
      table.style.overflow = "hidden";
      table.style.border = "1px solid #cbd5e1";

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");

      const columnDefs = [
        { title: t("question") || "سوال", width: "29%", align: isRTL ? "right" : "left" },
        { title: t("yourAnswer") || "پاسخ شما", width: "15%", align: isRTL ? "right" : "left" },
        { title: t("correctAnswer") || "پاسخ صحیح", width: "15%", align: isRTL ? "right" : "left" },
        { title: t("result") || "نتیجه", width: "11%", align: "center" },
        { title: t("explainAnswer") || "شرح پاسخ (AI)", width: "30%", align: isRTL ? "right" : "left" },
      ];

      columnDefs.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col.title;
        th.style.width = col.width;
        th.style.borderBottom = "2px solid #cbd5e1";
        th.style.borderRight = "1px solid #e2e8f0";
        th.style.padding = "10px 12px";
        th.style.background = "#f1f5f9";
        th.style.color = "#1e293b";
        th.style.fontWeight = "700";
        th.style.textAlign = col.align;
        th.style.verticalAlign = "middle";
        th.style.fontSize = "11.5px";
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
        const isUnanswered = selectedAnswer === t("unanswered") || !selectedAnswers[index];

        const row = document.createElement("tr");
        row.style.background = isCorrect
          ? "#f0fdf4"
          : isUnanswered
          ? "#fefce8"
          : "#fef2f2";
        row.style.borderBottom = "1px solid #e2e8f0";

        // 1. Question Cell
        const tdQ = document.createElement("td");
        tdQ.style.width = "29%";
        tdQ.style.padding = "10px 12px";
        tdQ.style.borderBottom = "1px solid #e2e8f0";
        tdQ.style.borderRight = "1px solid #e2e8f0";
        tdQ.style.verticalAlign = "top";
        tdQ.style.lineHeight = "1.6";
        tdQ.style.fontWeight = "500";
        tdQ.style.color = "#0f172a";
        tdQ.textContent = questionText;
        row.appendChild(tdQ);

        // 2. Your Answer Cell
        const tdYour = document.createElement("td");
        tdYour.style.width = "15%";
        tdYour.style.padding = "10px 12px";
        tdYour.style.borderBottom = "1px solid #e2e8f0";
        tdYour.style.borderRight = "1px solid #e2e8f0";
        tdYour.style.verticalAlign = "top";
        tdYour.style.lineHeight = "1.5";
        tdYour.style.fontWeight = "600";
        tdYour.style.color = isCorrect ? "#15803d" : isUnanswered ? "#64748b" : "#b91c1c";
        tdYour.textContent = selectedAnswerText;
        row.appendChild(tdYour);

        // 3. Correct Answer Cell
        const tdCorrect = document.createElement("td");
        tdCorrect.style.width = "15%";
        tdCorrect.style.padding = "10px 12px";
        tdCorrect.style.borderBottom = "1px solid #e2e8f0";
        tdCorrect.style.borderRight = "1px solid #e2e8f0";
        tdCorrect.style.verticalAlign = "top";
        tdCorrect.style.lineHeight = "1.5";
        tdCorrect.style.fontWeight = "600";
        tdCorrect.style.color = "#15803d";
        tdCorrect.textContent = correctAnswerText;
        row.appendChild(tdCorrect);

        // 4. Result Cell with Check/Cross Badge
        const tdResult = document.createElement("td");
        tdResult.style.width = "11%";
        tdResult.style.padding = "10px 8px";
        tdResult.style.borderBottom = "1px solid #e2e8f0";
        tdResult.style.borderRight = "1px solid #e2e8f0";
        tdResult.style.verticalAlign = "middle";
        tdResult.style.textAlign = "center";

        const badge = document.createElement("div");
        badge.style.display = "inline-block";
        badge.style.padding = "4px 10px";
        badge.style.borderRadius = "9999px";
        badge.style.verticalAlign = "middle";
        badge.style.boxSizing = "border-box";
        badge.style.lineHeight = "1";
        badge.style.whiteSpace = "nowrap";
        badge.dir = isRTL ? "rtl" : "ltr";

        let iconType = "x";
        let iconColor = "#b91c1c";
        let labelText = isRTL ? "نادرست" : "Incorrect";

        if (isCorrect) {
          badge.style.background = "#dcfce7";
          badge.style.border = "1.5px solid #22c55e";
          iconType = "check";
          iconColor = "#15803d";
          labelText = isRTL ? "درست" : "Correct";
        } else if (isUnanswered) {
          badge.style.background = "#f3f4f6";
          badge.style.border = "1.5px solid #9ca3af";
          iconType = "minus";
          iconColor = "#4b5563";
          labelText = isRTL ? "بی‌پاسخ" : "Unanswered";
        } else {
          badge.style.background = "#fee2e2";
          badge.style.border = "1.5px solid #ef4444";
          iconType = "x";
          iconColor = "#b91c1c";
          labelText = isRTL ? "نادرست" : "Incorrect";
        }

        const iconEl = createLucideIconCanvas(iconType, iconColor);

        const textSpan = document.createElement("span");
        textSpan.style.display = "inline-block";
        textSpan.style.verticalAlign = "middle";
        textSpan.style.lineHeight = "1";
        textSpan.style.fontSize = "11.5px";
        textSpan.style.fontWeight = "700";
        textSpan.style.color = iconColor;
        textSpan.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
        textSpan.textContent = labelText;

        badge.appendChild(iconEl);
        badge.appendChild(textSpan);
        tdResult.appendChild(badge);
        row.appendChild(tdResult);

        // 5. AI Explanation Cell
        const tdExp = document.createElement("td");
        tdExp.style.width = "30%";
        tdExp.style.padding = "10px 12px";
        tdExp.style.borderBottom = "1px solid #e2e8f0";
        tdExp.style.verticalAlign = "top";
        tdExp.style.lineHeight = "1.65";
        tdExp.style.fontSize = "10.5px";
        tdExp.style.color = "#1e293b";
        tdExp.style.wordBreak = "break-word";

        const expContent =
          (explanations[index] || "").trim() ||
          (isCorrect
            ? (isRTL ? "پاسخ کاملاً صحیح است." : "Correct answer.")
            : (isRTL
                ? `گزینه صحیح (${correctAnswer}) است.`
                : `The correct option is (${correctAnswer}).`));

        tdExp.textContent = expContent;
        row.appendChild(tdExp);

        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      container.appendChild(table);

      document.body.appendChild(container);

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const imageHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position = margin - (imageHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imageHeight);
        heightLeft -= usableHeight;
      }

      document.body.removeChild(container);
      pdf.save("quiz-result.pdf");
      setStatusMessage(t("pdfDownloadedSuccess"));
    } catch (err) {
      console.error("PDF generation failed:", err);
      setStatusMessage(t("errorGettingExplanation") || "خطا در ساخت کارنامه PDF");
    } finally {
      if (fontFixStyle && fontFixStyle.parentNode) {
        fontFixStyle.parentNode.removeChild(fontFixStyle);
      }
      setIsDownloadingPdf(false);
    }
  };

  const handleAction = (actionId) => {
    if (actionId === "download") {
      handleDownload();
      return;
    }
    if (actionId === "chat") {
      if (isModal && onBackToChat) {
        onBackToChat();
        return;
      }
      handleBackToChat();
      return;
    }
    if (actionId === "retry") {
      if (isModal && onRetryQuiz) {
        onRetryQuiz();
        return;
      }
      navigate("/QuizFirstPage");
      return;
    }
    if (actionId === "review") {
      if (isModal && onReviewAnswers) {
        onReviewAnswers(quizData, selectedAnswers);
        return;
      }
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
      className={`w-full ${
        isModal ? "h-full flex-1" : "md:w-[420px] min-h-dvh mx-auto"
      } flex flex-col bg-[#f0f2f5] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 transition-colors duration-200 select-none overflow-x-hidden relative`}
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
