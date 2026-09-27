import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
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
  Calendar,
  BookOpen,
} from "lucide-react";
import "@/styles/fonts.css";

const toPersianDigits = (num) => {
  if (num === null || num === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export const TeacherExamResultsModal = ({ isOpen, onClose, exam }) => {
  const { isRTL } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "completed", "in_progress", "not_started"

  // Selected student session for inspecting conversation transcript
  const [selectedSessionStudent, setSelectedSessionStudent] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);

  const assignmentId = exam?.id || exam?.quiz_id || exam?.assignment_id;

  useEffect(() => {
    if (!isOpen || !assignmentId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSelectedSessionStudent(null);
    setSessionDetail(null);

    examsApi
      .getExamResults(assignmentId)
      .then((data) => {
        if (isMounted) {
          setResultsData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load teacher exam results:", err);
        if (isMounted) {
          setError(
            isRTL
              ? "دریافت نتایج آزمون با خطا مواجه شد."
              : "Failed to load exam results."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, assignmentId, isRTL]);

  const handleOpenStudentDetail = async (student) => {
    if (!student.session_id) return;
    setSelectedSessionStudent(student);
    setLoadingSession(true);
    setSessionDetail(null);

    try {
      const detail = await examsApi.getSessionDetail(assignmentId, student.session_id);
      setSessionDetail(detail);
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
      <div className="bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 w-full max-w-lg max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
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
                {resultsData?.course || "سیستم عامل"} • {resultsData?.date || exam?.date || "1405/07/20"}
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
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-xs font-vazir text-red-600 dark:text-red-400 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <span>{error}</span>
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
                      <span className="font-inter font-bold text-lg text-primery-800 dark:text-primery-200">
                        {sessionDetail.score !== null ? `${toPersianDigits(sessionDetail.score)}٪` : "—"}
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
              ) : null}
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
                  <span className="font-inter font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5">
                    {toPersianDigits(resultsData?.total_students ?? 0)}
                  </span>
                </div>

                <div className="bg-emerald-50/60 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-emerald-200/60 dark:border-neutral-scale1000 flex flex-col items-center text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "تکمیل کرده‌ها" : "Completed"}
                  </span>
                  <span className="font-inter font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5">
                    {toPersianDigits(resultsData?.completed_students ?? 0)}
                  </span>
                </div>

                <div className="bg-primery-50/60 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-primery-200/60 dark:border-neutral-scale1000 flex flex-col items-center text-center">
                  <Award className="w-4 h-4 text-primery-700 dark:text-primery-300 mb-1" />
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "میانگین نمرات" : "Avg Score"}
                  </span>
                  <span className="font-inter font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5">
                    {resultsData?.average_score !== null && resultsData?.average_score !== undefined
                      ? `${toPersianDigits(resultsData.average_score)}٪`
                      : "—"}
                  </span>
                </div>

                <div className="bg-purple-50/60 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-purple-200/60 dark:border-neutral-scale1000 flex flex-col items-center text-center">
                  <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "درصد قبولی" : "Pass Rate"}
                  </span>
                  <span className="font-inter font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5">
                    {resultsData?.pass_rate !== null && resultsData?.pass_rate !== undefined
                      ? `${toPersianDigits(resultsData.pass_rate)}٪`
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
                            <span className="font-inter font-bold text-sm text-primery-800 dark:text-primery-200 bg-primery-100/60 dark:bg-primery-900/40 px-2 py-0.5 rounded-md">
                              {toPersianDigits(s.score)}٪
                            </span>
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
                                ? `مشاهده متن آزمون (${toPersianDigits(s.turns_count)} سوال)`
                                : `View Interview (${s.turns_count} turns)`}
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
    </div>
  );
};

export default TeacherExamResultsModal;
