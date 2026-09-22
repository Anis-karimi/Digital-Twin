import { useContext, useState } from "react";
import { ArrowLeft, Plus, Clock3, CalendarDays } from "lucide-react";
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
      <section className="w-full flex-1 min-h-0 mt-[15px] mb-[75px]">
        <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden">
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
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="
                    w-full
                    rounded-[12px]
                    border
                    border-neutral-scale300
                    dark:border-neutral-scale1000
                    bg-neutral-scale80
                    dark:bg-neutral-scale1200
                    p-3
                  "
                >
                  {/* Top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-[10px] min-w-0 flex-1">

                      {/* Exam Icon */}
                      <div
                        className="
                          w-[42px]
                          h-[42px]
                          rounded-[10px]
                          bg-primery-100
                          dark:bg-neutral-scale1100
                          flex
                          items-center
                          justify-center
                          shrink-0
                        "
                      >
                        <CalendarDays
                          className="!w-[20px] !h-[20px] text-primery-800 dark:text-neutral-scale70"
                        />
                      </div>

                      {/* Title */}
                      <div className="flex flex-col min-w-0 flex-1 gap-[2px]">
                        <span
                          dir="rtl"
                          className={`fa-body-medium font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70 truncate ${
                            isRTL
                              ? "text-right"
                              : "text-left [direction:rtl]"
                          }`}
                        >
                          {exam.title}
                        </span>

                        <span
                          dir="rtl"
                          className={`fa-caption-1 font-vazir text-neutral-scale1000 dark:text-neutral-scale300 truncate ${
                            isRTL
                              ? "text-right"
                              : "text-left [direction:rtl]"
                          }`}
                        >
                          {exam.course}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div
                      className={`
                        flex
                        items-center
                        gap-[5px]
                        px-[8px]
                        py-[4px]
                        rounded-full
                        shrink-0
                        ${
                          exam.active
                            ? "bg-green-100 dark:bg-green-950"
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
                            exam.active
                              ? "bg-green-600"
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
                          exam.active
                            ? "text-green-700 dark:text-green-300"
                            : "text-neutral-scale900 dark:text-neutral-scale400"
                        }`}
                      >
                        {isRTL
                          ? exam.active
                            ? "فعال"
                            : "غیرفعال"
                          : exam.active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-[1px] bg-neutral-scale200 dark:bg-neutral-scale1100 my-[11px]" />

                  {/* Topic */}
                  <div className="flex flex-col gap-[3px]">
                    <span
                      className={`text-neutral-scale900 dark:text-neutral-scale400 ${
                        isRTL
                          ? "fa-caption-1 font-vazir text-right"
                          : "en-caption-1 font-inter text-left"
                      }`}
                    >
                      {isRTL ? "مبحث آزمون" : "Exam Topic"}
                    </span>

                    <span
                      dir="rtl"
                      className={`text-neutral-scale1800 dark:text-neutral-scale70 ${
                        isRTL
                          ? "fa-body-small font-vazir text-right"
                          : "fa-body-small font-vazir text-left"
                      }`}
                    >
                      {exam.topic}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-center gap-[12px] mt-[11px]">

                    {/* Date */}
                    <div className="flex items-center gap-[5px] min-w-0">
                      <CalendarDays
                        className="!w-[15px] !h-[15px] text-neutral-scale900 dark:text-neutral-scale400 shrink-0"
                      />

                      <span
                        className={`text-neutral-scale1200 dark:text-neutral-scale300 truncate ${
                          isRTL
                            ? "fa-caption-1 font-vazir"
                            : "en-caption-1 font-inter"
                        }`}
                      >
                        {exam.date}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-[5px] min-w-0">
                      <Clock3
                        className="!w-[15px] !h-[15px] text-neutral-scale900 dark:text-neutral-scale400 shrink-0"
                      />

                      <span
                        className={`text-neutral-scale1200 dark:text-neutral-scale300 truncate ${
                          isRTL
                            ? "fa-caption-1 font-vazir"
                            : "en-caption-1 font-inter"
                        }`}
                      >
                        {exam.time}
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="mt-[8px]">
                    <span
                      className={`text-neutral-scale900 dark:text-neutral-scale400 ${
                        isRTL
                          ? "fa-caption-1 font-vazir"
                          : "en-caption-1 font-inter"
                      }`}
                    >
                      {isRTL
                        ? `مدت آزمون: ${exam.duration}`
                        : `Duration: ${exam.duration}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
