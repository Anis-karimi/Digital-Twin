import chatgptImageApr202026033358Pm1 from "./chatgpt-image-apr-20-2026-03-33-58-PM-1.png";
import chatgptImageApr202026033358Pm12 from "./chatgpt-image-apr-20-2026-03-33-58-PM-1-2.png";
import chatgptImageApr202026033358Pm13 from "./chatgpt-image-apr-20-2026-03-33-58-PM-1-3.png";
import chatgptImageApr202026033358Pm14 from "./chatgpt-image-apr-20-2026-03-33-58-PM-1-4.png";
import chatgptImageApr202026033358Pm15 from "./chatgpt-image-apr-20-2026-03-33-58-PM-1-5.png";
import chatgptImageApr202026033358Pm16 from "./chatgpt-image-apr-20-2026-03-33-58-PM-1-6.png";
import image1 from "./image.png";
import image from "./image.svg";
import line1 from "./line-1.svg";
import line12 from "./line-1-2.svg";
import line13 from "./line-1-3.svg";
import line14 from "./line-1-4.svg";
import line15 from "./line-1-5.svg";
import profilePhoto from "./profile-photo.png";
import profilePhoto2 from "./profile-photo-2.png";
import profilePhoto3 from "./profile-photo-3.png";
import profilePhoto4 from "./profile-photo-4.png";
import profilePhoto5 from "./profile-photo-5.png";

const courseCategories = [
  {
    id: "operating-systems",
    name: "سیستم عامل",
    image: profilePhoto,
    labelClassName: "left-[25px]",
  },
  {
    id: "security",
    name: "امنیت",
    image: profilePhoto2,
    labelClassName: "left-9",
  },
  {
    id: "artificial-intelligence",
    name: "هوش مصنوعی",
    image: profilePhoto3,
    labelClassName: "left-[22px]",
  },
  {
    id: "software-engineering",
    name: "مهندسی نرم‌افزار",
    image: profilePhoto4,
    labelClassName: "left-5",
  },
  {
    id: "technical-language",
    name: "زبان تخصصی",
    image: profilePhoto5,
    labelClassName: "left-6",
  },
];

const recentCourses = [
  {
    id: "operating-systems",
    name: "سیستم عامل",
    visibility: "Privet",
    image: chatgptImageApr202026033358Pm1,
    divider: line1,
    nameClassName: "top-0 left-[42px] w-[54px]",
    visibilityClassName: "left-[calc(50.00%_-_140px)] w-[22px]",
  },
  {
    id: "security",
    name: "امنیت",
    visibility: "Privet",
    image: image1,
    divider: image,
    nameClassName: "top-px left-[42px] w-[27px]",
    visibilityClassName: "left-[42px] w-[22px]",
  },
  {
    id: "mathematics-1",
    name: "ریاضی 1",
    visibility: "Public",
    image: chatgptImageApr202026033358Pm12,
    divider: line12,
    nameClassName: "top-px left-[42px] w-[35px]",
    visibilityClassName: "left-[42px] w-6",
  },
  {
    id: "physics-2",
    name: "فیزیک 2",
    visibility: "Public",
    image: chatgptImageApr202026033358Pm13,
    divider: line13,
    nameClassName: "top-px left-[42px] w-[35px]",
    visibilityClassName: "left-[42px] w-6",
  },
  {
    id: "signals-and-systems",
    name: "سیگنال ها و سیستم ها",
    visibility: "Privet",
    image: chatgptImageApr202026033358Pm14,
    divider: line14,
    nameClassName: "top-px left-[42px] w-[95px]",
    visibilityClassName: "left-[42px] w-[22px]",
  },
  {
    id: "family-knowledge",
    name: "دانش خانواده",
    visibility: "Public",
    image: chatgptImageApr202026033358Pm15,
    divider: line15,
    nameClassName: "top-px left-[42px] w-[54px]",
    visibilityClassName: "left-[43px] w-6",
  },
  {
    id: "physical-education-1",
    name: "تربیت بدنی 1",
    visibility: "Public",
    image: chatgptImageApr202026033358Pm16,
    divider: null,
    nameClassName: "top-px left-[42px] w-[97px]",
    visibilityClassName: "left-[42px] w-[39px]",
  },
];

