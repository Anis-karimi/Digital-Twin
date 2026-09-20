import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";

import Chat from "@/assets/icons/Chat.svg?react";
import MyCourses from "@/assets/icons/MyCourses.svg?react";
import Exam from "@/assets/icons/Exam.svg?react";
import Settings from "@/assets/icons/Settings.svg?react";

import ChatFilled from "@/assets/icons/ChatFull.svg?react";
import MyCoursesFilled from "@/assets/icons/MyCoursesFull.svg?react";
import ExamFilled from "@/assets/icons/ExamFull.svg?react";
import SettingsFilled from "@/assets/icons/SettingsFull.svg?react";

export const TeacherNavigationBar = () => {
  const { isRTL } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const itemsRef = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
  });

  const navItems = [
    {
      id: "chats",
      label: isRTL ? "گفتگوها" : "Chats",
      route: "/",
      icon: Chat,
      iconActive: ChatFilled,
      iconClassName: "w-[25px] h-[25px]",
    },
    {
      id: "courses",
      label: isRTL ? "درس‌های من" : "My Courses",
      route: "/TeacherResource",
      icon: MyCourses,
      iconActive: MyCoursesFilled,
      iconClassName: "w-[20px] h-[20px]",
    },
    {
      id: "exams",
      label: isRTL ? "آزمون‌ها" : "My Exams",
      route: "/TeacherExams",
      icon: Exam,
      iconActive: ExamFilled,
      iconClassName: "w-[15px] h-[15px]",
    },
    {
      id: "settings",
      label: isRTL ? "تنظیمات" : "Settings",
      route: "/TeacherSettings",
      icon: Settings,
      iconActive: SettingsFilled,
      iconClassName: "w-[20px] h-[20px]",
    },
  ];

  const isHomePage =
    location.pathname === "/" ||
    location.pathname.startsWith("/TeacherLessonsPage");

  const getActiveId = () => {
    if (isHomePage) return "chats";
    if (location.pathname === "/TeacherResource") return "courses";
    if (location.pathname === "/TeacherExams") return "exams";
    if (location.pathname === "/TeacherSettings") return "settings";

    // Internal sub-routes where no primary nav item should be active
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
              cursor-pointer
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
                text-center
                whitespace-nowrap
                ${
                  isActive
                    ? `text-primery-1000 dark:text-primery-1000 ${
                        isRTL ? "fa-caption-3" : "en-caption-3"
                      }`
                    : `text-neutral-scale1800 dark:text-neutral-scale70 ${
                        isRTL ? "fa-caption-1" : "en-caption-1"
                      }`
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