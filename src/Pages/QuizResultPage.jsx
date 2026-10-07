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
import { markdownToCleanHtml } from "@/utils/markdownUtils.js";
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

  const quizTopic =
    stateData.topic ||
    stateData.exam?.topic ||
    stateData.exam?.title ||
    quizData?.[0]?.topic ||
    (typeof window !== "undefined" && sessionStorage.getItem("lastQuizTopic")) ||
    "";

  const effectiveTopic =
    (quizTopic && String(quizTopic).trim()) ||
    (stateData?.topic && String(stateData.topic).trim()) ||
    (stateData?.exam?.topic && String(stateData.exam.topic).trim()) ||
    (stateData?.exam?.title && String(stateData.exam.title).trim()) ||
    (typeof window !== "undefined" && sessionStorage.getItem("lastQuizTopic")?.trim()) ||
    (isRTL ? "ارائه سیستم‌های عامل" : "Operating Systems Presentation");

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

      // 1. Fetch AI explanations for any question missing one
      const fetchExplanation = async (question, idx) => {
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
            setTimeout(() => resolve(""), 15000)
          );
          const apiPromise = quizApi.explainAnswer({
            question: question.question,
            options: question.options,
            answer: question.answer,
            selectedAnswer: selectedAnswers?.[idx],
          });
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
        quizData.map((q, idx) => fetchExplanation(q, idx))
      );

      // Helper: Create Header for Page (Full header for page 1, compact for subsequent pages)
      const createHeader = (isFirstPage, pageNum, totalPages) => {
        const headerDiv = document.createElement("div");
        headerDiv.style.display = "flex";
        headerDiv.style.justifyContent = "space-between";
        headerDiv.style.alignItems = "center";
        headerDiv.style.marginBottom = isFirstPage ? "14px" : "12px";
        headerDiv.style.paddingBottom = isFirstPage ? "10px" : "8px";
        headerDiv.style.borderBottom = "2px solid #e2e8f0";
        headerDiv.dir = isRTL ? "rtl" : "ltr";

        if (isFirstPage) {
          const titleBox = document.createElement("div");

          const title = document.createElement("h1");
          title.textContent = t("quizResultTitle") || "کارنامه آزمون هوشمند";
          title.style.fontSize = "22px";
          title.style.margin = "0";
          title.style.fontWeight = "800";
          title.style.color = "#0f172a";
          title.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
          titleBox.appendChild(title);

          const subtitle = document.createElement("div");
          subtitle.textContent = t("quizResultSubtitle") || "خلاصه عملکرد و درصد پاسخ‌های شما";
          subtitle.style.fontSize = "11.5px";
          subtitle.style.color = "#64748b";
          subtitle.style.marginTop = "3px";
          titleBox.appendChild(subtitle);

          const topicBadge = document.createElement("div");
          topicBadge.style.display = "inline-block";
          topicBadge.style.marginTop = "6px";
          topicBadge.style.padding = "4px 12px";
          topicBadge.style.backgroundColor = "#eff6ff";
          topicBadge.style.border = "1.5px solid #bfdbfe";
          topicBadge.style.borderRadius = "6px";
          topicBadge.style.fontSize = "12px";
          topicBadge.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
          topicBadge.style.textAlign = isRTL ? "right" : "left";
          topicBadge.innerHTML = `<span style="color:#2563eb;font-weight:700;margin-${isRTL ? "left" : "right"}:6px;">${isRTL ? "موضوع آزمون: " : "Quiz Topic: "}</span><strong style="color:#0f172a;font-weight:800;">${effectiveTopic}</strong>`;
          titleBox.appendChild(topicBadge);

          headerDiv.appendChild(titleBox);

          const metaBox = document.createElement("div");
          metaBox.style.display = "flex";
          metaBox.style.flexDirection = "column";
          metaBox.style.alignItems = isRTL ? "flex-start" : "flex-end";
          metaBox.style.gap = "4px";

          const dateStamp = document.createElement("div");
          dateStamp.textContent = `${isRTL ? "تاریخ آزمون: " : "Date: "}${new Date().toLocaleDateString(isRTL ? "fa-IR" : "en-US")}`;
          dateStamp.style.fontSize = "11.5px";
          dateStamp.style.color = "#64748b";
          dateStamp.style.fontWeight = "600";
          metaBox.appendChild(dateStamp);

          if (totalPages > 1) {
            const pageStamp = document.createElement("div");
            pageStamp.textContent = `${isRTL ? "صفحه" : "Page"} 1 ${isRTL ? "از" : "of"} ${totalPages}`;
            pageStamp.style.fontSize = "11px";
            pageStamp.style.color = "#94a3b8";
            pageStamp.style.fontWeight = "600";
            metaBox.appendChild(pageStamp);
          }

          headerDiv.appendChild(metaBox);
        } else {
          const miniTitleBox = document.createElement("div");
          miniTitleBox.style.display = "flex";
          miniTitleBox.style.alignItems = "center";
          miniTitleBox.style.gap = "10px";

          const miniTitle = document.createElement("h2");
          miniTitle.textContent = t("quizResultTitle") || "کارنامه آزمون هوشمند";
          miniTitle.style.fontSize = "15px";
          miniTitle.style.margin = "0";
          miniTitle.style.fontWeight = "800";
          miniTitle.style.color = "#0f172a";
          miniTitle.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
          miniTitleBox.appendChild(miniTitle);

          const miniTopicBadge = document.createElement("div");
          miniTopicBadge.style.display = "inline-block";
          miniTopicBadge.style.padding = "3px 10px";
          miniTopicBadge.style.backgroundColor = "#eff6ff";
          miniTopicBadge.style.border = "1px solid #bfdbfe";
          miniTopicBadge.style.borderRadius = "6px";
          miniTopicBadge.style.fontSize = "11px";
          miniTopicBadge.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
          miniTopicBadge.innerHTML = `<span style="color:#2563eb;font-weight:700;margin-${isRTL ? "left" : "right"}:4px;">${isRTL ? "موضوع:" : "Topic:"}</span><strong style="color:#0f172a;font-weight:800;">${effectiveTopic}</strong>`;
          miniTitleBox.appendChild(miniTopicBadge);

          headerDiv.appendChild(miniTitleBox);

          const miniMetaBox = document.createElement("div");
          miniMetaBox.style.display = "flex";
          miniMetaBox.style.alignItems = "center";
          miniMetaBox.style.gap = "12px";

          const miniPageStamp = document.createElement("div");
          miniPageStamp.textContent = `${isRTL ? "صفحه" : "Page"} ${pageNum} ${isRTL ? "از" : "of"} ${totalPages}`;
          miniPageStamp.style.fontSize = "11.5px";
          miniPageStamp.style.color = "#334155";
          miniPageStamp.style.fontWeight = "700";
          miniMetaBox.appendChild(miniPageStamp);

          headerDiv.appendChild(miniMetaBox);
        }

        return headerDiv;
      };

      // Helper: Summary Cards
      const createSummaryCards = () => {
        const summary = document.createElement("div");
        summary.style.display = "grid";
        summary.style.gridTemplateColumns = "repeat(4, 1fr)";
        summary.style.gap = "10px";
        summary.style.marginBottom = "14px";
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
          card.style.borderRadius = "10px";
          card.style.padding = "8px 14px";
          card.style.textAlign = isRTL ? "right" : "left";

          const lbl = document.createElement("div");
          lbl.textContent = c.label;
          lbl.style.fontSize = "10.5px";
          lbl.style.color = "#64748b";
          lbl.style.fontWeight = "600";
          lbl.style.marginBottom = "2px";

          const val = document.createElement("div");
          val.textContent = String(c.value);
          val.style.fontSize = "18px";
          val.style.fontWeight = "800";
          val.style.color = c.color;

          card.appendChild(lbl);
          card.appendChild(val);
          summary.appendChild(card);
        });

        return summary;
      };

      // Helper: Table Header Row
      const createTableHeader = () => {
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        const columnDefs = [
          { title: t("question") || "سوال", width: "30%", align: isRTL ? "right" : "left" },
          { title: t("yourAnswer") || "پاسخ شما", width: "15%", align: isRTL ? "right" : "left" },
          { title: t("correctAnswer") || "پاسخ صحیح", width: "15%", align: isRTL ? "right" : "left" },
          { title: t("result") || "نتیجه", width: "11%", align: "center" },
          { title: t("explainAnswer") || "توضیح هوش مصنوعی", width: "29%", align: isRTL ? "right" : "left" },
        ];

        columnDefs.forEach((col) => {
          const th = document.createElement("th");
          th.textContent = col.title;
          th.style.width = col.width;
          th.style.borderBottom = "2px solid #cbd5e1";
          th.style.borderRight = "1px solid #e2e8f0";
          th.style.padding = "7px 10px";
          th.style.background = "#f1f5f9";
          th.style.color = "#1e293b";
          th.style.fontWeight = "700";
          th.style.textAlign = col.align;
          th.style.verticalAlign = "middle";
          th.style.fontSize = "11px";
          headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        return thead;
      };

      // Helper: Build Table Row Element
      const createRow = (question, index) => {
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
        tdQ.style.width = "30%";
        tdQ.style.padding = "7px 10px";
        tdQ.style.borderBottom = "1px solid #e2e8f0";
        tdQ.style.borderRight = "1px solid #e2e8f0";
        tdQ.style.verticalAlign = "top";
        tdQ.style.lineHeight = "1.5";
        tdQ.style.fontWeight = "500";
        tdQ.style.color = "#0f172a";
        tdQ.style.fontSize = "10.5px";
        tdQ.textContent = questionText;
        row.appendChild(tdQ);

        // 2. Your Answer Cell
        const tdYour = document.createElement("td");
        tdYour.style.width = "15%";
        tdYour.style.padding = "7px 10px";
        tdYour.style.borderBottom = "1px solid #e2e8f0";
        tdYour.style.borderRight = "1px solid #e2e8f0";
        tdYour.style.verticalAlign = "top";
        tdYour.style.lineHeight = "1.45";
        tdYour.style.fontWeight = "600";
        tdYour.style.fontSize = "10.5px";
        tdYour.style.color = isCorrect ? "#15803d" : isUnanswered ? "#64748b" : "#b91c1c";
        tdYour.textContent = selectedAnswerText;
        row.appendChild(tdYour);

        // 3. Correct Answer Cell
        const tdCorrect = document.createElement("td");
        tdCorrect.style.width = "15%";
        tdCorrect.style.padding = "7px 10px";
        tdCorrect.style.borderBottom = "1px solid #e2e8f0";
        tdCorrect.style.borderRight = "1px solid #e2e8f0";
        tdCorrect.style.verticalAlign = "top";
        tdCorrect.style.lineHeight = "1.45";
        tdCorrect.style.fontWeight = "600";
        tdCorrect.style.fontSize = "10.5px";
        tdCorrect.style.color = "#15803d";
        tdCorrect.textContent = correctAnswerText;
        row.appendChild(tdCorrect);

        // 4. Result Cell with Check/Cross Badge (Native Unicode guaranteed rendering)
        const tdResult = document.createElement("td");
        tdResult.style.width = "11%";
        tdResult.style.padding = "7px 6px";
        tdResult.style.borderBottom = "1px solid #e2e8f0";
        tdResult.style.borderRight = "1px solid #e2e8f0";
        tdResult.style.verticalAlign = "middle";
        tdResult.style.textAlign = "center";

        const badge = document.createElement("div");
        badge.style.display = "inline-block";
        badge.style.textAlign = "center";
        badge.style.height = "24px";
        badge.style.lineHeight = "22px";
        badge.style.padding = "0 10px";
        badge.style.borderRadius = "9999px";
        badge.style.boxSizing = "border-box";
        badge.style.whiteSpace = "nowrap";

        const iconSymbol = isCorrect ? "✓" : isUnanswered ? "−" : "✕";
        const iconColor = isCorrect ? "#15803d" : isUnanswered ? "#4b5563" : "#b91c1c";
        const bgColor = isCorrect ? "#dcfce7" : isUnanswered ? "#f3f4f6" : "#fee2e2";
        const borderColor = isCorrect ? "#22c55e" : isUnanswered ? "#9ca3af" : "#ef4444";
        const labelText = isCorrect
          ? (isRTL ? "درست" : "Correct")
          : isUnanswered
          ? (isRTL ? "بی‌پاسخ" : "Unanswered")
          : (isRTL ? "نادرست" : "Incorrect");

        badge.style.backgroundColor = bgColor;
        badge.style.border = `1.5px solid ${borderColor}`;

        badge.innerHTML = `<span style="font-size:13px;font-weight:900;color:${iconColor};margin-${isRTL ? "left" : "right"}:4px;display:inline-block;vertical-align:middle;line-height:1;">${iconSymbol}</span><span style="font-size:11px;font-weight:700;color:${iconColor};display:inline-block;vertical-align:middle;line-height:1;font-family:${isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif"};">${labelText}</span>`;

        tdResult.appendChild(badge);
        row.appendChild(tdResult);

        // 5. AI Explanation Cell
        const tdExp = document.createElement("td");
        tdExp.style.width = "29%";
        tdExp.style.padding = "7px 10px";
        tdExp.style.borderBottom = "1px solid #e2e8f0";
        tdExp.style.verticalAlign = "top";
        tdExp.style.lineHeight = "1.55";
        tdExp.style.fontSize = "10px";
        tdExp.style.color = "#1e293b";
        tdExp.style.wordBreak = "break-word";
        tdExp.dir = isRTL ? "rtl" : "ltr";
        tdExp.style.textAlign = isRTL ? "right" : "left";

        const expContent =
          (explanations[index] || "").trim() ||
          (isCorrect
            ? (isRTL ? "پاسخ کاملاً صحیح است." : "Correct answer.")
            : (isRTL
                ? `گزینه صحیح (${correctAnswer}) است.`
                : `The correct option is (${correctAnswer}).`));

        tdExp.innerHTML = markdownToCleanHtml(expContent, { isRTL });
        row.appendChild(tdExp);

        return row;
      };

      // Measure row heights inside a detached hidden table
      const measureContainer = document.createElement("div");
      measureContainer.style.position = "absolute";
      measureContainer.style.left = "-10000px";
      measureContainer.style.top = "0";
      measureContainer.style.width = "1120px";
      measureContainer.style.visibility = "hidden";
      measureContainer.dir = isRTL ? "rtl" : "ltr";

      const measureTable = document.createElement("table");
      measureTable.style.width = "100%";
      measureTable.style.tableLayout = "fixed";
      measureTable.appendChild(createTableHeader());

      const measureTbody = document.createElement("tbody");
      const builtRows = quizData.map((q, idx) => createRow(q, idx));
      builtRows.forEach((r) => measureTbody.appendChild(r));
      measureTable.appendChild(measureTbody);
      measureContainer.appendChild(measureTable);
      document.body.appendChild(measureContainer);

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Partition rows across pages without slicing any row in half
      const pagesRows = [];
      let currentPage = [];
      let currentHeight = 0;
      const MAX_PAGE1_HEIGHT = 540; // Max table rows height on Page 1 (with header & summary)
      const MAX_PAGE_OTHER_HEIGHT = 650; // Max table rows height on subsequent pages

      builtRows.forEach((row) => {
        const rHeight = row.offsetHeight || 80;
        const limit = pagesRows.length === 0 ? MAX_PAGE1_HEIGHT : MAX_PAGE_OTHER_HEIGHT;

        if (currentHeight + rHeight > limit && currentPage.length > 0) {
          pagesRows.push(currentPage);
          currentPage = [row];
          currentHeight = rHeight;
        } else {
          currentPage.push(row);
          currentHeight += rHeight;
        }
      });

      if (currentPage.length > 0) {
        pagesRows.push(currentPage);
      }

      document.body.removeChild(measureContainer);

      const totalPdfPages = pagesRows.length;

      // Initialize jsPDF in Landscape A4 (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      for (let p = 0; p < totalPdfPages; p++) {
        const pageContainer = document.createElement("div");
        pageContainer.style.position = "absolute";
        pageContainer.style.left = "-10000px";
        pageContainer.style.top = "0";
        pageContainer.style.width = "1120px";
        pageContainer.style.minHeight = "790px";
        pageContainer.style.background = "#ffffff";
        pageContainer.style.padding = "24px 32px";
        pageContainer.style.boxSizing = "border-box";
        pageContainer.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
        pageContainer.style.color = "#0f172a";
        pageContainer.dir = isRTL ? "rtl" : "ltr";

        // 1. Page Header
        pageContainer.appendChild(createHeader(p === 0, p + 1, totalPdfPages));

        // 2. Summary cards (only on page 1)
        if (p === 0) {
          pageContainer.appendChild(createSummaryCards());
        }

        // 3. Table with repeated headers and specific page rows
        const pageTable = document.createElement("table");
        pageTable.style.width = "100%";
        pageTable.style.borderCollapse = "separate";
        pageTable.style.borderSpacing = "0";
        pageTable.style.tableLayout = "fixed";
        pageTable.style.fontSize = "11px";
        pageTable.style.fontFamily = isRTL ? "Vazirmatn, Arial, sans-serif" : "Inter, Arial, sans-serif";
        pageTable.dir = isRTL ? "rtl" : "ltr";
        pageTable.style.borderRadius = "8px";
        pageTable.style.overflow = "hidden";
        pageTable.style.border = "1px solid #cbd5e1";

        pageTable.appendChild(createTableHeader());

        const pageTbody = document.createElement("tbody");
        pagesRows[p].forEach((r) => pageTbody.appendChild(r));
        pageTable.appendChild(pageTbody);
        pageContainer.appendChild(pageTable);

        document.body.appendChild(pageContainer);

        const canvas = await html2canvas(pageContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        document.body.removeChild(pageContainer);

        if (p > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 285;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 6, 6, imgWidth, Math.min(imgHeight, 198));
      }

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
          topic: quizTopic,
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
          {effectiveTopic && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primery-50 dark:bg-primery-950/40 border border-primery-200/60 dark:border-primery-800/40 text-primery-700 dark:text-sky-300 text-xs font-semibold">
              <span className="text-neutral-500 dark:text-neutral-400 font-normal">
                {isRTL ? "موضوع آزمون:" : "Quiz Topic:"}
              </span>
              <span className="font-bold">{effectiveTopic}</span>
            </div>
          )}

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
