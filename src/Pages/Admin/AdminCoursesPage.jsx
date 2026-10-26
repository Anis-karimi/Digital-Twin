import { useContext, useState, useEffect } from "react";
import { BookOpen, Search, Sun, Moon, Sparkles } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";
import { toPersianDigits } from "@/utils/dateUtils";

export const AdminCoursesPage = () => {
  const { isRTL } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </header>

      {/* Main Content Area: Course Names List */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-[85px]">
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
            filteredCourses.map((course, idx) => (
              <div
                key={course.course_id || idx}
                className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl p-3 flex items-center justify-between shadow-xs hover:border-primery-300 dark:hover:border-neutral-scale900 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primery-100 dark:bg-neutral-scale1200 text-primery-800 dark:text-primery-300 flex items-center justify-center font-bold text-xs shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                      {course.title}
                    </h3>
                    <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-0.5 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      <span>{isRTL ? "آماده تنظیم پرامپت و جزئیات درس" : "Ready for prompt & details"}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-[10px] font-semibold text-neutral-scale500 dark:text-neutral-scale400 bg-neutral-scale100 dark:bg-neutral-scale1200 px-2 py-1 rounded-md">
                  #{isRTL ? toPersianDigits(idx + 1) : idx + 1}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminCoursesPage;
