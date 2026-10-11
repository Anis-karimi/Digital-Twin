import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  ArrowLeft,
  GraduationCap,
  School,
  BookOpen,
  FileText,
  Layers,
  Check,
  AlertCircle,
  Sun,
  Moon,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";

export const AdminCreateCoursePage = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [units, setUnits] = useState(3);
  const [subject, setSubject] = useState("مهندسی کامپیوتر");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const popularSubjects = [
    "مهندسی کامپیوتر",
    "هوش مصنوعی",
    "نرم‌افزار",
    "فناوری اطلاعات",
    "علوم کامپیوتر",
  ];

  useEffect(() => {
    let isMounted = true;
    adminApi
      .getTeachers()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setTeachers(data);
          setTeacherId(data[0].teacher_id);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch teachers for course creation:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingTeachers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage(isRTL ? "لطفاً عنوان درس را وارد نمایید." : "Please enter the course title.");
      return;
    }

    if (!teacherId) {
      setErrorMessage(isRTL ? "لطفاً استاد درس را انتخاب نمایید." : "Please select an instructor.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim() || "مهندسی کامپیوتر",
        teacher_id: teacherId,
        units: Number(units) || 3,
        is_public: Boolean(isPublic),
        is_active: Boolean(isActive),
      };

      const result = await adminApi.createCourse(payload);
      setSuccessMessage(
        isRTL
          ? `درس «${result.title}» با موفقیت در سامانه ثبت گردید.`
          : `Course "${result.title}" created successfully.`
      );

      // Redirect back to courses list after short delay
      setTimeout(() => {
        navigate("/Admin");
      }, 1200);
    } catch (err) {
      console.error("Course creation failed:", err);
      setErrorMessage(
        err.message || (isRTL ? "خطا در ثبت درس. لطفاً دوباره تلاش کنید." : "Failed to create course.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full min-h-dvh flex flex-col overflow-x-hidden transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="w-full h-[65px] flex items-center justify-between px-4 md:px-6 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/Admin")}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            aria-label="Back to courses"
          >
            <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
          </button>
          <div>
            <h1
              className={`text-white text-base md:text-lg font-bold leading-tight ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "ثبت اطلاعات درس جدید" : "Register New Course"}
            </h1>
            <p className="text-white/70 text-[11px] leading-tight">
              {isRTL ? "افزودن درس و انتساب به استاد" : "Add course & assign instructor"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
        </button>
      </header>

      {/* Main Form Container */}
      <div className="w-full max-w-2xl mx-auto flex-1 px-4 py-5 flex flex-col gap-4 pb-28">
        {/* Notifications */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-5 md:p-6 flex flex-col gap-5 shadow-xs"
        >
          {/* Section: Course Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs md:text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primery-700 dark:text-primery-400" />
              <span>{isRTL ? "عنوان درس *" : "Course Title *"}</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRTL ? "مثال: سیستم عامل، پایگاه داده، هوش مصنوعی" : "e.g., Operating Systems"}
              className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:border-primery-600 transition-colors"
            />
          </div>

          {/* Section: Instructor Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs md:text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
              <School className="w-4 h-4 text-primery-700 dark:text-primery-400" />
              <span>{isRTL ? "استاد درس *" : "Course Instructor *"}</span>
            </label>
            {loadingTeachers ? (
              <div className="text-xs text-neutral-scale500 py-2">
                {isRTL ? "در حال دریافت لیست اساتید..." : "Loading instructors..."}
              </div>
            ) : (
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:border-primery-600 transition-colors cursor-pointer"
              >
                {teachers.map((t) => (
                  <option key={t.teacher_id} value={t.teacher_id}>
                    {t.name} ({t.username})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Section: Units & Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Units Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primery-700 dark:text-primery-400" />
                <span>{isRTL ? "تعداد واحد" : "Course Credits/Units"}</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnits(u)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      units === u
                        ? "bg-primery-700 text-white border-primery-800 shadow-xs"
                        : "bg-white dark:bg-neutral-scale1200 border-neutral-scale200 dark:border-neutral-scale1000 text-neutral-scale1800 dark:text-neutral-scale70"
                    }`}
                  >
                    {u} {isRTL ? "واحد" : "Units"}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject/Department */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primery-700 dark:text-primery-400" />
                <span>{isRTL ? "گروه آموزشی" : "Subject/Department"}</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={isRTL ? "مثال: مهندسی کامپیوتر" : "e.g., Computer Engineering"}
                className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:border-primery-600 transition-colors"
              />
            </div>
          </div>

          {/* Quick Subject Tags */}
          <div className="flex items-center gap-1.5 flex-wrap -mt-2">
            <span className="text-[10px] text-neutral-scale500 dark:text-neutral-scale400">
              {isRTL ? "پیشنهاد سریع:" : "Quick pick:"}
            </span>
            {popularSubjects.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-scale100 dark:bg-neutral-scale1200 hover:bg-neutral-scale200 text-neutral-scale800 dark:text-neutral-scale300 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Section: Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs md:text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primery-700 dark:text-primery-400" />
              <span>{isRTL ? "توضیحات و اهداف درس" : "Course Description"}</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isRTL
                  ? "سرفصل‌ها، اهداف و منابع آموزشی درس را مختصراً وارد نمایید..."
                  : "Course objectives and topics..."
              }
              className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:border-primery-600 transition-colors resize-none"
            />
          </div>

          {/* Section: Options Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-scale100 dark:border-neutral-scale1100">
            {/* Active Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primery-700 rounded-sm focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                {isRTL ? "درس فعال باشد" : "Course is active"}
              </span>
            </label>

            {/* Public Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-primery-700 rounded-sm focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                {isRTL ? "درس عمومی باشد" : "Public course"}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isRTL ? "در حال ثبت درس..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4" />
                  <span>{isRTL ? "ثبت نهایی و ایجاد درس" : "Create Course"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default AdminCreateCoursePage;
