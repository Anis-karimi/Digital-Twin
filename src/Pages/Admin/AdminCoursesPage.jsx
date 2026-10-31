import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Sun,
  Moon,
  Sparkles,
  Sliders,
  Globe,
  ChevronLeft,
  FileCode,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";
import { toPersianDigits } from "@/utils/dateUtils";

export const AdminCoursesPage = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    adminApi
      .getCourses()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) setCourses(data);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = courses.filter((c) =>
    (c.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-full mx-auto flex flex-col overflow-hidden relative transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="w-full h-[65px] flex items-center justify-between px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors cursor-pointer"
          >
            <BackIcon className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-neutral-scale1200 flex items-center justify-center text-white shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-white text-sm font-bold leading-tight truncate ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "دروس سامانه" : "Courses Directory"}
            </h1>
            <p className="text-white/70 text-[10px] leading-tight truncate">
              {isRTL
                ? `${toPersianDigits(courses.length)} درس ثبت شده`
                : `${courses.length} courses registered`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Global Prompts Button */}
          <button
            type="button"
            onClick={() => navigate("/admin/system-prompts")}
            title={isRTL ? "پرامپت‌های سراسری سامانه" : "Global Prompts"}
            className="h-7 px-2 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center gap-1 text-white transition-all cursor-pointer text-[10px] font-bold"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-300" />
            <span>{isRTL ? "پرامپت عمومی" : "Global"}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-300" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-[85px]">
        {/* Global Prompts Banner Card */}
        <section className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-neutral-scale1300 dark:to-neutral-scale1200 border border-purple-200/70 dark:border-neutral-scale1100 rounded-xl p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                {isRTL ? "پرامپت‌های پیش‌فرض سراسری" : "System Global Prompts"}
              </h2>
              <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 truncate">
                {isRTL
                  ? "تنظیم دستورالعمل‌های پایه هوش مصنوعی"
                  : "Base prompts template for all courses"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/system-prompts")}
            className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold shrink-0 transition-colors cursor-pointer shadow-xs flex items-center gap-1"
          >
            <span>{isRTL ? "تنظیم" : "Edit"}</span>
            <ChevronLeft
              className={`w-3 h-3 ${isRTL ? "" : "rotate-180"}`}
            />
          </button>
        </section>

        {/* Search Box */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-1 shadow-xs">
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
              placeholder={isRTL ? "جستجوی نام درس..." : "Search course name..."}
              className={`w-full bg-white dark:bg-neutral-scale1200 rounded-lg py-1.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale500 focus:outline-none focus:border-primery-600 transition-colors ${
                isRTL ? "pr-8 pl-2.5 text-right" : "pl-8 pr-2.5 text-left"
              }`}
            />
          </div>
        </section>

        {/* Courses Names List */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200">
              {isRTL ? "لیست دروس سامانه" : "Registered Courses"}
            </h2>
            <span className="text-[10px] text-neutral-scale500 font-medium">
              {toPersianDigits(filteredCourses.length)} {isRTL ? "درس" : "courses"}
            </span>
          </div>

          {loading ? (
            <div className="w-full py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-primery-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-neutral-scale700 dark:text-neutral-scale400">
                {isRTL ? "در حال دریافت اسامی دروس..." : "Loading courses..."}
              </p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-6 text-center flex flex-col items-center justify-center gap-2">
              <BookOpen className="w-8 h-8 text-neutral-scale400" />
              <p className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale100">
                {isRTL ? "درسی با این نام یافت نشد" : "No courses found"}
              </p>
            </div>
          ) : (
            filteredCourses.map((course, idx) => {
              const courseId = course.course_id || course.id;
              return (
                <div
                  key={courseId || idx}
                  onClick={() =>
                    navigate(`/admin/system-prompts?courseId=${courseId}`)
                  }
                  className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl p-3 flex items-center justify-between shadow-xs hover:border-primery-400 dark:hover:border-neutral-scale900 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-primery-100 dark:bg-neutral-scale1200 text-primery-800 dark:text-primery-300 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primery-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          <span>
                            {isRTL ? "تنظیم پرامپت‌های درس" : "Configure Prompts"}
                          </span>
                        </span>
                        {course.teacher_name && (
                          <span className="text-[9px] text-neutral-scale500 dark:text-neutral-scale500 truncate">
                            • {course.teacher_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/system-prompts?courseId=${courseId}`);
                      }}
                      className="px-2 py-1 rounded-lg bg-primery-50 hover:bg-primery-100 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 text-primery-700 dark:text-primery-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-primery-200 dark:border-neutral-scale1000"
                    >
                      <FileCode className="w-3 h-3" />
                      <span>{isRTL ? "پرامپت‌ها" : "Prompts"}</span>
                    </button>
                    <ChevronLeft
                      className={`w-4 h-4 text-neutral-scale400 group-hover:text-primery-700 dark:group-hover:text-white transition-all shrink-0 ${
                        isRTL ? "" : "rotate-180"
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminCoursesPage;
