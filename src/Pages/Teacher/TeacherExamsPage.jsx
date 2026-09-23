import { useContext, useState } from "react";
import { ArrowLeft, Plus, Clock3, CalendarDays, Pencil, BarChart3 } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";

export const TeacherExams = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const [exams] = useState([
    {
      id: 1,
      title: "آزمون فصل اول",
      course: "سیستم عامل",
      topic: "مفاهیم اولیه سیستم عامل",
      date: "1405/07/10",
      time: "10:00 - 11:00",
      duration: "60 دقیقه",
      active: true,
    },
    {
      id: 2,
      title: "آزمون میان‌ترم",
      course: "سیستم عامل",
      topic: "مدیریت پردازش‌ها",
      date: "1405/07/15",
      time: "12:00 - 13:30",
      duration: "90 دقیقه",
      active: true,
    },
    {
      id: 3,
      title: "آزمون فصل سوم",
      course: "سیستم عامل",
      topic: "مدیریت حافظه",
      date: "1405/06/20",
      time: "09:00 - 10:00",
      duration: "60 دقیقه",
      active: false,
    },
    {
      id: 4,
      title: "آزمون فصل چهارم",
      course: "سیستم عامل",
      topic: "مدیریت فایل‌ها",
      date: "1405/07/25",
      time: "11:00 - 12:00",
      duration: "60 دقیقه",
      scheduled: true,
    },
  ]);

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="text-white w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
          >
            <ArrowLeft
              className={`!w-6 !h-6 text-neutral-scale70 ${
                isRTL ? "rotate-180" : ""
              }`}
            />
          </button>

          <h1
            className={`flex-1 mx-2 text-neutral-scale70 ${
              isRTL
                ? "fa-title-1 font-vazir text-right"
                : "en-title-1 font-inter text-left"
            } truncate whitespace-nowrap`}
          >
            {isRTL ? "آزمون‌ها" : "Exams"}
          </h1>
        </div>
      </header>

      {/* Content */}
      <section className="w-full flex-1 min-h-0 pb-[80px] overflow-y-auto overflow-x-hidden">
        <div className="w-full px-3.5 ">
          <div className="mt-[5px] w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[20px]">
            {/* Section Header */}
            <div className="px-4 flex items-center justify-between gap-2">
              <p
                className={`text-primery-800 dark:text-neutral-scale70 ${
                  isRTL
                    ? "fa-body-medium font-vazir text-right"
                    : "en-body-medium font-inter text-left"
                }`}
              >
                {isRTL ? "آزمون‌های درس" : "Course Exams"}
              </p>

              {/* Add Exam */}
              <button
                type="button"
                onClick={() => console.log("Add Exam")}
                className="
                  flex
                  items-center
                  justify-center
                  gap-[5px]
                  h-[32px]
                  px-[10px]
                  rounded-[9px]
                  bg-primery-700
                  text-neutral-scale70
                  hover:bg-primery-800
                  active:scale-[0.98]
                  transition-all
                  shrink-0
                "
              >
                <Plus className="!w-[15px] !h-[15px]" />

                <span
                  className={
                    isRTL
                      ? "fa-caption-1 font-vazir"
                      : "en-caption-1 font-inter"
                  }
                >
                  {isRTL ? "افزودن آزمون" : "Add Exam"}
                </span>
              </button>
            </div>

            {/* Exams */}
            <div className="flex flex-col w-full gap-[12px] mt-[16px] px-3.5">
              {exams.map((exam) => {
                const isScheduled = exam.scheduled;
                const isActive = exam.active;

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
                          : isScheduled
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
                              grayscale-[30%]
                            `
                      }
                    `}
                  >
                    {/* Top */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-[10px] min-w-0 flex-1">
                        {/* Exam Icon */}
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
                                : isScheduled
                                  ? "bg-primery-100 dark:bg-primery-1000"
                                  : "bg-neutral-scale300 dark:bg-neutral-scale1200"
                            }
                          `}
                        >
                          <CalendarDays
                            className={`
                              !w-[20px]
                              !h-[20px]
                              ${
                                isActive
                                  ? "text-success-1000 dark:text-success-100"
                                  : isScheduled
                                    ? "text-primery-1000 dark:text-primery-90 "
                                    : "text-neutral-scale700 dark:text-neutral-scale400"
                              }
                            `}
                          />
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
                                isActive || isScheduled
                                  ? "text-neutral-scale1800 dark:text-neutral-scale70"
                                  : "text-neutral-scale900 dark:text-neutral-scale500"
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
                                isActive || isScheduled
                                  ? "text-neutral-scale1000 dark:text-neutral-scale300"
                                  : "text-neutral-scale700 dark:text-neutral-scale500"
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
                      <div className="flex flex-col items-end gap-[6px] shrink-0">
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
                                : isScheduled
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
                                  : isScheduled
                                    ? "bg-primery-900 dark:bg-primery-90"
                                    : "bg-neutral-scale700"
                              }
                            `}
                          />

                          <span
                            className={`${
                              isRTL
                                ? "fa-caption-1 font-vazir"
                                : "en-caption-1 font-inter"
                            } ${
                              isActive
                                ? "text-success-1000 dark:text-success-100"
                                : isScheduled
                                  ? "text-primery-1000 dark:text-primery-90"
                                  : "text-neutral-scale900 dark:text-neutral-scale400"
                            }`}
                          >
                            {isRTL
                              ? isActive
                                ? "فعال"
                                : isScheduled
                                  ? "تعریف شده"
                                  : "غیرفعال"
                              : isActive
                                ? "Active"
                                : isScheduled
                                  ? "Scheduled"
                                  : "Inactive"}
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
                            : isScheduled
                              ? "bg-primery-500 dark:bg-primery-800"
                              : "bg-neutral-scale300 dark:bg-neutral-scale1200"
                        }
                      `}
                    />

                    {/* Topic */}
                    <div className="flex items-center gap-[3px]">
                      <span
                        className={`
                          ${
                            isActive || isScheduled
                              ? "text-neutral-scal1800 dark:text-neutral-scale70"
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
                          ${
                            isActive || isScheduled
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

                    {/* Date & Time */}
                    <div className="flex items-center gap-[12px] mt-[11px]">
                      {/* Date */}
                      <div className="flex items-center gap-[5px] min-w-0">
                        <CalendarDays
                          className={`
                            !w-[15px]
                            !h-[15px]
                            shrink-0
                            ${
                              isActive || isScheduled
                                ? "text-neutral-scale900 dark:text-neutral-scale400"
                                : "text-neutral-scale700 dark:text-neutral-scale500"
                            }
                          `}
                        />

                        <span
                          className={`
                            truncate
                            ${
                              isActive || isScheduled
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

                      {/* Time */}
                      <div className="flex items-center gap-[5px] min-w-0">
                        <Clock3
                          className={`
                            !w-[15px]
                            !h-[15px]
                            shrink-0
                            ${
                              isActive || isScheduled
                                ? "text-neutral-scale900 dark:text-neutral-scale400"
                                : "text-neutral-scale700 dark:text-neutral-scale500"
                            }
                          `}
                        />

                        <span
                          className={`
                            truncate
                            ${
                              isActive || isScheduled
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
                          {exam.time}
                        </span>
                      </div>
                    </div>

                    {/* Edit Button */}
                    {isScheduled && (
                      <button
                        type="button"
                        onClick={() => console.log("Edit Exam", exam.id)}
                        className="
                          w-full
                          flex
                          items-center
                          justify-center
                          gap-[5px]
                          h-[32px]
                          mt-[12px]
                          px-[10px]
                          rounded-[8px]    
                          border
                          border-primery-800
                          text-primery-1000
                          dark:text-neutral-scale70
                          bg-primery-100
                          hover:bg-primery-200
                          dark:bg-primery-1000
                          active:scale-[0.98]
                          transition-all
                        "
                      >
                        <Pencil className="!w-[13px] !h-[13px] text-primery-1000 dark:text-neutral-scale70" />

                        <span
                          className={
                            isRTL
                              ? "fa-caption-1 font-vazir"
                              : "en-caption-1 font-inter"
                          }
                        >
                          {isRTL ? "ویرایش" : "Edit"}
                        </span>
                      </button>
                    )}

                    {/* Results Button */}
                    {!isActive && !isScheduled && (
                      <button
                        type="button"
                        onClick={() => console.log("View Results", exam.id)}
                        className="
                          w-full
                          flex
                          items-center
                          justify-center
                          gap-[5px]
                          h-[32px]
                          mt-[12px]
                          px-[10px]
                          rounded-[8px]
                          border
                          border-neutral-scale600
                          dark:border-neutral-scale200
                          bg-neutral-scale70
                          dark:bg-neutral-scale1200
                          text-neutral-scale1200
                          dark:text-neutral-scale80
                          hover:bg-neutral-scale100
                          dark:hover:bg-neutral-scale1100
                          hover:border-neutral-scale800
                          dark:hover:border-neutral-scale500
                          active:scale-[0.98]
                          transition-all
                          cursor-pointer
                        "
                      >
                        <BarChart3 className="!w-[15px] !h-[15px] dark:text-neutral-scale80" />

                        <span
                          className={
                            isRTL
                              ? "fa-caption-1 font-vazir"
                              : "en-caption-1 font-inter"
                          }
                        >
                          {isRTL ? "مشاهده نتایج" : "View Results"}
                        </span>
                      </button>
                    )}
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

