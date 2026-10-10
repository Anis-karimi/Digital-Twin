import { useContext, useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  Clock3,
  CalendarDays,
  Play,
  Hourglass,
  CheckCircle2,
  Award,
  BarChart3,
  AlertCircle,
  BookOpen,
  Filter,
  ArrowUpDown,
  Check,
  X,
  ScanFace,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { ExamsNavBar } from "@/Components/ExamsNavBar";
import { examsApi } from "@/api/new/exams.api";
import { biometricsApi } from "@/api/new/biometrics.api";
import { ExamScheduleModal } from "@/Components/ExamScheduleModal";
import { toPersianDigits, jalaliToGregorian } from "@/utils/dateUtils";

export const StudentExams = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRTL, t, currentUser } = useContext(AppContext);

  const studentId = String(
    currentUser?.user_id ||
    currentUser?.id ||
    currentUser?.student_id ||
    currentUser?.username ||
    "20000000-0000-4000-8000-000000000105"
  );

  const [biometricsStatus, setBiometricsStatus] = useState(null);
  const [biometricsLoading, setBiometricsLoading] = useState(true);

  const isBiometricsRegistered = Boolean(
    biometricsStatus?.is_enrolled ||
    biometricsStatus?.face_enrolled ||
    biometricsStatus?.is_fully_registered ||
    biometricsStatus?.ready_for_exam
  );

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedulingExam, setSchedulingExam] = useState(null);
  const [turnWarning, setTurnWarning] = useState("");

  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'past' | 'all'
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("date_desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [now, setNow] = useState(new Date());

  const formatCountdown = (milliseconds) => {
    if (milliseconds <= 0) return "00:00:00";

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

  const getExamDateTimes = (exam) => {
    // 1. Try ISO timestamps first if available
    let overallStart = exam.startAt ? new Date(exam.startAt) : null;
    let overallEnd = exam.endAt ? new Date(exam.endAt) : null;

    if (overallStart && isNaN(overallStart.getTime())) overallStart = null;
    if (overallEnd && isNaN(overallEnd.getTime())) overallEnd = null;

    // 2. Resolve base calendar date (year, month 0-indexed, day)
    let baseYear = null;
    let baseMonth = null; // 0-indexed
    let baseDay = null;

    if (overallStart) {
      baseYear = overallStart.getFullYear();
      baseMonth = overallStart.getMonth();
      baseDay = overallStart.getDate();
    } else if (exam.date) {
      const asciiDate = String(exam.date)
        .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
        .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
      const parts = asciiDate.split(/[\/\-]/).map(Number);
      if (parts.length === 3 && parts.every((p) => !isNaN(p))) {
        if (parts[0] > 1900) {
          // Gregorian (e.g. 2026/10/03)
          baseYear = parts[0];
          baseMonth = parts[1] - 1;
          baseDay = parts[2];
        } else if (parts[0] > 1300 && parts[0] < 1600) {
          // Jalali (e.g. 1405/07/11)
          const { gy, gm, gd } = jalaliToGregorian(parts[0], parts[1], parts[2]);
          baseYear = gy;
          baseMonth = gm - 1;
          baseDay = gd;
        }
      }
    }

    if (baseYear === null) {
      const today = new Date();
      baseYear = today.getFullYear();
      baseMonth = today.getMonth();
      baseDay = today.getDate();
    }

    const parseTime = (timeStr) => {
      if (!timeStr || !String(timeStr).includes(":")) return null;
      const [h, m] = String(timeStr).split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return null;
      return new Date(baseYear, baseMonth, baseDay, h, m, 0, 0);
    };

    let slotStart = parseTime(exam.studentSlotStart);
    let slotEnd = parseTime(exam.studentSlotEnd);
    let windowStart = parseTime(exam.windowStart) || overallStart;
    let windowEnd = parseTime(exam.windowEnd) || overallEnd;

    if (slotStart && slotEnd && slotEnd < slotStart) {
      slotEnd.setDate(slotEnd.getDate() + 1);
    }
    if (windowStart && windowEnd && windowEnd < windowStart) {
      windowEnd.setDate(windowEnd.getDate() + 1);
    }

    if (!overallStart) {
      overallStart = windowStart || slotStart || new Date(baseYear, baseMonth, baseDay, 0, 0, 0, 0);
    }
    if (!overallEnd) {
      overallEnd = windowEnd || slotEnd || new Date(baseYear, baseMonth, baseDay, 23, 59, 59, 999);
    }

    return {
      slotStart: slotStart || overallStart,
      slotEnd: slotEnd || overallEnd,
      windowStart: windowStart || overallStart,
      windowEnd: windowEnd || overallEnd,
    };
  };

  const checkSlotTiming = (exam) => {
    if (exam.status === "completed") {
      return { status: "completed", canEnter: true };
    }

    if (exam.status === "expired" || exam.status === "passed") {
      return {
        status: "passed",
        canEnter: false,
        slotStart: exam.studentSlotStart,
        slotEnd: exam.studentSlotEnd,
        message: "زمان برگزاری این آزمون به پایان رسیده است.",
      };
    }

    if (exam.status === "started" || exam.status === "active") {
      return { status: "active", canEnter: true };
    }

    const currentTime = now;
    const { slotStart, slotEnd, windowEnd } = getExamDateTimes(exam);

    // If the overall exam window has already ended in calendar time
    if (currentTime.getTime() > windowEnd.getTime()) {
      return {
        status: "passed",
        canEnter: false,
        slotStart: exam.studentSlotStart,
        slotEnd: exam.studentSlotEnd,
        message: "زمان برگزاری این آزمون به پایان رسیده است.",
      };
    }

    // If student slot is upcoming (has not started yet)
    const remainingUntilStart = slotStart.getTime() - currentTime.getTime();
    if (remainingUntilStart > 0) {
      const waitMins = Math.ceil(remainingUntilStart / 60000);
      let waitStr = "";
      if (waitMins >= 1440) {
        const days = Math.floor(waitMins / 1440);
        waitStr = `${days} روز دیگر`;
      } else if (waitMins >= 60) {
        waitStr = `${Math.floor(waitMins / 60)} ساعت و ${waitMins % 60} دقیقه دیگر`;
      } else {
        waitStr = `${waitMins} دقیقه دیگر`;
      }

      return {
        status: "upcoming",
        canEnter: false,
        slotStart: exam.studentSlotStart,
        slotEnd: exam.studentSlotEnd,
        waitStr,
        remainingUntilStart,
        message: `نوبت حضور شما هنوز فرا نرسیده است.`,
      };
    }

    // Slot start has arrived. Check if within slot or within overall window
    if (currentTime.getTime() > slotEnd.getTime()) {
      if (currentTime.getTime() <= windowEnd.getTime()) {
        return {
          status: "current",
          canEnter: true,
          slotStart: exam.studentSlotStart,
          slotEnd: exam.studentSlotEnd,
          message: "بازه آزمون فعال است.",
        };
      }

      return {
        status: "passed",
        canEnter: false,
        slotStart: exam.studentSlotStart,
        slotEnd: exam.studentSlotEnd,
        message: "زمان برگزاری این آزمون به پایان رسیده است.",
      };
    }

    // Inside slot
    return {
      status: "current",
      canEnter: true,
      message: "هم‌اکنون نوبت شماست!",
    };
  };

  const handleSlotChanged = (updated) => {
    setExams((prev) =>
      prev.map((ex) => {
        if (
          ex.assignment_id === updated.assignment_id ||
          ex.id === updated.assignment_id
        ) {
          return {
            ...ex,
            studentSlotStart: updated.start_time,
            studentSlotEnd: updated.end_time,
          };
        }

        return ex;
      }),
    );
  };

  // Fetch real assigned exams from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    examsApi
      .getMyStudentExams()
      .then((data) => {
        if (!isMounted) return;

        if (Array.isArray(data) && data.length > 0) {
          const seenIds = new Set();
          const mapped = [];

          for (const item of data) {
            const key = String(item.id || item.assignment_id);

            if (seenIds.has(key)) {
              continue;
            }

            seenIds.add(key);

            const topic =
              Array.isArray(item.goals) && item.goals.length > 0
                ? item.goals
                    .map((g) =>
                      typeof g === "object" && g !== null
                        ? g.title || g.name || ""
                        : String(g),
                    )
                    .filter(Boolean)
                    .join("، ")
                : item.topic || item.description || item.title;

            mapped.push({
              id: key,
              assignment_id: item.assignment_id || key,
              session_id: item.session_id,
              title: item.title,
              course: item.course || "سیستم عامل",
              topic: topic || "مباحث آزمون",
              date: item.date || item.exam_date || "1405/07/20",
              startAt: item.start_at,
              endAt: item.end_at,
              duration: item.duration || item.duration_minutes || 20,
              status: item.status || "assigned",
              score: item.score,
              passed: item.passed,
              windowStart: item.window_start || item.start_at || "10:00",
              windowEnd: item.window_end || item.end_at || "14:00",
              studentSlotStart: item.student_slot_start,
              studentSlotEnd: item.student_slot_end,
              gapMinutes: item.gap_minutes || 5,
            });
          }

          setExams(mapped);
        } else {
          // Fallback to course quizzes if empty
          examsApi
            .getLessonQuizzes("c0000000-0000-4000-8000-000000000001")
            .then((quizzes) => {
              if (
                !isMounted ||
                !Array.isArray(quizzes) ||
                quizzes.length === 0
              ) {
                return;
              }

              const mapped = quizzes.map((q) => {
                const topic =
                  Array.isArray(q.goals) && q.goals.length > 0
                    ? q.goals
                        .map((g) =>
                          typeof g === "object" && g !== null
                            ? g.title || g.name || ""
                            : String(g),
                        )
                        .filter(Boolean)
                        .join("، ")
                    : q.description || "مباحث آزمون";

                return {
                  id: q.quiz_id || q.id,
                  assignment_id: q.quiz_id || q.id,
                  session_id: null,
                  title: q.title,
                  course: "سیستم عامل",
                  topic: topic || "مباحث آزمون",
                  date: q.exam_date || "1405/07/20",
                  startAt: q.start_at,
                  endAt: q.end_at,
                  duration: q.duration_minutes || 20,
                  status: "assigned",
                  score: null,
                  passed: null,
                };
              });

              setExams(mapped);
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("Failed to load student exams:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setBiometricsLoading(true);
    biometricsApi
      .getStudentBiometricProfile(studentId)
      .then((res) => {
        if (isMounted) {
          setBiometricsStatus(res);
          setBiometricsLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to check biometric profile in exams page:", err);
        if (isMounted) setBiometricsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentId, location.key]);

  const getExamStatus = (exam) => {
    if (exam.status === "completed") return "completed";

    if (exam.status === "started" || exam.status === "active") {
      return "active";
    }

    if (exam.status === "expired" || exam.status === "passed") {
      return "passed";
    }

    return "assigned";
  };

  const examCounts = useMemo(() => {
    let active = 0;
    let past = 0;
    for (const ex of exams) {
      const timing = checkSlotTiming(ex);
      if (ex.status === "completed" || ex.status === "expired" || ex.status === "passed" || timing.status === "passed") {
        past++;
      } else {
        active++;
      }
    }
    return { active, past, all: exams.length };
  }, [exams, now]);

  const displayedExams = useMemo(() => {
    let result = exams.map((exam) => {
      const timing = checkSlotTiming(exam);

      let timingCategory = "upcoming";

      if (exam.status === "completed") {
        timingCategory = "ended";
      } else if (
        exam.status === "started" ||
        exam.status === "active" ||
        timing.status === "current"
      ) {
        timingCategory = "active";
      } else if (
        exam.status === "expired" ||
        exam.status === "passed" ||
        timing.status === "passed"
      ) {
        timingCategory = "ended";
      } else {
        timingCategory = "upcoming";
      }

      return {
        ...exam,
        timingCategory,
        filterStatus: timingCategory,
      };
    });

    // Primary Tab filtering: active (ongoing + upcoming) vs past (ended) vs all
    if (activeTab === "active") {
      result = result.filter((exam) => exam.timingCategory !== "ended");
    } else if (activeTab === "past") {
      result = result.filter((exam) => exam.timingCategory === "ended");
    }

    if (filterStatus !== "all") {
      result = result.filter((exam) => exam.filterStatus === filterStatus);
    }

    result.sort((a, b) => {
      if (sortOrder === "title") {
        return (a.title || "").localeCompare(b.title || "", "fa");
      }

      const dateA = getExamDateTimes(a).windowStart.getTime();
      const dateB = getExamDateTimes(b).windowStart.getTime();

      if (sortOrder === "date_asc") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return result;
  }, [exams, activeTab, filterStatus, sortOrder, now]);

  const handleStartExam = (exam) => {
    const targetId = exam.assignment_id || exam.id;

    if (exam.status === "completed") {
      navigate(`/StudentExamResult/${targetId}`, {
        state: { exam },
      });
      return;
    }

    const timing = checkSlotTiming(exam);
    if (timing.status === "passed" || exam.status === "expired" || exam.status === "passed") {
      setTurnWarning("زمان برگزاری این آزمون به پایان رسیده است.");
      return;
    }

    // Check biometric identity registration before letting student enter
    if (!isBiometricsRegistered) {
      navigate("/StudentSettings/Biometrics", {
        state: {
          returnTo: `/StudentExam/${targetId}`,
          exam,
          reason: "biometrics_required",
          message: isRTL
            ? "جهت ورود به آزمون، احراز هویت چهره و نگاه الزامی است."
            : "Biometric identity verification is required before entering the exam."
        }
      });
      return;
    }

    const isActive = exam.status === "started" || exam.status === "active";

    if (!isActive) {
      const timing = checkSlotTiming(exam);

      if (!timing.canEnter) {
        setTurnWarning(timing.message);
        return;
      }
    }

    navigate(`/StudentExam/${targetId}`, {
      state: { exam },
    });
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden select-text"
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

      {/* Exams Navigation Bar */}
      <ExamsNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={examCounts}
      />

      {/* Content */}
      <section className="w-full flex-1 min-h-0 flex flex-col">
        <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden pb-[105px]">
          {/* Biometric Identity Requirement Banner - only shown when not registered */}
          {!biometricsLoading && !isBiometricsRegistered && (
            <div className="mt-2 mb-2 w-full p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <ScanFace className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold font-vazir text-amber-800 dark:text-amber-300">
                  {isRTL ? "احراز هویت بیومتریک الزامی است" : "Biometric Verification Required"}
                </h4>
                <p className="text-[11px] font-vazir text-amber-700/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                  {isRTL
                    ? "پیش از شرکت در آزمون، تکمیل مراحل ثبت چهره، کالیبراسیون نگاه و حالت خنثی الزامی است."
                    : "Face enrollment and gaze calibration must be completed before entering any exam."}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/StudentSettings/Biometrics", { state: { reason: "biometrics_required" } })}
                  className="mt-2 h-7 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-[11px] font-bold font-vazir flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <span>{isRTL ? "تکمیل احراز هویت" : "Complete Verification"}</span>
                  <ArrowLeft className={`w-3 h-3 ${isRTL ? "" : "rotate-180"}`} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-[5px] w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[20px]">
            {/* Section Header */}
            <div className="px-4 flex flex-col gap-2.5">
              {/* Row 1 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-primery-800 dark:text-neutral-scale70 ${
                      isRTL
                        ? "fa-body-medium font-vazir text-right"
                        : "en-body-medium font-inter text-left"
                    }`}
                  >
                    {isRTL ? "آزمون‌های من" : "My Exams"}
                  </p>

                  <span className="text-[11px] font-vazir font-semibold px-2 py-0.5 rounded-full bg-neutral-scale200 dark:bg-neutral-scale1100 text-neutral-scale900 dark:text-neutral-scale300">
                    {isRTL
                      ? toPersianDigits(displayedExams.length)
                      : displayedExams.length}
                  </span>
                </div>
              </div>

              {/* Row 2: Filter & Sort */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60">
                <div className="flex items-center gap-2">
                  {/* Filter */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFilterOpen(!isFilterOpen);
                        setIsSortOpen(false);
                      }}
                      className="flex items-center gap-1.5 h-[30px] px-2.5 rounded-[8px] border transition-all cursor-pointer text-xs font-vazir bg-white dark:bg-neutral-scale1200 border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-scale1400 dark:text-neutral-scale200 hover:bg-neutral-50 dark:hover:bg-neutral-scale1100"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{isRTL ? "فیلتر" : "Filter"}</span>

                      {filterStatus !== "all" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                      )}
                    </button>

                    {isFilterOpen && (
                      <div
                        className={`absolute top-full mt-1.5 ${
                          isRTL ? "right-0" : "left-0"
                        } z-30 min-w-[170px] bg-white dark:bg-neutral-scale1300 rounded-xl border border-neutral-scale200 dark:border-neutral-scale1100 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150`}
                      >
                        <div className="flex flex-col gap-0.5 text-xs font-vazir">
                          {/* All */}
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
                            <span>
                              {isRTL ? "همه وضعیت‌ها" : "All statuses"}
                            </span>

                            {filterStatus === "all" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Active */}
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
                              <span>
                                {isRTL ? "در حال برگزاری (سبز)" : "Active"}
                              </span>
                            </span>

                            {filterStatus === "active" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Upcoming */}
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
                              <span>
                                {isRTL ? "شروع نشده (آبی)" : "Upcoming"}
                              </span>
                            </span>

                            {filterStatus === "upcoming" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Ended */}
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
                              <span>
                                {isRTL ? "پایان یافته (خاکستری)" : "Ended"}
                              </span>
                            </span>

                            {filterStatus === "ended" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSortOpen(!isSortOpen);
                        setIsFilterOpen(false);
                      }}
                      className="flex items-center gap-1.5 h-[30px] px-2.5 rounded-[8px] border transition-all cursor-pointer text-xs font-vazir bg-white dark:bg-neutral-scale1200 border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-scale1400 dark:text-neutral-scale200 hover:bg-neutral-50 dark:hover:bg-neutral-scale1100"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>
                        {sortOrder === "date_desc"
                          ? isRTL
                            ? "جدیدترین تاریخ"
                            : "Newest date"
                          : sortOrder === "date_asc"
                            ? isRTL
                              ? "نزدیک‌ترین تاریخ"
                              : "Earliest date"
                            : isRTL
                              ? "عنوان آزمون"
                              : "Title"}
                      </span>
                    </button>

                    {isSortOpen && (
                      <div
                        className={`absolute top-full mt-1.5 ${
                          isRTL ? "right-0" : "left-0"
                        } z-30 min-w-[160px] bg-white dark:bg-neutral-scale1300 rounded-xl border border-neutral-scale200 dark:border-neutral-scale1100 shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150`}
                      >
                        <div className="flex flex-col gap-0.5 text-xs font-vazir">
                          {/* Newest */}
                          <button
                            type="button"
                            onClick={() => {
                              setSortOrder("date_desc");
                              setIsSortOpen(false);
                            }}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <span>
                              {isRTL ? "جدیدترین تاریخ" : "Newest date"}
                            </span>

                            {sortOrder === "date_desc" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Earliest */}
                          <button
                            type="button"
                            onClick={() => {
                              setSortOrder("date_asc");
                              setIsSortOpen(false);
                            }}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <span>
                              {isRTL ? "نزدیک‌ترین تاریخ" : "Earliest date"}
                            </span>

                            {sortOrder === "date_asc" && (
                              <Check className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Title */}
                          <button
                            type="button"
                            onClick={() => {
                              setSortOrder("title");
                              setIsSortOpen(false);
                            }}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            <span>
                              {isRTL ? "عنوان آزمون (الفبایی)" : "Title"}
                            </span>

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
                {filterStatus !== "all" && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Active Filter */}
                    {filterStatus !== "all" && (
                      <div
                        className={`flex items-center gap-1 h-[26px] px-2 rounded-full border ${
                          filterStatus === "active"
                            ? "bg-green-50 dark:bg-green-950/40 border-success-300 dark:border-success-700 text-success-1000 dark:text-success-100"
                            : filterStatus === "upcoming"
                              ? "bg-blue-50 dark:bg-blue-950/40 border-primery-300 dark:border-primery-700 text-primery-800 dark:text-primery-200"
                              : "bg-neutral-100 dark:bg-neutral-scale800 border-neutral-scale300 dark:border-neutral-scale700 text-neutral-scale800 dark:text-neutral-scale200"
                        }`}
                      >
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
                  </div>
                )}
              </div>
            </div>

            {/* Exams List */}
            <div className="flex flex-col w-full gap-[12px] mt-[16px] px-3.5">
              {loading ? (
                <div className="w-full py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-primery-700 border-t-transparent rounded-full animate-spin" />

                  <span className="font-vazir text-xs text-neutral-scale1000 dark:text-neutral-scale300">
                    {isRTL ? "در حال بارگذاری آزمون‌ها..." : "Loading exams..."}
                  </span>
                </div>
              ) : displayedExams.length === 0 ? (
                <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center gap-2">
                  <CalendarDays className="w-8 h-8 text-neutral-400" />

                  <span className="text-xs font-vazir text-neutral-500 dark:text-neutral-400">
                    {filterStatus !== "all"
                      ? isRTL
                        ? "هیچ آزمونی با این وضعیت یافت نشد."
                        : "No exams match this filter."
                      : isRTL
                        ? "در حال حاضر هیچ آزمونی برای شما تعریف نشده است."
                        : "No exams currently assigned to you."}
                  </span>
                </div>
              ) : (
                displayedExams.map((exam) => {
                  const status = getExamStatus(exam);
                  const timing = checkSlotTiming(exam);

                  const isCompleted = status === "completed";

                  const isUpcoming =
                    exam.status === "assigned" && timing.status === "upcoming";

                  const isPassed = !isCompleted && timing.status === "passed";

                  const isReadyToStart =
                    !isCompleted &&
                    !isUpcoming &&
                    !isPassed &&
                    (exam.status === "active" ||
                      (exam.status === "assigned" &&
                        timing.status === "current"));

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
                          isCompleted || isPassed
                            ? `
                            border-error-100
                            dark:border-neutral-scale1500
                            bg-neutral-scale80
                            dark:bg-neutral-scale1100
                          `
                              : isReadyToStart
                                ? `
                                border-green-500
                                dark:border-green-600
                                bg-green-50
                                dark:bg-green-950/30
                              `
                                : `
                                border-primery-500
                                dark:border-primery-800
                                bg-blue-50
                                dark:bg-blue-950/30
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
                                isCompleted || isPassed
                                  ? "bg-neutral-scale70 dark:bg-neutral-scale1200 text-error-500 dark:text-neutral-scale400 "
                                    : isReadyToStart
                                      ? "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-300"
                                      : "bg-primery-90 dark:bg-primery-1000 text-primery-1000 dark:text-primery-90"
                              }
                            `}
                          >
                            {isCompleted ? (
                              <Award className="!w-[20px] !h-[20px]" />
                            ) : (
                              <CalendarDays className="!w-[20px] !h-[20px]" />
                            )}
                          </div>

                          {/* Title & Course */}
                          <div className="flex flex-col min-w-0 flex-1 gap-[2px]">
                            <span
                              dir="rtl"
                              className="fa-body-medium font-vazir font-semibold truncate text-neutral-scale1800 dark:text-neutral-scale70 text-right"
                            >
                              {exam.title}
                            </span>

                            <span
                              dir="rtl"
                              className="fa-caption-1 font-vazir truncate text-neutral-scale1000 dark:text-neutral-scale300 text-right"
                            >
                              {exam.course || "سیستم عامل"}
                            </span>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <div className="flex flex-col items-end gap-[6px] shrink-0">
                          <div
                            className={`
                              flex
                              items-center
                              gap-[5px]
                              px-[8px]
                              py-[3px]
                              rounded-full
                              ${
                                isCompleted || isPassed
                                  ? "bg-neutral-scale70 dark:bg-neutral-scale1100 text-neutral-scale800 dark:text-neutral-scale400 border border-neutral-scale100"
                                    : isReadyToStart
                                      ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 border border-green-500/30"
                                      : "bg-blue-100 dark:bg-primery-1000 text-primery-800 dark:text-primery-90 border border-blue-500/30"
                              }
                            `}
                          >
                            <span
                              className={`
                                w-[6px]
                                h-[6px]
                                rounded-full
                                ${
                                  isCompleted || isPassed
                                    ? "bg-neutral-scale300"
                                      : isReadyToStart
                                        ? "bg-green-500 animate-ping"
                                        : "bg-primery-600"
                                }
                              `}
                            />

                            <span className="fa-caption-1 font-vazir text-[11px] font-medium">
                              {isCompleted
                                ? "تکمیل شده"
                                : isPassed
                                  ? "پایان یافته"
                                    : isReadyToStart
                                      ? "آماده شروع"
                                      : isUpcoming
                                        ? "در انتظار برگزاری"
                                        : "تعریف شده"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div
                        className={`
                          w-full
                          h-[1px]
                          my-[10px]
                          ${
                            isCompleted || isPassed
                              ? "bg-neutral-scale300 dark:bg-neutral-scale1200"
                                : isReadyToStart
                                  ? "bg-success-100"
                                  : "bg-primery-100"
                          }
                        `}
                      />

                      {/* Topic */}
                      <div className="flex items-start gap-[5px] text-xs font-vazir">
                        <span className="shrink-0 text-neutral-scale1200 dark:text-neutral-scale400 font-medium">
                          {isRTL ? "مباحث آزمون:" : "Topics:"}
                        </span>

                        <span
                          dir="rtl"
                          className="min-w-0 text-neutral-scale1600 dark:text-neutral-scale200 truncate"
                        >
                          {exam.topic || exam.title}
                        </span>
                      </div>

                      {/* Date & Duration */}
                      <div className="flex items-center justify-between mt-[10px] text-xs font-vazir text-neutral-scale1000 dark:text-neutral-scale400">
                        <div className="flex items-center gap-[5px]">
                          <CalendarDays className="!w-[14px] !h-[14px] shrink-0 text-primery-600 dark:text-primery-400" />

                          <span>
                            {isRTL ? toPersianDigits(exam.date) : exam.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-[5px]">
                          <Clock3 className="!w-[14px] !h-[14px] shrink-0 text-primery-600 dark:text-primery-400" />

                          <span>
                            {exam.duration
                              ? isRTL
                                ? `${toPersianDigits(exam.duration)} دقیقه`
                                : `${exam.duration} min`
                              : isRTL
                                ? "۲۰ دقیقه"
                                : "20 min"}
                          </span>
                        </div>
                      </div>

                      {/* Exam Window & Student Scheduled Slot Card */}
                      <div className="mt-2.5 p-2 rounded-lg bg-neutral-scale50 dark:bg-neutral-scale1200/80 border border-neutral-scale200 dark:border-neutral-scale1000 flex flex-col gap-1.5 text-[11px] font-vazir">
                        {/* Overall window */}
                        <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock3 className="w-3 h-3 text-[#2481cc]" />

                            <span>
                              {isRTL ? "بازه کلی آزمون:" : "Overall Window:"}
                            </span>
                          </span>

                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {toPersianDigits(exam.windowStart || "10:00")} تا{" "}
                            {toPersianDigits(exam.windowEnd || "14:00")}
                          </span>
                        </div>

                        {/* Student Assigned Slot */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50 dark:border-neutral-800">
                          <span className="flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />

                            <span>
                              {isReadyToStart
                                ? isRTL
                                  ? "وضعیت جلسه:"
                                  : "Session Status:"
                                : isRTL
                                  ? "نوبت حضور شما:"
                                  : "Your Slot:"}
                            </span>
                          </span>

                          <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                            {isReadyToStart ? (
                              <span className="text-green-600 dark:text-green-400 font-semibold">
                                {isRTL ? "آماده شروع" : "Ready to Start"}
                              </span>
                            ) : exam.studentSlotStart && exam.studentSlotEnd ? (
                              `${toPersianDigits(
                                exam.studentSlotStart,
                              )} تا ${toPersianDigits(exam.studentSlotEnd)}`
                            ) : (
                              <span>
                                {toPersianDigits(exam.windowStart || "10:00")}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Change Time Slot - only before the exam starts */}
                      {exam.status === "assigned" &&
                        isUpcoming &&
                        !isCompleted && (
                          <button
                            type="button"
                            onClick={() => setSchedulingExam(exam)}
                            className="w-full mt-2 h-7 rounded-lg border border-[#2481cc]/40 dark:border-[#52a2f6]/40 bg-[#edf5fd]/70 dark:bg-[#182533]/70 hover:bg-[#e1eefc] dark:hover:bg-[#203244] text-[#2481cc] dark:text-[#52a2f6] text-[11px] font-bold font-vazir flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Clock3 className="w-3.5 h-3.5" />

                            <span>
                              {isRTL
                                ? "زمان‌بندی و تغییر نوبت حضور"
                                : "Change Time Slot"}
                            </span>
                          </button>
                        )}

                      {/* Action Button */}
                      <button
                        type="button"
                        disabled={isUpcoming || isPassed}
                        onClick={() => handleStartExam(exam)}
                        className={`
                          w-full
                          flex
                          items-center
                          justify-center
                          gap-[6px]
                          h-[36px]
                          mt-[10px]
                          px-[10px]
                          rounded-[9px]
                          font-vazir
                          text-xs
                          font-semibold
                          transition-all
                          ${
                            isCompleted
                              ? `
                                bg-neutral-scale70
                                border
                                border-error-100
                                dark:border-neutral-scale90
                                hover:bg-neutral-scale90
                                dark:bg-neutral-scale700
                                dark:hover:bg-neutral-scale600
                                text-error-300
                                dark:text-neutral-scale70
                                cursor-pointer
                              `
                              : isPassed
                                ? `
                                  bg-neutral-scale200
                                  dark:bg-neutral-scale1100
                                  text-neutral-scale700
                                  dark:text-neutral-scale400
                                  border
                                  border-neutral-scale300
                                  dark:border-neutral-scale1000
                                  cursor-not-allowed
                                `
                                  : isReadyToStart
                                    ? `
                                      bg-green-600
                                      hover:bg-green-700
                                      text-white
                                      cursor-pointer
                                      active:scale-[0.98]
                                    `
                                    : isUpcoming
                                      ? `
                                        bg-neutral-scale90
                                        dark:bg-neutral-scale1100
                                        text-neutral-scale1300
                                        dark:text-neutral-scale300
                                        border
                                        border-neutral-scale300
                                        dark:border-neutral-scale1000
                                        cursor-not-allowed
                                      `
                                      : `
                                        bg-primery-700
                                        hover:bg-primery-800
                                        text-white
                                        cursor-pointer
                                      `
                          }
                        `}
                      >
                        {isCompleted ? (
                          <>
                            <BarChart3 className="!w-[14px] !h-[14px]" />

                            <span>
                              {isRTL
                                ? "مشاهده کارنامه و نتیجه"
                                : "View Result & Report"}
                            </span>
                          </>
                        ) : isUpcoming ? (
                          <>
                            <Clock3 className="!w-[14px] !h-[14px]" />

                            <span>{isRTL ? "شروع آزمون" : "Start Exam"}</span>

                            <span
                              dir="ltr"
                              className={`${isRTL ? "font-vazir" : "font-inter"} font-bold tabular-nums`}
                            >
                              {timing.remainingUntilStart >= 86400000
                                ? timing.waitStr
                                : isRTL
                                  ? toPersianDigits(
                                      formatCountdown(timing.remainingUntilStart),
                                    )
                                  : formatCountdown(timing.remainingUntilStart)}
                            </span>
                          </>
                        ) : isReadyToStart ? (
                          <>
                            <Play className="!w-[14px] !h-[14px]" />

                            <span>{isRTL ? "شروع آزمون" : "Start Exam"}</span>
                          </>
                        ) : isPassed ? (
                          <>
                            <AlertCircle className="!w-[14px] !h-[14px]" />

                            <span>
                              {isRTL
                                ? "زمان برگزاری به پایان رسیده"
                                : "Exam Ended"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Play className="!w-[14px] !h-[14px]" />

                            <span>{isRTL ? "شروع آزمون" : "Start Exam"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Turn Timing Modal / Alert */}
      {turnWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-[340px] bg-white dark:bg-neutral-scale1300 rounded-2xl p-5 border border-neutral-scale200 dark:border-neutral-scale1100 shadow-2xl flex flex-col gap-3 font-vazir text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <Clock3 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {isRTL ? "نوبت حضور در آزمون" : "Exam Slot Notice"}
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed px-1">
              {turnWarning}
            </p>

            <button
              type="button"
              onClick={() => setTurnWarning("")}
              className="w-full py-2.5 mt-2 rounded-xl bg-primery-700 hover:bg-primery-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-primery-700/25"
            >
              {isRTL ? "متوجه شدم" : "Got it"}
            </button>
          </div>
        </div>
      )}

      {/* Exam Schedule Modal */}
      {schedulingExam && (
        <ExamScheduleModal
          isOpen={!!schedulingExam}
          onClose={() => setSchedulingExam(null)}
          exam={schedulingExam}
          onSlotChanged={handleSlotChanged}
        />
      )}
    </main>
  );
};