export const CoursesOverviewSection = () => {
  const handleCourseSelection = (courseId) => {
    window.dispatchEvent(
      new CustomEvent("course-select", {
        detail: { courseId },
      }),
    );
  };

  return (
    <section
      className="absolute top-[82px] left-0 w-[360px] h-[651px] flex flex-col overflow-y-scroll"
      aria-labelledby="my-courses-heading"
    >
      <header className="flex -ml-px w-[360px] h-[22px] relative mt-px items-center justify-center gap-2.5 pl-2.5 pr-[277px] py-0.5 bg-neutral-scale80">
        <h2
          id="my-courses-heading"
          className="relative w-fit mt-[-1.00px] font-EN-inter-caption-3 font-[number:var(--EN-inter-caption-3-font-weight)] text-neutral-scale600 text-[length:var(--EN-inter-caption-3-font-size)] tracking-[var(--EN-inter-caption-3-letter-spacing)] leading-[var(--EN-inter-caption-3-line-height)] whitespace-nowrap [font-style:var(--EN-inter-caption-3-font-style)]"
        >
          My Courses
        </h2>
      </header>
      <nav
        className="w-[360px] h-[66px] flex overflow-x-scroll"
        aria-label="Course categories"
      >
        <div className="flex w-[406px] h-[66px] -ml-3.5 relative items-center pl-0 pr-2.5 py-[5px] overflow-y-scroll">
          {courseCategories.map((category, index) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCourseSelection(category.id)}
              className={`relative w-[93px] h-[57px] rounded-[13px] overflow-hidden border-0 bg-transparent p-0 text-left ${
                index === 0 ? "" : "ml-[-30px]"
              } ${index === courseCategories.length - 1 ? "!w-[91px]" : ""}`}
              aria-label={category.name}
            >
              <img
                className="absolute top-[3px] left-[27px] w-[38px] h-[38px] aspect-[1] object-cover"
                alt=""
                src={category.image}
              />
              <span
                dir="rtl"
                className={`top-[43px] ${category.labelClassName} font-vazir text-[length:var(--FA-vazirmatn-caption-5-font-size)] text-center leading-[var(--FA-vazirmatn-caption-5-line-height)] whitespace-nowrap absolute font-FA-vazirmatn-caption-5 font-[number:var(--FA-vazirmatn-caption-5-font-weight)] text-black tracking-[var(--FA-vazirmatn-caption-5-letter-spacing)] [direction:rtl] [font-style:var(--FA-vazirmatn-caption-5-font-style)]`}
              >
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </nav>
      <section
        className="flex -ml-px w-[360px] h-[315px] relative mt-[5px] flex-col items-center gap-[5px]"
        aria-labelledby="recent-courses-heading"
      >
        <header className="relative self-stretch w-full h-[22px] bg-neutral-scale80">
          <h3
            id="recent-courses-heading"
            className="absolute top-0.5 left-2.5 font-EN-inter-caption-3 font-[number:var(--EN-inter-caption-3-font-weight)] text-neutral-scale600 text-[length:var(--EN-inter-caption-3-font-size)] tracking-[var(--EN-inter-caption-3-letter-spacing)] leading-[var(--EN-inter-caption-3-line-height)] whitespace-nowrap [font-style:var(--EN-inter-caption-3-font-style)]"
          >
            Resent
          </h3>
        </header>
        <ul className="flex flex-col w-[360px] items-start gap-[5px] pl-2.5 pr-0 py-0 absolute top-[29px] left-0 list-none m-0">
          {recentCourses.map((course) => (
            <li
              key={course.id}
              className={
                course.divider
                  ? "relative w-[364px] h-9 mr-[-14.00px]"
                  : "relative w-[143.09px] h-[32.51px]"
              }
            >
              <button
                type="button"
                onClick={() => handleCourseSelection(course.id)}
                className="absolute inset-0 w-full h-full border-0 bg-transparent p-0 text-left"
                aria-label={`${course.name}, ${course.visibility}`}
              >
                <img
                  className="absolute top-0 left-0 w-[33px] h-[33px] aspect-[1] object-cover"
                  alt=""
                  src={course.image}
                />
                <span
                  dir="rtl"
                  className={`absolute ${course.nameClassName} font-vazir text-[length:var(--FA-vazirmatn-caption-4-font-size)] text-left leading-[var(--FA-vazirmatn-caption-4-line-height)] font-FA-vazirmatn-caption-4 font-[number:var(--FA-vazirmatn-caption-4-font-weight)] text-black tracking-[var(--FA-vazirmatn-caption-4-letter-spacing)] [direction:rtl] [font-style:var(--FA-vazirmatn-caption-4-font-style)]`}
                >
                  {course.name}
                </span>
                <span
                  className={`absolute top-[18px] ${course.visibilityClassName} font-FA-vazirmatn-caption-5 font-[number:var(--FA-vazirmatn-caption-5-font-weight)] text-neutral-scale1100 text-[length:var(--FA-vazirmatn-caption-5-font-size)] tracking-[var(--FA-vazirmatn-caption-5-letter-spacing)] leading-[var(--FA-vazirmatn-caption-5-line-height)] [font-style:var(--FA-vazirmatn-caption-5-font-style)]`}
                >
                  {course.visibility}
                </span>
                {course.divider && (
                  <img
                    className="absolute top-9 left-[42px] w-[318px] h-px object-cover"
                    alt=""
                    src={course.divider}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
};
