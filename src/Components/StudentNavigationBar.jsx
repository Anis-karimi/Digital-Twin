import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";

import { Search } from "lucide-react";

import Chat from "@/assets/icons/Chat.svg?react";
import Exam from "@/assets/icons/Exam.svg?react";
import Settings from "@/assets/icons/Settings.svg?react";

import ChatFilled from "@/assets/icons/ChatFull.svg?react";
import ExamFilled from "@/assets/icons/ExamFull.svg?react";
import SettingsFilled from "@/assets/icons/SettingsFull.svg?react";
import { chatHistoryApi } from "@/api";

export const StudentNavigationBar = () => {
  const { t, isRTL, currentUser } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const itemsRef = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
  });
  const [unreadCommentsCount, setUnreadCommentsCount] = useState(0);

  const studentId = currentUser?.user_id || "ef6125a3-d179-442c-a9be-b4cd82e8ada6";

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = () => {
      chatHistoryApi.getUnreadCommentsSummary(studentId)
        .then((res) => {
          if (isMounted && res && typeof res.unread_count === "number") {
            setUnreadCommentsCount(res.unread_count);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    window.addEventListener("focus", fetchUnread);
    window.addEventListener("comments-read-updated", fetchUnread);
    const interval = setInterval(fetchUnread, 12000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", fetchUnread);
      window.removeEventListener("comments-read-updated", fetchUnread);
      clearInterval(interval);
    };
  }, [studentId]);

  const navItems = [
    {
      id: "chats",
      label: t("chats"),
      route: "/Student",
      icon: Chat,
      iconActive: ChatFilled,
      iconClassName: "w-[25px] h-[25px]",
    },
    {
      id: "explore",
      label: t("explor") || (isRTL ? "کاوش" : "Explore"),
      route: "/StudentExplore",
      icon: Search,
      iconActive: Search,
      iconClassName: "w-[21px] h-[20px]",
      strokeWidth: 1.35,
    },
    {
      id: "exams",
      label: t("exams"),
      route: "/StudentExams",
      icon: Exam,
      iconActive: ExamFilled,
      iconClassName: "w-[15px] h-[15px]",
    },
    {
      id: "settings",
      label: t("settings"),
      route: "/StudentSettings",
      icon: Settings,
      iconActive: SettingsFilled,
      iconClassName: "w-[20px] h-[20px]",
    },
  ];

  const isHomePage =
    location.pathname.toLowerCase() === "/student" ||
    location.pathname === "/StudentHome" ||
    location.pathname.toLowerCase() === "/students";

  const getActiveId = () => {
  if (isHomePage) return "chats";

  if (location.pathname === "/StudentExplore") {
    return "explore";
  }

  if (
    location.pathname === "/StudentSettings" ||
    location.pathname.toLowerCase() === "/language" ||
    location.pathname.toLowerCase() === "/theme"
  ) {
    return "settings";
  }

  if (
    location.pathname.toLowerCase() === "/studentexams" ||
    location.pathname.toLowerCase().startsWith("/studentexam")
  ) {
    return "exams";
  }

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
    if (item.disabled || !item.route) return;
    navigate(item.route);
  };


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
              ${item.disabled ? "cursor-default opacity-50" : "cursor-pointer"}
            `}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon */}
              <div className="relative h-[25px] flex items-center justify-center">
                <Icon
                  className={`
    ${item.iconClassName || "w-[20px] h-[20px]"}
    ${
      isActive
        ? "text-primery-1000"
        : "text-neutral-scale1800 dark:text-neutral-scale70"
    }
  `}
                  strokeWidth={item.strokeWidth}
                />
                {item.id === "chats" && unreadCommentsCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#2481cc] dark:bg-[#52a2f6] text-white font-mono text-[9px] font-bold flex items-center justify-center leading-none shadow-xs">
                    {unreadCommentsCount > 9 ? "+9" : unreadCommentsCount}
                  </span>
                )}
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
