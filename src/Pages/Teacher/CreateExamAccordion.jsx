import { useState, useEffect, useContext, useMemo } from "react";
import {
  FileText,
  Users,
  Clock3,
  CalendarDays,
  ChevronDown,
  Plus,
  Minus,
  Check,
  Search,
  AlertCircle,
  Loader2,
  Target,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { studentsApi } from "@/api/new/students.api";
import { examsApi } from "@/api/new/exams.api";
import { DatePickerModal } from "@/Components/Common/DatePickerModal";
import { ClockPickerModal } from "@/Components/Common/ClockPickerModal";
import {
  parseIsoDate,
  gregorianToJalali,
  formatDisplayDate,
  toPersianDigits,
  getTodayIsoDate,
} from "@/utils/dateUtils";

// Utility helpers for time and minute math
const calculateTotalMinutes = (studentCount, durationMinutes, gapMinutes = 5) => {
  const n = parseInt(studentCount, 10) || 0;
  const d = parseInt(durationMinutes, 10) || 0;
  if (n <= 0 || d <= 0) return 0;
  return n * d + (n - 1) * gapMinutes;
};

const addMinutesToTime = (timeStr, minutesToAdd) => {
  if (!timeStr || !timeStr.includes(":")) return "10:00";
  const [hours, mins] = timeStr.split(":").map(Number);
  const totalMins = (hours * 60 + mins + minutesToAdd) % (24 * 60);
  const newHours = Math.floor(totalMins / 60);
  const newMins = totalMins % 60;
  return `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
};

const isTimeEqualOrAfter = (timeA, timeB) => {
  if (!timeA || !timeB || !timeA.includes(":") || !timeB.includes(":")) return true;
  const [hA, mA] = timeA.split(":").map(Number);
  const [hB, mB] = timeB.split(":").map(Number);
  return hA * 60 + mA >= hB * 60 + mB;
};

export const CreateExamAccordion = ({
  courseId = "c0000000-0000-4000-8000-000000000001",
  courseTitle = "سیستم عامل",
  onExamCreated,
  onCancel,
}) => {
  const { isRTL, t } = useContext(AppContext);

  // Form State
  const [examTitle, setExamTitle] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");

  // Accordion Expand States
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(true);
  const [isTimeOpen, setIsTimeOpen] = useState(true);

  // Duration & Goals
  const [durationPerStudent, setDurationPerStudent] = useState(10);
  const [goalCount, setGoalCount] = useState(2);
  const [goals, setGoals] = useState(["", ""]);

  // Date & Time Scheduling
  const [examDate, setExamDate] = useState("1405/07/20");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:25");
  const [timeError, setTimeError] = useState("");

  // Modals for Date & Clock Pickers
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStartTimePickerOpen, setIsStartTimePickerOpen] = useState(false);
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);
  const [selectedIsoDate, setSelectedIsoDate] = useState(() => getTodayIsoDate());

  const handleDateSelected = (isoDate) => {
    setSelectedIsoDate(isoDate);
    const p = parseIsoDate(isoDate);
    if (p) {
      if (isRTL) {
        const { jy, jm, jd } = gregorianToJalali(p.gy, p.gm, p.gd);
        const jalaliStr = `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
        setExamDate(jalaliStr);
      } else {
        setExamDate(isoDate);
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Load students for this course
  useEffect(() => {
    let isMounted = true;
    setIsLoadingStudents(true);
    studentsApi
      .getStudentsByCourse(courseId)
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : [];
        setStudents(list);
        // By default select all students of the course
        setSelectedStudentIds(list.map((s) => String(s.id)));
      })
      .catch((err) => {
        console.error("Failed to load course students:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStudents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  // Handle Goal Count changes
  const handleGoalCountChange = (newCount) => {
    const validCount = Math.max(1, Math.min(10, parseInt(newCount, 10) || 1));
    setGoalCount(validCount);
    setGoals((prev) => {
      const next = [...prev];
      while (next.length < validCount) next.push("");
      return next.slice(0, validCount);
    });
    if (validCount > 0) {
      setIsGoalsOpen(true);
    }
  };

  const handleGoalTextChange = (index, value) => {
    setGoals((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Student toggle handlers
  const handleToggleStudent = (studentId) => {
    const sId = String(studentId);
    setSelectedStudentIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => String(s.id)));
    }
  };

  // Filtered students for search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.trim().toLowerCase();
    return students.filter(
      (s) =>
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.id && String(s.id).includes(q))
    );
  }, [students, studentSearch]);

  // Selected students avatar stack (take first 4)
  const selectedStudentsObjects = useMemo(() => {
    const set = new Set(selectedStudentIds);
    return students.filter((s) => set.has(String(s.id)));
  }, [students, selectedStudentIds]);

  // Recalculate minimum required end time whenever student count, duration, or start time changes
  const totalExamMinutes = useMemo(() => {
    return calculateTotalMinutes(selectedStudentIds.length, durationPerStudent, 5);
  }, [selectedStudentIds.length, durationPerStudent]);

  const minCalculatedEndTime = useMemo(() => {
    return addMinutesToTime(startTime, totalExamMinutes);
  }, [startTime, totalExamMinutes]);

  // Auto update end time to minimum if current end time is invalid or earlier
  useEffect(() => {
    if (!isTimeEqualOrAfter(endTime, minCalculatedEndTime)) {
      setEndTime(minCalculatedEndTime);
      setTimeError("");
    }
  }, [minCalculatedEndTime]);

  const handleEndTimeChange = (newVal) => {
    setEndTime(newVal);
    if (!isTimeEqualOrAfter(newVal, minCalculatedEndTime)) {
      setTimeError(
        isRTL
          ? `حداقل زمان پایان بر اساس گپ ۵ دقیقه‌ای باید ${minCalculatedEndTime} باشد.`
          : `End time must be at least ${minCalculatedEndTime} based on 5m gaps.`
      );
    } else {
      setTimeError("");
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError("");

    if (!examTitle.trim()) {
      setFormError(
        isRTL ? "لطفاً نام آزمون را وارد کنید." : "Please enter the exam title."
      );
      return;
    }

    if (selectedStudentIds.length === 0) {
      setFormError(
        isRTL
          ? "حداقل باید یک دانشجو برای شرکت در آزمون انتخاب شود."
          : "Please select at least one student for the exam."
      );
      setIsStudentsOpen(true);
      return;
    }

    if (!isTimeEqualOrAfter(endTime, minCalculatedEndTime)) {
      setFormError(
        isRTL
          ? `زمان پایان نمی‌تواند کمتر از ${minCalculatedEndTime} باشد.`
          : `End time cannot be earlier than ${minCalculatedEndTime}.`
      );
      setIsTimeOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: examTitle.trim(),
        description: `آزمون درس ${courseTitle} با ${goals.filter(Boolean).length} هدف آموزشی`,
        duration_minutes: durationPerStudent,
        goals: goals.filter((g) => g.trim().length > 0),
        student_ids: selectedStudentIds,
        gap_minutes: 5,
        exam_date: examDate,
        mode: "quiz",
        pass_score: 70,
        is_active: true,
      };

      const result = await examsApi.createLessonQuiz(courseId, payload);

      const createdItem = {
        id: result?.quiz_id || Date.now(),
        title: examTitle.trim(),
        course: courseTitle,
        topic: goals.filter(Boolean).join("، ") || "مباحث آزمون",
        date: examDate,
        time: `${startTime} - ${endTime}`,
        duration: `${durationPerStudent} دقیقه هر دانشجو`,
        active: true,
        scheduled: true,
        studentCount: selectedStudentIds.length,
        goals: goals.filter(Boolean),
      };

      onExamCreated?.(createdItem);
    } catch (err) {
      console.error("Failed to create exam:", err);
      setFormError(
        isRTL
          ? "خطا در برقراری ارتباط با سرور. لطفاً مجدداً تلاش فرمایید."
          : "Failed to create exam. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="w-full flex flex-col gap-3.5 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300 select-text"
    >
      {/* Top Header / Back Bar */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-scale200 dark:hover:bg-neutral-scale1200 transition-colors text-neutral-scale1000 dark:text-neutral-scale300 cursor-pointer"
            aria-label="بازگشت"
          >
            {isRTL ? (
              <ArrowRight className="w-5 h-5" />
            ) : (
              <ArrowLeft className="w-5 h-5" />
            )}
          </button>

          <div>
            <h2 className="text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 font-vazir">
              {isRTL ? "ساخت آزمون جدید" : "Create New Exam"}
            </h2>
            <p className="text-[11px] text-[#2481cc] dark:text-[#52a2f6] font-vazir">
              {isRTL ? `درس: ${courseTitle}` : `Course: ${courseTitle}`}
            </p>
          </div>
        </div>


      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-vazir animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* =========================================================
          ITEM 1: انتخاب نام آزمون (NO EXTEND - همیشه باز و مستقیم)
          ========================================================= */}
      <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-[14px] border border-neutral-scale100 dark:border-neutral-scale1100 p-3.5 shadow-2xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <label className="text-xs font-bold text-neutral-scale1600 dark:text-neutral-scale100 font-vazir">
            {isRTL ? "نام آزمون" : "Exam Title"}
            <span className="text-red-500 mr-1">*</span>
          </label>
        </div>

        <input
          type="text"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder={
            isRTL
              ? "مثلاً: آزمون میان‌ترم مفاهیم پایه سیستم عامل..."
              : "e.g., Operating Systems Midterm Exam..."
          }
          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-xs font-vazir focus:outline-none focus:ring-2 focus:ring-[#2481cc]/25 focus:border-[#2481cc] transition-all"
        />
      </div>

      {/* =========================================================
          ITEM 2: نمایش دانشجویان درس که می‌خوای شرکت بکنن (EXTENDABLE)
          بسته: آواتار استک دایره‌ای روی هم
          باز: لیست کامل با سوییچ tg-switch و اسکرول
          ========================================================= */}
      <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-[14px] border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden shadow-2xs transition-all">
        {/* Outer Summary Header (Always Visible & Clickable) */}
        <div
          onClick={() => setIsStudentsOpen(!isStudentsOpen)}
          className="p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-neutral-scale100/40 dark:hover:bg-neutral-scale1200/40 transition-colors select-none"
        >
          {/* Right: Icon + Label + Subtitle */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-neutral-scale1600 dark:text-neutral-scale100 font-vazir leading-tight">
                {isRTL ? "دانشجویان شرکت‌کننده" : "Participating Students"}
              </span>
              <span className="text-[10px] text-[#2481cc] dark:text-[#52a2f6] font-vazir leading-tight mt-0.5">
                {isRTL
                  ? `${selectedStudentIds.length} از ${students.length} دانشجو انتخاب شده`
                  : `${selectedStudentIds.length} of ${students.length} selected`}
              </span>
            </div>
          </div>

          {/* Left: Avatar Stack Overlapping Halfway & Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Circular Avatar Stack */}
            <div className="flex items-center py-0.5 shrink-0" dir={isRTL ? "rtl" : "ltr"}>
              {selectedStudentsObjects.slice(0, 3).map((st, i) => (
                <div
                  key={st.id || i}
                  style={{
                    zIndex: 10 - i,
                    ...(i > 0
                      ? isRTL
                        ? { marginRight: "-9px" }
                        : { marginLeft: "-9px" }
                      : {}),
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-scale1300 bg-blue-100 dark:bg-blue-900/60 text-[#2481cc] dark:text-blue-300 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-2xs shrink-0 select-none"
                  title={st.title || st.name}
                >
                  {st.photo_url ? (
                    <img
                      src={st.photo_url}
                      alt={st.title || st.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(st.title || st.name || "د").charAt(0)}</span>
                  )}
                </div>
              ))}

              {selectedStudentsObjects.length > 3 && (
                <div
                  style={{
                    zIndex: 5,
                    ...(selectedStudentsObjects.length > 0
                      ? isRTL
                        ? { marginRight: "-9px" }
                        : { marginLeft: "-9px" }
                      : {}),
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-scale1300 bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center text-[9px] font-bold shadow-2xs shrink-0 select-none font-vazir"
                >
                  +{selectedStudentsObjects.length - 3}
                </div>
              )}
            </div>

            <ChevronDown
              className={`w-4 h-4 text-neutral-400 transition-transform duration-250 ${
                isStudentsOpen ? "rotate-180 text-[#2481cc]" : ""
              }`}
            />
          </div>
        </div>

        {/* Extended Body */}
        {isStudentsOpen && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60 flex flex-col gap-2.5 animate-in fade-in duration-200">
            {/* Search & Select All Actions */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder={
                    isRTL ? "جستجوی دانشجو با نام..." : "Search student by name..."
                  }
                  className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#2481cc] font-vazir"
                />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] border border-[#2481cc]/25 hover:bg-[#e1eefc] dark:hover:bg-[#203244] transition-colors cursor-pointer font-vazir shrink-0"
              >
                {selectedStudentIds.length === students.length
                  ? isRTL
                    ? "لغو همه"
                    : "Deselect"
                  : isRTL
                  ? "انتخاب همه"
                  : "Select All"}
              </button>
            </div>

            {/* Scrollable Students List */}
            {isLoadingStudents ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-neutral-500 font-vazir">
                <Loader2 className="w-4 h-4 animate-spin text-[#2481cc]" />
                <span>{isRTL ? "در حال دریافت دانشجویان..." : "Loading students..."}</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-400 font-vazir">
                {isRTL ? "دانشجویی یافت نشد" : "No students found"}
              </div>
            ) : (
              <div className="max-h-[220px] overflow-y-auto space-y-2 px-2.5 py-1 custom-scroll">
                {filteredStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(String(st.id));
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleStudent(st.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                        isChecked
                          ? "bg-white dark:bg-[#121c27] border-[#2481cc]/30 dark:border-[#52a2f6]/30 shadow-2xs"
                          : "bg-neutral-scale100/50 dark:bg-neutral-scale1200/40 border-transparent opacity-65"
                      }`}
                    >
                      {/* Student info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2481cc] dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden font-vazir">
                          {st.photo_url ? (
                            <img
                              src={st.photo_url}
                              alt={st.title || st.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{(st.title || st.name || "د").charAt(0)}</span>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 font-vazir truncate">
                            {st.title || st.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-vazir">
                            {st.statusFa || st.status || "دانشجو"}
                          </span>
                        </div>
                      </div>

                      {/* Telegram Switch (tg-switch-sm compact variant) */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <label className="tg-switch tg-switch-sm shrink-0" dir="ltr">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleStudent(st.id)}
                          />
                          <span className="tg-track" />
                          <span className="tg-thumb" />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          ITEM 3: زمان آزمون و تعداد هدف‌ها goal (EXTENDABLE)
          بیرونی: فیلد زمان هر نفر و تعداد گل
          اکستند: باکس‌های نوشتن توضیحات goal 1, goal 2, ...
          ========================================================= */}
      <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-[14px] border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden shadow-2xs transition-all">
        {/* Outer Fields (Always Visible) */}
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-neutral-scale1600 dark:text-neutral-scale100 font-vazir">
                {isRTL ? "زمان هر دانشجو و اهداف آزمون" : "Duration & Goals"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsGoalsOpen(!isGoalsOpen)}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-250 ${
                  isGoalsOpen ? "rotate-180 text-[#2481cc]" : ""
                }`}
              />
            </button>
          </div>

          {/* Two Outer Controls in a Row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Duration per student */}
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000">
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 font-vazir">
                {isRTL ? "زمان هر دانشجو" : "Per Student"}
              </span>

              <div className="flex items-center justify-between gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setDurationPerStudent((prev) => Math.max(1, prev - 1))
                  }
                  className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={durationPerStudent}
                    onChange={(e) =>
                      setDurationPerStudent(
                        Math.max(1, parseInt(e.target.value, 10) || 1)
                      )
                    }
                    className="w-12 text-center font-bold text-xs text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none font-vazir"
                  />
                  <span className="text-[10px] text-neutral-400 font-vazir">
                    {isRTL ? "دقیقه" : "min"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDurationPerStudent((prev) => Math.min(180, prev + 1))
                  }
                  className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 2. Number of Goals */}
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000">
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 font-vazir">
                {isRTL ? "تعداد هدف‌ها (Goal)" : "Goal Count"}
              </span>

              <div className="flex items-center justify-between gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={() => handleGoalCountChange(goalCount - 1)}
                  className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={goalCount}
                    onChange={(e) => handleGoalCountChange(e.target.value)}
                    className="w-12 text-center font-bold text-xs text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none font-vazir"
                  />
                  <span className="text-[10px] text-neutral-400 font-vazir">
                    {isRTL ? "هدف" : "goals"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoalCountChange(goalCount + 1)}
                  className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Goals Box: Opens to enter descriptions for each goal */}
        {isGoalsOpen && goalCount > 0 && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60 flex flex-col gap-2.5 animate-in fade-in duration-200">
            <span className="text-[11px] font-semibold text-[#2481cc] dark:text-[#52a2f6] font-vazir pt-1">
              {isRTL
                ? `تعریف و توضیحات ${goalCount} هدف آزمون:`
                : `Define details for ${goalCount} goals:`}
            </span>

            {Array.from({ length: goalCount }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 font-vazir flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#2481cc] text-white flex items-center justify-center text-[9px] font-vazir font-bold">
                    {idx + 1}
                  </span>
                  <span>
                    {isRTL ? `هدف شماره ${idx + 1} (Goal ${idx + 1}):` : `Goal ${idx + 1}:`}
                  </span>
                </label>

                <textarea
                  rows={2}
                  value={goals[idx] || ""}
                  onChange={(e) => handleGoalTextChange(idx, e.target.value)}
                  placeholder={
                    isRTL
                      ? `سرفصل یا سوالات مربوط به هدف ${idx + 1} را بنویسید...`
                      : `Enter details or topics for goal ${idx + 1}...`
                  }
                  className="w-full resize-none p-2 text-xs rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#2481cc] font-vazir leading-relaxed"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================
          ITEM 4: تاریخ، زمان شروع و پایان هوشمند با گپ ۵ دقیقه‌ای (EXTENDABLE)
          محاسبه خودکار حداقل زمان پایان بر اساس فرمول:
          Total = N * Duration + (N - 1) * 5
          کاربر نمی‌تواند پایان را کمتر از این حداقل ثبت کند
          ========================================================= */}
      <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-[14px] border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden shadow-2xs transition-all">
        {/* Outer Header */}
        <div
          onClick={() => setIsTimeOpen(!isTimeOpen)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-scale100/40 dark:hover:bg-neutral-scale1200/40 transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
              <Clock3 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-neutral-scale1600 dark:text-neutral-scale100 font-vazir">
                {isRTL ? "زمان‌بندی و برگزاری آزمون" : "Date & Time Scheduling"}
              </span>
              <span className="text-[10px] text-neutral-400 font-vazir">
                {examDate} • {startTime} {isRTL ? "تا" : "to"} {endTime}
              </span>
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-250 ${
              isTimeOpen ? "rotate-180 text-[#2481cc]" : ""
            }`}
          />
        </div>

        {/* Extended Scheduling Body */}
        {isTimeOpen && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60 flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Date Field with Calendar Picker */}
            <div className="flex flex-col gap-1 pt-1 font-vazir">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 font-vazir flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-[#2481cc]" />
                  <span>{isRTL ? "تاریخ برگزاری آزمون" : "Exam Date"}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="px-2 py-0.5 rounded-md bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] text-[10px] font-semibold cursor-pointer hover:bg-[#e1eefc] dark:hover:bg-[#203244] border border-[#2481cc]/25 transition-colors flex items-center gap-1"
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span>{isRTL ? "انتخاب از تقویم" : "Calendar"}</span>
                </button>
              </div>

              <div
                onClick={() => setIsDatePickerOpen(true)}
                className="relative flex items-center cursor-pointer group"
              >
                <input
                  type="text"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  placeholder="1405/07/20"
                  className="w-full pr-3 pl-10 py-2 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 group-hover:border-[#2481cc] text-neutral-900 dark:text-neutral-100 text-xs font-vazir font-semibold focus:outline-none focus:ring-1 focus:ring-[#2481cc] cursor-pointer transition-colors"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDatePickerOpen(true);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-[#2481cc] dark:group-hover:text-[#52a2f6] transition-colors cursor-pointer p-1"
                  title={isRTL ? "باز کردن تقویم انتخاب تاریخ" : "Open Calendar"}
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Start and End Time Selection (opens ClockPickerModal like calendar) */}
            <div className="grid grid-cols-2 gap-2.5 font-vazir">
              {/* Start Time Field */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 font-vazir flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5 text-primery-700" />
                    <span>{isRTL ? "ساعت شروع" : "Start Time"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsStartTimePickerOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-[#edf5fd] dark:bg-[#182533] text-primery-700 dark:text-[#52a2f6] text-[10px] font-semibold cursor-pointer hover:bg-[#e1eefc] dark:hover:bg-[#203244] border border-primery-700/25 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Clock3 className="w-3 h-3" />
                    <span>{isRTL ? "انتخاب ساعت" : "Select"}</span>
                  </button>
                </div>

                <div
                  onClick={() => setIsStartTimePickerOpen(true)}
                  className="relative flex items-center cursor-pointer group"
                >
                  <input
                    type="text"
                    readOnly
                    value={startTime}
                    className="w-full pr-3 pl-9 py-2 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 group-hover:border-primery-700 text-neutral-900 dark:text-neutral-100 text-xs font-vazir font-bold focus:outline-none focus:ring-1 focus:ring-primery-700 cursor-pointer transition-colors text-center"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStartTimePickerOpen(true);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-primery-700 dark:group-hover:text-[#52a2f6] transition-colors cursor-pointer p-1"
                    title={isRTL ? "تنظیم ساعت شروع" : "Set Start Time"}
                  >
                    <Clock3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9.5px] px-1">
                  <span className="text-neutral-400 font-vazir">
                    {isRTL ? "کلیک جهت باز کردن ساعت" : "Click to set time"}
                  </span>
                </div>
              </div>

              {/* End Time Field */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 font-vazir flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5 text-primery-700" />
                    <span>{isRTL ? "ساعت پایان" : "End Time"}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEndTimePickerOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-[#edf5fd] dark:bg-[#182533] text-primery-700 dark:text-[#52a2f6] text-[10px] font-semibold cursor-pointer hover:bg-[#e1eefc] dark:hover:bg-[#203244] border border-primery-700/25 transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Clock3 className="w-3 h-3" />
                    <span>{isRTL ? "انتخاب ساعت" : "Select"}</span>
                  </button>
                </div>

                <div
                  onClick={() => setIsEndTimePickerOpen(true)}
                  className="relative flex items-center cursor-pointer group"
                >
                  <input
                    type="text"
                    readOnly
                    value={endTime}
                    className={`w-full pr-3 pl-9 py-2 rounded-xl bg-white dark:bg-[#121c27] border ${
                      timeError
                        ? "border-red-400 bg-red-50/30 text-red-600"
                        : "border-neutral-scale300 dark:border-neutral-scale1000 group-hover:border-primery-700 text-neutral-900 dark:text-neutral-100"
                    } text-xs font-vazir font-bold focus:outline-none focus:ring-1 focus:ring-primery-700 cursor-pointer transition-colors text-center`}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEndTimePickerOpen(true);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-primery-700 dark:group-hover:text-[#52a2f6] transition-colors cursor-pointer p-1"
                    title={isRTL ? "تنظیم ساعت پایان" : "Set End Time"}
                  >
                    <Clock3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[9.5px] px-1">
                  <span className="text-neutral-400 font-vazir">
                    {isRTL ? `حداقل مجاز: ${minCalculatedEndTime}` : `Min: ${minCalculatedEndTime}`}
                  </span>
                </div>
              </div>
            </div>

            {timeError && (
              <span className="text-[10px] text-red-500 font-vazir flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {timeError}
              </span>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          BOTTOM ACTIONS: ثبت و ایجاد آزمون / انصراف
          ========================================================= */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-700 dark:text-neutral-300 font-vazir text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center"
        >
          {isRTL ? "انصراف" : "Cancel"}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !examTitle.trim() || selectedStudentIds.length === 0}
          className="flex-[2] py-3 px-4 rounded-xl bg-[#2481cc] hover:bg-[#1b70b5] dark:bg-[#52a2f6] dark:hover:bg-[#3d91ea] text-white font-vazir text-xs font-bold transition-all shadow-md shadow-[#2481cc]/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isRTL ? "در حال ایجاد آزمون..." : "Creating exam..."}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{isRTL ? "ثبت و ایجاد آزمون" : "Create Exam"}</span>
            </>
          )}
        </button>
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={selectedIsoDate}
        onSelectDate={handleDateSelected}
        title={isRTL ? "انتخاب تاریخ آزمون" : "Select Exam Date"}
      />

      {/* Start Time Clock Picker Modal */}
      <ClockPickerModal
        isOpen={isStartTimePickerOpen}
        onClose={() => setIsStartTimePickerOpen(false)}
        initialTime={startTime}
        onConfirm={(newTime) => setStartTime(newTime)}
        title={isRTL ? "تنظیم ساعت شروع آزمون" : "Set Start Time"}
      />

      {/* End Time Clock Picker Modal with Min Time Lock */}
      <ClockPickerModal
        isOpen={isEndTimePickerOpen}
        onClose={() => setIsEndTimePickerOpen(false)}
        initialTime={endTime}
        minTime={minCalculatedEndTime}
        onConfirm={(newTime) => handleEndTimeChange(newTime)}
        title={isRTL ? "تنظیم ساعت پایان آزمون" : "Set End Time"}
      />
    </div>
  );
};

export default CreateExamAccordion;
