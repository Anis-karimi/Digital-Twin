import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
import { DatePickerModal } from "@/Components/Common/DatePickerModal";
import { ClockPickerModal } from "@/Components/Common/ClockPickerModal";
import {
  X,
  FileText,
  Clock3,
  Calendar as CalendarIcon,
  Target,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import "@/styles/fonts.css";

const toPersianDigits = (num) => {
  if (num === null || num === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export const TeacherEditExamModal = ({ isOpen, onClose, exam, onSuccess }) => {
  const { isRTL } = useContext(AppContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examDate, setExamDate] = useState("1405/07/20");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:30");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [gapMinutes, setGapMinutes] = useState(5);
  const [goals, setGoals] = useState([]);
  const [newGoalInput, setNewGoalInput] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStartTimePickerOpen, setIsStartTimePickerOpen] = useState(false);
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const assignmentId = exam?.id || exam?.quiz_id || exam?.assignment_id;

  // Initialize form when exam changes
  useEffect(() => {
    if (!exam || !isOpen) return;

    setTitle(exam.title || "");
    setDescription(exam.description || "");
    setExamDate(exam.date || exam.exam_date || "1405/07/20");

    let sTime = "10:00";
    let eTime = "11:30";
    if (exam.time && typeof exam.time === "string" && exam.time.includes("-")) {
      const parts = exam.time.split("-").map((p) => p.trim());
      if (parts[0]) sTime = parts[0];
      if (parts[1]) eTime = parts[1];
    } else if (exam.start_at && exam.end_at) {
      try {
        if (typeof exam.start_at === "string" && exam.start_at.includes(":") && !exam.start_at.includes("T")) {
          sTime = exam.start_at;
          eTime = exam.end_at;
        } else {
          sTime = new Date(exam.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          eTime = new Date(exam.end_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
      } catch {
        sTime = "10:00";
        eTime = "11:30";
      }
    }
    setStartTime(sTime);
    setEndTime(eTime);

    let dur = 15;
    if (exam.duration) {
      const match = String(exam.duration).match(/\d+/);
      if (match) dur = parseInt(match[0], 10);
    } else if (exam.duration_minutes) {
      dur = exam.duration_minutes;
    }
    setDurationMinutes(dur);
    setGapMinutes(exam.gap_minutes ?? 5);

    // Goals
    let initialGoals = [];
    if (Array.isArray(exam.goals) && exam.goals.length > 0) {
      initialGoals = exam.goals.map((g) => (typeof g === "object" && g !== null ? (g.title || g.name || "") : String(g))).filter(Boolean);
    } else if (exam.topic) {
      initialGoals = exam.topic.split("،").map((t) => t.trim()).filter(Boolean);
    }
    if (initialGoals.length === 0) {
      initialGoals = ["مباحث کلی آزمون"];
    }
    setGoals(initialGoals);
    setIsActive(exam.active ?? exam.is_active ?? true);
    setError(null);
  }, [exam, isOpen]);

  const handleAddGoal = () => {
    const trimmed = newGoalInput.trim();
    if (!trimmed) return;
    if (!goals.includes(trimmed)) {
      setGoals([...goals, trimmed]);
    }
    setNewGoalInput("");
  };

  const handleRemoveGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(isRTL ? "لطفاً عنوان آزمون را وارد کنید." : "Exam title is required.");
      return;
    }

    if (!assignmentId) {
      setError(isRTL ? "شناسه آزمون نامعتبر است." : "Invalid exam ID.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      exam_date: examDate,
      start_at: startTime,
      end_at: endTime,
      duration_minutes: parseInt(durationMinutes, 10) || 15,
      gap_minutes: parseInt(gapMinutes, 10) || 5,
      goals: goals.length > 0 ? goals : [title.trim()],
      is_active: isActive,
    };

    try {
      await examsApi.updateExam(assignmentId, payload);
      if (onSuccess) {
        onSuccess({ ...exam, ...payload, id: assignmentId, quiz_id: assignmentId });
      }
      onClose();
    } catch (err) {
      console.error("Failed to update exam:", err);
      setError(
        isRTL
          ? "خطا در به‌روزرسانی آزمون. لطفاً دوباره تلاش کنید."
          : "Failed to update exam. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-text animate-in fade-in duration-200"
      >
        <div className="bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 w-full max-w-md max-h-[90vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <header className="p-4 bg-primery-700 dark:bg-neutral-scale1200 text-white flex items-center justify-between border-b dark:border-neutral-scale1000 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-scale70" />
              <h2 className="font-vazir font-bold text-sm text-neutral-scale70">
                {isRTL ? "ویرایش مشخصات آزمون" : "Edit Exam"}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={isRTL ? "بستن" : "Close"}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 text-neutral-scale70 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-vazir text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Exam Title */}
            <div className="space-y-1">
              <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70">
                {isRTL ? "عنوان آزمون" : "Exam Title"} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isRTL ? "مثال: آزمون میان‌ترم سیستم عامل" : "e.g. Midterm Operating Systems"}
                className="w-full h-10 px-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 focus:outline-none focus:border-primery-700"
                required
              />
            </div>

            {/* Date and Timing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Exam Date Picker Button */}
              <div className="space-y-1">
                <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? "تاریخ برگزاری" : "Exam Date"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="w-full h-10 px-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 flex items-center justify-between cursor-pointer hover:border-neutral-scale400"
                >
                  <span>{examDate}</span>
                  <CalendarIcon className="w-4 h-4 text-neutral-scale900 dark:text-neutral-scale400" />
                </button>
              </div>

              {/* Status Toggle */}
              <div className="space-y-1">
                <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? "وضعیت آزمون" : "Exam Status"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-full h-10 px-3 text-xs font-vazir rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "bg-neutral-scale100 dark:bg-neutral-scale1200 border-neutral-scale200 dark:border-neutral-scale1000 text-neutral-scale1000 dark:text-neutral-scale400"
                  }`}
                >
                  <span>{isActive ? (isRTL ? "فعال و باز" : "Active") : (isRTL ? "غیرفعال (بسته)" : "Closed")}</span>
                  <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-neutral-scale500"}`} />
                </button>
              </div>
            </div>

            {/* Time Window (Start & End) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? "ساعت شروع بازه" : "Start Time"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsStartTimePickerOpen(true)}
                  className="w-full h-10 px-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 flex items-center justify-between cursor-pointer hover:border-neutral-scale400"
                >
                  <span>{startTime}</span>
                  <Clock3 className="w-4 h-4 text-neutral-scale900 dark:text-neutral-scale400" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? "ساعت پایان بازه" : "End Time"}
                </label>
                <button
                  type="button"
                  onClick={() => setIsEndTimePickerOpen(true)}
                  className="w-full h-10 px-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 flex items-center justify-between cursor-pointer hover:border-neutral-scale400"
                >
                  <span>{endTime}</span>
                  <Clock3 className="w-4 h-4 text-neutral-scale900 dark:text-neutral-scale400" />
                </button>
              </div>
            </div>

            {/* Duration per student & Gap */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? "مدت هر دانشجو (دقیقه)" : "Duration/Student (min)"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 focus:outline-none focus:border-primery-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? "فاصله بین نوبت‌ها (دقیقه)" : "Gap (min)"}
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={gapMinutes}
                  onChange={(e) => setGapMinutes(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 focus:outline-none focus:border-primery-700"
                />
              </div>
            </div>

            {/* Topics / Goals */}
            <div className="space-y-1.5 pt-1">
              <label className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primery-700 dark:text-primery-300" />
                <span>{isRTL ? "مباحث و اهداف آموزشی آزمون" : "Exam Goals & Topics"}</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddGoal();
                    }
                  }}
                  placeholder={isRTL ? "افزودن مبحث جدید (مثال: مدیریت حافظه)..." : "Add new topic..."}
                  className="flex-1 h-9 px-3 text-xs font-vazir bg-neutral-scale50 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-neutral-scale1800 dark:text-neutral-scale80 focus:outline-none focus:border-primery-700"
                />
                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="h-9 px-3 bg-primery-700 text-white rounded-xl text-xs font-vazir flex items-center gap-1 hover:bg-primery-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRTL ? "افزودن" : "Add"}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {goals.map((g, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-primery-50 dark:bg-neutral-scale1200 border border-primery-200 dark:border-neutral-scale1000 px-2.5 py-1 rounded-lg text-xs font-vazir text-neutral-scale1800 dark:text-neutral-scale80"
                  >
                    <span>{g}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="hover:text-red-500 transition-colors cursor-pointer text-neutral-scale900 dark:text-neutral-scale400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 h-10 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 bg-white dark:bg-neutral-scale1200 text-neutral-scale1800 dark:text-neutral-scale70 text-xs font-vazir hover:bg-neutral-scale50 cursor-pointer disabled:opacity-50"
              >
                {isRTL ? "انصراف" : "Cancel"}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 h-10 rounded-xl bg-primery-700 hover:bg-primery-800 text-white text-xs font-vazir font-semibold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 transition-all active:scale-98"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{isRTL ? "ذخیره تغییرات" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Date Picker Modal */}
      {isDatePickerOpen && (
        <DatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onSelectDate={(newDate) => {
            setExamDate(newDate);
            setIsDatePickerOpen(false);
          }}
          initialDate={examDate}
        />
      )}

      {/* Start Time Picker Modal */}
      {isStartTimePickerOpen && (
        <ClockPickerModal
          isOpen={isStartTimePickerOpen}
          onClose={() => setIsStartTimePickerOpen(false)}
          onSelectTime={(newTime) => {
            setStartTime(newTime);
            setIsStartTimePickerOpen(false);
          }}
          initialTime={startTime}
        />
      )}

      {/* End Time Picker Modal */}
      {isEndTimePickerOpen && (
        <ClockPickerModal
          isOpen={isEndTimePickerOpen}
          onClose={() => setIsEndTimePickerOpen(false)}
          onSelectTime={(newTime) => {
            setEndTime(newTime);
            setIsEndTimePickerOpen(false);
          }}
          initialTime={endTime}
        />
      )}
    </>
  );
};

export default TeacherEditExamModal;
