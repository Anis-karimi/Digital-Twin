import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Plus,
  Users,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  FolderPlus,
} from "lucide-react";
import courseImage from "@/assets/images/AI.png";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";
import { toPersianDigits } from "@/utils/dateUtils";
import { AdminCourseManagementModal } from "@/Components/AdminCourseManagementModal";

export const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);
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
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-white text-sm font-bold leading-tight truncate ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "مدیریت دروس و سرفصل‌ها" : "Courses Management"}
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

          {/* Quick Register Course Button */}
          <button
            type="button"
            onClick={() => navigate("/AdminCreateCourse")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>{isRTL ? "ثبت درس" : "New"}</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Content Area */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-[85px]">
        {/* Metric Overview Cards */}
        <section className="grid grid-cols-3 gap-2">
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

        {/* Search & Filter Toolbar */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-2.5 flex flex-col gap-2 shadow-xs">
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
              className={`w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-lg py-1.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale500 focus:outline-none focus:border-primery-600 transition-colors ${
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

        {/* Courses List */}
        <section className="flex flex-col gap-2.5">
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
                onClick={() => navigate("/AdminCreateCourse")}
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
                {/* Header row: Title, badges */}
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

                {/* Manage Members & Teacher Action Button */}
                <button
                  type="button"
                  onClick={() => setSelectedCourseForModal(course)}
                  className="w-full mt-0.5 bg-primery-50 hover:bg-primery-100 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 border border-primery-200 dark:border-neutral-scale1000 text-primery-800 dark:text-primery-300 text-[11px] font-bold py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3 h-3" />
                  <span>{isRTL ? "مدیریت اعضا و استاد درس" : "Manage Members"}</span>
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
