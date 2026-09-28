import { useContext, useState, useEffect } from "react";
import { ArrowLeft, Plus, Clock3, CalendarDays, Pencil, BarChart3, CheckCircle2 } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { CreateExamAccordion } from "@/Components/CreateExamAccordion";
import { examsApi } from "@/api/new/exams.api";
import { TeacherExamResultsModal } from "@/Components/TeacherExamResultsModal";
import { TeacherEditExamModal } from "@/Components/TeacherEditExamModal";

export const TeacherExams = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingExam, setEditingExam] = useState(null);
  const [resultsExam, setResultsExam] = useState(null);

  const [exams, setExams] = useState([]);

  const deduplicateExams = (items) => {
    const seenIds = new Set();
    const seenTitles = new Set();
    return items.filter((item) => {
      const idKey = String(item.id || item.quiz_id);
      const titleKey = (item.title || "").trim().toLowerCase();
      if (seenIds.has(idKey)) return false;
      if (titleKey && seenTitles.has(titleKey)) return false;
      seenIds.add(idKey);
      if (titleKey) seenTitles.add(titleKey);
      return true;
    });
  };

  const loadExams = () => {
    examsApi
      .getLessonQuizzes("c0000000-0000-4000-8000-000000000001")
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const mapped = data.map((q) => {
          let timeDisplay = "10:00 - 10:25";
          if (q.start_at && q.end_at) {
            try {
              if (typeof q.start_at === "string" && q.start_at.includes(":") && !q.start_at.includes("T")) {
                timeDisplay = `${q.start_at} - ${q.end_at}`;
              } else {
                const s = new Date(q.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const e = new Date(q.end_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                timeDisplay = `${s} - ${e}`;
              }
            } catch {
              timeDisplay = `${q.start_at} - ${q.end_at}`;
            }
          }
          const topic = (Array.isArray(q.goals) && q.goals.length > 0)
            ? q.goals.map((g) => (typeof g === "object" && g !== null ? (g.title || g.name || "") : String(g))).filter(Boolean).join("، ")
            : (q.description || "مباحث آزمون");

          return {
            id: q.quiz_id || q.id,
            title: q.title,
            course: "سیستم عامل",
            topic: topic || "مباحث آزمون",
            date: q.exam_date || "1405/07/20",
            time: timeDisplay,
            duration: `${q.duration_minutes || 10} دقیقه هر دانشجو`,
            active: q.is_active ?? true,
            scheduled: true,
          };
        });

        setExams(deduplicateExams(mapped));
      })
      .catch(() => {});
  };

  // Load backend exams on mount
  useEffect(() => {
    loadExams();
  }, []);

  const handleExamCreated = () => {
    setIsCreatingExam(false);
    setSuccessMessage(
      isRTL ? "آزمون جدید با موفقیت ایجاد شد و در لیست قرار گرفت!" : "New exam created successfully!"
    );
    loadExams();
    setTimeout(() => {
      setSuccessMessage("");
    }, 4500);
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
  };

  const handleViewResults = (exam) => {
    setResultsExam(exam);
  };

  const handleExamUpdated = () => {
    setEditingExam(null);
    setSuccessMessage(
      isRTL ? "مشخصات آزمون با موفقیت ویرایش شد!" : "Exam updated successfully!"
    );
    loadExams();
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => (isCreatingExam ? setIsCreatingExam(false) : navigate(-1))}
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
            {isCreatingExam
              ? isRTL
                ? "ساخت آزمون جدید"
                : "Create New Exam"
              : isRTL
              ? "آزمون‌ها"
              : "Exams"}
          </h1>
        </div>
      </header>

      {/* Content */}
      <section className="w-full flex-1 min-h-0">
        {successMessage && (
          <div className="mx-3.5 mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-xs font-vazir">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {isCreatingExam ? (
          <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden pt-[15px]">
            <CreateExamAccordion
              courseId="c0000000-0000-4000-8000-000000000001"
              courseTitle="سیستم عامل"
              onExamCreated={handleExamCreated}
              onCancel={() => setIsCreatingExam(false)}
            />
          </div>
        ) : (
          <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden pb-[80px]">
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
                  onClick={() => setIsCreatingExam(true)}
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

                    {/* Action Buttons: Edit and Results */}
                    <div className="flex items-center gap-2 mt-[12px] w-full">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEdit(exam)}
                        className="
                          flex-1
                          flex
                          items-center
                          justify-center
                          gap-[5px]
                          h-[32px]
                          px-[8px]
                          rounded-[8px]    
                          border
                          border-primery-800
                          text-neutral-scale1800
                          dark:text-neutral-scale70
                          bg-primery-100
                          hover:bg-primery-200
                          dark:bg-primery-1000
                          active:scale-[0.98]
                          transition-all
                          cursor-pointer
                        "
                      >
                        <Pencil className="!w-[13px] !h-[13px] text-neutral-scale1800 dark:text-neutral-scale70" />
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

                      {/* Results Button */}
                      <button
                        type="button"
                        onClick={() => handleViewResults(exam)}
                        className="
                          flex-1
                          flex
                          items-center
                          justify-center
                          gap-[5px]
                          h-[32px]
                          px-[8px]
                          rounded-[8px]
                          border
                          border-neutral-scale600
                          dark:border-neutral-scale200
                          bg-neutral-scale70
                          dark:bg-neutral-scale1200
                          text-neutral-scale1800
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
                        <BarChart3 className="!w-[14px] !h-[14px] dark:text-neutral-scale80" />
                        <span
                          className={
                            isRTL
                              ? "fa-caption-1 font-vazir"
                              : "en-caption-1 font-inter"
                          }
                        >
                          {isRTL ? "نتایج" : "Results"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </section>

      {/* Teacher Edit Exam Modal */}
      {editingExam && (
        <TeacherEditExamModal
          isOpen={Boolean(editingExam)}
          onClose={() => setEditingExam(null)}
          exam={editingExam}
          onSuccess={handleExamUpdated}
        />
      )}

      {/* Teacher Exam Results Modal */}
      {resultsExam && (
        <TeacherExamResultsModal
          isOpen={Boolean(resultsExam)}
          onClose={() => setResultsExam(null)}
          exam={resultsExam}
        />
      )}
    </main>
  );
};

