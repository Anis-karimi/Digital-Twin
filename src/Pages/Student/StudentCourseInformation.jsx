import { useEffect, useState, useContext } from "react";
import {
  ArrowLeft,
  Calendar,
  Lock,
  Globe,
  Loader2,
  FileText,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { coursesApi } from "@/api";
import { AppContext } from "@/Context/AppContext";
import { formatDisplayDate, toPersianDigits, toJalaliNumericString } from "@/utils/dateUtils";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import AI from "@/assets/images/AI.png";
import courseImage from "@/assets/images/course.jpg";

const DEFAULT_COURSE = {
  name: "سیستم عامل",
  startDate: "2026-03-01",
  endDate: "2026-07-01",
  description:
    "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی)",
  accessLevel: "private",
  photo_url: null,
};

const isPersianText = (text) => {
  if (!text || typeof text !== "string") return false;
  return /[\u0600-\u06FF]/.test(text);
};

export const CourseInformation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const stateCourse = location.state?.course;
  const { isRTL } = useContext(AppContext);

  const titleClass = isRTL ? "fa-title-1 font-vazir" : "en-title-1 font-inter";
  const bodyClass = isRTL ? "fa-body-medium font-vazir" : "en-body-medium font-inter";
  const captionClass = isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter";
  const textAlign = isRTL ? "text-right" : "text-left";

  const [courseDetails, setCourseDetails] = useState(() => ({
    name: stateCourse?.titleFa || stateCourse?.title || DEFAULT_COURSE.name,
    startDate: DEFAULT_COURSE.startDate,
    endDate: DEFAULT_COURSE.endDate,
    description:
      stateCourse?.description ||
      stateCourse?.descriptionFa ||
      stateCourse?.preview ||
      DEFAULT_COURSE.description,
    accessLevel: stateCourse?.accessLevel || DEFAULT_COURSE.accessLevel,
    photo_url: stateCourse?.photo_url || null,
    degree: stateCourse?.degree || "کارشناسی",
    units: stateCourse?.units || 3,
    course_code: stateCourse?.course_code || stateCourse?.courseCode || null,
    department: stateCourse?.department || stateCourse?.field || "مهندسی کامپیوتر",
    term: stateCourse?.term || "نیم‌سال دوم ۱۴۰۴-۱۴۰۵",
    instructor_name:
      stateCourse?.instructorName ||
      stateCourse?.instructor_name ||
      stateCourse?.teacher_name ||
      null,
    isActive: stateCourse?.isActive ?? stateCourse?.is_active ?? true,
    is_enrolled: Boolean(stateCourse?.is_enrolled),
  }));

  const [courseTitle, setCourseTitle] = useState(
    stateCourse?.titleFa || stateCourse?.title || DEFAULT_COURSE.name
  );
  const [isLoadingCourse, setIsLoadingCourse] = useState(!stateCourse);
  const [actionLoading, setActionLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // ---------------------------------------
  // Check enrollment status
  // ---------------------------------------
  const targetCourseId = id || stateCourse?.id || "c0000000-0000-4000-8000-000000000001";

  const isEnrolled = (() => {
    try {
      const stored = localStorage.getItem("student_joined_courses");
      const list = stored ? JSON.parse(stored) : [];
      if (list.includes(String(targetCourseId))) return true;
      if (String(targetCourseId) === "c0000000-0000-4000-8000-000000000001" && list.includes("os")) return true;
    } catch {
      // fallback
    }
    return Boolean(courseDetails.is_enrolled || stateCourse?.is_enrolled);
  })();

  const isPending = (() => {
    try {
      const stored = localStorage.getItem("student_pending_requests");
      const list = stored ? JSON.parse(stored) : [];
      if (list.includes(String(targetCourseId))) return true;
    } catch {
      // fallback
    }
    return requestSent;
  })();

  // ---------------------------------------
  // Load Course Details
  // ---------------------------------------
  useEffect(() => {
    let isMounted = true;

    coursesApi
      .getCourseDetails(targetCourseId)
      .then((data) => {
        if (!isMounted || !data) return;

        const activeStatus =
          data.isActive !== undefined
            ? Boolean(data.isActive)
            : data.is_active !== undefined
              ? Boolean(data.is_active)
              : true;

        const loadedDesc =
          data.description ||
          data.descriptionFa ||
          data.preview ||
          stateCourse?.description ||
          stateCourse?.descriptionFa ||
          stateCourse?.preview ||
          DEFAULT_COURSE.description;

        const loaded = {
          name:
            data.name ||
            data.nameFa ||
            data.nameEn ||
            stateCourse?.titleFa ||
            stateCourse?.title ||
            DEFAULT_COURSE.name,
          startDate: data.startDate || DEFAULT_COURSE.startDate,
          endDate: data.endDate || DEFAULT_COURSE.endDate,
          description: loadedDesc,
          accessLevel: (
            data.accessLevel || stateCourse?.accessLevel || DEFAULT_COURSE.accessLevel
          ).toLowerCase(),
          isActive: activeStatus,
          photo_url: data.photo_url || stateCourse?.photo_url || null,
          degree: data.degree || stateCourse?.degree || "کارشناسی",
          units: data.units || stateCourse?.units || 3,
          course_code: data.course_code || data.courseCode || stateCourse?.course_code || null,
          department: data.department || data.field || stateCourse?.department || "مهندسی کامپیوتر",
          term: data.term || stateCourse?.term || "نیم‌سال دوم ۱۴۰۴-۱۴۰۵",
          instructor_name:
            data.instructor_name ||
            data.teacher_name ||
            stateCourse?.instructorName ||
            null,
          is_enrolled: data.is_enrolled ?? stateCourse?.is_enrolled ?? false,
        };

        setCourseDetails(loaded);
        setCourseTitle(loaded.name);
      })
      .catch((error) => {
        console.warn("Failed to load student course details:", error);
        if (isMounted && !stateCourse) {
          setCourseDetails({
            ...DEFAULT_COURSE,
            isActive: true,
          });
          setCourseTitle(DEFAULT_COURSE.name);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingCourse(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [targetCourseId, stateCourse]);

  const handleJoinRequest = async () => {
    setActionLoading(true);
    try {
      await coursesApi.joinCourse(String(targetCourseId));
      setRequestSent(true);
      const stored = JSON.parse(localStorage.getItem("student_pending_requests") || "[]");
      if (!stored.includes(String(targetCourseId))) {
        stored.push(String(targetCourseId));
        localStorage.setItem("student_pending_requests", JSON.stringify(stored));
      }
    } catch (err) {
      console.error("Join request failed:", err);
      setRequestSent(true);
    } finally {
      setActionLoading(false);
    }
  };

  // ---------------------------------------
  // Loading State
  // ---------------------------------------
  if (isLoadingCourse) {
    return (
      <main
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col"
      >
        <header className="w-full h-[65px] shrink-0">
          <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000 items-center px-4">
            <button
              onClick={() => navigate(-1)}
              type="button"
              aria-label={isRTL ? "بازگشت" : "Go back"}
              className="text-white w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
            >
              <ArrowLeft
                className={`!w-6 !h-6 text-neutral-scale70 ${
                  isRTL ? "rotate-180" : ""
                }`}
              />
            </button>

            <h1
              className={`flex-1 mx-2 text-neutral-scale70 whitespace-nowrap truncate ${titleClass} ${textAlign}`}
            >
              {isRTL ? "اطلاعات درس" : "Course Details"}
            </h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primery-700 animate-spin" />
        </div>
      </main>
    );
  }

  const finalDescription =
    courseDetails.description ||
    courseDetails.descriptionFa ||
    courseDetails.preview ||
    (isRTL
      ? "توضیحات تکمیلی و سرفصل‌های آموزشی این درس توسط استاد ارائه خواهد شد."
      : "Course description and educational materials will be provided by the instructor.");

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col"
    >
      {/* ---------------------------------------
          Header
      --------------------------------------- */}
      <header className="w-full h-[65px] -mt-px flex shrink-0">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000 items-center px-4 shadow-xs">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="text-white w-8 h-8 flex items-center justify-center cursor-pointer shrink-0 active:scale-95 transition-transform"
          >
            <ArrowLeft
              className={`!w-6 !h-6 text-neutral-scale70 ${
                isRTL ? "rotate-180" : ""
              }`}
            />
          </button>

          <h1
            dir={isRTL ? "rtl" : "ltr"}
            className={`flex-1 mx-2 text-neutral-scale70 whitespace-nowrap truncate ${titleClass} ${
              isRTL ? "text-right" : "text-left"
            }`}
          >
            {courseTitle || DEFAULT_COURSE.name}
          </h1>
        </div>
      </header>

      {/* ---------------------------------------
          Main Content
      --------------------------------------- */}
      <section
        className="w-full flex-1 min-h-0 px-3.5 pt-2.5 pb-20 overflow-y-auto overflow-x-hidden"
        aria-label={isRTL ? "اطلاعات درس" : "Course information"}
      >
        <div className="w-full flex flex-col gap-3">
          {/* ---------------------------------------
              1. Course Header / Banner
          --------------------------------------- */}
          <section className="w-full relative flex items-center gap-3.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl shrink-0 shadow-2xs">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-neutral-scale200 dark:border-neutral-scale1100 shadow-sm bg-neutral-scale100 dark:bg-neutral-scale1200">
              <img
                src={resolveMediaUrl(courseDetails.photo_url) || AI}
                alt={courseDetails.name || "Course"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = courseImage;
                }}
              />
            </div>

            <div className={`flex flex-col min-w-0 flex-1 ${textAlign}`}>
              <h2
                className={`${bodyClass} text-neutral-scale1800 dark:text-neutral-scale70 text-sm font-bold truncate`}
              >
                {courseDetails.name}
              </h2>

              <span
                className={`${captionClass} text-[11px] mt-1 text-neutral-scale700 dark:text-neutral-scale400 font-vazir`}
              >
                {courseDetails.department || (isRTL ? "اطلاعات و محتوای درس" : "Course Information")}
              </span>
            </div>
          </section>

          {/* ---------------------------------------
              2. Course Status
          --------------------------------------- */}
          <section
            aria-labelledby="student-course-status"
            className="w-full relative flex items-center justify-between px-4 py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl shrink-0 shadow-2xs"
          >
            <div
              className={`flex items-center gap-3 min-w-0 flex-1 ${textAlign}`}
            >
              <div className="w-8 h-8 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1200 flex items-center justify-center shrink-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    courseDetails.isActive ? "bg-emerald-500" : "bg-neutral-scale400"
                  }`}
                />
              </div>

              <div className="flex flex-col min-w-0">
                <h2
                  id="student-course-status"
                  className={`${bodyClass} text-neutral-scale1800 dark:text-neutral-scale70 text-xs font-semibold leading-tight`}
                >
                  {isRTL ? "وضعیت درس" : "Course Status"}
                </h2>

                <span
                  className={`${captionClass} text-[11px] mt-0.5 leading-none font-vazir ${
                    courseDetails.isActive
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : "text-neutral-scale600 dark:text-neutral-scale400"
                  }`}
                >
                  {courseDetails.isActive
                    ? isRTL
                      ? "فعال و در حال برگزاری"
                      : "Active"
                    : isRTL
                      ? "غیرفعال"
                      : "Inactive"}
                </span>
              </div>
            </div>
          </section>

          {/* ---------------------------------------
              3. توضیحات درس (Prominently at the Top)
          --------------------------------------- */}
          <section
            aria-labelledby="student-course-description"
            className="w-full relative flex flex-col items-start gap-2 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl shrink-0 shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primery-700 dark:text-primery-400 shrink-0" />
              <h3
                id="student-course-description"
                className={`${bodyClass} text-primery-800 dark:text-primery-300 text-xs font-bold font-vazir`}
              >
                {isRTL ? "توضیحات درس" : "Course Description"}
              </h3>
            </div>

            <p
              dir={isPersianText(finalDescription) ? "rtl" : isRTL ? "rtl" : "ltr"}
              className="w-full text-xs text-neutral-scale1200 dark:text-neutral-scale200 leading-relaxed font-vazir text-right whitespace-pre-line"
            >
              {finalDescription}
            </p>
          </section>

          {/* ---------------------------------------
              4. مشخصات آموزشی و آکادمیک
          --------------------------------------- */}
          <div className="flex items-center px-1 mt-0.5">
            <h2
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-bold font-vazir`}
            >
              {isRTL ? "مشخصات آموزشی درس" : "Course Details"}
            </h2>
          </div>

          {/* Academic Details Card */}
          <div className="w-full bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
            {/* Instructor */}
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-scale100 dark:border-neutral-scale1200">
              <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                {isRTL ? "استاد درس" : "Instructor"}
              </span>
              <span className="text-xs font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                {courseDetails.instructor_name || (isRTL ? "دکتر محمد اله بخش" : "Dr. Mohammad Allahbakhsh")}
              </span>
            </div>

            {/* Academic Level */}
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-scale100 dark:border-neutral-scale1200">
              <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                {isRTL ? "مقطع تحصیلی" : "Academic Level"}
              </span>
              <span className="text-xs font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                {courseDetails.degree || (isRTL ? "کارشناسی" : "Bachelor")}
              </span>
            </div>

            {/* Department */}
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-scale100 dark:border-neutral-scale1200">
              <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                {isRTL ? "رشته تحصیلی" : "Department"}
              </span>
              <span className="text-xs font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                {courseDetails.department || (isRTL ? "مهندسی کامپیوتر" : "Computer Engineering")}
              </span>
            </div>

            {/* Units & Code with Persian Digits */}
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-scale100 dark:border-neutral-scale1200">
              <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                {isRTL ? "تعداد واحد" : "Course Units"}
              </span>
              <span className="text-xs font-vazir font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                {isRTL
                  ? courseDetails.units
                    ? `${toPersianDigits(courseDetails.units)} واحد`
                    : "۳ واحد"
                  : `${courseDetails.units || 3} Credits`}
              </span>
            </div>

            {courseDetails.course_code && (
              <div className="flex items-center justify-between pb-2.5 border-b border-neutral-scale100 dark:border-neutral-scale1200">
                <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                  {isRTL ? "کد درس" : "Course Code"}
                </span>
                <span className="text-xs font-vazir font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                  {isRTL ? toPersianDigits(courseDetails.course_code) : courseDetails.course_code}
                </span>
              </div>
            )}

            {/* Academic Term */}
            {courseDetails.term && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                  {isRTL ? "نیم‌سال تحصیلی" : "Term"}
                </span>
                <span className="text-xs font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                  {courseDetails.term}
                </span>
              </div>
            )}
          </div>

          {/* ---------------------------------------
              5. زمان‌بندی و دسترسی
          --------------------------------------- */}
          <div className="flex items-center px-1 mt-0.5">
            <h2
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-bold font-vazir`}
            >
              {isRTL ? "زمان‌بندی و دسترسی" : "Schedule & Access"}
            </h2>
          </div>

          <div className="w-full bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
            {/* Start Date */}
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-scale100 dark:border-neutral-scale1200">
              <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                {isRTL ? "تاریخ شروع درس" : "Start Date"}
              </span>
              <div className="flex items-center gap-1.5 font-vazir text-xs font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                <span>{formatDisplayDate(courseDetails.startDate, isRTL)}</span>
                {isRTL && toJalaliNumericString(courseDetails.startDate) && (
                  <span className="text-[11px] text-neutral-scale700 dark:text-neutral-scale400 font-vazir font-normal">
                    ({toJalaliNumericString(courseDetails.startDate)})
                  </span>
                )}
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-scale100 dark:border-neutral-scale1200">
              <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                {isRTL ? "تاریخ پایان درس" : "End Date"}
              </span>
              <div className="flex items-center gap-1.5 font-vazir text-xs font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                <span>{formatDisplayDate(courseDetails.endDate, isRTL)}</span>
                {isRTL && toJalaliNumericString(courseDetails.endDate) && (
                  <span className="text-[11px] text-neutral-scale700 dark:text-neutral-scale400 font-vazir font-normal">
                    ({toJalaliNumericString(courseDetails.endDate)})
                  </span>
                )}
              </div>
            </div>

            {/* Access Level */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-vazir text-neutral-scale900 dark:text-neutral-scale400 font-medium">
                {isRTL ? "نوع دسترسی" : "Access Level"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70">
                {courseDetails.accessLevel === "private" ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{isRTL ? "خصوصی (نیاز به عضویت)" : "Private"}</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isRTL ? "عمومی" : "Public"}</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* ---------------------------------------
              6. Bottom Action Button
          --------------------------------------- */}
          <div className="pt-1">
            {isEnrolled ? (
              <button
                type="button"
                onClick={() => navigate(`/ChatArea/course/${targetCourseId}`)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-primery-700 hover:bg-primery-800 text-white font-vazir text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{isRTL ? "ورود به گفتگوی درس" : "Enter Course Chat"}</span>
              </button>
            ) : isPending ? (
              <div className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-vazir text-xs font-bold">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>{isRTL ? "درخواست عضویت ارسال شده و در انتظار تأیید است" : "Join Request Pending"}</span>
              </div>
            ) : (
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleJoinRequest}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-primery-700 hover:bg-primery-800 text-white font-vazir text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isRTL ? "درخواست عضویت در درس" : "Request to Join"}</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
