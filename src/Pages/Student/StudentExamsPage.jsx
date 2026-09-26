import { useContext, useEffect, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  CalendarDays,
  Play,
  Hourglass,
  CheckCircle2,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";

export const StudentExams = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  /*
   * هر آزمون اینجا زمان اختصاصی همین دانشجو را دارد.
   *
   * startAt / endAt باید در نسخه واقعی از Backend بیاید.
   */
  const [exams] = useState([
    {
      id: 1,
      title: "آزمون فصل اول",
      course: "سیستم عامل",
      topic: "مفاهیم اولیه سیستم عامل",
      date: "1405/07/10",

      // زمان اختصاص داده شده به این دانشجو
      startAt: "2026-09-26T10:15:00+03:30",
      endAt: "2026-09-26T10:35:00+03:30",

      // برای تست می‌توانی زمان‌ها را تغییر بدهی
      duration: 20,
    },

    {
      id: 2,
      title: "آزمون میان‌ترم",
      course: "سیستم عامل",
      topic: "مدیریت پردازش‌ها",
      date: "1405/07/15",

      startAt: "2026-09-26T17:00:00+03:30",
      endAt: "2026-09-26T17:30:00+03:30",

      duration: 30,
    },

    {
      id: 3,
      title: "آزمون فصل سوم",
      course: "سیستم عامل",
      topic: "مدیریت حافظه",
      date: "1405/07/20",

      startAt: "2026-09-26T12:00:00+03:30",
      endAt: "2026-09-26T12:25:00+03:30",

      duration: 25,
    },
  ]);

  /*
   * این state فقط برای اینکه countdown هر ثانیه آپدیت شود.
   */
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /*
   * وضعیت هر آزمون:
   *
   * waiting  => هنوز شروع نشده
   * active   => الان دانشجو می‌تواند وارد آزمون شود
   * expired  => زمان آزمون تمام شده
   */
  const getExamStatus = (exam) => {
    const start = new Date(exam.startAt).getTime();
    const end = new Date(exam.endAt).getTime();

    if (now < start) {
      return "waiting";
    }

    if (now >= start && now < end) {
      return "active";
    }

    return "expired";
  };

  /*
   * تبدیل میلی‌ثانیه به:
   * 00:12:35
   */
  const formatCountdown = (milliseconds) => {
    if (milliseconds <= 0) {
      return "00:00:00";
    }

    const totalSeconds = Math.floor(milliseconds / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  };

  /*
   * ساعت را از startAt / endAt می‌گیرد.
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleTimeString(isRTL ? "fa-IR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleStartExam = (exam) => {
    if (getExamStatus(exam) !== "active") return;

    /*
     * مسیر صفحه آزمونت را اینجا قرار بده.
     */
    navigate(`/StudentExam/${exam.id}`);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="
        bg-[#f1f0f0]
        dark:bg-neutral-scale1400
        w-full
        md:w-[360px]
        h-dvh
        mx-auto
        flex
        flex-col
        overflow-hidden
      "
    >
      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div
          className="
            w-full
            h-[65px]
            relative
            flex
            items-center
            px-4
            bg-primery-700
            dark:bg-neutral-scale1300
            border-b
            dark:border-neutral-scale1000
          "
        >
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="
              text-white
              w-8
              h-8
              flex
              items-center
              justify-center
              cursor-pointer
              shrink-0
            "
          >
            <ArrowLeft
              className={`!w-6 !h-6 text-neutral-scale70 ${
                isRTL ? "rotate-180" : ""
              }`}
            />
          </button>

          <h1
            className={`
              flex-1
              mx-2
              text-neutral-scale70
              ${
                isRTL
                  ? "fa-title-1 font-vazir text-right"
                  : "en-title-1 font-inter text-left"
              }
              truncate
              whitespace-nowrap
            `}
          >
            {isRTL ? "آزمون‌های من" : "My Exams"}
          </h1>
        </div>
      </header>

      {/* Content */}
      <section className="w-full flex-1 min-h-0">
        <div
          className="
            w-full
            h-full
            px-3.5
            overflow-y-auto
            overflow-x-hidden
            pb-[80px]
          "
        >
          <div
            className="
              mt-[5px]
              w-full
              bg-neutral-scale70
              dark:bg-neutral-scale1300
              border
              border-neutral-scale100
              dark:border-neutral-scale1100
              rounded-[13px]
              py-[20px]
            "
          >
            {/* Section Header */}
            <div className="px-4">
              <p
                className={`
                  text-primery-800
                  dark:text-neutral-scale70
                  ${
                    isRTL
                      ? "fa-body-medium font-vazir text-right"
                      : "en-body-medium font-inter text-left"
                  }
                `}
              >
                {isRTL ? "آزمون‌های من" : "My Exams"}
              </p>

              <p
                className={`
                  mt-[4px]
                  text-neutral-scale900
                  dark:text-neutral-scale400
                  ${
                    isRTL
                      ? "fa-caption-1 font-vazir text-right"
                      : "en-caption-1 font-inter text-left"
                  }
                `}
              >
                {isRTL
                  ? "آزمون‌هایی که برای شما تعریف شده‌اند"
                  : "Exams assigned to you"}
              </p>
            </div>

            {/* Exams */}
            <div className="flex flex-col w-full gap-[12px] mt-[16px] px-3.5">
              {exams.map((exam) => {
                const status = getExamStatus(exam);

                const startTime = new Date(exam.startAt).getTime();
                const endTime = new Date(exam.endAt).getTime();

                const remainingUntilStart = startTime - now;
                const remainingUntilEnd = endTime - now;

                const isWaiting = status === "waiting";
                const isActive = status === "active";
                const isExpired = status === "expired";

                return (
                  <div
                    key={exam.id}
                    className={`
                      w-full
                      rounded-[12px]
                      border
                      p-3
                      transition-colors
                      ${
                        isActive
                          ? `
                            border-success-500
                            dark:border-success-600
                            bg-green-50
                            dark:bg-green-950/30
                          `
                          : isWaiting
                          ? `
                            border-primery-500
                            dark:border-primery-800
                            bg-blue-100
                            dark:bg-blue-950/30
                          `
                          : `
                            border-neutral-scale600
                            dark:border-neutral-scale1500
                            bg-neutral-scale90
                            dark:bg-neutral-scale900
                            opacity-80
                          `
                      }
                    `}
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-[10px] min-w-0 flex-1">
                        {/* Icon */}
                        <div
                          className={`
                            w-[42px]
                            h-[42px]
                            rounded-[10px]
                            flex
                            items-center
                            justify-center
                            shrink-0
                            ${
                              isActive
                                ? "bg-success-100 dark:bg-success-1000"
                                : isWaiting
                                ? "bg-primery-100 dark:bg-primery-1000"
                                : "bg-neutral-scale300 dark:bg-neutral-scale1200"
                            }
                          `}
                        >
                          {isWaiting ? (
                            <Hourglass
                              className={`
                                !w-[20px]
                                !h-[20px]
                                text-primery-1000
                                dark:text-primery-90
                              `}
                            />
                          ) : (
                            <CalendarDays
                              className={`
                                !w-[20px]
                                !h-[20px]
                                ${
                                  isActive
                                    ? "text-success-1000 dark:text-success-100"
                                    : "text-neutral-scale700 dark:text-neutral-scale400"
                                }
                              `}
                            />
                          )}
                        </div>

                        {/* Title */}
                        <div className="flex flex-col min-w-0 flex-1 gap-[2px]">
                          <span
                            dir="rtl"
                            className={`
                              fa-body-medium
                              font-vazir
                              font-semibold
                              truncate
                              ${
                                isExpired
                                  ? "text-neutral-scale900 dark:text-neutral-scale500"
                                  : "text-neutral-scale1800 dark:text-neutral-scale70"
                              }
                              ${
                                isRTL
                                  ? "text-right"
                                  : "text-left [direction:rtl]"
                              }
                            `}
                          >
                            {exam.title}
                          </span>

                          <span
                            dir="rtl"
                            className={`
                              fa-caption-1
                              font-vazir
                              truncate
                              ${
                                isExpired
                                  ? "text-neutral-scale700 dark:text-neutral-scale500"
                                  : "text-neutral-scale1000 dark:text-neutral-scale300"
                              }
                              ${
                                isRTL
                                  ? "text-right"
                                  : "text-left [direction:rtl]"
                              }
                            `}
                          >
                            {exam.course}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div
                        className="
                          flex
                          flex-col
                          items-end
                          gap-[6px]
                          shrink-0
                        "
                      >
                        <div
                          className={`
                            flex
                            items-center
                            gap-[5px]
                            px-[8px]
                            py-[4px]
                            rounded-full
                            ${
                              isActive
                                ? "bg-success-100 dark:bg-success-1000"
                                : isWaiting
                                ? "bg-primery-100 dark:bg-primery-1000"
                                : "bg-neutral-scale200 dark:bg-neutral-scale1100"
                            }
                          `}
                        >
                          <span
                            className={`
                              w-[6px]
                              h-[6px]
                              rounded-full
                              ${
                                isActive
                                  ? "bg-success-900 dark:bg-success-100"
                                  : isWaiting
                                  ? "bg-primery-900 dark:bg-primery-90"
                                  : "bg-neutral-scale700"
                              }
                            `}
                          />

                          <span
                            className={`
                              ${
                                isRTL
                                  ? "fa-caption-1 font-vazir"
                                  : "en-caption-1 font-inter"
                              }
                              ${
                                isActive
                                  ? "text-success-1000 dark:text-success-100"
                                  : isWaiting
                                  ? "text-primery-1000 dark:text-primery-90"
                                  : "text-neutral-scale900 dark:text-neutral-scale400"
                              }
                            `}
                          >
                            {isRTL
                              ? isActive
                                ? "آماده شروع"
                                : isWaiting
                                ? "در انتظار"
                                : "پایان یافته"
                              : isActive
                              ? "Ready"
                              : isWaiting
                              ? "Waiting"
                              : "Expired"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div
                      className={`
                        w-full
                        h-[1px]
                        my-[11px]
                        ${
                          isActive
                            ? "bg-success-500 dark:bg-success-600"
                            : isWaiting
                            ? "bg-primery-500 dark:bg-primery-800"
                            : "bg-neutral-scale300 dark:bg-neutral-scale1200"
                        }
                      `}
                    />

                    {/* Topic */}
                    <div className="flex items-start gap-[3px]">
                      <span
                        className={`
                          shrink-0
                          ${
                            isActive || isWaiting
                              ? "text-neutral-scale1800 dark:text-neutral-scale70"
                              : "text-neutral-scale900 dark:text-neutral-scale500"
                          }
                          ${
                            isRTL
                              ? "fa-caption-1 font-vazir text-right"
                              : "en-caption-1 font-inter text-left"
                          }
                        `}
                      >
                        {isRTL ? "مبحث آزمون :" : "Exam Topic :"}
                      </span>

                      <span
                        dir="rtl"
                        className={`
                          min-w-0
                          ${
                            isActive || isWaiting
                              ? "text-neutral-scale1800 dark:text-neutral-scale70"
                              : "text-neutral-scale900 dark:text-neutral-scale500"
                          }
                          ${
                            isRTL
                              ? "fa-caption-1 text-right"
                              : "en-caption-1 text-left"
                          }
                        `}
                      >
                        {exam.topic}
                      </span>
                    </div>

                    {/* Student Time */}
                    <div className="flex items-center gap-[12px] mt-[11px]">
                      {/* Date */}
                      <div className="flex items-center gap-[5px] min-w-0">
                        <CalendarDays
                          className={`
                            !w-[15px]
                            !h-[15px]
                            shrink-0
                            ${
                              isActive || isWaiting
                                ? "text-neutral-scale900 dark:text-neutral-scale400"
                                : "text-neutral-scale700 dark:text-neutral-scale500"
                            }
                          `}
                        />

                        <span
                          className={`
                            truncate
                            ${
                              isActive || isWaiting
                                ? "text-neutral-scale1200 dark:text-neutral-scale300"
                                : "text-neutral-scale800 dark:text-neutral-scale500"
                            }
                            ${
                              isRTL
                                ? "fa-caption-1 font-vazir"
                                : "en-caption-1 font-inter"
                            }
                          `}
                        >
                          {exam.date}
                        </span>
                      </div>

                      {/* Student Time */}
                      <div className="flex items-center gap-[5px] min-w-0">
                        <Clock3
                          className={`
                            !w-[15px]
                            !h-[15px]
                            shrink-0
                            ${
                              isActive || isWaiting
                                ? "text-neutral-scale900 dark:text-neutral-scale400"
                                : "text-neutral-scale700 dark:text-neutral-scale500"
                            }
                          `}
                        />

                        <span
                          className={`
                            truncate
                            ${
                              isActive || isWaiting
                                ? "text-neutral-scale1200 dark:text-neutral-scale300"
                                : "text-neutral-scale800 dark:text-neutral-scale500"
                            }
                            ${
                              isRTL
                                ? "fa-caption-1 font-vazir"
                                : "en-caption-1 font-inter"
                            }
                          `}
                        >
                          {formatTime(exam.startAt)} - {formatTime(exam.endAt)}
                        </span>
                      </div>
                    </div>

                    {/* Countdown / Remaining */}
                    {isWaiting && (
                      <div
                        className="
                          mt-[10px]
                          w-full
                          rounded-[8px]
                          bg-primery-50
                          dark:bg-primery-1100
                          border
                          border-primery-200
                          dark:border-primery-900
                          px-[10px]
                          py-[7px]
                          flex
                          items-center
                          justify-between
                          gap-2
                        "
                      >
                        <span
                          className={`
                            text-primery-1000
                            dark:text-primery-100
                            ${
                              isRTL
                                ? "fa-caption-1 font-vazir"
                                : "en-caption-1 font-inter"
                            }
                          `}
                        >
                          {isRTL
                            ? "زمان باقی‌مانده تا شروع"
                            : "Starts in"}
                        </span>

                        <span
                          dir="ltr"
                          className="
                            text-primery-1000
                            dark:text-primery-100
                            font-inter
                            text-[12px]
                            font-semibold
                            tabular-nums
                          "
                        >
                          {formatCountdown(remainingUntilStart)}
                        </span>
                      </div>
                    )}

                    {/* Active remaining time */}
                    {isActive && (
                      <div
                        className="
                          mt-[10px]
                          w-full
                          rounded-[8px]
                          bg-success-50
                          dark:bg-success-1100
                          border
                          border-success-200
                          dark:border-success-900
                          px-[10px]
                          py-[7px]
                          flex
                          items-center
                          justify-between
                          gap-2
                        "
                      >
                        <span
                          className={`
                            text-success-1000
                            dark:text-success-100
                            ${
                              isRTL
                                ? "fa-caption-1 font-vazir"
                                : "en-caption-1 font-inter"
                            }
                          `}
                        >
                          {isRTL
                            ? "زمان باقی‌مانده آزمون"
                            : "Time remaining"}
                        </span>

                        <span
                          dir="ltr"
                          className="
                            text-success-1000
                            dark:text-success-100
                            font-inter
                            text-[12px]
                            font-semibold
                            tabular-nums
                          "
                        >
                          {formatCountdown(remainingUntilEnd)}
                        </span>
                      </div>
                    )}

                    {/* Start Button */}
                    <button
                      type="button"
                      disabled={!isActive}
                      onClick={() => handleStartExam(exam)}
                      className={`
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-[5px]
                        h-[34px]
                        mt-[12px]
                        px-[10px]
                        rounded-[8px]
                        border
                        transition-all
                        ${
                          isActive
                            ? `
                              border-success-700
                              bg-success-500
                              hover:bg-success-600
                              text-white
                              cursor-pointer
                              active:scale-[0.98]
                            `
                            : isWaiting
                            ? `
                              border-primery-500
                              dark:border-primery-800
                              bg-primery-100
                              dark:bg-primery-1000
                              text-primery-1000
                              dark:text-primery-90
                              cursor-not-allowed
                            `
                            : `
                              border-neutral-scale500
                              dark:border-neutral-scale1200
                              bg-neutral-scale200
                              dark:bg-neutral-scale1100
                              text-neutral-scale700
                              dark:text-neutral-scale500
                              cursor-not-allowed
                            `
                        }
                      `}
                    >
                      {isActive ? (
                        <Play className="!w-[14px] !h-[14px]" />
                      ) : isWaiting ? (
                        <Hourglass className="!w-[14px] !h-[14px]" />
                      ) : (
                        <CheckCircle2 className="!w-[14px] !h-[14px]" />
                      )}

                      <span
                        className={
                          isRTL
                            ? "fa-caption-1 font-vazir"
                            : "en-caption-1 font-inter"
                        }
                      >
                        {isRTL
                          ? isActive
                            ? "شروع آزمون"
                            : isWaiting
                            ? `شروع آزمون در ${formatCountdown(
                                remainingUntilStart
                              )}`
                            : "آزمون به پایان رسیده"
                          : isActive
                          ? "Start Exam"
                          : isWaiting
                          ? `Starts in ${formatCountdown(
                              remainingUntilStart
                            )}`
                          : "Exam Ended"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
