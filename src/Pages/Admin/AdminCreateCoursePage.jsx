import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderPlus,
  Search,
  Plus,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  CalendarClock,
  School,
  FileText,
  Layers,
  Check,
  AlertCircle,
  AlertTriangle,
  Trash2,
  ChevronDown,
  X,
  ArrowRight,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";
import { toPersianDigits } from "@/utils/dateUtils";
import { AdminCourseManagementModal } from "@/Components/AdminCourseManagementModal";

export const AdminCreateCoursePage = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const scrollContainerRef = useRef(null);

  // Courses data state
  const [courses, setCourses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'inactive'
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

  // Delete Course state
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  // Collapsible Create Course form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Teachers for dropdown
  const [teachers, setTeachers] = useState([
    {
      teacher_id: "t0000000-0000-4000-8000-000000000001",
      name: "دکتر محمد اله بخش",
      username: "mohammad_allahbakhsh",
    },
    {
      teacher_id: "t0000000-0000-4000-8000-000000000002",
      name: "دکتر علی احمدی",
      username: "ali_ahmadi",
    },
  ]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Form inputs
  const [title, setTitle] = useState("");
  const [teacherId, setTeacherId] = useState("t0000000-0000-4000-8000-000000000001");
  const [units, setUnits] = useState(3);
  const [subject, setSubject] = useState("مهندسی کامپیوتر");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const popularSubjects = [
    "مهندسی کامپیوتر",
    "هوش مصنوعی",
    "نرم‌افزار",
    "فناوری اطلاعات",
    "علوم کامپیوتر",
  ];

  // Fetch courses and metrics
  const fetchCoursesData = () => {
    Promise.all([adminApi.getCourses(), adminApi.getOverview()])
      .then(([coursesData, overviewData]) => {
        if (Array.isArray(coursesData)) setCourses(coursesData);
        if (overviewData) setOverview(overviewData);
      })
      .catch((err) => {
        console.error("Failed to load admin courses data:", err);
      });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([adminApi.getCourses(), adminApi.getOverview()])
      .then(([coursesData, overviewData]) => {
        if (!isMounted) return;
        if (Array.isArray(coursesData)) setCourses(coursesData);
        if (overviewData) setOverview(overviewData);
      })
      .catch((err) => {
        console.error("Failed to load admin courses data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch teachers list from backend
  useEffect(() => {
    let isMounted = true;
    setLoadingTeachers(true);
    adminApi
      .getTeachers()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setTeachers(data);
          setTeacherId((prev) => prev || data[0].teacher_id);
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

  // Toggle collapsible create course form
  const toggleCreateForm = () => {
    setIsCreateOpen((prev) => {
      const next = !prev;
      if (next && scrollContainerRef.current) {
        setTimeout(() => {
          scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }, 50);
      }
      return next;
    });
  };

  // Reset form inputs
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUnits(3);
    setSubject("مهندسی کامپیوتر");
    setIsPublic(true);
    setIsActive(true);
    setFormError("");
    setFormSuccess("");
  };

  // Handle course creation submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!title.trim()) {
      setFormError(isRTL ? "لطفاً عنوان درس را وارد نمایید." : "Please enter the course title.");
      return;
    }

    if (!teacherId) {
      setFormError(isRTL ? "لطفاً استاد درس را انتخاب نمایید." : "Please select an instructor.");
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
      setFormSuccess(
        isRTL
          ? `درس «${result.title}» با موفقیت در سامانه ثبت گردید.`
          : `Course "${result.title}" created successfully.`
      );

      // Refresh list & metrics
      fetchCoursesData();

      // Reset and auto collapse after brief display
      setTimeout(() => {
        resetForm();
        setIsCreateOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Course creation failed:", err);
      setFormError(
        err.message || (isRTL ? "خطا در ثبت درس. لطفاً دوباره تلاش کنید." : "Failed to create course.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle course deletion
  const handleConfirmDelete = async () => {
    if (!courseToDelete?.course_id) return;

    setDeletingCourse(true);
    setDeleteError("");
    try {
      await adminApi.deleteCourse(courseToDelete.course_id);

      // Remove from courses list immediately
      setCourses((prev) => prev.filter((c) => c.course_id !== courseToDelete.course_id));

      // Refresh overview counts
      adminApi.getOverview().then((data) => {
        if (data) setOverview(data);
      });

      const deletedTitle = courseToDelete.title;
      setCourseToDelete(null);
      setDeleteSuccess(
        isRTL
          ? `درس «${deletedTitle}» با موفقیت حذف گردید.`
          : `Course "${deletedTitle}" deleted successfully.`
      );

      setTimeout(() => {
        setDeleteSuccess("");
      }, 4000);
    } catch (err) {
      console.error("Failed to delete course:", err);
      setDeleteError(
        err.message || (isRTL ? "خطا در حذف درس. لطفاً دوباره تلاش کنید." : "Failed to delete course.")
      );
    } finally {
      setDeletingCourse(false);
    }
  };

  // Filter courses
  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.teacher_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subject || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === "active") return c.is_active;
    if (filterStatus === "inactive") return !c.is_active;
    return true;
  });

  const totalCoursesCount = overview?.total_courses ?? courses.length;
  const activeCoursesCount = overview?.active_courses ?? courses.filter((c) => c.is_active).length;
  const enrollmentsCount = overview?.total_enrollments ?? 17;

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden relative transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="w-full h-[65px] flex items-center justify-between px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-neutral-scale1200 flex items-center justify-center text-white shrink-0">
            <FolderPlus className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-white text-sm font-bold leading-tight truncate ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "ثبت و مدیریت دروس" : "Course Registration"}
            </h1>
            <p className="text-white/70 text-[10px] leading-tight truncate">
              {isRTL ? "پنل مدیریت سامانه" : "Administration Panel"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
          </button>

          {/* Quick Toggle Create Course Form Button */}
          <button
            type="button"
            onClick={toggleCreateForm}
            className={`text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer ${
              isCreateOpen
                ? "bg-primery-800 hover:bg-primery-900 border border-white/20"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {isCreateOpen ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform" />
                <span>{isRTL ? "بستن فرم" : "Close"}</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isRTL ? "ثبت درس" : "New"}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-[85px]"
      >
        {/* Global Action Alerts */}
        {deleteSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{deleteSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setDeleteSuccess("")}
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ITEM 1: Collapsible Create Course Accordion at the VERY TOP (کشویی بالا) */}
        {/* ========================================================================= */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl overflow-hidden shadow-xs shrink-0 transition-colors duration-200">
          {/* Accordion Header / Clickable Toggle Button */}
          <button
            type="button"
            onClick={toggleCreateForm}
            className={`w-full p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors text-start ${
              isCreateOpen
                ? "bg-primery-50/60 dark:bg-neutral-scale1400/80 border-b border-neutral-scale100 dark:border-neutral-scale1100"
                : "hover:bg-neutral-scale100/40 dark:hover:bg-neutral-scale1200/30"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isCreateOpen
                    ? "bg-primery-700 text-white shadow-xs"
                    : "bg-primery-100 dark:bg-neutral-scale1400 text-primery-700 dark:text-primery-300 border border-primery-200 dark:border-neutral-scale1100"
                }`}
              >
                <FolderPlus className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <h2 className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                  {isRTL ? "ثبت درس جدید" : "Register New Course"}
                </h2>
                <p className="text-[10px] text-neutral-scale700 dark:text-neutral-scale400 truncate mt-0.5">
                  {isRTL ? "افزودن درس، تعیین واحد و انتساب به استاد" : "Add course, set units & assign instructor"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-primery-700 dark:text-primery-300">
                {isCreateOpen
                  ? isRTL
                    ? "بستن فرم"
                    : "Close"
                  : isRTL
                  ? "ایجاد درس"
                  : "Open"}
              </span>
              <div
                className={`w-6 h-6 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1200 flex items-center justify-center text-neutral-scale700 dark:text-neutral-scale300 transition-transform duration-200 ${
                  isCreateOpen ? "rotate-180 text-primery-700 dark:text-primery-300" : ""
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </button>

          {/* Accordion Body: Course Registration Form */}
          {isCreateOpen && (
            <div className="p-4 flex flex-col gap-4 border-t border-neutral-scale100 dark:border-neutral-scale1100/60 bg-neutral-scale50/50 dark:bg-neutral-scale1400/40">
              {/* Form Notifications */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                {/* Section: Course Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    <span>{isRTL ? "عنوان درس *" : "Course Title *"}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      isRTL
                        ? "مثال: سیستم عامل، پایگاه داده، هوش مصنوعی"
                        : "e.g., Operating Systems"
                    }
                    className="w-full !border !border-neutral-scale200 dark:!border-neutral-scale1000 !bg-white dark:!bg-neutral-scale1400 rounded-xl px-3 py-2 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 dark:placeholder-neutral-scale500 focus:!border-primery-600 focus:ring-1 focus:ring-primery-600 transition-colors"
                  />
                </div>

                {/* Section: Instructor Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    <span>{isRTL ? "استاد درس *" : "Course Instructor *"}</span>
                  </label>
                  {loadingTeachers ? (
                    <div className="text-xs text-neutral-scale500 py-2 flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-primery-600 border-t-transparent rounded-full animate-spin" />
                      <span>{isRTL ? "در حال دریافت اساتید..." : "Loading instructors..."}</span>
                    </div>
                  ) : (
                    <div className="relative w-full">
                      <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        className="w-full !border !border-neutral-scale200 dark:!border-neutral-scale1000 !bg-white dark:!bg-neutral-scale1400 rounded-xl px-3 py-2 text-xs text-neutral-scale1800 dark:text-neutral-scale70 focus:!border-primery-600 focus:ring-1 focus:ring-primery-600 transition-colors cursor-pointer appearance-none pe-8"
                      >
                        {teachers.map((t) => (
                          <option key={t.teacher_id} value={t.teacher_id} className="bg-white dark:bg-neutral-scale1300 text-neutral-scale1800 dark:text-neutral-scale70">
                            {t.name} {t.username && t.username !== "teacher" ? `(${t.username})` : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-neutral-scale500 pointer-events-none absolute top-1/2 -translate-y-1/2 end-2.5" />
                    </div>
                  )}
                </div>

                {/* Section: Units */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                      <span>{isRTL ? "تعداد واحد" : "Units"}</span>
                    </label>
                    <span className="text-[10px] font-bold text-primery-700 dark:text-primery-300 bg-primery-50 dark:bg-primery-950/60 px-2 py-0.5 rounded-md border border-primery-200 dark:border-primery-800/40">
                      {isRTL ? `${toPersianDigits(units)} واحد` : `${units} Units`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnits(u)}
                        className={`py-2 rounded-xl text-xs font-bold !border transition-all cursor-pointer ${
                          units === u
                            ? "!bg-primery-700 text-white !border-primery-800 shadow-xs"
                            : "!bg-white dark:!bg-neutral-scale1400 !border-neutral-scale200 dark:!border-neutral-scale1000 text-neutral-scale1800 dark:text-neutral-scale70 hover:!border-primery-300"
                        }`}
                      >
                        {isRTL ? toPersianDigits(u) : u} {isRTL ? "واحد" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Subject/Department */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    <span>{isRTL ? "گروه آموزشی" : "Subject"}</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={isRTL ? "مثال: مهندسی کامپیوتر" : "e.g., Computer Engineering"}
                    className="w-full !border !border-neutral-scale200 dark:!border-neutral-scale1000 !bg-white dark:!bg-neutral-scale1400 rounded-xl px-3 py-2 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 dark:placeholder-neutral-scale500 focus:!border-primery-600 focus:ring-1 focus:ring-primery-600 transition-colors"
                  />
                  {/* Quick Subject Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-neutral-scale500 dark:text-neutral-scale400 shrink-0">
                      {isRTL ? "پیشنهاد سریع:" : "Quick pick:"}
                    </span>
                    {popularSubjects.map((s) => {
                      const isSelected = subject === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubject(s)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg !border transition-all cursor-pointer ${
                            isSelected
                              ? "!bg-primery-700 text-white !border-primery-800 font-bold shadow-xs"
                              : "!bg-white dark:!bg-neutral-scale1400 text-neutral-scale700 dark:text-neutral-scale300 !border-neutral-scale200 dark:!border-neutral-scale1000 hover:!border-primery-400 dark:hover:!border-primery-500"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    <span>{isRTL ? "توضیحات و اهداف درس" : "Description"}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isRTL
                        ? "سرفصل‌ها و اهداف آموزشی درس را مختصراً وارد نمایید..."
                        : "Course objectives and topics..."
                    }
                    className="w-full !border !border-neutral-scale200 dark:!border-neutral-scale1000 !bg-white dark:!bg-neutral-scale1400 rounded-xl px-3 py-2 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 dark:placeholder-neutral-scale500 focus:!border-primery-600 focus:ring-1 focus:ring-primery-600 transition-colors resize-none"
                  />
                </div>

                {/* Section: Active & Public Toggles */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Active Toggle Card */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isActive}
                    onClick={() => setIsActive((prev) => !prev)}
                    className={`p-2.5 rounded-xl !border flex items-center justify-between transition-all cursor-pointer select-none text-start ${
                      isActive
                        ? "!bg-primery-50/70 dark:!bg-primery-950/40 !border-primery-300 dark:!border-primery-800/50 text-primery-900 dark:text-primery-200"
                        : "!bg-white dark:!bg-neutral-scale1400 !border-neutral-scale200 dark:!border-neutral-scale1000 text-neutral-scale1800 dark:text-neutral-scale70 hover:!border-neutral-scale300"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="text-[11px] font-bold leading-tight truncate">
                        {isRTL ? "درس فعال" : "Active"}
                      </span>
                      <span className="text-[9px] text-neutral-scale600 dark:text-neutral-scale400 mt-0.5 truncate">
                        {isActive ? (isRTL ? "در دسترس" : "Available") : isRTL ? "غیرفعال" : "Disabled"}
                      </span>
                    </div>

                    <div className="tg-switch shrink-0 pointer-events-none" dir="ltr">
                      <input type="checkbox" checked={isActive} readOnly tabIndex={-1} />
                      <span className="tg-track" />
                      <span className="tg-thumb" />
                    </div>
                  </button>

                  {/* Public Toggle Card */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublic}
                    onClick={() => setIsPublic((prev) => !prev)}
                    className={`p-2.5 rounded-xl !border flex items-center justify-between transition-all cursor-pointer select-none text-start ${
                      isPublic
                        ? "!bg-primery-50/70 dark:!bg-primery-950/40 !border-primery-300 dark:!border-primery-800/50 text-primery-900 dark:text-primery-200"
                        : "!bg-white dark:!bg-neutral-scale1400 !border-neutral-scale200 dark:!border-neutral-scale1000 text-neutral-scale1800 dark:text-neutral-scale70 hover:!border-neutral-scale300"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="text-[11px] font-bold leading-tight truncate">
                        {isRTL ? "درس عمومی" : "Public"}
                      </span>
                      <span className="text-[9px] text-neutral-scale600 dark:text-neutral-scale400 mt-0.5 truncate">
                        {isPublic ? (isRTL ? "همه دانشجویان" : "Open") : isRTL ? "خصوصی" : "Restricted"}
                      </span>
                    </div>

                    <div className="tg-switch shrink-0 pointer-events-none" dir="ltr">
                      <input type="checkbox" checked={isPublic} readOnly tabIndex={-1} />
                      <span className="tg-track" />
                      <span className="tg-thumb" />
                    </div>
                  </button>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primery-700 hover:bg-primery-800 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{isRTL ? "در حال ثبت درس..." : "Saving..."}</span>
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4" />
                        <span>{isRTL ? "ثبت نهایی و ایجاد درس" : "Create Course"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsCreateOpen(false);
                    }}
                    className="!bg-white dark:!bg-neutral-scale1400 hover:!bg-neutral-scale100 dark:hover:!bg-neutral-scale1300 text-neutral-scale800 dark:text-neutral-scale200 text-xs font-semibold py-2.5 px-3 rounded-xl !border !border-neutral-scale200 dark:!border-neutral-scale1000 transition-all cursor-pointer"
                  >
                    {isRTL ? "انصراف" : "Cancel"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ITEM 2: Metric Overview Cards (کل دروس، دروس فعال، ثبت‌نامی‌ها) */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-2.5 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-lg font-black text-primery-800 dark:text-neutral-scale70">
              {isRTL ? toPersianDigits(totalCoursesCount) : totalCoursesCount}
            </span>
            <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 mt-0.5">
              {isRTL ? "کل دروس" : "Total"}
            </span>
          </div>

          <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-2.5 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {isRTL ? toPersianDigits(activeCoursesCount) : activeCoursesCount}
            </span>
            <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 mt-0.5">
              {isRTL ? "دروس فعال" : "Active"}
            </span>
          </div>

          <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-2.5 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">
              {isRTL ? toPersianDigits(enrollmentsCount) : enrollmentsCount}
            </span>
            <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 mt-0.5">
              {isRTL ? "ثبت‌نامی‌ها" : "Enrolled"}
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ITEM 3: Exam Schedule & Server Capacity Banner */}
        {/* ========================================================================= */}
        <section
          onClick={() => navigate("/AdminExamsSchedule")}
          className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 hover:border-primery-400 dark:hover:border-primery-600 rounded-[13px] p-3 flex items-center justify-between text-neutral-scale1800 dark:text-neutral-scale70 cursor-pointer shadow-xs shrink-0 transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primery-50 dark:bg-neutral-scale1200 border border-primery-200 dark:border-neutral-scale1000 flex items-center justify-center text-primery-700 dark:text-primery-300 shrink-0 group-hover:scale-105 transition-transform">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold font-vazir text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                  {isRTL ? "پایش زمان‌بندی و همپوشانی آزمون‌ها" : "Exam Schedule & Server Load"}
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 font-vazir truncate mt-0.5">
                {isRTL ? "بررسی تداخل ساعات آزمون اساتید و ظرفیت سرور" : "Check overlap & server capacity"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-primery-700 dark:text-primery-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform shrink-0">
            <span>{isRTL ? "مشاهده" : "View"}</span>
            {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ITEM 4: Search & Filter Toolbar */}
        {/* ========================================================================= */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-2.5 flex flex-col gap-2 shadow-xs shrink-0">
          {/* Search Box */}
          <div className="w-full relative">
            <Search
              className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-neutral-scale600 dark:text-neutral-scale500 ${
                isRTL ? "right-2.5" : "left-2.5"
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? "جستجوی درس یا استاد..." : "Search courses..."}
              className={`w-full !border !border-neutral-scale200 dark:!border-neutral-scale1000 !bg-white dark:!bg-neutral-scale1200 rounded-lg py-1.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale500 focus:outline-none focus:!border-primery-600 transition-colors ${
                isRTL ? "pr-8 pl-2.5 text-right" : "pl-8 pr-2.5 text-left"
              }`}
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="w-full flex items-center gap-1 bg-neutral-scale100 dark:bg-neutral-scale1200 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer text-center ${
                filterStatus === "all"
                  ? "bg-white dark:bg-neutral-scale1000 text-primery-800 dark:text-white shadow-xs"
                  : "text-neutral-scale700 dark:text-neutral-scale400 hover:text-neutral-scale900"
              }`}
            >
              {isRTL ? "همه" : "All"}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("active")}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer text-center ${
                filterStatus === "active"
                  ? "bg-white dark:bg-neutral-scale1000 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-neutral-scale700 dark:text-neutral-scale400 hover:text-neutral-scale900"
              }`}
            >
              {isRTL ? "فعال" : "Active"}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("inactive")}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer text-center ${
                filterStatus === "inactive"
                  ? "bg-white dark:bg-neutral-scale1000 text-red-500 dark:text-red-400 shadow-xs"
                  : "text-neutral-scale700 dark:text-neutral-scale400 hover:text-neutral-scale900"
              }`}
            >
              {isRTL ? "غیرفعال" : "Inactive"}
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ITEM 5: Courses List with Members Management AND Course Deletion */}
        {/* ========================================================================= */}
        <section className="flex flex-col gap-2.5 shrink-0">
          {loading ? (
            <div className="w-full py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-primery-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-neutral-scale700 dark:text-neutral-scale400">
                {isRTL ? "در حال دریافت فهرست دروس..." : "Loading courses..."}
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-6 text-center flex flex-col items-center justify-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1200 flex items-center justify-center text-neutral-scale600">
                <FolderPlus className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale100">
                {isRTL ? "هیچ درسی با این مشخصات یافت نشد" : "No courses found"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(true);
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="mt-1 bg-primery-700 hover:bg-primery-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRTL ? "ثبت درس جدید" : "Register Course"}</span>
              </button>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.course_id}
                className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-3 flex flex-col gap-2 shadow-xs hover:border-primery-300 dark:hover:border-neutral-scale900 transition-all"
              >
                {/* Header row: Title, units, active badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primery-100 dark:bg-neutral-scale1200 text-primery-800 dark:text-primery-300 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                          {course.title}
                        </h3>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primery-50 dark:bg-primery-950/60 text-primery-800 dark:text-primery-300 border border-primery-200 dark:border-primery-800/40 shrink-0">
                          {isRTL ? toPersianDigits(course.units) : course.units} {isRTL ? "واحد" : "Units"}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-scale700 dark:text-neutral-scale400 truncate mt-0.5">
                        {course.subject || (isRTL ? "مهندسی کامپیوتر" : "Computer Engineering")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {course.is_active ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{isRTL ? "فعال" : "Active"}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center gap-0.5">
                        <XCircle className="w-2.5 h-2.5" />
                        <span>{isRTL ? "غیرفعال" : "Inactive"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Description if available */}
                {course.description && (
                  <p className="text-[11px] text-neutral-scale800 dark:text-neutral-scale300 line-clamp-2 leading-relaxed bg-neutral-scale50 dark:bg-neutral-scale1200/50 p-2 rounded-lg border border-neutral-scale100/60 dark:border-neutral-scale1100/40">
                    {course.description}
                  </p>
                )}

                {/* Footer details: Instructor & Enrollment count */}
                <div className="pt-1.5 border-t border-neutral-scale100 dark:border-neutral-scale1100/60 flex items-center justify-between text-[11px] text-neutral-scale700 dark:text-neutral-scale400 gap-2">
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-medium text-neutral-scale500 dark:text-neutral-scale500 text-[10px] shrink-0">
                      {isRTL ? "استاد:" : "Teacher:"}
                    </span>
                    <span className="font-bold text-primery-800 dark:text-neutral-scale100 truncate">
                      {course.teacher_name || (isRTL ? "تعیین‌نشده" : "Not assigned")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Users className="w-3 h-3 text-neutral-scale500" />
                    <span>
                      {isRTL ? toPersianDigits(course.students_count || 0) : course.students_count || 0} {isRTL ? "دانشجو" : "Students"}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Manage Members & Delete Course */}
                <div className="flex items-center gap-2 mt-0.5 pt-1 border-t border-neutral-scale100/60 dark:border-neutral-scale1100/40">
                  {/* Manage Members Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedCourseForModal(course)}
                    className="flex-1 bg-primery-50 hover:bg-primery-100 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 border border-primery-200 dark:border-neutral-scale1000 text-primery-800 dark:text-primery-300 text-[11px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3 h-3" />
                    <span>{isRTL ? "مدیریت اعضا و استاد" : "Manage Members"}</span>
                  </button>

                  {/* Delete Course Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setCourseToDelete(course);
                    }}
                    title={isRTL ? "حذف درس" : "Delete Course"}
                    className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:text-red-700 text-[11px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRTL ? "حذف" : "Delete"}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Course Members & Teacher Management Modal */}
      {selectedCourseForModal && (
        <AdminCourseManagementModal
          course={selectedCourseForModal}
          isOpen={Boolean(selectedCourseForModal)}
          onClose={() => setSelectedCourseForModal(null)}
          onCourseUpdated={() => {
            fetchCoursesData();
          }}
        />
      )}

      {/* Course Deletion Confirmation Modal */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full max-w-[340px] bg-white dark:bg-neutral-scale1300 rounded-2xl border border-neutral-scale200 dark:border-neutral-scale1100 p-5 shadow-2xl flex flex-col gap-4"
          >
            {/* Header with Warning Icon */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? "حذف درس" : "Delete Course"}
                </h3>
                <p className="text-[11px] text-neutral-scale600 dark:text-neutral-scale400 mt-0.5">
                  {isRTL
                    ? "آیا از حذف این درس اطمینان دارید؟"
                    : "Are you sure you want to delete this course?"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={deletingCourse}
                className="w-7 h-7 rounded-lg hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 flex items-center justify-center text-neutral-scale500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Course Summary Box */}
            <div className="p-3 rounded-xl bg-neutral-scale50 dark:bg-neutral-scale1200/60 border border-neutral-scale100 dark:border-neutral-scale1100 text-xs flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                  «{courseToDelete.title}»
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primery-100 dark:bg-neutral-scale1100 text-primery-800 dark:text-neutral-scale200">
                  {isRTL ? toPersianDigits(courseToDelete.units) : courseToDelete.units} {isRTL ? "واحد" : "Units"}
                </span>
              </div>
              <div className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 flex items-center justify-between">
                <span>{isRTL ? "استاد:" : "Teacher:"} {courseToDelete.teacher_name || "---"}</span>
                <span>{isRTL ? toPersianDigits(courseToDelete.students_count || 0) : courseToDelete.students_count || 0} {isRTL ? "دانشجو" : "Students"}</span>
              </div>
            </div>

            {/* Danger Warning Text */}
            <p className="text-[11px] text-red-600 dark:text-red-400 leading-relaxed">
              {isRTL
                ? "توجه: این عملیات غیرقابل بازگشت است و تمامی سرفصل‌ها، آزمون‌ها و اعضای ثبت‌نام شده در درس حذف خواهند شد."
                : "Warning: This action cannot be undone. All materials, quizzes, and enrolled members will be removed."}
            </p>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs">
                {deleteError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingCourse}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {deletingCourse ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isRTL ? "در حال حذف..." : "Deleting..."}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRTL ? "تأیید و حذف درس" : "Confirm Delete"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={deletingCourse}
                className="bg-neutral-scale100 hover:bg-neutral-scale200 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 text-neutral-scale800 dark:text-neutral-scale200 text-xs font-semibold py-2.5 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                {isRTL ? "انصراف" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminCreateCoursePage;
