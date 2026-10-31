import { useEffect, useState, useContext, useCallback } from "react";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
import { biometricsApi } from "@/api/new/biometrics.api";
import { studentsApi } from "@/api/new/students.api";
import {
  X,
  Users,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Search,
  MessageSquare,
  Bot,
  User,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
  Camera,
  ZoomIn,
  EyeOff,
  UserX,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import "@/styles/fonts.css";
import { getTodayJalaliDate } from "@/utils/dateUtils";

const toPersianDigits = (num) => {
  if (num === null || num === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

const buildFallbackResults = (exam, isRTL, courseStudents = []) => {
  const durMins = Number(exam?.duration_minutes) || 10;
  const gapMins = Number(exam?.gap_minutes) || 5;
  const timeStr = exam?.time || "10:00 - 11:30";
  let startTime = "10:00";
  let endTime = "11:30";
  if (typeof timeStr === "string" && timeStr.includes("-")) {
    const parts = timeStr.split("-").map((p) => p.trim());
    if (parts[0]) startTime = parts[0];
    if (parts[1]) endTime = parts[1];
  }

  const rawStudentIds = Array.isArray(exam?.student_ids) ? exam.student_ids : [];

  const studentList =
    rawStudentIds.length > 0
      ? rawStudentIds
      : courseStudents.length > 0
      ? courseStudents.map((s) => s.id)
      : [];

  const [sH, sM] = startTime.split(":").map(Number);
  let curMinute = (sH || 10) * 60 + (sM || 0);

  const fallbackStudents = studentList.map((sid) => {
    const sIdStr = String(sid);
    const matchedProfile = courseStudents.find((cs) => String(cs.id) === sIdStr);
    const slotStartMin = curMinute;
    const slotEndMin = curMinute + durMins;
    curMinute = slotEndMin + gapMins;

    const formatTime = (totalMin) => {
      const h = Math.floor(totalMin / 60) % 24;
      const m = totalMin % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const studentName =
      matchedProfile?.name ||
      matchedProfile?.student_name ||
      (isRTL ? `دانشجو ${sIdStr.slice(-4)}` : `Student ${sIdStr.slice(-4)}`);

    return {
      student_id: sIdStr,
      student_name: studentName,
      username: matchedProfile?.username || sIdStr,
      profile_url: matchedProfile?.avatar || matchedProfile?.profile_url || null,
      status: "assigned",
      score: null,
      passed: null,
      slot_start: formatTime(slotStartMin),
      slot_end: formatTime(slotEndMin),
      session_id: null,
      turns_count: 0,
      strikes: 0,
    };
  });

  return {
    assignment_id:
      exam?.id ||
      exam?.quiz_id ||
      exam?.assignment_id ||
      exam?.quizId ||
      exam?.assignmentId ||
      "assignment",
    title: exam?.title || (isRTL ? "نتایج آزمون" : "Exam Results"),
    course: exam?.course || "سیستم عامل",
    date: exam?.date || exam?.exam_date || getTodayJalaliDate(),
    window_start: startTime,
    window_end: endTime,
    duration_minutes: durMins,
    gap_minutes: gapMins,
    total_students: fallbackStudents.length,
    completed_students: 0,
    average_score: null,
    pass_rate: null,
    students: fallbackStudents,
  };
};

export const TeacherExamResultsModal = ({ isOpen, onClose, exam }) => {
  const { isRTL } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "completed", "in_progress", "not_started"

  // Selected student session for inspecting conversation transcript & proctoring evidence
  const [selectedSessionStudent, setSelectedSessionStudent] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const assignmentId =
    exam?.id ||
    exam?.quiz_id ||
    exam?.assignment_id ||
    exam?.quizId ||
    exam?.assignmentId ||
    exam?.raw?.quiz_id ||
    exam?.raw?.id;

  const loadResults = useCallback(async () => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    setSelectedSessionStudent(null);
    setSessionDetail(null);
    setPreviewImage(null);

    // Fetch course students in parallel for name and profile resolution
    let courseStudents = [];
    try {
      const courseId =
        exam?.course_id ||
        exam?.lesson_id ||
        "c0000000-0000-4000-8000-000000000001";
      courseStudents = await studentsApi.getStudentsByCourse(courseId);
    } catch (e) {
      console.warn("Could not load course students for results resolution:", e);
    }

    if (!assignmentId) {
      if (exam) {
        setResultsData(buildFallbackResults(exam, isRTL, courseStudents));
      } else {
        setError(isRTL ? "شناسه آزمون معتبر نمی‌باشد." : "Exam ID is missing.");
      }
      setLoading(false);
      return;
    }

    try {
      const data = await examsApi.getExamResults(assignmentId);
      if (data && (Array.isArray(data.students) || data.title || data.assignment_id)) {
        const enrichedStudents = (data.students || []).map((s) => {
          const match = courseStudents.find(
            (cs) => String(cs.id) === String(s.student_id)
          );
          return {
            ...s,
            student_name:
              s.student_name &&
              !s.student_name.startsWith("دانشجو ") &&
              !s.student_name.startsWith("Student ")
                ? s.student_name
                : match?.name ||
                  match?.student_name ||
                  s.student_name ||
                  (isRTL
                    ? `دانشجو ${String(s.student_id).slice(-4)}`
                    : `Student ${String(s.student_id).slice(-4)}`),
            profile_url:
              s.profile_url || match?.avatar || match?.profile_url || null,
          };
        });
        setResultsData({ ...data, students: enrichedStudents });
      } else {
        setResultsData(buildFallbackResults(exam, isRTL, courseStudents));
      }
    } catch (err) {
      console.warn(
        "Backend getExamResults failed, falling back to local exam data:",
        err
      );
      if (exam) {
        setResultsData(buildFallbackResults(exam, isRTL, courseStudents));
      } else {
        setError(
          isRTL
            ? "دریافت نتایج آزمون با خطا مواجه شد."
            : "Failed to load exam results."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [isOpen, assignmentId, exam, isRTL]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      loadResults();
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, loadResults]);

  const handleOpenStudentDetail = async (student) => {
    if (!student.session_id) return;
    setSelectedSessionStudent(student);
    setLoadingSession(true);
    setSessionDetail(null);
    setPreviewImage(null);

    try {
      const detail = await examsApi.getSessionDetail(assignmentId, student.session_id);
      let incidents = detail?.incidents || [];
      if (!Array.isArray(incidents) || incidents.length === 0) {
        try {
          const incRes = await biometricsApi.getExamIncidents(student.session_id);
          if (incRes?.incidents?.length > 0) {
            incidents = incRes.incidents;
          }
        } catch (e) {
          console.warn("Failed to fetch incidents fallback:", e);
        }
      }
      setSessionDetail({ ...detail, incidents });
    } catch (err) {
      console.error("Failed to load session detail:", err);
    } finally {
      setLoadingSession(false);
    }
  };

  if (!isOpen) return null;

  const students = resultsData?.students || [];

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.student_name && s.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.username && s.username.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "completed") {
      return s.status === "completed" || s.score !== null;
    }
    if (statusFilter === "in_progress") {
      return s.status === "started" || s.status === "active";
    }
    if (statusFilter === "not_started") {
      return s.status === "assigned" || (!s.score && s.status !== "completed");
    }
    return true;
  });

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-text animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 w-full max-w-xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="p-4 bg-primery-700 dark:bg-neutral-scale1200 text-white flex items-center justify-between border-b dark:border-neutral-scale1000 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-neutral-scale70" />
            </div>
            <div className="min-w-0">
              <h2 className="font-vazir font-bold text-sm text-neutral-scale70 truncate">
                {resultsData?.title || exam?.title || (isRTL ? "نتایج آزمون" : "Exam Results")}
              </h2>
              <span className="font-vazir text-[11px] text-neutral-scale200 block truncate">
                {resultsData?.course || "سیستم عامل"} • {resultsData?.date || exam?.date || getTodayJalaliDate()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isRTL ? "بستن" : "Close"}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 text-neutral-scale70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primery-700 dark:text-primery-400 animate-spin" />
              <p className="font-vazir text-xs text-neutral-scale1100 dark:text-neutral-scale400">
                {isRTL ? "در حال دریافت نتایج و آمار آزمون..." : "Loading results..."}
              </p>
            </div>
          ) : error && !resultsData ? (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-xs font-vazir text-red-600 dark:text-red-400 flex flex-col items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span>{error}</span>
              <button
                type="button"
                onClick={loadResults}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isRTL ? "تلاش مجدد" : "Try Again"}</span>
              </button>
            </div>
          ) : selectedSessionStudent ? (
            /* ================= Student Session Transcript View ================= */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-scale200 dark:border-neutral-scale1100">
                <button
                  type="button"
                  onClick={() => setSelectedSessionStudent(null)}
                  className="flex items-center gap-1 text-xs font-vazir text-primery-700 dark:text-primery-300 font-semibold cursor-pointer hover:underline"
                >
                  {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  <span>{isRTL ? "بازگشت به فهرست دانشجویان" : "Back to Student Roster"}</span>
                </button>

                <span className="font-vazir text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                  {selectedSessionStudent.student_name}
                </span>
              </div>

              {loadingSession ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-primery-700 dark:text-primery-400 animate-spin" />
                  <span className="font-vazir text-xs text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "در حال دریافت متن مصاحبه..." : "Loading transcript..."}
                  </span>
                </div>
              ) : sessionDetail ? (
                <div className="space-y-3">
                  {/* Student Score Summary */}
                  <div className="bg-primery-50 dark:bg-neutral-scale1200 rounded-xl p-3 border border-primery-200 dark:border-neutral-scale1000 flex items-center justify-between">
                    <div>
                      <span className="font-vazir text-[11px] text-neutral-scale1000 dark:text-neutral-scale400 block">
                        {isRTL ? "نمره ارزیابی نهایی" : "Final Score"}
                      </span>
                      <span className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-lg text-primery-800 dark:text-primery-200`}>
                        {sessionDetail.score !== null ? (isRTL ? `${toPersianDigits(sessionDetail.score)}٪` : `${sessionDetail.score}%`) : "—"}
                      </span>
                    </div>

                    <div className="text-left">
                      <span
                        className={`text-xs font-vazir font-bold px-2.5 py-1 rounded-lg ${
                          sessionDetail.passed
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {sessionDetail.passed
                          ? isRTL
                            ? "قبول شده"
                            : "Passed"
                          : isRTL
                          ? "نیاز به تلاش"
                          : "Needs Review"}
                      </span>
                    </div>
                  </div>

                  {/* Proctoring Evidence & Violation Snapshots */}
                  <div className="bg-neutral-scale50 dark:bg-neutral-scale1200 rounded-xl p-3 border border-neutral-scale200 dark:border-neutral-scale1000 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-vazir text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale80 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-primery-700 dark:text-primery-300" />
                        {isRTL ? "مستندات نظارت تصویری و تخلفات (وبکم)" : "Proctoring Evidence & Photos"}
                      </span>
                      {Array.isArray(sessionDetail.incidents) && sessionDetail.incidents.length > 0 ? (
                        <span className="font-vazir text-[11px] font-bold text-rose-500 bg-rose-500/10 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-500/20">
                          {isRTL ? `${toPersianDigits(sessionDetail.incidents.length)} اخطار ثبت‌شده` : `${sessionDetail.incidents.length} Strikes`}
                        </span>
                      ) : (
                        <span className="font-vazir text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isRTL ? "بدون تخلف (تأیید کامل)" : "Clean Session"}
                        </span>
                      )}
                    </div>

                    {Array.isArray(sessionDetail.incidents) && sessionDetail.incidents.length > 0 ? (
                      <div className="space-y-2">
                        {sessionDetail.incidents.length >= 3 && (
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-vazir text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-semibold">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                              {isRTL
                                ? "دانشجو به دلیل دریافت ۳ اخطار تخلف از آزمون اخراج و جلسه با نمره صفر ابطال گردید."
                                : "Student was disqualified and ejected due to 3 proctoring strikes."}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {sessionDetail.incidents.map((inc, iIdx) => (
                            <div
                              key={iIdx}
                              className="bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl overflow-hidden flex flex-col group hover:border-rose-400 transition-all shadow-xs"
                            >
                              {/* Thumbnail with zoom trigger */}
                              <div
                                onClick={() => inc.image_url && setPreviewImage(inc)}
                                className={`relative w-full h-24 bg-black/80 flex items-center justify-center overflow-hidden ${
                                  inc.image_url ? "cursor-pointer" : ""
                                }`}
                              >
                                {inc.image_url ? (
                                  <>
                                    <img
                                      src={inc.image_url}
                                      alt={`Strike ${inc.strike_number || iIdx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <ZoomIn className="w-5 h-5 drop-shadow" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-slate-500 gap-1">
                                    <Camera className="w-6 h-6" />
                                    <span className="font-vazir text-[9px]">{isRTL ? "تصویر ثبت نشده" : "No image"}</span>
                                  </div>
                                )}
                                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-vazir text-[9px] font-bold shadow">
                                  {isRTL ? `اخطار ${toPersianDigits(inc.strike_number || iIdx + 1)}` : `Strike ${inc.strike_number || iIdx + 1}`}
                                </div>
                              </div>

                              {/* Incident Meta */}
                              <div className="p-2 flex flex-col gap-1 text-[11px] font-vazir">
                                <div className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 truncate">
                                  {inc.violation_type === "multiple_faces" ? (
                                    <>
                                      <Users className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{isRTL ? "بیش از ۱ چهره" : "Multiple Faces"}</span>
                                    </>
                                  ) : inc.violation_type === "no_face" ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{isRTL ? "عدم حضور چهره" : "No Face"}</span>
                                    </>
                                  ) : inc.violation_type === "gaze_out_of_bounds" ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{isRTL ? "انحراف دید" : "Looking Away"}</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">{isRTL ? "عدم انطباق چهره" : "Face Mismatch"}</span>
                                    </>
                                  )}
                                </div>

                                {inc.notes && (
                                  <p className="text-[10px] text-neutral-scale1000 dark:text-neutral-scale400 line-clamp-2 leading-relaxed">
                                    {inc.notes}
                                  </p>
                                )}

                                <span className="font-mono text-[9px] text-neutral-scale900 dark:text-neutral-scale500 mt-0.5">
                                  {inc.created_at
                                    ? new Date(inc.created_at).toLocaleTimeString(isRTL ? "fa-IR" : "en-US")
                                    : inc.timestamp || ""}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-vazir text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {isRTL
                            ? "هیچ تخلفی در طول این آزمون ثبت نشده است. حضور پیوسته، عدم حضور افراد دیگر و انطباق هویت دانشجو تأیید شده است."
                            : "Clean session. Full attendance, solo presence, and biometric verification confirmed."}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Turns list */}
                  <div className="space-y-2">
                    <span className="font-vazir text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale80 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-primery-700 dark:text-primery-300" />
                      {isRTL ? "متن سوالات و پاسخ‌های شفاهی" : "Oral Dialogue Transcript"}
                    </span>

                    {Array.isArray(sessionDetail.turns) && sessionDetail.turns.length > 0 ? (
                      sessionDetail.turns.map((turn, tIdx) => (
                        <div
                          key={tIdx}
                          className="bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl p-3 space-y-2 text-xs font-vazir"
                        >
                          <div className="flex items-start gap-2">
                            <Bot className="w-4 h-4 text-primery-700 dark:text-primery-300 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-primery-700 dark:text-primery-300 block mb-0.5">
                                {isRTL ? `پرسش ${toPersianDigits(tIdx + 1)}:` : `Question ${tIdx + 1}:`}
                              </span>
                              <p className="text-[11px] text-neutral-scale1800 dark:text-neutral-scale80 leading-relaxed font-medium">
                                {turn.question}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                {isRTL ? "پاسخ دانشجو:" : "Student Answer:"}
                              </span>
                              <p className="text-[11px] text-neutral-scale1800 dark:text-neutral-scale80 leading-relaxed bg-white dark:bg-neutral-scale1300 p-2 rounded-lg border border-neutral-scale200 dark:border-neutral-scale1000">
                                {turn.answer || (isRTL ? "پاسخی ثبت نشد." : "No answer.")}
                              </p>
                            </div>
                          </div>

                          {turn.feedback && (
                            <div className="flex items-start gap-2 bg-primery-50/70 dark:bg-neutral-scale1300/60 p-2 rounded-lg border border-primery-100 dark:border-neutral-scale1000">
                              <Sparkles className="w-3.5 h-3.5 text-primery-700 dark:text-primery-300 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-[10px] font-bold text-primery-700 dark:text-primery-300 block mb-0.5">
                                  {isRTL ? "ارزیابی هوش مصنوعی:" : "AI Evaluation:"}
                                </span>
                                <p className="text-[11px] text-neutral-scale1800 dark:text-neutral-scale80 leading-relaxed">
                                  {turn.feedback}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-neutral-scale900 dark:text-neutral-scale400 text-xs font-vazir">
                        {isRTL ? "پرسشی برای این دانشجو ثبت نشده است." : "No questions recorded."}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-xs font-vazir text-neutral-scale1000 dark:text-neutral-scale400">
                  <AlertCircle className="w-6 h-6 text-neutral-scale800 dark:text-neutral-scale500" />
                  <span>
                    {isRTL
                      ? "اطلاعات جلسه این دانشجو در دسترس نیست یا دانشجو هنوز وارد آزمون نشده است."
                      : "Student session details are not available or student has not entered the exam yet."}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* ================= Overall Stats & Students Roster View ================= */
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-primery-50/60 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-primery-200/60 dark:border-neutral-scale1000 flex flex-col items-center text-center">
                  <Users className="w-4 h-4 text-primery-700 dark:text-primery-300 mb-1" />
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "کل دانشجویان" : "Total Students"}
                  </span>
                  <span className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5`}>
                    {isRTL ? toPersianDigits(resultsData?.total_students ?? 0) : (resultsData?.total_students ?? 0)}
                  </span>
                </div>

                <div className="bg-emerald-50/60 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-emerald-200/60 dark:border-neutral-scale1000 flex flex-col items-center text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "تکمیل کرده‌ها" : "Completed"}
                  </span>
                  <span className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5`}>
                    {isRTL ? toPersianDigits(resultsData?.completed_students ?? 0) : (resultsData?.completed_students ?? 0)}
                  </span>
                </div>

                <div className="bg-primery-50/60 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-primery-200/60 dark:border-neutral-scale1000 flex flex-col items-center text-center">
                  <Award className="w-4 h-4 text-primery-700 dark:text-primery-300 mb-1" />
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "میانگین نمرات" : "Avg Score"}
                  </span>
                  <span className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5`}>
                    {resultsData?.average_score !== null && resultsData?.average_score !== undefined
                      ? isRTL ? `${toPersianDigits(resultsData.average_score)}٪` : `${resultsData.average_score}%`
                      : "—"}
                  </span>
                </div>

                <div className="bg-purple-50/60 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-purple-200/60 dark:border-neutral-scale1000 flex flex-col items-center text-center">
                  <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "درصد قبولی" : "Pass Rate"}
                  </span>
                  <span className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5`}>
                    {resultsData?.pass_rate !== null && resultsData?.pass_rate !== undefined
                      ? isRTL ? `${toPersianDigits(resultsData.pass_rate)}٪` : `${resultsData.pass_rate}%`
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="space-y-2">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute top-2.5 right-3 text-neutral-scale900 dark:text-neutral-scale400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRTL ? "جستجوی دانشجو یا شماره دانشجویی..." : "Search student..."}
                    className="w-full h-9 pr-9 pl-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 focus:outline-none focus:border-primery-700"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-vazir no-scrollbar">
                  {[
                    { id: "all", label: isRTL ? "همه" : "All" },
                    { id: "completed", label: isRTL ? "تکمیل شده" : "Completed" },
                    { id: "in_progress", label: isRTL ? "در حال آزمون" : "In Progress" },
                    { id: "not_started", label: isRTL ? "منتظر نوبت" : "Pending" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                        statusFilter === tab.id
                          ? "bg-primery-700 text-white shadow-xs"
                          : "bg-neutral-scale100 dark:bg-neutral-scale1200 text-neutral-scale1100 dark:text-neutral-scale400 hover:bg-neutral-scale200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Students List */}
              <div className="space-y-2">
                <span className="font-vazir text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale80 block">
                  {isRTL ? "فهرست نمرات و وضعیت دانشجویان" : "Student Scores & Attendance"}
                </span>

                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s, idx) => (
                    <div
                      key={s.student_id || idx}
                      className="bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl p-3 flex flex-col gap-2 transition-all hover:border-neutral-scale400 dark:hover:border-neutral-scale800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primery-100 dark:bg-primery-900 text-primery-800 dark:text-primery-200 font-vazir font-bold text-xs flex items-center justify-center shrink-0">
                            {s.student_name ? s.student_name.slice(0, 1) : "د"}
                          </div>
                          <div className="min-w-0">
                            <span className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale80 block truncate">
                              {s.student_name}
                            </span>
                            {s.slot_start && (
                              <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400 flex items-center gap-1">
                                <Clock3 className="w-3 h-3" />
                                {s.slot_start} - {s.slot_end}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score & Status */}
                        <div className="flex items-center gap-2 shrink-0">
                          {s.score !== null ? (
                            <div className="flex items-center gap-1.5">
                              {s.strikes > 0 && (
                                <span className="font-vazir text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                  {isRTL ? `${toPersianDigits(s.strikes)} اخطار` : `${s.strikes} strikes`}
                                </span>
                              )}
                              <span className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-sm text-primery-800 dark:text-primery-200 bg-primery-100/60 dark:bg-primery-900/40 px-2 py-0.5 rounded-md`}>
                                {isRTL ? `${toPersianDigits(s.score)}٪` : `${s.score}%`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-vazir text-neutral-scale900 dark:text-neutral-scale400">
                              {s.status === "started" || s.status === "active"
                                ? isRTL
                                ? "در حال آزمون"
                                : "In progress"
                                : isRTL
                                ? "شرکت نکرده"
                                : "Not started"}
                            </span>
                          )}

                          {s.passed !== null && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                s.passed ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              title={s.passed ? "قبول" : "نیاز به تلاش"}
                            />
                          )}
                        </div>
                      </div>

                      {/* Inspect Turns Button */}
                      {s.session_id && (
                        <div className="pt-1.5 border-t border-neutral-scale200 dark:border-neutral-scale1000 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenStudentDetail(s)}
                            className="flex items-center gap-1.5 text-[11px] font-vazir text-primery-700 dark:text-primery-300 font-semibold hover:underline cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>
                              {isRTL
                                ? `مشاهده متن و مستندات آزمون (${toPersianDigits(s.turns_count)} سوال)`
                                : `View Interview & Evidence (${s.turns_count} turns)`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-neutral-scale900 dark:text-neutral-scale400 font-vazir text-xs">
                    {isRTL ? "دانشجویی با این مشخصات یافت نشد." : "No students found."}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Proctoring Evidence Full-Size Lightbox Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-3.5 bg-slate-800/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-sky-400" />
                <span className="font-vazir font-bold text-xs text-white">
                  {isRTL
                    ? `مستند تصویری اخطار ${toPersianDigits(previewImage.strike_number || 1)}`
                    : `Strike ${previewImage.strike_number || 1} Evidence`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-black flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={previewImage.image_url}
                alt="Incident Snapshot"
                className="max-h-[55vh] w-auto object-contain rounded-lg border border-white/10 shadow"
              />
            </div>

            <div className="p-3.5 bg-slate-900 space-y-2 border-t border-white/10 text-xs font-vazir text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  {previewImage.violation_type === "multiple_faces"
                    ? (isRTL ? "حضور بیش از یک نفر در کادر دوربین" : "Multiple Faces")
                    : previewImage.violation_type === "no_face"
                    ? (isRTL ? "عدم حضور چهره در کادر تصویر" : "No Face Detected")
                    : previewImage.violation_type === "gaze_out_of_bounds"
                    ? (isRTL ? "انحراف دید از صفحه آزمون" : "Gaze Out of Bounds")
                    : (isRTL ? "عدم انطباق چهره با هویت دانشجو" : "Face Mismatch")}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {previewImage.created_at
                    ? new Date(previewImage.created_at).toLocaleTimeString(isRTL ? "fa-IR" : "en-US")
                    : previewImage.timestamp || ""}
                </span>
              </div>
              {previewImage.notes && (
                <p className="text-[11px] text-slate-400 leading-relaxed bg-white/5 p-2 rounded-lg">
                  {previewImage.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExamResultsModal;
