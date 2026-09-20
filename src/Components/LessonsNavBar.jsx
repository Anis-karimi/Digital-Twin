import { useEffect, useRef, useState, useContext } from "react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { navigationApi } from "@/api";
import { lessonItems as defaultLessonItems } from "@/data/LessonsNavBar";

export const LessonsNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const containerRef = useRef(null);
  const tabsRef = useRef({});
  const [items, setItems] = useState(defaultLessonItems);

  // Fetch dynamic navigation tabs from API
  useEffect(() => {
    let isMounted = true;
    navigationApi
      .getLessonTabs()
      .then((tabs) => {
        if (isMounted && Array.isArray(tabs) && tabs.length > 0) {
          setItems(tabs);
        }
      })
      .catch((err) => {
        console.warn("Failed to load navigation tabs, using defaults:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Determine active tab based on current URL path
  const getActiveTab = () => {
    const match = location.pathname.match(/\/TeacherLessonsPage\/([^/]+)/);

    if (match) {
      return match[1];
    }

    return "lessons";
  };

  const activeTab = getActiveTab();

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    offset: 0,
  });
  const [isReady, setIsReady] = useState(false);

  // Indicator movement - computed using offset relative to container scroll content for smooth RTL motion
  useEffect(() => {
    const updateIndicator = () => {
      const el = tabsRef.current[activeTab];
      const container = containerRef.current;
      if (!el || !container) return;

      const width = el.offsetWidth;
      let offset = 0;

      if (isRTL) {
        // In RTL, compute distance from right edge of scrollable content
        offset = container.scrollWidth - (el.offsetLeft + el.offsetWidth);
      } else {
        // In LTR, compute distance from left edge of scrollable content
        offset = el.offsetLeft;
      }

      setIndicatorStyle({
        width,
        offset,
      });
      setIsReady(true);
    };

    updateIndicator();
    // Re-check after layout settles
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab, isRTL, items]);

  // Auto scroll active tab into view
  useEffect(() => {
    const el = tabsRef.current[activeTab];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab, items]);

  const handleTabClick = (item) => {
    if (item.id === "lessons") {
      navigate("/");
      return;
    }

    navigate(`/TeacherLessonsPage/${item.id}`);
  };

  return (
    <nav
      aria-label={isRTL ? "درس‌ها" : "Lessons"}
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full h-16 items-start gap-2.5 p-2.5 z-40"
    >
      <div
        ref={containerRef}
        className="relative flex-1 grow h-[36px] bg-[#f8fcfd] dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[20px] overflow-x-auto overflow-y-hidden scroll-smooth shadow-[0px_-1px_3px_0.1px_#2828281a,0px_1px_3px_0.1px_#2828281a,1px_0px_3px_0.1px_#2828281a,-1px_0px_3px_0.1px_#2828281a]"
      >
        {/* Active tab indicator */}
        <div
          className={`absolute top-1 ${
            isRTL ? "right-0" : "left-0"
          } h-[26px] bg-primery-90 rounded-[21px] pointer-events-none ${
            isReady ? "transition-all duration-300 ease-out opacity-100" : "opacity-0"
          }`}
          style={{
            width: indicatorStyle.width ? indicatorStyle.width + 16 : 0,
            transform: isRTL
              ? `translateX(-${Math.max(0, indicatorStyle.offset - 8)}px)`
              : `translateX(${Math.max(0, indicatorStyle.offset - 8)}px)`,
          }}
        />

        <div
          className="flex min-w-max h-[32px] items-center gap-[20px] px-3.5 py-0 relative whitespace-nowrap"
          role="tablist"
        >
          {items.map((item) => {
            const isActive = activeTab === item.id;
            // The "lessons" tab is a UI navigation item that translates ("درس‌ها" / "Lessons").
            // Course tabs come from the backend and always remain in Persian ("سیستم عامل").
            const displayLabel =
              item.id === "lessons"
                ? isRTL
                  ? item.labelFa || item.label
                  : item.labelEn || item.label
                : item.labelFa || item.label || "سیستم عامل";
            const isPersianLabel = item.id !== "lessons" || /[\u0600-\u06FF]/.test(displayLabel);

            return (
              <button
                key={item.id}
                ref={(el) => (tabsRef.current[item.id] = el)}
                onClick={() => handleTabClick(item)}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`relative ${
                  item.unreadCount ? "w-max" : ""
                } ${isActive ? "h-6" : "h-5"} shrink-0 flex items-center gap-1.5 cursor-pointer`}
              >
                {/* Badge */}
                {item.unreadCount > 0 && (
                  <div className="relative h-[16px] min-w-[16px] w-fit px-[4px] flex items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-full ${
                        isActive ? "bg-primery-1000" : "bg-neutral-scale600"
                      }`}
                    />

                    <div
                      className={`relative top-[1px] ${
                        isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
                      } text-white leading-none text-center`}
                    >
                      {item.unreadCount > 99 ? "+99" : item.unreadCount}
                    </div>
                  </div>
                )}

                {/* Tab Label */}
                <div
                  className={
                    isActive
                      ? `text-primery-1000 ${
                          isRTL || isPersianLabel
                            ? "fa-caption-3 font-vazir"
                            : "en-caption-3 font-inter"
                        } text-center whitespace-nowrap`
                      : `text-neutral-scale1200 dark:text-primery-90 ${
                          isRTL || isPersianLabel
                            ? "fa-caption-1 font-vazir"
                            : "en-caption-1 font-inter"
                        } text-center whitespace-nowrap`
                  }
                  dir={isPersianLabel ? "rtl" : undefined}
                >
                  {displayLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};