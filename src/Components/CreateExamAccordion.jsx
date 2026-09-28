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
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Calendar as CalendarIcon,
  Paperclip,
  Trash2,
  UploadCloud,
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

export const BLOOM_LEVELS = [
  { level: 1, name: "یادآوری", desc: "بازشناسی و یادآوری تعاریف، کلیدواژه‌ها و اصول پایه", key: "remember" },
  { level: 2, name: "درک مفاهیم", desc: "تفسیر، تشریح و توضیح عمیق موضوعات به بیان خود دانشجو", key: "understand" },
  { level: 3, name: "به‌کارگیری", desc: "استفاده عملی از مفاهیم در حل سناریوها و مسائل عینی", key: "apply" },
  { level: 4, name: "تحلیل", desc: "کالبدشکافی ساختار، کشف ارتباط اجزا، مقایسه و عیب‌یابی", key: "analyze" },
  { level: 5, name: "ارزیابی", desc: "نقد فنی، داوری بر اساس معیارها و استدلال نقادانه", key: "evaluate" },
  { level: 6, name: "آفرینش", desc: "طراحی معماری، خلق راه‌حل نوآورانه و ترکیب مفاهیم", key: "create" },
];

export const GOAL_TYPES = [
  { id: "theoretical", label: "تئوری و مفهومی" },
  { id: "practical", label: "کاربردی و عملی" },
  { id: "analytical", label: "تحلیلی و حل مسئله" },
];

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
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(true);

  // Duration & Goals
  const [durationPerStudent, setDurationPerStudent] = useState(10);
  const [goalCount, setGoalCount] = useState(2);
  const [goals, setGoals] = useState([
    { title: "", goal_type: "theoretical", bloom_level: 2 },
    { title: "", goal_type: "practical", bloom_level: 3 },
  ]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [rawFiles, setRawFiles] = useState([]);
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  const [goalAiNotice, setGoalAiNotice] = useState({ type: "", message: "" });
  const [isGoalSuccess, setIsGoalSuccess] = useState(false);

  // Date & Time Scheduling - Defaults to current local moment
  const [examDate, setExamDate] = useState(() => {
    const todayIso = getTodayIsoDate();
    const p = parseIsoDate(todayIso);
    if (p) {
      const { jy, jm, jd } = gregorianToJalali(p.gy, p.gm, p.gd);
      return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
    }
    return "1405/07/06";
  });

  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    const curStart = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return addMinutesToTime(curStart, 60);
  });
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
      while (next.length < validCount) {
        next.push({
          title: "",
          goal_type: "theoretical",
          bloom_level: 2,
        });
      }
      return next.slice(0, validCount);
    });
    if (validCount > 0) {
      setIsGoalsOpen(true);
    }
  };

  const handleGoalFieldChange = (index, field, value) => {
    setGoals((prev) => {
      const next = [...prev];
      const cur =
        typeof next[index] === "object" && next[index] !== null
          ? { ...next[index] }
          : { title: String(next[index] || ""), goal_type: "theoretical", bloom_level: 2 };
      cur[field] = value;
      next[index] = cur;
      return next;
    });
  };

  const handleGoalTextChange = (index, value) => {
    handleGoalFieldChange(index, "title", value);
  };

  // Generate Goals using AI from uploaded file
  const handleGenerateGoalsFromAttachedFile = async () => {
    setGoalAiNotice({ type: "", message: "" });
    setIsGoalSuccess(false);

    if (!rawFiles || rawFiles.length === 0) {
      setGoalAiNotice({
        type: "warning",
        message: isRTL
          ? "لطفاً ابتدا در بخش بالای اهداف (پیوست فایل‌ها و منابع مرجع)، یک فایل جزوه، اسلاید یا سند بارگذاری نمایید."
          : "Please attach a reference file (PDF, DOCX, PPTX, TXT) in the section above first.",
      });
      setIsFilesOpen(true);
      return;
    }

    const targetFile = rawFiles[0];
    setIsGeneratingGoals(true);
    setIsGoalsOpen(true);

    try {
      const response = await examsApi.generateGoalsFromFile(targetFile, {
        courseTitle,
        examTitle,
        maxGoals: Math.max(2, goalCount || 3),
      });

      if (response && response.goals && Array.isArray(response.goals) && response.goals.length > 0) {
        const formattedGoals = response.goals.map((g) => ({
          title: g.title || "",
          goal_type: g.goal_type || "theoretical",
          bloom_level: typeof g.bloom_level === "number" ? Math.max(1, Math.min(6, g.bloom_level)) : 2,
        }));

        setGoals(formattedGoals);
        setGoalCount(formattedGoals.length);
        setIsGoalSuccess(true);
        setGoalAiNotice({
          type: "success",
          message: isRTL
            ? `${toPersianDigits(formattedGoals.length)} هدف آموزشی با تحلیل هوشمند فایل «${targetFile.name}» با موفقیت تنظیم شد.`
            : `Successfully generated ${formattedGoals.length} goals from "${targetFile.name}".`,
        });
      } else {
        throw new Error("No valid goals returned from server");
      }
    } catch (err) {
      console.error("Failed to generate goals from file:", err);
      setIsGoalSuccess(false);
      setGoalAiNotice({
        type: "error",
        message: isRTL
          ? "خطا در استخراج هوشمند اهداف از فایل. لطفاً از اتصال اینترنت یا فرمت فایل اطمینان حاصل کرده یا اهداف را دستی وارد نمایید."
          : "Failed to extract goals using AI. Please check the file or enter goals manually.",
      });
    } finally {
      setIsGeneratingGoals(false);
    }
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
      const validGoals = goals
        .map((g) => {
          if (typeof g === "object" && g !== null) {
            const bKey =
              BLOOM_LEVELS.find((b) => b.level === (g.bloom_level || 2))?.key || "understand";
            return {
              title: (g.title || "").trim(),
              goal_type: g.goal_type || "theoretical",
              bloom_level: bKey,
              difficulty: (g.bloom_level || 2) <= 2 ? 0.3 : (g.bloom_level <= 4 ? 0.6 : 0.9),
            };
          }
          return { title: String(g).trim(), goal_type: "theoretical", bloom_level: "understand" };
        })
        .filter((g) => g.title.length > 0);

      let isoStart = null;
      let isoEnd = null;
      try {
        const [sh, sm] = (startTime || "10:00").split(":").map(Number);
        const [eh, em] = (endTime || "12:00").split(":").map(Number);
        const baseDate = selectedIsoDate ? new Date(selectedIsoDate) : new Date();
        const dStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), sh, sm, 0, 0);
        const dEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), eh, em, 0, 0);
        isoStart = dStart.toISOString();
        isoEnd = dEnd.toISOString();
      } catch (e) {
        console.error("Error creating ISO dates:", e);
      }

      const payload = {
        title: examTitle.trim(),
        description: `آزمون درس ${courseTitle} با ${validGoals.length} هدف آموزشی`,
        duration_minutes: durationPerStudent,
        goals: validGoals.length > 0 ? validGoals : [examTitle.trim()],
        student_ids: selectedStudentIds,
        gap_minutes: 5,
        exam_date: examDate,
        start_at: isoStart || startTime,
        end_at: isoEnd || endTime,
        starts_at: isoStart || startTime,
        ends_at: isoEnd || endTime,
        window_start: startTime,
        window_end: endTime,
        mode: "quiz",
        pass_score: 70,
        is_active: true,
        materials: attachedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      };

      const result = await examsApi.createLessonQuiz(courseId, payload);

      const topicTitles = validGoals.map((g) => g.title).filter(Boolean);
      const createdItem = {
        id: result?.quiz_id || Date.now(),
        title: examTitle.trim(),
        course: courseTitle,
        topic: topicTitles.join("، ") || "مباحث آزمون",
        date: examDate,
        time: `${startTime} - ${endTime}`,
        duration: `${durationPerStudent} دقیقه هر دانشجو`,
        active: true,
        scheduled: true,
        studentCount: selectedStudentIds.length,
        goals: validGoals,
        materials: attachedFiles,
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
      dir={isRTL ? "rtl " : "ltr font-inter"}
      className="w-full flex flex-col gap-3.5 pb-24 animate-in fade-in slide-in-from-bottom-2 duration-300 select-text"
    >
      <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-[14px] border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden shadow-2xs">
        {/* Course Header */}
        <div className="pt-3.5 px-3.5 pb-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>

          <span className="text-s font-bold text-neutral-scale1600 dark:text-neutral-scale100 ">
            {isRTL ? "نام درس" : "Course Name"}
          </span>
        </div>

        {/* Course Name */}
        <div className="px-3.5 pb-3.5">
          <div className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-900 dark:text-neutral-100 text-xs  text-start">
            {courseTitle}
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-s flex items-center gap-2 animate-in fade-in">
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
          <label className="text-s font-bold text-neutral-scale1600 dark:text-neutral-scale100 ">
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
          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-xs  focus:outline-none focus:ring-2 focus:ring-[#2481cc]/25 focus:border-[#2481cc] transition-all"
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
              <span className="text-s font-bold text-neutral-scale1600 dark:text-neutral-scale100  leading-tight">
                {isRTL ? "دانشجویان شرکت‌کننده" : "Participating Students"}
              </span>
              <span className="text-[10px] text-[#2481cc] dark:text-[#52a2f6]  leading-tight mt-0.5">
                {isRTL
                  ? `${selectedStudentIds.length} از ${students.length} دانشجو انتخاب شده`
                  : `${selectedStudentIds.length} of ${students.length} selected`}
              </span>
            </div>
          </div>

          {/* Left: Avatar Stack Overlapping Halfway & Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Circular Avatar Stack */}
            <div
              className="flex items-center py-0.5 shrink-0"
              dir={isRTL ? "rtl" : "ltr"}
            >
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
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-scale1300 bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center text-[9px] font-bold shadow-2xs shrink-0 select-none "
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
                    isRTL
                      ? "جستجوی دانشجو با نام..."
                      : "Search student by name..."
                  }
                  className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#2481cc] "
                />
                <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleSelectAllStudents}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] border border-[#2481cc]/25 hover:bg-[#e1eefc] dark:hover:bg-[#203244] transition-colors cursor-pointer  shrink-0"
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
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-neutral-500 ">
                <Loader2 className="w-4 h-4 animate-spin text-[#2481cc]" />
                <span>
                  {isRTL ? "در حال دریافت دانشجویان..." : "Loading students..."}
                </span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-4 text-center text-s text-neutral-400 ">
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
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2481cc] dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ">
                          {st.photo_url ? (
                            <img
                              src={st.photo_url}
                              alt={st.title || st.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {(st.title || st.name || "د").charAt(0)}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100  truncate">
                            {st.title || st.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 ">
                            {st.statusFa || st.status || "دانشجو"}
                          </span>
                        </div>
                      </div>

                      {/* Telegram Switch (tg-switch-sm compact variant) */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <label
                          className="tg-switch tg-switch-sm shrink-0"
                          dir="ltr"
                        >
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
          ITEM 3: پیوست فایل‌ها و منابع مرجع آزمون (ACCORDION)
          قرارگیری قبل از اهداف برای امکان تولید هوشمند اهداف از فایل
          ========================================================= */}
      <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-[14px] border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden shadow-2xs transition-all">
        <div
          onClick={() => setIsFilesOpen(!isFilesOpen)}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-scale100/40 dark:hover:bg-neutral-scale1200/40 transition-colors select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-s font-bold text-neutral-scale1600 dark:text-neutral-scale100">
                {isRTL ? "پیوست فایل‌ها و منابع مرجع آزمون" : "Exam Reference Files"}
              </span>
              <span className="text-[10px] text-neutral-400">
                {attachedFiles.length > 0
                  ? isRTL
                    ? `${toPersianDigits(attachedFiles.length)} فایل پیوست شده (آماده استخراج هوشمند اهداف)`
                    : `${attachedFiles.length} file(s) attached (ready for AI goal extraction)`
                  : isRTL
                    ? "اسلایدهای کلاسی، جزوه، کتب مرجع جهت تولید خودکار اهداف و سوالات (اختیاری)"
                    : "Course slides, notes, or reference docs for auto-generating goals (optional)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {attachedFiles.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#2481cc]/15 text-[#2481cc] dark:text-[#52a2f6] border border-[#2481cc]/30">
                {toPersianDigits(attachedFiles.length)}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-neutral-400 transition-transform duration-250 ${
                isFilesOpen ? "rotate-180 text-[#2481cc]" : ""
              }`}
            />
          </div>
        </div>

        {isFilesOpen && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60 flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Upload Dropzone */}
            <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-[#2481cc]/30 dark:border-[#52a2f6]/30 hover:border-[#2481cc] dark:hover:border-[#52a2f6] bg-[#edf5fd]/40 dark:bg-[#182533]/40 transition-colors cursor-pointer text-center">
              <UploadCloud className="w-6 h-6 text-[#2481cc] dark:text-[#52a2f6]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {isRTL ? "انتخاب یا کشیدن فایل‌های مرجع آزمون" : "Select or drop reference files"}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {isRTL
                    ? "پشتیبانی از فرمت‌های PDF، DOCX، PPTX، TXT (حداکثر ۲۰ مگابایت)"
                    : "Supports PDF, DOCX, PPTX, TXT (up to 20MB)"}
                </span>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setRawFiles((prev) => [...prev, ...files]);
                    setAttachedFiles((prev) => [
                      ...prev,
                      ...files.map((f) => ({
                        name: f.name,
                        size: (f.size / (1024 * 1024)).toFixed(2) + " MB",
                        type: f.type || "document",
                      })),
                    ]);
                    setGoalAiNotice({ type: "", message: "" });
                  }
                }}
                className="hidden"
              />
            </label>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="space-y-1.5">
                {attachedFiles.map((file, fIdx) => (
                  <div
                    key={fIdx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#2481cc] shrink-0" />
                      <span className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        ({file.size})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedFiles((prev) => prev.filter((_, i) => i !== fIdx));
                        setRawFiles((prev) => prev.filter((_, i) => i !== fIdx));
                      }}
                      className="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      title={isRTL ? "حذف فایل" : "Remove file"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          ITEM 4: زمان آزمون و تعداد هدف‌ها goal (EXTENDABLE)
          بیرونی: فیلد زمان هر نفر و تعداد گل
          اکستند: تولید خودکار با هوش مصنوعی از فایل، اسکلت لودینگ، تنظیمات بلوم
          ========================================================= */}
      <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-[14px] border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden shadow-2xs transition-all">
        {/* Outer Fields (Always Visible) */}
        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <span className="text-s font-bold text-neutral-scale1600 dark:text-neutral-scale100 ">
                {isRTL ? "زمان هر دانشجو و اهداف آزمون" : "Duration & Goals"}
              </span>
            </div>

            <div className="flex items-center gap-2">
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
          </div>

          {/* Two Outer Controls in a Row */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Duration per student */}
            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000">
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 ">
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
                        Math.max(1, parseInt(e.target.value, 10) || 1),
                      )
                    }
                    className="w-12 text-center font-bold text-xs text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none "
                  />
                  <span className="text-[10px] text-neutral-400 ">
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
              <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 ">
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
                    className="w-12 text-center font-bold text-xs text-neutral-900 dark:text-neutral-100 bg-transparent focus:outline-none "
                  />
                  <span className="text-[10px] text-neutral-400 ">
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

        {/* Extended Goals Box: Opens to enter descriptions, types, and Bloom levels for each goal */}
        {isGoalsOpen && (
          <div className="px-3.5 pb-3.5 pt-1 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60 flex flex-col gap-3 animate-in fade-in duration-200">
            {/* AI Generator Circular Button Section */}
            <div className="py-3 px-4 rounded-xl bg-neutral-50/60 dark:bg-neutral-800/25 border border-neutral-200/50 dark:border-neutral-800/50 flex flex-col items-center justify-center gap-1.5 transition-all">
              <div className="relative inline-flex items-center justify-center p-1">
                {/* Spinning border ring when loading */}
                {isGeneratingGoals && (
                  <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#2481cc] border-r-[#2481cc] animate-spin pointer-events-none" />
                )}

                <button
                  type="button"
                  onClick={handleGenerateGoalsFromAttachedFile}
                  disabled={isGeneratingGoals}
                  title={
                    isGoalSuccess
                      ? (isRTL ? "اهداف با موفقیت استخراج شد (کلیک برای استخراج مجدد)" : "Goals generated (click to regenerate)")
                      : (isRTL ? "استخراج هوشمند اهداف با هوش مصنوعی" : "Generate goals via AI")
                  }
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isGoalSuccess
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25"
                      : isGeneratingGoals
                        ? "bg-[#2481cc] text-white opacity-90 shadow-[#2481cc]/25"
                        : "bg-[#2481cc] hover:bg-[#1f72b5] text-white shadow-[#2481cc]/30 hover:scale-105 active:scale-95"
                  }`}
                >
                  {isGoalSuccess ? (
                    <Check className="w-5 h-5 text-white stroke-[2.5] animate-in zoom-in duration-200" />
                  ) : (
                    <Sparkles
                      className={`w-5 h-5 text-white ${
                        isGeneratingGoals ? "animate-pulse" : ""
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Faint, non-bold text underneath */}
              <div className="flex flex-col items-center gap-0.5 text-center select-none">
                <span className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400 leading-tight">
                  {isGeneratingGoals
                    ? (isRTL ? "در حال استخراج هوشمند اهداف با هوش مصنوعی..." : "Extracting goals with AI...")
                    : isGoalSuccess
                      ? (isRTL ? "اهداف آزمون با موفقیت بر اساس فایل تنظیم شد" : "Goals extracted successfully from file")
                      : (isRTL ? "تولید هوشمند اهداف از فایل مرجع با هوش مصنوعی" : "Auto-generate goals from reference file via AI")}
                </span>
                {rawFiles.length > 0 && !isGeneratingGoals && (
                  <span className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500 max-w-xs truncate">
                    {rawFiles[0].name}
                  </span>
                )}
              </div>
            </div>

            {/* Error or Warning Notice Alert (only if not success) */}
            {goalAiNotice.message && goalAiNotice.type !== "success" && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 animate-in fade-in ${
                  goalAiNotice.type === "error"
                    ? "bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{goalAiNotice.message}</span>
              </div>
            )}

            {/* ========================================================
                LOADING SKELETON: Displayed during AI Goal Extraction
                ======================================================== */}
            {isGeneratingGoals ? (
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-[#2481cc]/25 text-xs text-[#2481cc] dark:text-[#52a2f6]">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#2481cc]" />
                  <span className="font-semibold">
                    {isRTL
                      ? "هوش مصنوعی در حال تحلیل عمیق محتوا و تدوین اهداف یادگیری بلوم است..."
                      : "AI is analyzing document contents and formulating Bloom learning goals..."}
                  </span>
                </div>

                {Array.from({ length: Math.min(3, Math.max(2, goalCount)) }).map((_, sIdx) => (
                  <div
                    key={`skeleton-goal-${sIdx}`}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 flex flex-col gap-3 shadow-2xs animate-pulse"
                  >
                    {/* Header + Title input skeleton */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                          <div className="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                        </div>
                        <div className="h-3 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                      </div>
                      <div className="h-9 w-full bg-neutral-100 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-800" />
                    </div>

                    {/* Goal Type buttons skeleton */}
                    <div className="flex flex-col gap-2">
                      <div className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-7 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg" />
                        <div className="h-7 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg" />
                        <div className="h-7 bg-neutral-100 dark:bg-neutral-800/60 rounded-lg" />
                      </div>
                    </div>

                    {/* Bloom Taxonomy slider skeleton */}
                    <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-36 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                        <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                      </div>
                      <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-lg my-1" />
                      <div className="flex justify-between items-center px-1">
                        {Array.from({ length: 6 }).map((_, bIdx) => (
                          <div
                            key={bIdx}
                            className="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800"
                          />
                        ))}
                      </div>
                      <div className="h-8 w-full bg-neutral-100 dark:bg-neutral-800/40 rounded-lg mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ========================================================
                 ACTUAL GOAL CARDS
                 ======================================================== */
              <>
                <span className="text-[11px] font-semibold text-[#2481cc] dark:text-[#52a2f6] pt-1">
                  {isRTL
                    ? `تعریف و تنظیمات ${toPersianDigits(goalCount)} هدف آزمون (سطح تسلط بلوم و نوع ارزیابی):`
                    : `Define details for ${goalCount} goals (Bloom depth & goal type):`}
                </span>

                {Array.from({ length: goalCount }).map((_, idx) => {
                  const currentGoal =
                    typeof goals[idx] === "object" && goals[idx] !== null
                      ? goals[idx]
                      : { title: String(goals[idx] || ""), goal_type: "theoretical", bloom_level: 2 };
                  const currentBloomLevel = currentGoal.bloom_level || 2;
                  const currentBloomObj =
                    BLOOM_LEVELS.find((b) => b.level === currentBloomLevel) || BLOOM_LEVELS[1];

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 flex flex-col gap-3 shadow-2xs"
                    >
                      {/* Goal Header & Title Input */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#2481cc] text-white flex items-center justify-center text-[10px] font-bold">
                              {toPersianDigits(idx + 1)}
                            </span>
                            <span>
                              {isRTL
                                ? `عنوان هدف شماره ${toPersianDigits(idx + 1)}:`
                                : `Goal ${idx + 1} Title:`}
                            </span>
                          </label>

                          {goalCount > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = goals.filter((_, i) => i !== idx);
                                setGoals(next);
                                setGoalCount(next.length);
                              }}
                              className="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              title={isRTL ? "حذف این هدف" : "Remove goal"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={currentGoal.title || ""}
                          onChange={(e) =>
                            handleGoalFieldChange(idx, "title", e.target.value)
                          }
                          placeholder={
                            isRTL
                              ? `مثال: مفاهیم چندنخی (Multithreading) و همگام‌سازی پروسس‌ها...`
                              : `e.g. Multithreading concepts and process synchronization...`
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-scale50 dark:bg-neutral-scale1200/50 border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#2481cc]"
                        />
                      </div>

                      {/* Goal Type Selector */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                          {isRTL ? "نوع هدف (Goal Type):" : "Goal Type:"}
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {GOAL_TYPES.map((gt) => {
                            const isSelected =
                              (currentGoal.goal_type || "theoretical") === gt.id;
                            return (
                              <button
                                key={gt.id}
                                type="button"
                                onClick={() =>
                                  handleGoalFieldChange(idx, "goal_type", gt.id)
                                }
                                className={`py-1.5 px-2 text-[10.5px] font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? "bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] border-[#2481cc]/50 shadow-2xs"
                                    : "bg-neutral-50 dark:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                                }`}
                              >
                                {gt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bloom Learning Level Stepped Slider */}
                      <div className="flex flex-col gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                            {isRTL
                              ? "سطح یادگیری مورد انتظار (تاکسونومی بلوم):"
                              : "Expected Learning Depth (Bloom):"}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2481cc]/10 dark:bg-[#52a2f6]/15 text-[#2481cc] dark:text-[#52a2f6] border border-[#2481cc]/25">
                            {isRTL
                              ? `سطح ${toPersianDigits(currentBloomLevel)}: ${currentBloomObj.name}`
                              : `Level ${currentBloomLevel}: ${currentBloomObj.name}`}
                          </span>
                        </div>

                        {/* Stepped Range Control */}
                        <div className="flex flex-col gap-1 px-1">
                          <input
                            type="range"
                            min="1"
                            max="6"
                            step="1"
                            value={currentBloomLevel}
                            onChange={(e) =>
                              handleGoalFieldChange(
                                idx,
                                "bloom_level",
                                parseInt(e.target.value, 10),
                              )
                            }
                            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#2481cc]"
                          />

                          {/* Step Labels */}
                          <div className="flex justify-between items-center mt-1 px-0.5">
                            {BLOOM_LEVELS.map((bl) => {
                              const isActive = bl.level <= currentBloomLevel;
                              const isCurrent = bl.level === currentBloomLevel;
                              return (
                                <div
                                  key={bl.level}
                                  onClick={() =>
                                    handleGoalFieldChange(idx, "bloom_level", bl.level)
                                  }
                                  className="flex flex-col items-center gap-0.5 cursor-pointer group"
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold transition-all ${
                                      isCurrent
                                        ? "bg-[#2481cc] text-white scale-110 shadow-xs"
                                        : isActive
                                          ? "bg-[#2481cc]/60 text-white"
                                          : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                                    }`}
                                  >
                                    {toPersianDigits(bl.level)}
                                  </div>
                                  <span
                                    className={`text-[8.5px] font-medium transition-colors hidden sm:block ${
                                      isCurrent
                                        ? "text-[#2481cc] dark:text-[#52a2f6] font-bold"
                                        : "text-neutral-400 group-hover:text-neutral-600"
                                    }`}
                                  >
                                    {bl.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Level Description Info Box */}
                          <div className="mt-2 p-2 rounded-lg bg-[#f8fafc] dark:bg-[#15202b] border border-neutral-scale200 dark:border-neutral-scale1100 text-[10px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                            <span className="font-bold text-[#2481cc] dark:text-[#52a2f6] ml-1">
                              {isRTL ? "شاخص سنجش:" : "Criteria:"}
                            </span>
                            {currentBloomObj.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          ITEM 5: تاریخ، زمان شروع و پایان هوشمند با گپ ۵ دقیقه‌ای (EXTENDABLE)
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
            <div className="flex flex-col gap-1">
              <span className="text-s font-bold text-neutral-scale1600 dark:text-neutral-scale100 ">
                {isRTL ? "زمان‌بندی و برگزاری آزمون" : "Date & Time Scheduling"}
              </span>
              <span className="text-[10px] text-neutral-400 ">
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
            <div className="flex flex-col gap-1 pt-1 ">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300  flex items-center gap-1.5">
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
                  className="w-full pr-3 pl-10 py-2 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 group-hover:border-[#2481cc] text-neutral-900 dark:text-neutral-100 text-xs  font-semibold focus:outline-none focus:ring-1 focus:ring-[#2481cc] cursor-pointer transition-colors"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDatePickerOpen(true);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-[#2481cc] dark:group-hover:text-[#52a2f6] transition-colors cursor-pointer p-1"
                  title={
                    isRTL ? "باز کردن تقویم انتخاب تاریخ" : "Open Calendar"
                  }
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Start and End Time Selection (opens ClockPickerModal like calendar) */}
            <div className="grid grid-cols-2 gap-2.5 ">
              {/* Start Time Field */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300  flex items-center gap-1.5">
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
                    className="w-full pr-3 pl-9 py-2 rounded-xl bg-white dark:bg-[#121c27] border border-neutral-scale300 dark:border-neutral-scale1000 group-hover:border-primery-700 text-neutral-900 dark:text-neutral-100 text-xs  font-bold focus:outline-none focus:ring-1 focus:ring-primery-700 cursor-pointer transition-colors text-center"
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
                  <span className="text-neutral-400 ">
                    {isRTL ? "کلیک جهت باز کردن ساعت" : "Click to set time"}
                  </span>
                </div>
              </div>

              {/* End Time Field */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300  flex items-center gap-1.5">
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
                    } text-xs  font-bold focus:outline-none focus:ring-1 focus:ring-primery-700 cursor-pointer transition-colors text-center`}
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
                  <span className="text-neutral-400 ">
                    {isRTL
                      ? `حداقل مجاز: ${minCalculatedEndTime}`
                      : `Min: ${minCalculatedEndTime}`}
                  </span>
                </div>
              </div>
            </div>

            {timeError && (
              <span className="text-[10px] text-red-500  flex items-center gap-1">
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
          className="flex-1 py-3 px-4 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-700 dark:text-neutral-300  text-s font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center"
        >
          {isRTL ? "انصراف" : "Cancel"}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting || !examTitle.trim() || selectedStudentIds.length === 0
          }
          className="flex-[2] py-3 px-4 rounded-xl bg-[#2481cc] hover:bg-[#1b70b5] dark:bg-[#52a2f6] dark:hover:bg-[#3d91ea] text-white  text-s font-bold transition-all shadow-md shadow-[#2481cc]/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {isRTL ? "در حال ایجاد آزمون..." : "Creating exam..."}
              </span>
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
