import { useEffect, useRef, useState, useContext } from "react";
import "@/styles/Allpages.css";
import { lessonItems } from "@/data/LessonsNavBar";
import "@/styles/fonts.css";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";

export const LessonsNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const containerRef = useRef(null);
  const tabsRef = useRef({});

  // تعیین تب فعال بر اساس URL
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
    left: 0,
  });

  // indicator move - computed using bounding client rect relative to container for perfect RTL/LTR precision
  useEffect(() => {
    const updateIndicator = () => {
      const el = tabsRef.current[activeTab];
      const container = containerRef.current;
      if (!el || !container) return;

      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeLeft = elRect.left - containerRect.left + container.scrollLeft;

      setIndicatorStyle({
        width: elRect.width,
        left: relativeLeft,
      });
    };

    updateIndicator();
    // Re-check after layout settles
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab, isRTL]);

  // auto scroll
  useEffect(() => {
    const el = tabsRef.current[activeTab];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

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
        {/* indicator */}
        <div
          className="absolute top-1 left-0 h-[26px] bg-primery-90 rounded-[21px] transition-all duration-300 ease-out pointer-events-none"
          style={{
            width: indicatorStyle.width ? indicatorStyle.width + 16 : 0,
            transform: `translateX(${indicatorStyle.left - 8}px)`,
          }}
        />

        <div
          className="flex min-w-max h-[32px] items-center gap-[20px] px-3.5 py-0 relative whitespace-nowrap"
          role="tablist"
        >
          {lessonItems.map((item) => {
            const isActive = activeTab === item.id;
            const displayLabel = isRTL
              ? item.labelFa || item.label
              : item.labelEn || item.label;

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
                {/* badge */}
                {item.unreadCount > 0 && (
                  <div className="relative h-[16px] min-w-[16px] w-fit px-[4px] flex items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-full ${
                        isActive ? "bg-primery-1000" : "bg-neutral-scale600"
                      }`}
                    />

                    <div
                      className={`relative top-[1px] ${
                        isRTL ? "fa-caption-2" : "en-caption-2"
                      } text-white leading-none text-center`}
                    >
                      {item.unreadCount > 99 ? "+99" : item.unreadCount}
                    </div>
                  </div>
                )}

                {/* label */}
                <div
                  className={
                    isActive
                      ? `text-primery-1000 ${
                          isRTL ? "fa-caption-3" : "en-caption-3"
                        } text-center whitespace-nowrap`
                      : `text-neutral-scale1200 dark:text-primery-90 ${
                          isRTL ? "fa-caption-1" : "en-caption-1"
                        } text-center whitespace-nowrap`
                  }
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