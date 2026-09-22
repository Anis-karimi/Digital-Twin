import { useContext, useState, useEffect } from "react";
import { ChevronRight, ArrowLeft } from "lucide-react";
import courseImage from "@/assets/images/course.jpg";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { coursesApi } from "@/api";
import { courses as defaultCourses } from "@/data/courses";
import { AppContext } from "@/Context/AppContext";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { isPersianText } from "@/utils/textUtils";

export const TeacherResource = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);
  const [courses, setCourses] = useState(defaultCourses);

  useEffect(() => {
    let isMounted = true;
    coursesApi.getCourses().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setCourses(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden"
    >
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
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
            className={`flex-1 mx-2 text-neutral-scale70 ${
              isRTL ? "fa-title-1 font-vazir text-right" : "en-title-1 font-inter text-left"
            } truncate whitespace-nowrap`}
          >
            {isRTL ? "اطلاعات دروس" : "Courses Information"}
          </h1>
        </div>
      </header>

      <section
        aria-labelledby="resource-course-selection"
        className="w-full flex-1 min-h-0 mt-[15px] mb-[75px]"
      >
        <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden">
          <div className="mt-[5px] w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[20px]">
            <p
              id="resource-course-selection"
              className={`px-4 ${
                isRTL ? "fa-body-medium font-vazir text-right" : "en-body-medium font-inter text-left"
              } text-primery-800 dark:text-neutral-scale70`}
            >
              {isRTL
                ? "برای بارگذاری فایل، یک درس را انتخاب کنید"
                : "Select a course to upload your file"}
            </p>

            <div className="flex flex-col w-full gap-[12px] mt-[16px] px-3.5">
              {courses.map((course) => {
                const descText =
                  course.description ||
                  (isRTL
                    ? "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری"
                    : "This course includes educational materials and related resources.");
                const isDescPersian = isPersianText(descText);

                return (
                  <button
                    key={course.id}
                    type="button"
                    aria-label={`Select course ${course.titleFa || course.title}`}
                    className={`flex items-center rounded-[10px] border border-neutral-scale200 dark:border-neutral-scale1000 bg-neutral-scale80 dark:bg-neutral-scale1200 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1100 justify-between w-full cursor-pointer p-3 transition-colors ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                    onClick={() => navigate(`/TeacherCourseDoc/${course.id}`)}
                  >
                    <div className="flex items-center gap-[12px] min-w-0 flex-1">
                      {/* Course Image */}
                      <div className="w-[75px] h-[75px] flex-shrink-0 overflow-hidden rounded-[10px] border border-neutral-scale200 dark:border-neutral-scale1000 bg-neutral-scale100 dark:bg-neutral-scale1100 shadow-sm">
                        <img
                          src={resolveMediaUrl(course.photo_url) || courseImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Course Information */}
                      <div
                        className={`flex flex-col min-w-0 gap-[3px] flex-1 justify-center ${
                          isRTL ? "text-right" : "text-left"
                        }`}
                      >
                        {/* Title - Always Persian font and format */}
                        <span
                          dir="rtl"
                          className={`fa-body-medium font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70 truncate ${
                            isRTL ? "text-right" : "text-left [direction:rtl]"
                          }`}
                        >
                          {course.titleFa || course.title || "سیستم عامل"}
                        </span>

                        {/* Privacy / Access Level */}
                        <span
                          className={`${
                            isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter"
                          } text-neutral-scale1000 dark:text-neutral-scale300 capitalize`}
                        >
                          {isRTL
                            ? (course.accessLevel === "public" ? "عمومی" : "خصوصی")
                            : (course.accessLevel === "public" ? "Public" : "Private")}
                        </span>

                        {/* Description - Auto-detect Persian font */}
                        <span
                          dir={isDescPersian ? "rtl" : (isRTL ? "rtl" : "ltr")}
                          className={`${
                            isDescPersian
                              ? "fa-caption-1 font-vazir"
                              : (isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter")
                          } text-neutral-scale1000 dark:text-neutral-scale400 truncate min-w-0 ${
                            !isRTL && isDescPersian ? "text-left [direction:rtl]" : ""
                          }`}
                        >
                          {descText}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className={`!w-4 !h-4 flex-shrink-0 text-neutral-scale1800 dark:text-neutral-scale70 mx-1 ${
                        isRTL ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
