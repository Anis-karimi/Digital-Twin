import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
    route: "/",
    icon: Chat,
    iconActive: ChatFilled,
    iconClassName: "w-[25px] h-[25px]",
  },
  {
    id: "courses",
    label: "Courses",
    route: "/TeacherResource",
    icon: MyCourses,
    iconActive: MyCoursesFilled,
    iconClassName: "w-[20px] h-[20px]",
  },
  {
    id: "exams",
    label: "Exams",
    route: "/TeacherExams",
    icon: Exam,
    iconActive: ExamFilled,
    iconClassName: "w-[15px] h-[15px]",
  },
  {
    id: "settings",
    label: "Settings",
    route: "/TeacherSettings",
    icon: Settings,
    iconActive: SettingsFilled,
    iconClassName: "w-[20px] h-[20px]",
  },
];

export const TeacherNavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const itemsRef = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
  });

  const isHomePage =
    location.pathname === "/" ||
    location.pathname.startsWith("/TeacherLessonsPage");

  const getActiveId = () => {
    if (isHomePage) return "chats";

    if (location.pathname === "/TeacherResource") return "courses";
    if (location.pathname === "/TeacherExams") return "exams";
    if (location.pathname === "/TeacherSettings") return "settings";

    // صفحات داخلی که نباید هیچ Nav Item ای فعال باشد
    return null;
  };

  const activeId = getActiveId();

  // Active indicator position
  useEffect(() => {
    const el = itemsRef.current[activeId];

    if (!el) return;

    setIndicatorStyle({
      width: el.offsetWidth,
      left: el.offsetLeft,
    });
  }, [activeId, location.pathname]);

  const handleNavigate = (item) => {
    navigate(item.route);
  };

  const captionClass = isRTL ? "fa-caption-1" : "en-caption-1";
  const activeCaptionClass = isRTL ? "fa-caption-3" : "en-caption-3";

  const navItems = [
    {
      id: "chats",
      label: isRTL ? "گفتگوها" : "Chats",
      wrapperClassName: "relative w-[65px] h-11 mt-[-3.00px] mb-[-3.00px]",
      contentClassName:
        "relative left-2.5 w-[46px] h-10 flex flex-col gap-[0.3px]",
      iconWrapperClassName: "ml-[9.3px] w-[25.81px] h-[24.66px] flex",
      icon: Chat,
      iconActive: ChatFilled,
      iconClassName: "flex-1 w-[20.35px]",
      labelClassName: `w-11 h-[15px] ${captionClass} text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap`,
    },
    {
      id: "courses",
      label: isRTL ? "درس‌های من" : "My Courses",
      wrapperClassName: "w-[90px] relative h-11 mt-[-3.00px] mb-[-3.00px]",
      contentClassName:
        "relative top-1 left-[11px] w-[70px] h-9 flex flex-col gap-1.5",
      iconWrapperClassName: "ml-6 w-[21px] h-[15px] flex",
      icon: MyCourses,
      iconActive: MyCoursesFilled,
      iconClassName:
        "flex-1 w-[19px] text-neutral-scale1800 dark:text-neutral-scale70",
      labelClassName: `w-[68px] h-[15px] text-neutral-scale1800 dark:text-neutral-scale70 ${captionClass} text-center whitespace-nowrap`,
    },
    {
      id: "exams",
      label: isRTL ? "آزمون‌ها" : "My Exams",
      route: "/TeacherExams",
      wrapperClassName: "w-20 relative h-11 mt-[-3.00px] mb-[-3.00px]",
      contentClassName:
        "relative w-[76.25%] h-[84.09%] top-[6.82%] left-[12.50%]",
      icon: Exam,
      iconActive: ExamFilled,
      iconClassName:
        "absolute w-[16px] h-[16px] left-[18px] text-neutral-scale1800 dark:text-neutral-scale70",
      labelClassName: `absolute top-[22px] left-0 w-[59px] ${captionClass} text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap`,
      isCustom: true,
    },
    {
      id: "settings",
      label: isRTL ? "تنظیمات" : "Settings",
      activeClassName:
        "relative w-[73px] h-11 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[23px]",
      wrapperClassName: "relative w-[73px] h-11 mt-[-3.00px] mb-[-3.00px]",
      contentClassName:
        "relative top-px left-3 w-[51px] h-10 flex flex-col gap-[3px]",
      iconWrapperClassName: "ml-3.5 w-[22px] h-[21px] flex",
      icon: Settings,
      iconActive: SettingsFilled,
      iconClassName: "flex-1 w-[19.33px]",
      labelClassName: `w-[49px] h-4 ${captionClass} text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap`,
    },
  ];

  return (
    <nav
      dir="ltr"
      className="fixed left-1/2 -translate-x-1/2 z-50
        w-80 h-[50px] flex
        bg-[#f8fcfd] dark:bg-neutral-scale1300
        border border-neutral-scale100 dark:border-neutral-scale1100
        rounded-[40px] overflow-hidden
        shadow-[0px_-1px_3px_0.1px_#2828281a,0px_1px_3px_0.1px_#2828281a,1px_0px_3px_0.1px_#00000040,-1px_0px_3px_0.1px_#2828281a]"
      aria-label="Bottom navigation"
    >
      <div
        className="
        relative
        flex
        items-center
        w-full
        h-full
      "
      >
        {/* Active Indicator */}
        {activeId && (
          <div
            className="
            absolute
            top-[3px]
            h-[44px]
            bg-primery-90
            rounded-[23px]
            transition-all
            duration-300
            ease-out
            pointer-events-none
          "
            style={{
              width: `calc(${indicatorStyle.width}px - 10px)`,
              transform: `translateX(${indicatorStyle.left + 4}px)`,
            }}
          />
        )}

        {/* Navigation Items */}
        {navItems.map((item) => {
          const isActive = activeId === item.id;

          const Icon = isActive ? item.iconActive || item.icon : item.icon;

          return (
            <button
              key={item.id}
              ref={(el) => {
                itemsRef.current[item.id] = el;
              }}
              type="button"
              onClick={() => handleNavigate(item)}
              className="
              relative
              z-10
              flex
              flex-col
              items-center
              justify-center
              gap-[0px]
              flex-1
              h-11
              shrink-0
            "
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon */}
              <div className="h-[25px] flex items-center justify-center">
                <Icon
                  className={`
            ${item.iconClassName || "w-[20px] h-[20px]"}
            ${
              isActive
                ? "text-primery-1000"
                : "text-neutral-scale1800 dark:text-neutral-scale70"
            }
          `}
                />
              </div>

              {/* Label */}
              <div
                className={`
                h-[15px]
                en-caption-1
                text-center
                whitespace-nowrap
                ${
                  isActive
                    ? "text-primery-1000 dark:text-primery-1000 en-caption-3"
                    : "text-neutral-scale1800 dark:text-neutral-scale70"
                }
              `}
              >
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};