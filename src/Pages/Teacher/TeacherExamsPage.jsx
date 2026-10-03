import { useContext, useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  Clock3,
  CalendarDays,
  Pencil,
  BarChart3,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Check,
  X,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { CreateExamAccordion } from "@/Components/CreateExamAccordion";
import { examsApi } from "@/api/new/exams.api";
import { TeacherExamResultsModal } from "@/Components/TeacherExamResultsModal";
import { jalaliToGregorian, toPersianDigits } from "@/utils/dateUtils";
import { isPersianText } from "@/utils/textUtils";

export const getExamTimingState = (exam, isRTL = true) => {
  // If explicitly marked inactive or completed
  if (exam.is_active === false || exam.active === false || exam.status === "completed" || exam.status === "ended") {
    return {
      status: "ended",
      label: isRTL ? "پایان یافته" : "Ended",
      colorClass: "border-neutral-scale600 dark:border-neutral-scale1500 bg-neutral-scale90 dark:bg-neutral-scale900 opacity-80 grayscale-[30%]",
      badgeClass: "bg-neutral-scale200 dark:bg-neutral-scale1100 text-neutral-scale900 dark:text-neutral-scale400",
      dotClass: "bg-neutral-scale700",
      iconBoxClass: "bg-neutral-scale300 dark:bg-neutral-scale1200",
      iconClass: "text-neutral-scale700 dark:text-neutral-scale400",
      dividerClass: "bg-neutral-scale300 dark:bg-neutral-scale1200",
      canEdit: false, // دیگر قابلیت ادیت ندارد
      canViewResults: true,
    };
  }

  let startTimeStr = "10:00";
  let endTimeStr = "11:30";

  if (exam.time && typeof exam.time === "string" && exam.time.includes("-")) {
    const parts = exam.time.split("-").map((p) => p.trim());
    if (parts[0]) startTimeStr = parts[0];
    if (parts[1]) endTimeStr = parts[1];
  } else if (exam.start_at && exam.end_at) {
    try {
      if (typeof exam.start_at === "string" && exam.start_at.includes(":") && !exam.start_at.includes("T")) {
        startTimeStr = exam.start_at;
        endTimeStr = exam.end_at;
      } else {
        startTimeStr = new Date(exam.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
        endTimeStr = new Date(exam.end_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      }
    } catch {
      startTimeStr = "10:00";
      endTimeStr = "11:30";
    }
  }

  const now = new Date();
  let examStartDateTime = null;
  let examEndDateTime = null;

  try {
    const dateStr = exam.exam_date || exam.date || "";
    if (dateStr.includes("/")) {
      const [jy, jm, jd] = dateStr.split("/").map(Number);
      const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
      const [sh, sm] = startTimeStr.split(":").map(Number);
      const [eh, em] = endTimeStr.split(":").map(Number);
      examStartDateTime = new Date(gy, gm - 1, gd, sh || 0, sm || 0, 0);
      examEndDateTime = new Date(gy, gm - 1, gd, eh || 0, em || 0, 0);
    } else if (dateStr.includes("-")) {
      const [gy, gm, gd] = dateStr.split("-").map(Number);
      const [sh, sm] = startTimeStr.split(":").map(Number);
      const [eh, em] = endTimeStr.split(":").map(Number);
      examStartDateTime = new Date(gy, gm - 1, gd, sh || 0, sm || 0, 0);
      examEndDateTime = new Date(gy, gm - 1, gd, eh || 0, em || 0, 0);
    } else if (exam.start_at && exam.start_at.includes("T")) {
      examStartDateTime = new Date(exam.start_at);
      examEndDateTime = new Date(exam.end_at);
    }
  } catch (e) {
    console.error("Error parsing exam dates:", e);
  }

  if (examStartDateTime && examEndDateTime && !isNaN(examStartDateTime.getTime()) && !isNaN(examEndDateTime.getTime())) {
    if (now < examStartDateTime) {
      return {
        status: "upcoming",
        label: isRTL ? "شروع نشده" : "Upcoming",
        colorClass: "border-primery-500 dark:border-primery-800 bg-blue-100 dark:bg-blue-950/30",
        badgeClass: "bg-primery-100 dark:bg-primery-1000 text-primery-1000 dark:text-primery-90",
        dotClass: "bg-primery-900 dark:bg-primery-90",
        iconBoxClass: "bg-primery-100 dark:bg-primery-1000",
        iconClass: "text-primery-1000 dark:text-primery-90",
        dividerClass: "bg-primery-500 dark:bg-primery-800",
        canEdit: true,
        canViewResults: false, // برای آزمون که هنوز زمان شروع آن فرا نرسیده است دکمه نتایج به نمایش در نیاد
      };
    } else if (now >= examStartDateTime && now <= examEndDateTime) {
      return {
        status: "active",
        label: isRTL ? "در حال برگزاری" : "Active",
        colorClass: "border-success-500 dark:border-success-600 bg-green-50 dark:bg-green-950/30",
        badgeClass: "bg-success-100 dark:bg-success-1000 text-success-1000 dark:text-success-100",
        dotClass: "bg-success-900 dark:bg-success-100",
        iconBoxClass: "bg-success-100 dark:bg-success-1000",
        iconClass: "text-success-1000 dark:text-success-100",
        dividerClass: "bg-success-500 dark:bg-success-600",
        canEdit: true,
        canViewResults: true,
      };
    } else {
      return {
        status: "ended",
        label: isRTL ? "پایان یافته" : "Ended",
        colorClass: "border-neutral-scale600 dark:border-neutral-scale1500 bg-neutral-scale90 dark:bg-neutral-scale900 opacity-80 grayscale-[30%]",
        badgeClass: "bg-neutral-scale200 dark:bg-neutral-scale1100 text-neutral-scale900 dark:text-neutral-scale400",
        dotClass: "bg-neutral-scale700",
        iconBoxClass: "bg-neutral-scale300 dark:bg-neutral-scale1200",
        iconClass: "text-neutral-scale700 dark:text-neutral-scale400",
        dividerClass: "bg-neutral-scale300 dark:bg-neutral-scale1200",
        canEdit: false, // دیگر قابلیت ادیت ندارد
        canViewResults: true,
      };
    }
  }

  // Default fallback: upcoming
  return {
    status: "upcoming",
    label: isRTL ? "شروع نشده" : "Upcoming",
    colorClass: "border-primery-500 dark:border-primery-800 bg-blue-100 dark:bg-blue-950/30",
    badgeClass: "bg-primery-100 dark:bg-primery-1000 text-primery-1000 dark:text-primery-90",
    dotClass: "bg-primery-900 dark:bg-primery-90",
    iconBoxClass: "bg-primery-100 dark:bg-primery-1000",
    iconClass: "text-primery-1000 dark:text-primery-90",
    dividerClass: "bg-primery-500 dark:bg-primery-800",
    canEdit: true,
    canViewResults: false,
  };
};

export const TeacherExams = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingExam, setEditingExam] = useState(null);
  const [resultsExam, setResultsExam] = useState(null);

  const [exams, setExams] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'upcoming' | 'ended'
  const [sortOrder, setSortOrder] = useState("date_desc"); // 'date_desc' | 'date_asc' | 'title'
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

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
                const s = new Date(q.start_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                const e = new Date(q.end_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
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
            quiz_id: q.quiz_id || q.id,
            assignment_id: q.assignment_id || q.quiz_id || q.id,
            title: q.title,
            course: "سیستم عامل",
            topic: topic || "مباحث آزمون",
            date: q.exam_date || "1405/07/20",
            exam_date: q.exam_date,
            start_at: q.start_at,
            end_at: q.end_at,
            time: timeDisplay,
            duration: `${q.duration_minutes || 10} دقیقه هر دانشجو`,
            duration_minutes: q.duration_minutes || 10,
            active: q.is_active ?? true,
            is_active: q.is_active ?? true,
            scheduled: true,
            goals: q.goals,
            student_ids: q.student_ids,
            raw: q,
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
    setEditingExam(null);
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
    setIsCreatingExam(false);
    setSuccessMessage(
      isRTL ? "مشخصات آزمون با موفقیت ویرایش شد!" : "Exam updated successfully!"
    );
    loadExams();
    setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  // Filter & Sort calculation
  const displayedExams = useMemo(() => {
    let result = exams.map((exam) => ({
      ...exam,
      timing: getExamTimingState(exam, isRTL),
    }));

    if (filterStatus !== "all") {
      result = result.filter((e) => e.timing.status === filterStatus);
    }

    result.sort((a, b) => {
      if (sortOrder === "title") {
        return (a.title || "").localeCompare(b.title || "", "fa");
      }
      const dateA = a.exam_date || a.date || "";
      const dateB = b.exam_date || b.date || "";
      if (sortOrder === "date_asc") {
        return dateA.localeCompare(dateB);
      }
      // date_desc
      return dateB.localeCompare(dateA);
    });

    return result;
  }, [exams, filterStatus, sortOrder, isRTL]);

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() =>
              editingExam
                ? setEditingExam(null)
                : isCreatingExam
                ? setIsCreatingExam(false)
                : navigate(-1)
            }
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
            {editingExam
              ? isRTL
                ? "ویرایش آزمون"
                : "Edit Exam"
              : isCreatingExam
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

        {isCreatingExam || editingExam ? (
          <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden pt-[15px]">
            <CreateExamAccordion
              courseId="c0000000-0000-4000-8000-000000000001"
              courseTitle="سیستم عامل"
              isEditMode={Boolean(editingExam)}
              initialExam={editingExam}
              onExamCreated={handleExamCreated}
              onExamUpdated={handleExamUpdated}
              onCancel={() => {
                setIsCreatingExam(false);
                setEditingExam(null);
              }}
            />
          </div>
        ) : (
          <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden pb-[80px]">
            <div className="mt-[5px] w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[20px]">
              {/* Section Header */}
              <div className="px-4 flex flex-col gap-2.5">
                {/* Row 1: Title and Add Exam */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-neutral-scale1800 dark:text-neutral-scale70 ${
                        isRTL
                          ? "fa-body-medium font-vazir text-right"
                          : "en-body-medium font-inter text-left"
                      }`}
                    >
                      {isRTL ? "آزمون‌های درس" : "Course Exams"}
                    </p>
                    <span className="text-[11px] font-vazir font-semibold px-2 py-0.5 rounded-full bg-neutral-scale200 dark:bg-neutral-scale1100 text-neutral-scale900 dark:text-neutral-scale300">
                      {toPersianDigits(displayedExams.length)}
                    </span>
                  </div>

                  {/* Add Exam */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExam(null);
                      setIsCreatingExam(true);
                    }}
                    className="flex items-center justify-center gap-[5px] h-[32px] px-[10px] rounded-[9px] bg-primery-700 text-neutral-scale70 hover:bg-primery-800 active:scale-[0.98] transition-all shrink-0 cursor-pointer"
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

                {/* Row 2: Filter and Sort Controls */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60">
                  <div className="flex items-center gap-2">
                    {/* Filter Button & Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsFilterOpen(!isFilterOpen);
                          setIsSortOpen(false);
                        }}
                        className={`flex items-center gap-1.5 h-[30px] px-2.5 rounded-[8px] border transition-all cursor-pointer text-xs font-vazir ${
                          filterStatus !== "all"
                            ? "bg-primery-100 dark:bg-primery-900/40 border-primery-500 text-primery-800 dark:text-primery-200 font-semibold"
                            : "bg-white dark:bg-neutral-scale1200 border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-scale1400 dark:text-neutral-scale200 hover:bg-neutral-50 dark:hover:bg-neutral-scale1100"
                        }`}
                        title={isRTL ? "فیلتر وضعیت" : "Filter status"}
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span>{isRTL ? "فیلتر" : "Filter"}</span>
                        {filterStatus !== "all" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primery-600 dark:bg-primery-400" />
                        )}
                      </button>

                      {isFilterOpen && (
                        <div
                          className={`absolute top-full mt-1.5 ${
                            isRTL ? "right-0" : "left-0"
                          } z-30 min-w-[170px] bg-white dark:bg-neutral-scale1300 rounded-xl border border-neutral-scale200 dark:border-neutral-scale1100 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150`}
                        >
                          <div className="flex flex-col gap-0.5 text-xs font-vazir">
                            <button
                              type="button"
                              onClick={() => {
                                setFilterStatus("all");
                                setIsFilterOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                filterStatus === "all"
                                  ? "bg-primery-50 dark:bg-primery-900/30 text-primery-700 dark:text-primery-300 font-semibold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              }`}
                            >
                              <span>{isRTL ? "همه وضعیت‌ها" : "All statuses"}</span>
                              {filterStatus === "all" && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilterStatus("active");
                                setIsFilterOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                filterStatus === "active"
                                  ? "bg-green-50 dark:bg-green-950/40 text-success-1000 dark:text-success-100 font-semibold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-success-500" />
                                <span>{isRTL ? "در حال برگزاری (سبز)" : "Active"}</span>
                              </span>
                              {filterStatus === "active" && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilterStatus("upcoming");
                                setIsFilterOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                filterStatus === "upcoming"
                                  ? "bg-blue-50 dark:bg-blue-950/40 text-primery-800 dark:text-primery-200 font-semibold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primery-500" />
                                <span>{isRTL ? "شروع نشده (آبی)" : "Upcoming"}</span>
                              </span>
                              {filterStatus === "upcoming" && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFilterStatus("ended");
                                setIsFilterOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                filterStatus === "ended"
                                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              }`}
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-neutral-scale700" />
                                <span>{isRTL ? "پایان یافته (خاکستری)" : "Ended"}</span>
                              </span>
                              {filterStatus === "ended" && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sort Button & Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSortOpen(!isSortOpen);
                          setIsFilterOpen(false);
                        }}
                        className={`flex items-center gap-1.5 h-[30px] px-2.5 rounded-[8px] border transition-all cursor-pointer text-xs font-vazir ${
                          sortOrder !== "date_desc"
                            ? "bg-primery-100 dark:bg-primery-900/40 border-primery-500 text-primery-800 dark:text-primery-200 font-semibold"
                            : "bg-white dark:bg-neutral-scale1200 border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-scale1400 dark:text-neutral-scale200 hover:bg-neutral-50 dark:hover:bg-neutral-scale1100"
                        }`}
                        title={isRTL ? "مرتب‌سازی" : "Sort"}
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>{isRTL ? "مرتب‌سازی" : "Sort"}</span>
                      </button>

                      {isSortOpen && (
                        <div
                          className={`absolute top-full mt-1.5 ${
                            isRTL ? "right-0" : "left-0"
                          } z-30 min-w-[160px] bg-white dark:bg-neutral-scale1300 rounded-xl border border-neutral-scale200 dark:border-neutral-scale1100 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150`}
                        >
                          <div className="flex flex-col gap-0.5 text-xs font-vazir">
                            <button
                              type="button"
                              onClick={() => {
                                setSortOrder("date_desc");
                                setIsSortOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                sortOrder === "date_desc"
                                  ? "bg-primery-50 dark:bg-primery-900/30 text-primery-700 dark:text-primery-300 font-semibold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              }`}
                            >
                              <span>{isRTL ? "جدیدترین تاریخ" : "Newest date"}</span>
                              {sortOrder === "date_desc" && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSortOrder("date_asc");
                                setIsSortOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                sortOrder === "date_asc"
                                  ? "bg-primery-50 dark:bg-primery-900/30 text-primery-700 dark:text-primery-300 font-semibold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              }`}
                            >
                              <span>{isRTL ? "نزدیک‌ترین تاریخ" : "Earliest date"}</span>
                              {sortOrder === "date_asc" && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSortOrder("title");
                                setIsSortOpen(false);
                              }}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                sortOrder === "title"
                                  ? "bg-primery-50 dark:bg-primery-900/30 text-primery-700 dark:text-primery-300 font-semibold"
                                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              }`}
                            >
                              <span>{isRTL ? "عنوان آزمون (الفبایی)" : "Title"}</span>
                              {sortOrder === "title" && (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Filter / Sort Chips */}
                {(filterStatus !== "all" || sortOrder !== "date_desc") && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Active Filter */}
                    {filterStatus !== "all" && (
                      <div className="flex items-center gap-1 h-[26px] px-2 rounded-full bg-primery-100 dark:bg-primery-900/40 border border-primery-300 dark:border-primery-700 text-primery-800 dark:text-primery-200">
                        <span className="text-[10px] font-vazir font-medium">
                          {filterStatus === "active"
                            ? isRTL
                              ? "در حال برگزاری"
                              : "Active"
                            : filterStatus === "upcoming"
                              ? isRTL
                                ? "شروع نشده"
                                : "Upcoming"
                              : isRTL
                                ? "پایان یافته"
                                : "Ended"}
                        </span>

                        <button
                          type="button"
                          onClick={() => setFilterStatus("all")}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primery-200 dark:hover:bg-primery-800 cursor-pointer transition-colors"
                          aria-label={isRTL ? "حذف فیلتر" : "Remove filter"}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Active Sort */}
                    {sortOrder !== "date_desc" && (
                      <div className="flex items-center gap-1 h-[26px] px-2 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1100 border border-neutral-scale300 dark:border-neutral-scale900 text-neutral-scale1200 dark:text-neutral-scale300">
                        <span className="text-[10px] font-vazir font-medium">
                          {sortOrder === "date_asc"
                            ? isRTL
                              ? "نزدیک‌ترین تاریخ"
                              : "Earliest date"
                            : isRTL
                              ? "عنوان آزمون"
                              : "Title"}
                        </span>

                        <button
                          type="button"
                          onClick={() => setSortOrder("date_desc")}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-neutral-scale200 dark:hover:bg-neutral-scale900 cursor-pointer transition-colors"
                          aria-label={
                            isRTL ? "حذف مرتب‌سازی" : "Remove sorting"
                          }
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>

              {/* Exams Cards */}
              <div className="flex flex-col w-full gap-[12px] mt-[16px] px-3.5">
                {displayedExams.length === 0 && (
                  <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center gap-2">
                    <CalendarDays className="w-8 h-8 text-neutral-400" />
                    <span className="text-xs font-vazir text-neutral-500 dark:text-neutral-400">
                      {filterStatus !== "all"
                        ? isRTL
                          ? "هیچ آزمونی با این وضعیت یافت نشد."
                          : "No exams match this filter."
                        : isRTL
                        ? "هنوز هیچ آزمونی تعریف نشده است."
                        : "No exams created yet."}
                    </span>
                  </div>
                )}

                {displayedExams.map((exam) => {
                  const timing = exam.timing;

                  return (
                    <div
                      key={exam.id}
                      className={`w-full rounded-[12px] border p-3 transition-colors ${timing.colorClass}`}
                    >
                      {/* Top */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-[10px] min-w-0 flex-1">
                          {/* Exam Icon */}
                          <div
                            className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0 ${timing.iconBoxClass}`}
                          >
                            <CalendarDays className={`!w-[20px] !h-[20px] ${timing.iconClass}`} />
                          </div>

                          {/* Title */}
                          <div className="flex flex-col min-w-0 flex-1 gap-[2px]">
                            <span
                              dir={isPersianText(exam.title) ? "rtl" : isRTL ? "rtl" : "ltr"}
                              className={`fa-body-medium ${
                                isPersianText(exam.title) || isRTL ? "font-vazir" : "font-inter"
                              } font-semibold whitespace-normal break-words ${
                                timing.status === "active" || timing.status === "upcoming"
                                  ? "text-neutral-scale1800 dark:text-neutral-scale70"
                                  : "text-neutral-scale900 dark:text-neutral-scale500"
                              } ${
                                isPersianText(exam.title) || isRTL ? "text-right" : "text-left"
                              }`}
                            >
                              {exam.title}
                            </span>

                            <span
                              dir={isPersianText(exam.course) ? "rtl" : isRTL ? "rtl" : "ltr"}
                              className={`fa-caption-1 ${
                                isPersianText(exam.course) || isRTL ? "font-vazir" : "font-inter"
                              } truncate ${
                                timing.status === "active" || timing.status === "upcoming"
                                  ? "text-neutral-scale1000 dark:text-neutral-scale300"
                                  : "text-neutral-scale700 dark:text-neutral-scale500"
                              } ${
                                isPersianText(exam.course) || isRTL ? "text-right" : "text-left"
                              }`}
                            >
                              {exam.course}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-[6px] shrink-0">
                          <div
                            className={`flex items-center gap-[5px] px-[8px] py-[4px] rounded-full ${timing.badgeClass}`}
                          >
                            <span
                              className={`w-[6px] h-[6px] rounded-full ${timing.dotClass}`}
                            />
                            <span
                              className={
                                isRTL
                                  ? "fa-caption-1 font-vazir"
                                  : "en-caption-1 font-inter"
                              }
                            >
                              {timing.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div
                        className={`w-full h-[1px] my-[11px] ${timing.dividerClass}`}
                      />

                      {/* Topic */}
                      <div className="flex items-start gap-[5px] w-full min-w-0">
                        <span
                          className={`shrink-0 ${
                            timing.status === "active" || timing.status === "upcoming"
                              ? "text-neutral-scale1800 dark:text-neutral-scale70"
                              : "text-neutral-scale900 dark:text-neutral-scale500"
                          } ${
                            isRTL
                              ? "fa-caption-1 font-vazir text-right"
                              : "en-caption-1 font-inter text-left"
                          }`}
                        >
                          {isRTL ? "مبحث آزمون:" : "Exam Topic:"}
                        </span>

                        <bdi
                          dir={isPersianText(exam.topic) ? "rtl" : isRTL ? "rtl" : "ltr"}
                          className={`min-w-0 flex-1 whitespace-normal break-words ${
                            isPersianText(exam.topic) || isRTL
                              ? "fa-caption-1 font-vazir"
                              : "en-caption-1 font-inter"
                          } ${
                            timing.status === "active" || timing.status === "upcoming"
                              ? "text-neutral-scale1800 dark:text-neutral-scale70"
                              : "text-neutral-scale900 dark:text-neutral-scale500"
                          } ${
                            isPersianText(exam.topic) || isRTL
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {exam.topic}
                        </bdi>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-[12px] mt-[11px]">
                        {/* Date */}
                        <div className="flex items-center gap-[5px] min-w-0">
                          <CalendarDays
                            className={`!w-[15px] !h-[15px] shrink-0 ${
                              timing.status === "active" || timing.status === "upcoming"
                                ? "text-neutral-scale900 dark:text-neutral-scale400"
                                : "text-neutral-scale700 dark:text-neutral-scale500"
                            }`}
                          />
                          <span
                            className={`truncate font-vazir ${
                              timing.status === "active" || timing.status === "upcoming"
                                ? "text-neutral-scale1200 dark:text-neutral-scale300"
                                : "text-neutral-scale800 dark:text-neutral-scale500"
                            } ${
                              isRTL
                                ? "fa-caption-1"
                                : "text-xs font-medium"
                            }`}
                          >
                            {toPersianDigits(exam.date)}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-[5px] min-w-0">
                          <Clock3
                            className={`!w-[15px] !h-[15px] shrink-0 ${
                              timing.status === "active" || timing.status === "upcoming"
                                ? "text-neutral-scale900 dark:text-neutral-scale400"
                                : "text-neutral-scale700 dark:text-neutral-scale500"
                            }`}
                          />
                          <span
                            className={`truncate font-vazir ${
                              timing.status === "active" || timing.status === "upcoming"
                                ? "text-neutral-scale1200 dark:text-neutral-scale300"
                                : "text-neutral-scale800 dark:text-neutral-scale500"
                            } ${
                              isRTL
                                ? "fa-caption-1"
                                : "text-xs font-medium"
                            }`}
                          >
                            {toPersianDigits(exam.time)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Edit and Results */}
                      <div className="flex items-center gap-2 mt-[12px] w-full">
                        {/* Edit Button: Hidden for ended exams */}
                        {timing.canEdit && (
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
                        )}

                        {/* Results Button: Hidden for upcoming exams */}
                        {timing.canViewResults && (
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

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

