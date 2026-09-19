import { Link, useLocation } from "react-router-dom";
import "@/styles/fonts.css";

import Chat from "@/assets/icons/Chat.svg?react";
import MyCourses from "@/assets/icons/MyCourses.svg?react";
import Exam from "@/assets/icons/Exam.svg?react";
import Settings from "@/assets/icons/Settings.svg?react";
import ChatFilled from "@/assets/icons/ChatFull.svg?react";
import MyCoursesFilled from "@/assets/icons/MyCoursesFull.svg?react";
import ExamFilled from "@/assets/icons/ExamFull.svg?react";
import SettingsFilled from "@/assets/icons/SettingsFull.svg?react";

const navItems = [
  {
    id: "chats",
    label: "Chats",
    wrapperClassName: "relative w-[65px] h-11 mt-[-3.00px] mb-[-3.00px]",
    contentClassName:
      "relative left-2.5 w-[46px] h-10 flex flex-col gap-[0.3px]",
    iconWrapperClassName: "ml-[9.3px] w-[25.81px] h-[24.66px] flex",

    icon: Chat,
    iconActive: ChatFilled, // ✅ added

    iconClassName: "flex-1 w-[20.35px]",

    labelClassName:
      "w-11 h-[15px] en-caption-1 text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap ",
  },

  {
    id: "courses",
    label: "My Courses",
    wrapperClassName: "w-[90px] relative h-11 mt-[-3.00px] mb-[-3.00px]",
    contentClassName:
      "relative top-1 left-[11px] w-[70px] h-9 flex flex-col gap-1.5",
    iconWrapperClassName: "ml-6 w-[21px] h-[15px] flex",

    icon: MyCourses,
    iconActive: MyCoursesFilled, // ✅ added

    iconClassName:
      "flex-1 w-[19px] text-neutral-scale1800 dark:text-neutral-scale70",

    labelClassName:
      "w-[68px] h-[15px] text-neutral-scale1800 dark:text-neutral-scale70 en-caption-1 text-center whitespace-nowrap",
  },

  {
    id: "exams",
    label: "My Exams",
    route: "/TeacherExams",
    wrapperClassName: "w-20 relative h-11 mt-[-3.00px] mb-[-3.00px]",
    contentClassName:
      "relative w-[76.25%] h-[84.09%] top-[6.82%] left-[12.50%]",

    icon: Exam,
    iconActive: ExamFilled, // ✅ added

    iconClassName:
      "absolute w-[16px] h-[16px] left-[18px] text-neutral-scale1800 dark:text-neutral-scale70",

    labelClassName:
      "absolute top-[22px] left-0 w-[59px] en-caption-1 text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap",

    isCustom: true,
  },

  {
    id: "settings",
    label: "Settings",
    activeClassName:
      "relative w-[73px] h-11 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[23px]",
    wrapperClassName: "relative w-[73px] h-11 mt-[-3.00px] mb-[-3.00px]",
    contentClassName:
      "relative top-px left-3 w-[51px] h-10 flex flex-col gap-[3px]",
    iconWrapperClassName: "ml-3.5 w-[22px] h-[21px] flex",

    icon: Settings,
    iconActive: SettingsFilled, // ✅ added

    iconClassName: "flex-1 w-[19.33px]",

    labelClassName:
      "w-[49px] h-4 en-caption-1 text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap",

    // labelActiveClassName:
    //   "w-[49px] h-4 en-caption-3 text-primery-1000 text-center whitespace-nowrap",
  },
];

export const TeacherNavigationBar = () => {
  const location = useLocation();

  const isHomePage = location.pathname === "/";
  const isLessonPage = location.pathname.startsWith("/TeacherLessonsPage");
  const isSettingsPage = location.pathname === "/TeacherSettings";
  const isCoursesPage = location.pathname === "/TeacherCourses";
  const isExamsPage = location.pathname === "/TeacherExams";

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 z-50
             w-80 h-[50px] flex
             bg-[#f8fcfd] dark:bg-neutral-scale1300
             border border-neutral-scale100 dark:border-neutral-scale1100
             rounded-[40px] overflow-hidden
             shadow-[0px_-1px_3px_0.1px_#2828281a,0px_1px_3px_0.1px_#2828281a,1px_0px_3px_0.1px_#00000040,-1px_0px_3px_0.1px_#2828281a]"
      aria-label="Bottom navigation"
    >
      <div className="flex mt-1.5 w-[314px] h-[38px] ml-[3px] relative items-center gap-0.5">
        {/* Chats & LessonPage = Home */}
        {isHomePage || isLessonPage ? (
          <div className="relative w-[65px] h-11 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[23px]">
            <div className={navItems[0].contentClassName}>
              <div className={navItems[0].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[0].iconActive || navItems[0].icon;
                  return (
                    <Icon
                      className={`${navItems[0].iconClassName} text-primery-1000`}
                    />
                  );
                })()}
              </div>
              <div
                className={`${navItems[0].labelClassName} text-primery-1000  dark:text-primery-1000 en-caption-3 text-center whitespace-nowrap`}
              >
                {navItems[0].label}
              </div>
            </div>
          </div>
        ) : (
          <Link to="/" className={navItems[0].wrapperClassName}>
            <div className={navItems[0].contentClassName}>
              <div className={navItems[0].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[0].icon;
                  return (
                    <Icon
                      className={`${navItems[0].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
                    />
                  );
                })()}
              </div>
              <div className={navItems[0].labelClassName}>
                {navItems[0].label}
              </div>
            </div>
          </Link>
        )}

        {/* Courses */}
        <div className={navItems[1].wrapperClassName}>
          <div className={navItems[1].contentClassName}>
            <div className={navItems[1].iconWrapperClassName}>
              {(() => {
                const Icon = isCoursesPage
                  ? navItems[1].iconActive || navItems[1].icon
                  : navItems[1].icon;

                return <Icon className={navItems[1].iconClassName} />;
              })()}
            </div>
            <div className={navItems[1].labelClassName}>
              {navItems[1].label}
            </div>
          </div>
        </div>

        {/* Exams */}
        <div className={navItems[2].wrapperClassName}>
          <div className={navItems[2].contentClassName}>
            {(() => {
              const Icon = isExamsPage
                ? navItems[2].iconActive || navItems[2].icon
                : navItems[2].icon;

              return <Icon className={navItems[2].iconClassName} />;
            })()}

            <div className={navItems[2].labelClassName}>
              {navItems[2].label}
            </div>
          </div>
        </div>

        {/* Settings */}
        {isSettingsPage ? (
          <div className="relative w-[73px] h-11 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[23px]">
            <div className={navItems[3].contentClassName}>
              <div className={navItems[3].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[3].iconActive || navItems[3].icon;
                  return (
                    <Icon
                      className={`${navItems[3].iconClassName} text-primery-1000`}
                    />
                  );
                })()}
              </div>

              <div
                className={`${navItems[3].labelClassName} text-primery-1000  dark:text-primery-1000 en-caption-3 text-center whitespace-nowrap`}
              >
                {navItems[3].label}
              </div>
            </div>
          </div>
        ) : (
          <Link to="/TeacherSettings" className={navItems[3].wrapperClassName}>
            <div className={navItems[3].contentClassName}>
              <div className={navItems[3].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[3].icon;
                  return (
                    <Icon
                      className={`${navItems[3].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
                    />
                  );
                })()}
              </div>

              <div className={navItems[3].labelClassName}>
                {navItems[3].label}
              </div>
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
};
