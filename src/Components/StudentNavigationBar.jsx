import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import "@/styles/fonts.css";

import { Search } from "lucide-react";

import Chat from "@/assets/icons/Chat.svg?react";
import Exam from "@/assets/icons/Exam.svg?react";
import Settings from "@/assets/icons/Settings.svg?react";

import ChatFilled from "@/assets/icons/ChatFull.svg?react";
import SettingsFilled from "@/assets/icons/SettingsFull.svg?react";

export const StudentNavigationBar = () => {
  const { t, isRTL } = useContext(AppContext);
  const location = useLocation();

  const navItems = [
    {
      id: "chats",
      label: t("chats"),

      wrapperClassName: "relative w-[65px] h-12 mt-[-3.00px] mb-[-3.00px]",

      contentClassName:
        "relative left-2.5 w-[46px] h-10 flex flex-col gap-[0.3px]",

      iconWrapperClassName: "ml-[9.3px] w-[25.81px] h-[24.66px] flex",

      icon: Chat,
      iconActive: ChatFilled,

      iconClassName: "flex-1 w-[20.35px]",

      labelClassName: `w-11 h-[15px] ${
        isRTL ? "fa-caption-1" : "en-caption-1"
      } text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap`,
    },

    {
      id: "explor",
      label: t("courses"),

      wrapperClassName: "relative w-[90px] h-12 mt-[-3.00px] mb-[-3.00px]",

      contentClassName:
        "relative top-1 left-[11px] w-[70px] h-10 flex flex-col gap-1.5",

      iconWrapperClassName: "ml-6 w-[21px] h-[15px] flex",

      icon: Explor,

      iconClassName:
        "flex-1 w-[19px] text-neutral-scale1400 dark:text-neutral-scale70",

      labelClassName: `w-[68px] h-[15px] text-neutral-scale1800 dark:text-neutral-scale70 ${
        isRTL ? "fa-caption-1" : "en-caption-1"
      } text-center whitespace-nowrap`,
    },

    {
      id: "settings",
      label: t("settings"),

      activeClassName:
        "relative w-[73px] h-12 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[23px]",

      wrapperClassName: "relative w-[73px] h-12 mt-[-3.00px] mb-[-3.00px]",

      contentClassName:
        "relative top-px left-3 w-[51px] h-10 flex flex-col gap-[3px]",

      iconWrapperClassName: "ml-3.5 w-[22px] h-[21px] flex",

      icon: Settings,
      iconActive: SettingsFilled,

      iconClassName: "flex-1 w-[19.33px]",

      labelClassName: `w-[49px] h-4 ${
        isRTL ? "fa-caption-1" : "en-caption-1"
      } text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap`,
    },
  ];

  const isHomePage =
    location.pathname === "/student" || location.pathname === "/StudentHome";

  const isCoursesPage = location.pathname === "/StudentCourses";

  const isSettingsPage = location.pathname === "/StudentSettings";

  return (
    <nav
      dir="ltr"
      className="fixed left-1/2 -translate-x-1/2 z-50 
        w-80 h-[55px] flex 
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
            top-1/2 
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
              transform: `translate(${indicatorStyle.left + 4}px, -50%)`,
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
              disabled={item.disabled}
              className={` 
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
              ${
                item.disabled
                  ? "cursor-default opacity-50"
                  : "cursor-pointer"
              }
            `}
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
