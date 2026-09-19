import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import background from "@/assets/images/Quiz-Background.jpg";
// import CloseIcon from "@/assets/icons/X.svg?react";

const actions = [
  { id: "review", label: "Review Answers" },
  { id: "retry", label: "Try Again" },
  { id: "download", label: "Download PDF" },
  { id: "chat", label: "Back to Chat" },
];

export const QuizResultPage = ({ onAction }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHandlingBackRef = useRef(false);
  const isLeavingResultRef = useRef(false);

  useEffect(() => {
    // یک entry جدید برای جلوگیری از خروج با Back می‌سازیم
    navigate(location.pathname + location.search + location.hash, {
      state: location.state,
    });

    const handlePopState = () => {
      // اگر خروج از طریق دکمه Back to Chat انجام شده،
      // اجازه بده navigation عادی انجام شود.
      if (isLeavingResultRef.current) {
        isLeavingResultRef.current = false;
        return;
      }

      // وقتی خودمان history.forward() را اجرا می‌کنیم
      if (isHandlingBackRef.current) {
        isHandlingBackRef.current = false;
        return;
      }

      // Back گوشی یا مرورگر → هیچ اتفاقی نیفتد
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
        const returnData = JSON.parse(savedReturn);

        // Result + Result Guard را از history خارج می‌کنیم
        // و مستقیماً به Chat قبلی برمی‌گردیم.
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





  const [statusMessage, setStatusMessage] = useState("");

  // دریافت نتیجه از QuizQuestionsPage
  const {
    correctCount = 0,
    incorrectCount = 0,
    totalQuestions = 0,
  } = location.state || {};

  // مجموع جواب‌های داده‌شده
  const totalAnswers = correctCount + incorrectCount;

  // درصد درست
  const correctPercentage =
    totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;

  // درصد غلط
  const incorrectPercentage =
    totalAnswers > 0 ? Math.round((incorrectCount / totalAnswers) * 100) : 0;

  const resultStatistics = [
    {
      label: "Correct",
      value: correctCount,
      colorClass: "text-success-900",
    },
    {
      label: "Incorrect",
      value: incorrectCount,
      colorClass: "text-error-800",
    },
  ];

  const announceAction = (action, message) => {
    setStatusMessage(message);
    onAction?.(action);
  };

  const handleDownload = async () => {
    const quizData = location.state?.quizData || [];
    const selectedAnswers = location.state?.selectedAnswers || {};

    const isPersianText = (text) => {
      return /[\u0600-\u06FF]/.test(String(text || ""));
    };

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
        (option) =>
          option.text.trim().toLowerCase() === rawAnswer.toLowerCase(),
      );

      if (matchingOption) {
        return matchingOption.letter;
      }

      return rawAnswer.charAt(0).toUpperCase();
    };

    // --------------------------------------------------
    // Create temporary HTML container
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Header
    // --------------------------------------------------

    const title = document.createElement("h1");

    title.textContent = "Quiz Result";

    title.style.fontSize = "24px";
    title.style.margin = "0 0 25px 0";
    title.style.fontWeight = "700";
    title.style.textAlign = "left";
    title.style.fontFamily = "Inter, Arial, sans-serif";

    container.appendChild(title);

    // --------------------------------------------------
    // Result summary
    // --------------------------------------------------

    const summary = document.createElement("div");

    summary.style.fontSize = "13px";
    summary.style.marginBottom = "25px";
    summary.style.fontFamily = "Inter, Arial, sans-serif";
    summary.style.lineHeight = "1.8";

    summary.innerHTML = `
    <div>Total Questions: ${totalQuestions}</div>
    <div>Correct: ${correctCount}</div>
    <div>Incorrect: ${incorrectCount}</div>
    <div>Score: ${correctPercentage}%</div>
  `;

    container.appendChild(summary);

    // --------------------------------------------------
    // Table
    // --------------------------------------------------

    const table = document.createElement("table");

    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.tableLayout = "fixed";
    table.style.fontSize = "11px";
    table.style.fontFamily = "Inter, Arial, sans-serif";

    // ---------- Table Header ----------

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headers = ["Question", "Your Answer", "Correct Answer", "Result"];

    headers.forEach((header) => {
      const th = document.createElement("th");

      th.textContent = header;

      th.style.border = "1px solid #cccccc";
      th.style.padding = "8px";
      th.style.background = "#f2f2f2";
      th.style.fontWeight = "700";
      th.style.textAlign = "left";
      th.style.verticalAlign = "middle";

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ---------- Table Body ----------

    const tbody = document.createElement("tbody");

    quizData.forEach((question, index) => {
      const options = (question.options || []).map((option, optionIndex) => ({
        letter: getOptionLetter(option, optionIndex),
        text: getOptionText(option),
      }));

      const selectedAnswer = selectedAnswers[index] || "Not answered";

      const correctAnswer = getCorrectAnswerLetter(question, options);

      const selectedOption = options.find(
        (option) => option.letter === selectedAnswer,
      );

      const correctOption = options.find(
        (option) => option.letter === correctAnswer,
      );

      const selectedAnswerText = selectedOption
        ? `${selectedAnswer}) ${selectedOption.text}`
        : selectedAnswer;

      const correctAnswerText = correctOption
        ? `${correctAnswer}) ${correctOption.text}`
        : correctAnswer;

      const questionText = `${index + 1}. ${question.question || ""}`;

      const resultText =
        selectedAnswer === correctAnswer ? "Correct" : "Incorrect";

      const row = document.createElement("tr");

      const cells = [
        questionText,
        selectedAnswerText,
        correctAnswerText,
        resultText,
      ];

      cells.forEach((text, cellIndex) => {
        const td = document.createElement("td");

        td.textContent = text;

        td.style.border = "1px solid #cccccc";
        td.style.padding = "8px";
        td.style.verticalAlign = "middle";
        td.style.lineHeight = "1.6";
        td.style.wordBreak = "break-word";

        // Persian / English
        if (isPersianText(text)) {
          td.dir = "rtl";
          td.style.textAlign = "right";

          // استفاده از فونت فارسی خود صفحه
          td.style.fontFamily = "Vazirmatn, Arial, sans-serif";
        } else {
          td.dir = "ltr";
          td.style.textAlign = "left";
          td.style.fontFamily = "Inter, Arial, sans-serif";
        }

        // Result column
        if (cellIndex === 3) {
          td.style.fontWeight = "700";
          td.style.textAlign = "center";
          td.dir = "ltr";
          td.style.fontFamily = "Inter, Arial, sans-serif";
        }

        row.appendChild(td);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    document.body.appendChild(container);

    // --------------------------------------------------
    // Wait for fonts
    // --------------------------------------------------

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // کمی زمان برای رندر شدن فونت فارسی
    await new Promise((resolve) => setTimeout(resolve, 200));

    // --------------------------------------------------
    // Convert HTML to image
    // --------------------------------------------------

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // --------------------------------------------------
    // Create PDF
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Remove temporary HTML
    // --------------------------------------------------

    document.body.removeChild(container);

    // --------------------------------------------------
    // Download
    // --------------------------------------------------

    pdf.save("quiz-result.pdf");

    announceAction("download", "Your quiz result PDF has been downloaded.");
  };

  const handleAction = (action) => {
    if (action === "download") {
      handleDownload();
      return;
    }

    if (action === "chat") {
      handleBackToChat();
      return;
    }

    if (action === "retry") {
      navigate("/QuizFirstPage");
      return;
    }

    if (action === "review") {
      navigate("/Review-Answers", {
        state: {
          quizData: location.state?.quizData || [],
          selectedAnswers: location.state?.selectedAnswers || {},
        },
      });
      return;
    }

    const messages = {
      review: "Review Answers selected.",
    };

    announceAction(action, messages[action]);
  };

  // const handleClose = () => {
  //   window.history.back();
  // };

  return (
    <main
      className="w-full min-h-screen flex justify-center overflow-y-auto overflow-x-hidden"
      aria-labelledby="quiz-result-title"
    >
      <div className="relative w-full md:w-[360px] min-h-dvh bg-white overflow-hidden">
        {/* Background */}
        <img
          src={background}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />

        {/* Main 360px content */}
        <div className="relative w-[360px] min-h-[781px] mx-auto">
          <div className="inline-flex flex-col items-start absolute top-0 left-0">
            {/* Title */}
            <section
              className="relative w-[360px] h-[381px]"
              aria-label="Quiz score"
            >
              <h1
                id="quiz-result-title"
                className="absolute top-[80px] w-full text-center font-bold text-[48px] leading-[1.05] bg-[linear-gradient(90deg,rgba(144,207,238,1)_0%,rgba(27,128,177,1)_30%,rgba(163,100,253,1)_65%,rgba(252,72,255,1)_90%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] text-transparent"
              >
                Quiz Result !
              </h1>
            </section>

            {/* Actions */}
            <section
              className="relative w-[360px] h-[300px]"
              aria-label="Quiz result actions"
            >
              <div className="flex flex-col w-[45.00%] h-[52.74%] items-start gap-[15px] absolute top-[37.95%] left-[27.50%]">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleAction(action.id)}
                    className="flex h-11 items-center justify-center gap-2.5 px-0 py-2.5 relative self-stretch w-full bg-primery-700 rounded-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-primery-900 focus-visible:ring-offset-2"
                  >
                    <span className="relative w-fit mt-[-1.00px] font-EN-inter-titles-2 font-[number:var(--EN-inter-titles-2-font-weight)] text-white text-[length:var(--EN-inter-titles-2-font-size)] tracking-[var(--EN-inter-titles-2-letter-spacing)] leading-[var(--EN-inter-titles-2-line-height)] whitespace-nowrap [font-style:var(--EN-inter-titles-2-font-style)]">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Answer summary */}
          <section
            className="flex flex-col w-[140px] items-start gap-[15px] absolute top-[350px] left-[105px]"
            aria-label="Answer summary"
          >
            {resultStatistics.map((statistic) => (
              <div
                key={statistic.label}
                className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]"
              >
                <span
                  className={`${statistic.colorClass} relative w-fit mt-[-1.00px] en-title-2 whitespace-nowrap`}
                >
                  {statistic.label}
                </span>

                <span
                  className={`${statistic.colorClass} relative w-fit mt-[-1.00px] en-title-2 whitespace-nowrap`}
                >
                  {statistic.value}
                </span>
              </div>
            ))}
          </section>

          {/* Quiz score chart */}
          <div
            className="absolute top-[170px] left-[107px] w-[143px] h-[143px] rounded-full"
            role="img"
            aria-label={`Quiz score chart: ${correctPercentage}% correct and ${incorrectPercentage}% incorrect`}
            style={{
              background: `conic-gradient(
               var(--success-600) 0% ${correctPercentage}%,
               var(--error-600) ${correctPercentage}% 100%
             )`,
              boxShadow:
                "inset 0px 2px 4px #00000040, inset 0px -2px 4px #00000040",
            }}
          >
            {/* Center */}
            <div className="absolute inset-[35px] rounded-full bg-white flex items-center justify-center">
              <span className="font-EN-inter-body-body font-[number:var(--EN-inter-body-body-font-weight)] text-black text-[length:var(--EN-inter-body-body-font-size)] tracking-[var(--EN-inter-body-body-letter-spacing)] leading-[var(--EN-inter-body-body-line-height)] [font-style:var(--EN-inter-body-body-font-style)]">
                {correctPercentage}%
              </span>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      </div>
    </main>
  );
};
