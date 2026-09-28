import { useContext, useState, useEffect } from "react";
import { ChevronRight, ArrowLeft, Search, X } from "lucide-react";
import courseImage from "@/assets/images/AI.png";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { coursesApi } from "@/api";
import { courses as defaultCourses } from "@/data/courses";
import { AppContext } from "@/Context/AppContext";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { isPersianText } from "@/utils/textUtils";

export const StudentExplore = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const [courses, setCourses] = useState(defaultCourses);
  const [searchQuery, setSearchQuery] = useState("");

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

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCourses = courses.filter((course) => {
    if (!normalizedQuery) return true;

    const titleFa = course.titleFa || "";
    const titleEn = course.title || "";
    const descriptionFa = course.descriptionFa || "";
    const descriptionEn = course.description || "";

    return (
      titleFa.toLowerCase().includes(normalizedQuery) ||
      titleEn.toLowerCase().includes(normalizedQuery) ||
      descriptionFa.toLowerCase().includes(normalizedQuery) ||
      descriptionEn.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden"
    >
      {/* Header */}
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
              isRTL
                ? "fa-title-1 font-vazir text-right"
                : "en-title-1 font-inter text-left"
            } truncate whitespace-nowrap`}
          >
            {isRTL ? "اکسپلور دروس" : "Explore Courses"}
          </h1>
        </div>
      </header>

      {/* Content */}
      <section className="w-full flex-1 min-h-0 mt-[15px] mb-[75px]">
        <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden">
          
          {/* Search Bar */}
          <div className="w-full">
            <div
              className={`w-full h-[44px] flex items-center gap-2 px-3.5 rounded-[12px] bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 transition-colors ${
                searchQuery
                  ? "border-primery-500 dark:border-primery-600"
                  : ""
              }`}
            >
              <Search
                className={`!w-[18px] !h-[18px] flex-shrink-0 ${
                  searchQuery
                    ? "text-primery-600 dark:text-primery-400"
                    : "text-neutral-scale900 dark:text-neutral-scale400"
                }`}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isRTL ? "جستجوی درس..." : "Search courses..."
                }
                dir={isRTL ? "rtl" : "ltr"}
                className={`flex-1 min-w-0 bg-transparent outline-none border-none text-neutral-scale1800 dark:text-neutral-scale70 placeholder:text-neutral-scale900 dark:placeholder:text-neutral-scale500 ${
                  isRTL
                    ? "fa-body-medium font-vazir text-right"
                    : "en-body-medium font-inter text-left"
                }`}
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label={isRTL ? "پاک کردن جستجو" : "Clear search"}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-scale900 dark:text-neutral-scale400 hover:bg-neutral-scale200 dark:hover:bg-neutral-scale1100"
                >
                  <X className="!w-4 !h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Course List */}
          <div className="w-full mt-[14px] bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[16px]">
            
            {/* Section Title */}
            <div className="px-4">
              <p
                className={`text-primery-800 dark:text-neutral-scale70 ${
                  isRTL
                    ? "fa-body-medium font-vazir text-right"
                    : "en-body-medium font-inter text-left"
                }`}
              >
                {searchQuery
                  ? isRTL
                    ? "نتایج جستجو"
                    : "Search Results"
                  : isRTL
                    ? "دروسی که در آنها عضو شده اید"
                    : "Courses you joined"}
              </p>

              {searchQuery && (
                <p
                  className={`mt-[3px] text-neutral-scale900 dark:text-neutral-scale400 ${
                    isRTL
                      ? "fa-caption-1 font-vazir text-right"
                      : "en-caption-1 font-inter text-left"
                  }`}
                >
                  {isRTL
                    ? `${filteredCourses.length} درس پیدا شد`
                    : `${filteredCourses.length} courses found`}
                </p>
              )}
            </div>

            {/* Courses */}
            {filteredCourses.length > 0 ? (
              <div className="flex flex-col w-full gap-[10px] mt-[14px] px-3.5">
                {filteredCourses.map((course) => {
                  const descText =
                    course.descriptionFa || course.description || "";

                  const isDescPersian = isPersianText(descText);

                  return (
                    <button
                      key={course.id}
                      type="button"
                      aria-label={`Open course ${
                        course.titleFa || course.title
                      }`}
                      className={`flex items-center rounded-[12px] border border-neutral-scale300 dark:border-neutral-scale1000 bg-neutral-scale80 dark:bg-neutral-scale1200 hover:bg-neutral-scale90 dark:hover:bg-neutral-scale1100 active:scale-[0.99] justify-between w-full cursor-pointer p-3 transition-all ${
                        isRTL ? "text-right" : "text-left"
                      }`}
                      onClick={() =>
                        navigate(`/CourseInformation/${course.id}`)
                      }
                    >
                      <div className="flex items-center gap-[12px] min-w-0 flex-1">
                        {/* Course Image */}
                        <div className="w-[64px] h-[64px] flex-shrink-0 overflow-hidden rounded-[10px] border border-neutral-scale300 dark:border-neutral-scale1000 bg-neutral-scale100 dark:bg-neutral-scale1100 shadow-sm">
                          <img
                            src={
                              resolveMediaUrl(course.photo_url) || courseImage
                            }
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
                          {/* Title */}
                          <span
                            dir="rtl"
                            className={`fa-body-medium font-vazir font-semibold text-neutral-scale1800 dark:text-neutral-scale70 truncate ${
                              isRTL ? "text-right" : "text-left [direction:rtl]"
                            }`}
                          >
                            {course.titleFa || course.title || "سیستم عامل"}
                          </span>

                          {/* Access */}
                          <span
                            className={`${
                              isRTL
                                ? "fa-caption-1 font-vazir"
                                : "en-caption-1 font-inter"
                            } text-neutral-scale1000 dark:text-neutral-scale300 capitalize`}
                          >
                            {isRTL
                              ? course.accessLevel === "public"
                                ? "عمومی"
                                : "خصوصی"
                              : course.accessLevel === "public"
                                ? "Public"
                                : "Private"}
                          </span>

                          {/* Description */}
                          {descText && (
                            <span
                              dir={
                                isDescPersian ? "rtl" : isRTL ? "rtl" : "ltr"
                              }
                              className={`${
                                isDescPersian
                                  ? "fa-caption-1 font-vazir"
                                  : isRTL
                                    ? "fa-caption-1 font-vazir"
                                    : "en-caption-1 font-inter"
                              } text-neutral-scale1000 dark:text-neutral-scale400 truncate min-w-0`}
                            >
                              {descText}
                            </span>
                          )}
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
            ) : (
              /* Empty Search State */
              <div className="flex flex-col items-center justify-center px-6 py-[45px]">
                <div className="w-[48px] h-[48px] rounded-full bg-neutral-scale100 dark:bg-neutral-scale1200 flex items-center justify-center mb-3">
                  <Search className="!w-5 !h-5 text-neutral-scale700 dark:text-neutral-scale500" />
                </div>

                <p
                  className={`text-neutral-scale1600 dark:text-neutral-scale100 ${
                    isRTL
                      ? "fa-body-medium font-vazir text-center"
                      : "en-body-medium font-inter text-center"
                  }`}
                >
                  {isRTL
                    ? "درسی پیدا نشد"
                    : "No courses found"}
                </p>

                <p
                  className={`mt-1 text-neutral-scale900 dark:text-neutral-scale500 ${
                    isRTL
                      ? "fa-caption-1 font-vazir text-center"
                      : "en-caption-1 font-inter text-center"
                  }`}
                >
                  {isRTL
                    ? "نام درس دیگری را جستجو کنید"
                    : "Try searching for another course"}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};