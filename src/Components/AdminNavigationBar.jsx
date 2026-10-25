import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { BookOpen, Users, FolderPlus, Settings as SettingsIcon, CalendarClock } from "lucide-react";

export const AdminNavigationBar = () => {
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
      id: "courses",
      label: isRTL ? "دروس" : "Courses",
      route: "/Admin",
      icon: BookOpen,
      iconClassName: "w-[18px] h-[18px]",
    },
    {
      id: "users",
      label: isRTL ? "کاربران" : "Users",
      route: "/AdminUsers",
      icon: Users,
      iconClassName: "w-[18px] h-[18px]",
    },
    {
      id: "schedule",
      label: isRTL ? "زمان‌بندی" : "Schedule",
      route: "/AdminExamsSchedule",
      icon: CalendarClock,
      iconClassName: "w-[18px] h-[18px]",
    },
    {
      id: "create",
      label: isRTL ? "ثبت درس" : "New",
      route: "/AdminCreateCourse",
      icon: FolderPlus,
      iconClassName: "w-[18px] h-[18px]",
    },
    {
      id: "settings",
      label: isRTL ? "تنظیمات" : "Settings",
      route: "/AdminSettings",
      icon: SettingsIcon,
      iconClassName: "w-[18px] h-[18px]",
    },
  ];

  const getActiveId = () => {
    const p = location.pathname.toLowerCase();
    if (p === "/admin" || p === "/admincourses") return "courses";
    if (p === "/adminusers") return "users";
    if (p === "/adminexamsschedule") return "schedule";
    if (p === "/admincreatecourse") return "create";
    if (p === "/adminsettings") return "settings";
    return null;
  };

  const activeId = getActiveId();

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
        w-[350px] max-w-[95vw] h-[55px] flex
        bg-[#f8fcfd] dark:bg-neutral-scale1300
        border border-neutral-scale100 dark:border-neutral-scale1100
        rounded-[40px] overflow-hidden
        shadow-[0px_-1px_3px_0.1px_#2828281a,0px_1px_3px_0.1px_#2828281a,1px_0px_3px_0.1px_#00000040,-1px_0px_3px_0.1px_#2828281a]"
      aria-label="Admin navigation"
    >
      <div className="relative flex items-center w-full h-full px-1">
        {/* Active Pill Indicator */}
        {activeId && (
          <div
            className="absolute top-1/2 h-[44px] bg-primery-90 dark:bg-primery-900/40 rounded-[23px] transition-all duration-300 ease-out pointer-events-none"
            style={{
              width: `calc(${indicatorStyle.width}px - 6px)`,
              transform: `translate(${indicatorStyle.left + 3}px, -50%)`,
            }}
          />
        )}

        {/* Navigation Item Buttons */}
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              ref={(el) => {
                itemsRef.current[item.id] = el;
              }}
              type="button"
              onClick={() => handleNavigate(item)}
              className="relative z-10 flex flex-col items-center justify-center flex-1 h-11 shrink-0 cursor-pointer transition-colors"
              aria-current={isActive ? "page" : undefined}
            >
              <div className="h-[22px] flex items-center justify-center">
                <Icon
                  className={`${item.iconClassName} ${
                    isActive
                      ? "text-primery-1000 dark:text-primery-300 stroke-[2.2px]"
                      : "text-neutral-scale1800 dark:text-neutral-scale70 opacity-75 stroke-[1.8px]"
                  }`}
                />
              </div>

              <span
                className={`text-[10px] leading-tight select-none mt-0.5 ${
                  isRTL ? "font-vazir" : "font-inter"
                } ${
                  isActive
                    ? "text-primery-1000 dark:text-primery-300 font-bold"
                    : "text-neutral-scale1800 dark:text-neutral-scale70 opacity-70 font-medium"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminNavigationBar;
