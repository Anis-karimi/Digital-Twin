import { useContext, useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  CheckCircle2,
  Clock,
  UserPlus,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import courseDefaultImage from "@/assets/images/AI.png";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { coursesApi } from "@/api";
import { courses as defaultCourses } from "@/data/courses";
import { AppContext } from "@/Context/AppContext";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { toPersianDigits } from "@/utils/dateUtils";

export const StudentExplore = () => {
  const navigate = useNavigate();
  const { isRTL, t } = useContext(AppContext);

  const [courses, setCourses] = useState(defaultCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all"); // "all" | "my_courses"
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Local tracking of joined courses and pending requests for instant reactivity
  const [joinedCourseIds, setJoinedCourseIds] = useState(() => {
    try {
      const stored = localStorage.getItem("student_joined_courses");
      return stored ? JSON.parse(stored) : ["c0000000-0000-4000-8000-000000000001", "os"];
    } catch {
      return ["c0000000-0000-4000-8000-000000000001", "os"];
    }
  });

  const [pendingRequestIds, setPendingRequestIds] = useState(() => {
    try {
      const stored = localStorage.getItem("student_pending_requests");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    coursesApi
      .getCourses()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setCourses(data);

          // Sync backend enrollment data into local state if available
          const serverEnrolled = data
            .filter((c) => c.is_enrolled)
            .map((c) => String(c.id));
          const serverPending = data
            .filter((c) => c.has_pending_request)
            .map((c) => String(c.id));

          if (serverEnrolled.length > 0) {
            const updated = Array.from(new Set([...serverEnrolled, "os"]));
            setJoinedCourseIds(updated);
            localStorage.setItem("student_joined_courses", JSON.stringify(updated));
          }

          if (serverPending.length > 0) {
            setPendingRequestIds(serverPending);
            localStorage.setItem("student_pending_requests", JSON.stringify(serverPending));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load courses for explore:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleRequestJoinCourse = async (course) => {
    const courseId = String(course.id);
    setActionLoadingId(courseId);

    try {
      const res = await coursesApi.joinCourse(courseId);
      if (res && res.status === "enrolled") {
        const updatedJoined = Array.from(new Set([...joinedCourseIds, courseId]));
        setJoinedCourseIds(updatedJoined);
        localStorage.setItem("student_joined_courses", JSON.stringify(updatedJoined));
        showToast(
          isRTL
            ? `شما با موفقیت در درس «${course.titleFa || course.title}» عضو شدید!`
            : `Successfully enrolled in ${course.title}!`,
          "success"
        );
      } else {
        const updatedPending = Array.from(new Set([...pendingRequestIds, courseId]));
        setPendingRequestIds(updatedPending);
        localStorage.setItem("student_pending_requests", JSON.stringify(updatedPending));
        showToast(
          isRTL
            ? `درخواست عضویت در «${course.titleFa || course.title}» برای استاد ارسال شد و در انتظار تأیید است.`
            : `Join request sent to the instructor for ${course.title}.`,
          "info"
        );
      }
    } catch (err) {
      console.error("Request join course failed:", err);
      const updatedPending = Array.from(new Set([...pendingRequestIds, courseId]));
      setPendingRequestIds(updatedPending);
      localStorage.setItem("student_pending_requests", JSON.stringify(updatedPending));
      showToast(
        isRTL
          ? "درخواست عضویت شما برای استاد ارسال شد و در انتظار تأیید است."
          : "Join request submitted.",
        "info"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEnterCourse = (course) => {
    navigate(`/CourseInformation/${course.id}`, { state: { course } });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filter courses by search and active tab
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const courseIdStr = String(course.id);
      const isEnrolled =
        course.is_enrolled ||
        joinedCourseIds.includes(courseIdStr) ||
        (courseIdStr === "c0000000-0000-4000-8000-000000000001" && joinedCourseIds.includes("os"));
      const isPublic =
        course.accessLevel === "public" || course.is_public === true;

      // Private courses: if NOT joined/enrolled, completely omit!
      if (!isPublic && !isEnrolled) return false;

      // Tab filter
      if (selectedTab === "my_courses" && !isEnrolled) return false;

      // Query filter
      if (!normalizedQuery) return true;

      const titleFa = course.titleFa || "";
      const titleEn = course.title || "";
      const descriptionFa = course.descriptionFa || "";
      const descriptionEn = course.description || "";
      const instructor =
        course.instructorName || course.instructor_name || course.teacher_name || "";

      return (
        titleFa.toLowerCase().includes(normalizedQuery) ||
        titleEn.toLowerCase().includes(normalizedQuery) ||
        descriptionFa.toLowerCase().includes(normalizedQuery) ||
        descriptionEn.toLowerCase().includes(normalizedQuery) ||
        instructor.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [courses, searchQuery, selectedTab, joinedCourseIds, normalizedQuery]);

  // Statistics for tab badges: only count visible courses
  const stats = useMemo(() => {
    let totalCount = 0;
    let myCount = 0;

    courses.forEach((c) => {
      const cid = String(c.id);
      const isEnrolled =
        c.is_enrolled ||
        joinedCourseIds.includes(cid) ||
        (cid === "c0000000-0000-4000-8000-000000000001" && joinedCourseIds.includes("os"));
      const isPublic = c.accessLevel === "public" || c.is_public === true;

      // Private courses are completely hidden unless the student is already enrolled
      if (!isPublic && !isEnrolled) return;

      totalCount++;
      if (isEnrolled) {
        myCount++;
      }
    });

    return { total: totalCount, my: myCount };
  }, [courses, joinedCourseIds]);

  const tabs = [
    {
      id: "all",
      label: isRTL ? "همه دروس" : "All Courses",
      count: stats.total,
    },
    {
      id: "my_courses",
      label: isRTL ? "دروس من" : "My Courses",
      count: stats.my,
    },
  ];

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden relative"
    >
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`absolute top-4 left-4 right-4 z-50 p-3 rounded-xl shadow-lg border flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-primery-700 text-white border-primery-600"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-vazir leading-tight flex-1">{toastMessage.message}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000 shadow-xs">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="text-white w-8 h-8 flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-transform"
          >
            <BackIcon className="!w-6 !h-6 text-neutral-scale70" />
          </button>

          <h1
            className={`flex-1 mx-2 text-neutral-scale70 ${
              isRTL ? "fa-title-1 font-vazir text-right" : "en-title-1 font-inter text-left"
            } truncate whitespace-nowrap`}
          >
            {isRTL ? "اکسپلور و کاوش دروس" : "Explore Courses"}
          </h1>
        </div>
      </header>

      {/* Content Section */}
      <section className="w-full flex-1 min-h-0 flex flex-col overflow-hidden px-3.5 pt-3 pb-[80px]">
        {/* Search Bar */}
        <div className="w-full shrink-0">
          <div
            className={`w-full h-[44px] flex items-center gap-2 px-3.5 rounded-xl bg-white dark:bg-neutral-scale1300 border transition-all shadow-2xs ${
              searchQuery
                ? "border-primery-600 ring-1 ring-primery-600/30"
                : "border-neutral-scale200 dark:border-neutral-scale1100"
            }`}
          >
            <Search
              className={`!w-4 !h-4 flex-shrink-0 ${
                searchQuery
                  ? "text-primery-600 dark:text-primery-400"
                  : "text-neutral-scale900 dark:text-neutral-scale400"
              }`}
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? "جستجوی نام درس، استاد، توضیحات..." : "Search courses..."}
              dir={isRTL ? "rtl" : "ltr"}
              className="flex-1 min-w-0 bg-transparent outline-none border-none text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder:text-neutral-scale900 dark:placeholder:text-neutral-scale500 font-vazir"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={isRTL ? "پاک کردن جستجو" : "Clear search"}
                className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-scale900 hover:text-neutral-scale1800 dark:text-neutral-scale400 dark:hover:text-neutral-scale100 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1100"
              >
                <X className="!w-3.5 !h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="w-full shrink-0 flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={`h-8 px-3.5 rounded-lg text-xs font-vazir font-medium flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? "bg-primery-700 text-white shadow-xs font-semibold"
                    : "bg-white dark:bg-neutral-scale1300 text-neutral-scale1000 dark:text-neutral-scale400 border border-neutral-scale200 dark:border-neutral-scale1100 hover:bg-neutral-scale50 dark:hover:bg-neutral-scale1200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-vazir font-semibold leading-none ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-neutral-scale100 dark:bg-neutral-scale1100 text-neutral-scale900 dark:text-neutral-scale400"
                  }`}
                >
                  {isRTL ? toPersianDigits(tab.count) : tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Course List: Chat-feed styled rows */}
        <div className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden mt-3 pr-0.5">
          {filteredCourses.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredCourses.map((course) => {
                const courseIdStr = String(course.id);
                const isEnrolled =
                  course.is_enrolled ||
                  joinedCourseIds.includes(courseIdStr) ||
                  (courseIdStr === "c0000000-0000-4000-8000-000000000001" && joinedCourseIds.includes("os"));
                const isPending = pendingRequestIds.includes(courseIdStr);
                const isLoadingAction = actionLoadingId === courseIdStr;
                const displayTitle = course.titleFa || course.title || "سیستم عامل";
                const displayDesc =
                  course.description || course.preview || (isRTL ? "بدون توضیحات" : "No description");

                return (
                  <article
                    key={course.id}
                    onClick={() => isEnrolled && handleEnterCourse(course)}
                    className={`relative w-full min-h-[58px] flex items-center gap-3 py-2 px-3 rounded-2xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 shadow-2xs transition-all hover:border-primery-400 dark:hover:border-primery-700/60 ${
                      isEnrolled ? "cursor-pointer" : ""
                    } ${isRTL ? "flex-row text-right" : "flex-row text-left"}`}
                  >
                    {/* Course Avatar */}
                    <img
                      className="w-[48px] h-[48px] rounded-full object-cover shrink-0 border border-neutral-scale200 dark:border-neutral-scale1100"
                      alt={displayTitle}
                      src={resolveMediaUrl(course.photo_url) || courseDefaultImage}
                      onError={(e) => {
                        e.currentTarget.src = courseDefaultImage;
                      }}
                    />

                    {/* Content Info: Title + Single-line Description */}
                    <div
                      className={`flex flex-col flex-1 min-w-0 justify-center gap-0.5 ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                    >
                      <h2
                        className={`truncate text-black dark:text-neutral-scale70 ${
                          isRTL ? "fa-title-3 font-vazir text-right" : "en-title-3 font-vazir text-left"
                        }`}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        {displayTitle}
                      </h2>
                      <p
                        dir={isRTL ? "rtl" : "ltr"}
                        className="truncate text-xs font-vazir text-neutral-scale1000 dark:text-neutral-scale300"
                      >
                        {displayDesc}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div
                      className="shrink-0 flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEnrolled ? (
                        <button
                          type="button"
                          onClick={() => handleEnterCourse(course)}
                          className="h-8 px-3 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-vazir text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <span>{isRTL ? "مشاهده درس" : "View"}</span>
                          <ForwardIcon className="w-3.5 h-3.5" />
                        </button>
                      ) : isPending ? (
                        <span className="h-8 px-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-vazir text-[11px] font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>{isRTL ? "در انتظار تأیید" : "Pending"}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isLoadingAction}
                          onClick={() => handleRequestJoinCourse(course)}
                          className="h-8 px-3 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-vazir text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isRTL ? "درخواست عضویت" : "Request Join"}</span>
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-center mb-3 shadow-2xs">
                <BookOpen className="w-6 h-6 text-primery-600 dark:text-primery-400" />
              </div>

              <h4 className="font-vazir font-semibold text-xs text-neutral-scale1800 dark:text-neutral-scale100">
                {searchQuery
                  ? isRTL
                    ? "درسی با این مشخصات یافت نشد"
                    : "No matching courses found"
                  : isRTL
                    ? "درسی در این دسته‌بندی وجود ندارد"
                    : "No courses in this category"}
              </h4>

              <p className="font-vazir text-[11px] text-neutral-scale900 dark:text-neutral-scale500 mt-1 max-w-[240px]">
                {searchQuery
                  ? isRTL
                    ? "عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید."
                    : "Try searching with a different keyword."
                  : isRTL
                    ? "می‌توانید از تب «همه دروس» برای دیدن سایر درس‌ها استفاده کنید."
                    : "Select 'All' to browse all courses."}
              </p>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-neutral-scale200 dark:bg-neutral-scale1100 text-xs font-vazir text-neutral-scale1600 dark:text-neutral-scale100 hover:bg-neutral-scale300 cursor-pointer"
                >
                  {isRTL ? "پاک کردن فیلتر جستجو" : "Clear Search"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};