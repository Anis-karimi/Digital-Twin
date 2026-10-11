import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Plus,
  Users,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  FolderPlus,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";
import { AdminCourseManagementModal } from "@/Components/AdminCourseManagementModal";

export const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const { isRTL, t } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const [courses, setCourses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'inactive'
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

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

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full min-h-dvh flex flex-col overflow-x-hidden transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="w-full h-[65px] flex items-center justify-between px-4 md:px-6 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-neutral-scale1200 flex items-center justify-center text-white">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className={`text-white text-base md:text-lg font-bold leading-tight ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "مدیریت دروس و سرفصل‌ها" : "Courses Management"}
            </h1>
            <p className="text-white/70 text-[11px] leading-tight">
              {isRTL ? "پنل مدیریت سامانه دوقلوی دیجیتال" : "Digital Twin Administration"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
          </button>

          {/* Quick Register Course Button */}
          <button
            type="button"
            onClick={() => navigate("/AdminCreateCourse")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isRTL ? "ثبت درس جدید" : "New Course"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-4xl mx-auto flex-1 px-4 py-5 flex flex-col gap-4 pb-24">
        {/* Metric Overview Cards */}
        <section className="grid grid-cols-3 gap-2.5 md:gap-4">
          <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-xl md:text-2xl font-black text-primery-800 dark:text-neutral-scale70">
              {overview?.total_courses ?? courses.length}
            </span>
            <span className="text-[11px] md:text-xs text-neutral-scale800 dark:text-neutral-scale400 mt-1">
              {isRTL ? "کل دروس" : "Total Courses"}
            </span>
          </div>

          <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {overview?.active_courses ?? courses.filter((c) => c.is_active).length}
            </span>
            <span className="text-[11px] md:text-xs text-neutral-scale800 dark:text-neutral-scale400 mt-1">
              {isRTL ? "دروس فعال" : "Active Courses"}
            </span>
          </div>

          <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-xs">
            <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">
              {overview?.total_enrollments ?? 17}
            </span>
            <span className="text-[11px] md:text-xs text-neutral-scale800 dark:text-neutral-scale400 mt-1">
              {isRTL ? "ثبت‌نام دانشجو" : "Enrollments"}
            </span>
          </div>
        </section>

        {/* Search & Filter Toolbar */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
          {/* Search Box */}
          <div className="w-full md:flex-1 relative">
            <Search
              className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-neutral-scale600 dark:text-neutral-scale500 ${
                isRTL ? "right-3" : "left-3"
              }`}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isRTL ? "جستجوی درس، نام استاد یا گروه آموزشی..." : "Search courses, teachers..."}
              className={`w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl py-2 text-xs md:text-sm text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale500 focus:outline-none focus:border-primery-600 transition-colors ${
                isRTL ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"
              }`}
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="w-full md:w-auto flex items-center gap-1 bg-neutral-scale100 dark:bg-neutral-scale1200 p-1 rounded-xl shrink-0 self-stretch md:self-auto justify-center">
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === "inactive"
                  ? "bg-white dark:bg-neutral-scale1000 text-red-500 dark:text-red-400 shadow-xs"
                  : "text-neutral-scale700 dark:text-neutral-scale400 hover:text-neutral-scale900"
              }`}
            >
              {isRTL ? "غیرفعال" : "Inactive"}
            </button>
          </div>
        </section>

        {/* Courses List */}
        <section className="flex flex-col gap-3">
          {loading ? (
            <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-primery-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-neutral-scale700 dark:text-neutral-scale400">
                {isRTL ? "در حال دریافت فهرست دروس..." : "Loading courses..."}
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1200 flex items-center justify-center text-neutral-scale600">
                <FolderPlus className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-neutral-scale900 dark:text-neutral-scale100">
                {isRTL ? "هیچ درسی با این مشخصات یافت نشد" : "No courses found"}
              </p>
              <button
                type="button"
                onClick={() => navigate("/AdminCreateCourse")}
                className="mt-2 bg-primery-700 hover:bg-primery-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isRTL ? "ثبت اولین درس جدید" : "Register New Course"}</span>
              </button>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.course_id}
                className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-xs hover:border-primery-300 dark:hover:border-neutral-scale900 transition-all"
              >
                {/* Header row: Title, badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primery-100 dark:bg-neutral-scale1200 text-primery-800 dark:text-primery-300 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm md:text-base font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                          {course.title}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primery-50 dark:bg-primery-950/60 text-primery-800 dark:text-primery-300 border border-primery-200 dark:border-primery-800/40">
                          {course.units} {isRTL ? "واحد" : "Units"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-scale700 dark:text-neutral-scale400 mt-0.5">
                        {course.subject || (isRTL ? "مهندسی کامپیوتر" : "Computer Engineering")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {course.is_active ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isRTL ? "فعال" : "Active"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>{isRTL ? "غیرفعال" : "Inactive"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Description if available */}
                {course.description && (
                  <p className="text-xs text-neutral-scale800 dark:text-neutral-scale300 line-clamp-2 leading-relaxed bg-neutral-scale50 dark:bg-neutral-scale1200/50 p-2.5 rounded-xl border border-neutral-scale100/60 dark:border-neutral-scale1100/40">
                    {course.description}
                  </p>
                )}

                {/* Footer details: Instructor & Enrollment count */}
                <div className="pt-2 border-t border-neutral-scale100 dark:border-neutral-scale1100/60 flex items-center justify-between text-xs text-neutral-scale700 dark:text-neutral-scale400 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-scale500 dark:text-neutral-scale500">
                      {isRTL ? "استاد درس:" : "Instructor:"}
                    </span>
                    <span className="font-bold text-primery-800 dark:text-neutral-scale100">
                      {course.teacher_name || (isRTL ? "تعیین‌نشده" : "Not assigned")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-neutral-scale500" />
                    <span>
                      {course.students_count || 0} {isRTL ? "دانشجو ثبت‌نام شده" : "Students enrolled"}
                    </span>
                  </div>
                </div>

                {/* Manage Members & Teacher Action Button */}
                <button
                  type="button"
                  onClick={() => setSelectedCourseForModal(course)}
                  className="w-full mt-1 bg-primery-50 hover:bg-primery-100 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 border border-primery-200 dark:border-neutral-scale1000 text-primery-800 dark:text-primery-300 text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isRTL ? "مدیریت اعضا و استاد درس" : "Manage Members & Instructor"}</span>
                </button>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Course Management Modal */}
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
    </main>
  );
};

export default AdminCoursesPage;
