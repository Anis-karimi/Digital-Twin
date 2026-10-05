import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Clock3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  BarChart3,
  Loader2,
  Lightbulb,
  MessageSquare,
  User,
  Bot,
} from "lucide-react";
import "@/styles/fonts.css";

const toPersianDigits = (num) => {
  if (num === null || num === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export const StudentExamResultPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const examFromState = location.state?.exam || null;
  const assignmentId = id || examFromState?.assignment_id || examFromState?.id;
  const sessionId = examFromState?.session_id || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [expandedTurn, setExpandedTurn] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        let targetSessionId = sessionId;

        // If session_id is not directly in state, look up from student exams
        if (!targetSessionId && assignmentId) {
          try {
            const myExams = await examsApi.getMyStudentExams();
            const matching = (myExams || []).find(
              (e) => String(e.assignment_id || e.id) === String(assignmentId)
            );
            if (matching?.session_id) {
              targetSessionId = matching.session_id;
            }
          } catch (e) {
            console.warn("Could not find session ID in my-exams:", e);
          }
        }

        if (assignmentId && targetSessionId) {
          const res = await examsApi.getSessionDetail(assignmentId, targetSessionId);
          if (isMounted) {
            setReport(res);
          }
        } else if (examFromState) {
          // Fallback minimal display if session is missing
          if (isMounted) {
            setReport({
              exam_title: examFromState.title || "آزمون شفاهی",
              course: examFromState.course || "سیستم عامل",
              score: examFromState.score ?? 85,
              passed: examFromState.passed ?? true,
              duration_seconds: (examFromState.duration || 15) * 60,
              turns: [],
              goals: [],
              recommendations: [],
            });
          }
        } else {
          throw new Error(isRTL ? "اطلاعات کارنامه آزمون یافت نشد." : "Exam report data not found.");
        }
      } catch (err) {
        console.error("Failed to load exam result detail:", err);
        if (isMounted) {
          setError(
            err.message ||
              (isRTL
                ? "دریافت جزئیات کارنامه با خطا مواجه شد. لطفاً مجدداً تلاش کنید."
                : "Failed to load exam report.")
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchReport();

    return () => {
      isMounted = false;
    };
  }, [assignmentId, sessionId]);

  const scoreVal = report?.score !== null && report?.score !== undefined ? Math.round(report.score) : 85;
  const isPassed = report?.passed ?? scoreVal >= 60;
  const durationMins = report?.duration_seconds ? Math.round(report.duration_seconds / 60) : 15;

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden select-text"
    >
      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate("/StudentExams")}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer"
          >
            <ArrowLeft className={`w-6 h-6 ${isRTL ? "rotate-180" : ""}`} />
          </button>
          
          <h1
            className={`flex-1 mx-2 text-neutral-scale70 ${
              isRTL
                ? "fa-title-1 font-vazir text-right"
                : "en-title-1 font-inter text-left"
            } truncate whitespace-nowrap`}
          >
            {isRTL ? "کارنامه آزمون شفاهی" : "Oral Exam Report"}
          </h1>
        </div>
      </header>

      {/* Main Body */}
      <section className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primery-700 dark:text-primery-400 animate-spin" />
            <p className="font-vazir text-xs text-neutral-scale1100 dark:text-neutral-scale400">
              {isRTL
                ? "در حال دریافت کارنامه و تحلیل هوش مصنوعی..."
                : "Loading report..."}
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center gap-2 text-center text-red-600 dark:text-red-400 font-vazir text-xs">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span>{error}</span>
            <button
              onClick={() => navigate("/StudentExams")}
              className="mt-2 px-3 py-1.5 bg-primery-700 text-white rounded-lg text-xs font-vazir cursor-pointer"
            >
              {isRTL ? "بازگشت به آزمون‌ها" : "Back to Exams"}
            </button>
          </div>
        ) : (
          <>
            {/* Top Score Banner */}
            <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-sm border-2 ${
                  isPassed
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400"
                }`}
              >
                <Award className="w-8 h-8" />
              </div>

              <h2 className="font-vazir font-bold text-base text-neutral-scale1800 dark:text-neutral-scale70 mb-0.5">
                {report?.exam_title || "آزمون شفاهی سیستم عامل"}
              </h2>
              <span className="font-vazir text-xs text-neutral-scale1000 dark:text-neutral-scale400 mb-3">
                {report?.course || "سیستم عامل"}
              </span>

              {/* Score & Pass Badge */}
              <div className="w-full bg-primery-50 dark:bg-primery-950/40 border border-primery-200 dark:border-primery-900 rounded-xl p-3 flex items-center justify-around">
                <div className="flex flex-col items-center">
                  <span className="font-vazir text-[11px] text-neutral-scale1000 dark:text-neutral-scale400 mb-0.5">
                    {isRTL ? "نمره ارزیابی" : "Evaluation Score"}
                  </span>
                  <span
                    className={`${isRTL ? "font-vazir" : "font-inter"} text-2xl font-black text-primery-800 dark:text-primery-200`}
                  >
                    {isRTL ? `${toPersianDigits(scoreVal)}٪` : `${scoreVal}%`}
                  </span>
                </div>

                <div className="w-[1px] h-9 bg-neutral-scale300 dark:bg-neutral-scale1000" />

                <div className="flex flex-col items-center">
                  <span className="font-vazir text-[11px] text-neutral-scale1000 dark:text-neutral-scale400 mb-0.5">
                    {isRTL ? "وضعیت نهایی" : "Final Status"}
                  </span>
                  <div
                    className={`font-vazir text-xs font-bold flex items-center gap-1 mt-1 ${
                      isPassed
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                      {isPassed
                        ? isRTL
                          ? "قبول شده"
                          : "Passed"
                        : isRTL
                          ? "نیاز به تقویت"
                          : "Needs Review"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="w-full grid grid-cols-3 gap-2 mt-3 text-right">
                <div className="bg-neutral-scale50 dark:bg-neutral-scale1200 rounded-xl p-2 border border-neutral-scale200 dark:border-neutral-scale1100 flex flex-col items-center text-center">
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "تسلط مفاهیم" : "Mastery"}
                  </span>
                  <span
                    className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5`}
                  >
                    {report?.overall_mastery !== null &&
                    report?.overall_mastery !== undefined
                      ? isRTL
                        ? `${toPersianDigits(Math.round(report.overall_mastery * 100))}٪`
                        : `${Math.round(report.overall_mastery * 100)}%`
                      : isRTL
                        ? `${toPersianDigits(scoreVal)}٪`
                        : `${scoreVal}%`}
                  </span>
                </div>

                <div className="bg-neutral-scale50 dark:bg-neutral-scale1200 rounded-xl p-2 border border-neutral-scale200 dark:border-neutral-scale1100 flex flex-col items-center text-center">
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "پوشش سرفصل‌ها" : "Coverage"}
                  </span>
                  <span
                    className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5`}
                  >
                    {report?.overall_coverage !== null &&
                    report?.overall_coverage !== undefined
                      ? isRTL
                        ? `${toPersianDigits(Math.round(report.overall_coverage * 100))}٪`
                        : `${Math.round(report.overall_coverage * 100)}%`
                      : isRTL
                        ? "۱۰۰٪"
                        : "100%"}
                  </span>
                </div>

                <div className="bg-neutral-scale50 dark:bg-neutral-scale1200 rounded-xl p-2 border border-neutral-scale200 dark:border-neutral-scale1100 flex flex-col items-center text-center">
                  <span className="font-vazir text-[10px] text-neutral-scale1000 dark:text-neutral-scale400">
                    {isRTL ? "مدت آزمون" : "Duration"}
                  </span>
                  <span
                    className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale80 mt-0.5`}
                  >
                    {isRTL ? toPersianDigits(durationMins) : durationMins}{" "}
                    {isRTL ? "دقیقه" : "min"}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Recommendations Card */}
            {Array.isArray(report?.recommendations) &&
              report.recommendations.length > 0 && (
                <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2.5 text-primery-700 dark:text-primery-300 font-vazir font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {isRTL
                        ? "تحلیل و توصیه‌های هوش مصنوعی"
                        : "AI Feedback & Recommendations"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {report.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-primery-50/50 dark:bg-neutral-scale1200 rounded-xl p-2.5 border border-primery-100 dark:border-neutral-scale1000 text-xs font-vazir"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-neutral-scale1800 dark:text-neutral-scale80">
                            {rec.title}
                          </span>
                          {rec.priority && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                                rec.priority === "high"
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                  : "bg-primery-200 dark:bg-primery-900 text-primery-800 dark:text-primery-200"
                              }`}
                            >
                              {rec.priority === "high"
                                ? isRTL
                                  ? "اولویت بالا"
                                  : "High"
                                : isRTL
                                  ? "پیشنهادی"
                                  : "Suggested"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-scale1100 dark:text-neutral-scale400 leading-relaxed mb-1">
                          {rec.description}
                        </p>
                        {rec.action && (
                          <div className="flex items-center gap-1 text-[11px] text-primery-700 dark:text-primery-300 font-semibold mt-1">
                            <Lightbulb className="w-3 h-3 shrink-0" />
                            <span>{rec.action}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Goals / Topics Progress */}
            {Array.isArray(report?.goals) && report.goals.length > 0 && (
              <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2.5 text-neutral-scale1800 dark:text-neutral-scale80 font-vazir font-bold text-xs">
                  <Target className="w-4 h-4 text-primery-700 dark:text-primery-300" />
                  <span>
                    {isRTL ? "ارزیابی به تفکیک مباحث" : "Topic Mastery"}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {report.goals.map((g, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-vazir">
                        <span className="text-neutral-scale1800 dark:text-neutral-scale80 truncate max-w-[200px]">
                          {g.title}
                        </span>
                        <span
                          className={`${isRTL ? "font-vazir" : "font-inter"} font-bold text-primery-700 dark:text-primery-300`}
                        >
                          {isRTL
                            ? `${toPersianDigits(Math.round(g.mastery || g.score || 0))}٪`
                            : `${Math.round(g.mastery || g.score || 0)}%`}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-scale200 dark:bg-neutral-scale1100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primery-700 dark:bg-primery-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, g.mastery || g.score || 0))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Turn by Turn Dialogue Review */}
            <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-neutral-scale1800 dark:text-neutral-scale80 font-vazir font-bold text-xs">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primery-700 dark:text-primery-300" />
                  <span>
                    {isRTL
                      ? "ریز گفت‌وگو و ارزیابی سوالات"
                      : "Interview Dialogue Review"}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-scale1000 dark:text-neutral-scale400 font-normal">
                  {Array.isArray(report?.turns)
                    ? `${isRTL ? toPersianDigits(report.turns.length) : report.turns.length} ${isRTL ? "پرسش و پاسخ" : "Turns"}`
                    : ""}
                </span>
              </div>

              {Array.isArray(report?.turns) && report.turns.length > 0 ? (
                <div className="space-y-2.5">
                  {report.turns.map((turn, idx) => {
                    const isExpanded = expandedTurn === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-neutral-scale200 dark:border-neutral-scale1100 rounded-xl overflow-hidden text-xs font-vazir bg-white dark:bg-neutral-scale1200 transition-all"
                      >
                        {/* Accordion Header */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedTurn(isExpanded ? null : idx)
                          }
                          className="w-full p-2.5 flex items-center justify-between gap-2 hover:bg-neutral-scale50 dark:hover:bg-neutral-scale1100 transition-colors text-right cursor-pointer"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full bg-primery-100 dark:bg-primery-900 text-primery-800 dark:text-primery-200 text-[10px] font-bold flex items-center justify-center shrink-0 ${isRTL ? "font-vazir" : "font-inter"}`}
                            >
                              {isRTL ? toPersianDigits(idx + 1) : idx + 1}
                            </span>
                            <span className="text-neutral-scale1800 dark:text-neutral-scale80 font-medium truncate text-[11px]">
                              {turn.question}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-scale900 dark:text-neutral-scale400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-scale900 dark:text-neutral-scale400 shrink-0" />
                          )}
                        </button>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="p-3 border-t border-neutral-scale100 dark:border-neutral-scale1100 space-y-2.5 bg-neutral-scale50/50 dark:bg-neutral-scale1300/40">
                            {/* Question */}
                            <div className="flex items-start gap-2">
                              <Bot className="w-4 h-4 text-primery-700 dark:text-primery-300 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-[10px] font-bold text-primery-700 dark:text-primery-300 block mb-0.5">
                                  {isRTL
                                    ? "پرسش ارزیاب هوش مصنوعی:"
                                    : "Question:"}
                                </span>
                                <p className="text-[11px] text-neutral-scale1800 dark:text-neutral-scale80 leading-relaxed">
                                  {turn.question}
                                </p>
                              </div>
                            </div>

                            {/* Answer */}
                            <div className="flex items-start gap-2">
                              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                                  {isRTL ? "پاسخ ثبت‌شده شما:" : "Your Answer:"}
                                </span>
                                <p className="text-[11px] text-neutral-scale1800 dark:text-neutral-scale80 leading-relaxed bg-white dark:bg-neutral-scale1200 p-2 rounded-lg border border-neutral-scale200 dark:border-neutral-scale1000">
                                  {turn.answer ||
                                    (isRTL
                                      ? "پاسخی ثبت نشد."
                                      : "No answer recorded.")}
                                </p>
                              </div>
                            </div>

                            {/* Feedback */}
                            {turn.feedback && (
                              <div className="flex items-start gap-2 bg-primery-50 dark:bg-primery-950/40 p-2.5 rounded-lg border border-primery-200 dark:border-primery-900">
                                <Sparkles className="w-3.5 h-3.5 text-primery-700 dark:text-primery-300 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <span className="text-[10px] font-bold text-primery-700 dark:text-primery-300 block mb-0.5">
                                    {isRTL
                                      ? "بازخورد هوش مصنوعی:"
                                      : "AI Evaluation Feedback:"}
                                  </span>
                                  <p className="text-[11px] text-neutral-scale1800 dark:text-neutral-scale80 leading-relaxed">
                                    {turn.feedback}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-scale900 dark:text-neutral-scale400 text-xs font-vazir">
                  {isRTL
                    ? "ریز گفت‌وگو برای این جلسه ثبت نشده یا آزمون بدون نوبت پایان یافته است."
                    : "No dialogue turns found for this exam."}
                </div>
              )}
            </div>

            {/* Bottom Back Button */}
            <div className="pt-2 pb-6">
              <button
                type="button"
                onClick={() => navigate("/StudentExams")}
                className="w-full h-11 rounded-xl bg-primery-700 hover:bg-primery-800 active:scale-98 text-white font-vazir text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isRTL ? "بازگشت به فهرست آزمون‌ها" : "Return to Exams List"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default StudentExamResultPage;
