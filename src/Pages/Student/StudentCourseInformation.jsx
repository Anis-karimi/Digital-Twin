import { useEffect, useState, useContext } from "react";
import {
  ArrowLeft,
  Calendar,
  Lock,
  Globe,
  Loader2,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate, useParams } from "react-router-dom";
import { contextsApi, coursesApi } from "@/api";
import { AppContext } from "@/Context/AppContext";
import { formatDisplayDate } from "@/utils/dateUtils";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import AI from "@/assets/images/AI.png";
import courseImage from "@/assets/images/course.jpg";

const DEFAULT_COURSE = {
  name: "سیستم عامل",
  startDate: "2026-03-01",
  endDate: "2026-07-01",
  description:
    "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی",
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
  const { isRTL } = useContext(AppContext);

  const titleClass = isRTL ? "fa-title-1 font-vazir" : "en-title-1 font-inter";

  const bodyClass = isRTL
    ? "fa-body-medium font-vazir"
    : "en-body-medium font-inter";

  const captionClass = isRTL
    ? "fa-caption-1 font-vazir"
    : "en-caption-1 font-inter";

  const textAlign = isRTL ? "text-right" : "text-left";

  const [courseDetails, setCourseDetails] = useState({
    ...DEFAULT_COURSE,
    isActive: true,
  });

  const [courseTitle, setCourseTitle] = useState(DEFAULT_COURSE.name);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [joinStatus, setJoinStatus] = useState("none");


  // ---------------------------------------
  // Load Course Details
  // ---------------------------------------
  useEffect(() => {
    let isMounted = true;

    const targetCourseId = id || "c0000000-0000-4000-8000-000000000001";

    setIsLoadingCourse(true);

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

        const loaded = {
          name: data.name || data.nameFa || data.nameEn || DEFAULT_COURSE.name,

          startDate: data.startDate || DEFAULT_COURSE.startDate,

          endDate: data.endDate || DEFAULT_COURSE.endDate,

          description: data.description ?? DEFAULT_COURSE.description,

          accessLevel: (
            data.accessLevel || DEFAULT_COURSE.accessLevel
          ).toLowerCase(),

          isActive: activeStatus,

          photo_url: data.photo_url || null,
        };

        setCourseDetails(loaded);
        setCourseTitle(loaded.name);
      })
      .catch((error) => {
        console.warn("Failed to load student course details:", error);

        if (isMounted) {
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
  }, [id]);

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

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col"
    >
      {/* ---------------------------------------
          Header
      --------------------------------------- */}
      <header className="w-full h-[65px] -mt-px flex shrink-0">
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
              Course Header / Image
          --------------------------------------- */}
          <section className="w-full relative flex items-center gap-3.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-neutral-scale200 dark:border-neutral-scale1000 shadow-sm bg-neutral-scale100 dark:bg-neutral-scale1200">
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
                className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-sm font-semibold truncate`}
              >
                {courseDetails.name}
              </h2>

              <span
                className={`${captionClass} text-[11px] mt-1 text-neutral-scale700 dark:text-neutral-scale400`}
              >
                {isRTL
                  ? "اطلاعات و محتوای درس"
                  : "Course information and materials"}
              </span>
            </div>
          </section>

          {/* ---------------------------------------
              Course Status
          --------------------------------------- */}
          <section
            aria-labelledby="student-course-status"
            className="w-full relative flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <div
              className={`flex items-center gap-3 min-w-0 flex-1 ${textAlign}`}
            >
              <div className="w-8 h-8 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1200 flex items-center justify-center shrink-0 text-neutral-scale800 dark:text-neutral-scale300">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    courseDetails.isActive
                      ? "bg-[#2481cc]"
                      : "bg-neutral-scale500"
                  }`}
                />
              </div>

              <div className="flex flex-col min-w-0">
                <h2
                  id="student-course-status"
                  className={`${bodyClass} text-neutral-scale1800 dark:text-neutral-scale70 text-[14px] font-semibold leading-tight`}
                >
                  {isRTL ? "وضعیت درس" : "Course Status"}
                </h2>

                <span
                  className={`${captionClass} text-[12px] mt-1 leading-none ${
                    courseDetails.isActive
                      ? "text-[#2481cc] dark:text-[#52a6e6]"
                      : "text-neutral-scale600 dark:text-neutral-scale400"
                  }`}
                >
                  {courseDetails.isActive
                    ? isRTL
                      ? "فعال"
                      : "Active"
                    : isRTL
                      ? "غیرفعال"
                      : "Inactive"}
                </span>
              </div>
            </div>
          </section>

          {/* ---------------------------------------
              Course Details
          --------------------------------------- */}
          <div className="flex items-center px-1 mt-1">
            <h2
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 font-semibold`}
            >
              {isRTL ? "مشخصات درس" : "Course Details"}
            </h2>
          </div>

          {/* Course Name */}
          <section
            aria-labelledby="student-course-name"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="student-course-name"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "نام درس" : "Course Name"}
            </h3>

            <p
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium font-vazir ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              {courseDetails.name || "سیستم عامل"}
            </p>
          </section>

          {/* Instructor */}
          <section
            aria-labelledby="student-course-instructor"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="student-course-instructor"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "استاد درس" : "Instructor"}
            </h3>

            <p
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium ${
                isRTL ? "font-vazir text-right" : "font-inter text-left"
              }`}
            >
              {isRTL ? "دکتر محمد اله بخش" : "Dr. Mohammad Allahbakhsh"}
            </p>
          </section>

          {/* Field of Study */}
          <section
            aria-labelledby="student-course-field"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="student-course-field"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "رشته تحصیلی" : "Field of Study"}
            </h3>

            <p
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium ${
                isRTL ? "font-vazir text-right" : "font-inter text-left"
              }`}
            >
              {isRTL ? "مهندسی کامپیوتر" : "Computer Engineering"}
            </p>
          </section>

          {/* Academic Level */}
          <section
            aria-labelledby="student-course-level"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="student-course-level"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "مقطع تحصیلی" : "Academic Level"}
            </h3>

            <p
              dir={isRTL ? "rtl" : "ltr"}
              className={`w-full text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium ${
                isRTL ? "font-vazir text-right" : "font-inter text-left"
              }`}
            >
              {isRTL ? "کارشناسی" : "Bachelor's"}
            </p>
          </section>

          {/* Start Date */}
          <section
            aria-labelledby="student-course-start-date"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <div className="flex items-center justify-between w-full">
              <h3
                id="student-course-start-date"
                className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
              >
                {isRTL ? "تاریخ شروع درس" : "Course Start Date"}
              </h3>

              <Calendar className="w-4 h-4 text-primery-700 dark:text-neutral-scale70" />
            </div>

            <div className="w-full flex items-center justify-between py-1.5 px-2">
              <span
                className={`text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium ${captionClass}`}
              >
                {formatDisplayDate(courseDetails.startDate, isRTL)}
              </span>

              <span className="text-[11px] text-neutral-scale700 dark:text-neutral-scale400 font-mono">
                {courseDetails.startDate}
              </span>
            </div>
          </section>

          {/* End Date */}
          <section
            aria-labelledby="student-course-end-date"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <div className="flex items-center justify-between w-full">
              <h3
                id="student-course-end-date"
                className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
              >
                {isRTL ? "تاریخ پایان درس" : "Course End Date"}
              </h3>

              <Calendar className="w-4 h-4 text-primery-700 dark:text-neutral-scale70" />
            </div>

            <div className="w-full flex items-center justify-between py-1.5 px-2">
              <span
                className={`text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium ${captionClass}`}
              >
                {formatDisplayDate(courseDetails.endDate, isRTL)}
              </span>

              <span className="text-[11px] text-neutral-scale700 dark:text-neutral-scale400 font-mono">
                {courseDetails.endDate}
              </span>
            </div>
          </section>

          {/* Access Level */}
          <section
            aria-labelledby="student-course-access"
            className="w-full relative flex flex-col items-start gap-2 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="student-course-access"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "سطح دسترسی درس" : "Course Access Level"}
            </h3>

            <div className="flex items-center gap-6">
              {courseDetails.accessLevel === "private" ? (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 ${captionClass}`}
                >
                  <Lock className="w-3 h-3 text-neutral-scale700 dark:text-neutral-scale400" />

                  <span>{isRTL ? "خصوصی" : "Private"}</span>
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 ${captionClass}`}
                >
                  <Globe className="w-3 h-3 text-neutral-scale700 dark:text-neutral-scale400" />

                  <span>{isRTL ? "عمومی" : "Public"}</span>
                </span>
              )}
            </div>
          </section>

          {/* Description */}
          <section
            aria-labelledby="student-course-description"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="student-course-description"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "توضیحات درس" : "Description"}
            </h3>

            <p
              dir={
                isPersianText(courseDetails.description)
                  ? "rtl"
                  : isRTL
                    ? "rtl"
                    : "ltr"
              }
              className={`w-full text-xs text-neutral-scale1000 dark:text-neutral-scale200 leading-relaxed ${
                isPersianText(courseDetails.description)
                  ? "font-vazir text-right"
                  : `${textAlign} ${captionClass}`
              }`}
            >
              {courseDetails.description ||
                (isRTL
                  ? "توضیحاتی برای این درس ثبت نشده است."
                  : "No description provided yet.")}
            </p>
          </section>

          {/* ---------------------------------------
            Request to Join
          --------------------------------------- */}
          <button
            type="button"
            disabled={joinStatus !== "none"}
            onClick={() => {
              if (joinStatus === "none") {
                setJoinStatus("requested");
              }
            }}
            className={`w-full h-11 flex items-center justify-center rounded-[13px] transition-colors shrink-0 ${
              joinStatus === "none"
                ? "bg-primery-700 hover:bg-primery-800 active:bg-primery-800 text-white cursor-pointer"
                : joinStatus === "requested"
                  ? "bg-neutral-scale600 text-white cursor-default"
                  : "bg-success-700 text-white cursor-default"
            }`}
          >
            <span
              className={`text-sm font-semibold ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {joinStatus === "none"
                ? isRTL
                  ? "درخواست عضویت"
                  : "Request to Join"
                : joinStatus === "requested"
                  ? isRTL
                    ? "درخواست ارسال شد"
                    : "Requested"
                  : isRTL
                    ? "عضو شدید"
                    : "Joined"}
            </span>
          </button>
        </div>
      </section>
    </main>
  );
};

