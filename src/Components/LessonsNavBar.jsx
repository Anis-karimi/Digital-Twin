import { useEffect, useRef, useState, useContext } from "react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { navigationApi } from "@/api";

import { lessonItems as defaultLessonItems } from "@/data/LessonsNavBar";

export const LessonsNavBar = ({
  activeTab: controlledActiveTab,
  onTabClick: controlledOnTabClick,
  items: controlledItems,
  dragOffset = 0,
  isDragging = false,
  viewportWidth = 360,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const containerRef = useRef(null);
  const tabsRef = useRef({});
  const [internalItems, setInternalItems] = useState(defaultLessonItems);

  const items = controlledItems && controlledItems.length > 0 ? controlledItems : internalItems;

  // Fetch dynamic navigation tabs from API if not provided via props
  useEffect(() => {
    if (controlledItems && controlledItems.length > 0) return;

    let isMounted = true;
    navigationApi
      .getLessonTabs()
      .then((tabs) => {
        if (isMounted && Array.isArray(tabs) && tabs.length > 0) {
          setInternalItems(tabs);
        }
      })
      .catch((err) => {
        console.warn("Failed to load navigation tabs, using defaults:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [controlledItems]);

  // Determine active tab based on prop or URL path
  const getActiveTab = () => {
    if (controlledActiveTab !== undefined && controlledActiveTab !== null) {
      return controlledActiveTab;
    }
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

  // Helper to measure tab element
  const getTabMetrics = (tabId) => {
    const el = tabsRef.current[tabId];
    const container = containerRef.current;
    if (!el || !container) return null;

    const width = el.offsetWidth;
    const offset = isRTL
      ? container.scrollWidth - (el.offsetLeft + el.offsetWidth)
      : el.offsetLeft;

    return { width, offset };
  };

  // Indicator movement & real-time swipe interpolation
  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current;
      if (!container) return;

      const currentMetrics = getTabMetrics(activeTab);
      if (!currentMetrics) return;

      let targetWidth = currentMetrics.width + 16;
      let targetOffset = Math.max(0, currentMetrics.offset - 8);

      // If user is actively dragging, interpolate between current and adjacent tab
      if (isDragging && dragOffset !== 0) {
        const currentIndex = items.findIndex((item) => item.id === activeTab);
        const effectiveVpWidth = viewportWidth > 0 ? viewportWidth : 360;

        if (isRTL) {
          // In RTL: dragOffset > 0 moves towards NEXT tab (leftwards in DOM)
          if (dragOffset > 0 && currentIndex < items.length - 1) {
            const nextMetrics = getTabMetrics(items[currentIndex + 1]?.id);
            if (nextMetrics) {
              const fraction = Math.min(1, Math.max(0, dragOffset / effectiveVpWidth));
              targetWidth = currentMetrics.width + fraction * (nextMetrics.width - currentMetrics.width) + 16;
              targetOffset = Math.max(0, (currentMetrics.offset + fraction * (nextMetrics.offset - currentMetrics.offset)) - 8);
            }
          } else if (dragOffset < 0 && currentIndex > 0) {
            // dragOffset < 0 moves towards PREVIOUS tab (rightwards in DOM)
            const prevMetrics = getTabMetrics(items[currentIndex - 1]?.id);
            if (prevMetrics) {
              const fraction = Math.min(1, Math.max(0, -dragOffset / effectiveVpWidth));
              targetWidth = currentMetrics.width + fraction * (prevMetrics.width - currentMetrics.width) + 16;
              targetOffset = Math.max(0, (currentMetrics.offset + fraction * (prevMetrics.offset - currentMetrics.offset)) - 8);
            }
          }
        } else {
          // In LTR: dragOffset < 0 moves towards NEXT tab (rightwards in DOM)
          if (dragOffset < 0 && currentIndex < items.length - 1) {
            const nextMetrics = getTabMetrics(items[currentIndex + 1]?.id);
            if (nextMetrics) {
              const fraction = Math.min(1, Math.max(0, -dragOffset / effectiveVpWidth));
              targetWidth = currentMetrics.width + fraction * (nextMetrics.width - currentMetrics.width) + 16;
              targetOffset = Math.max(0, (currentMetrics.offset + fraction * (nextMetrics.offset - currentMetrics.offset)) - 8);
            }
          } else if (dragOffset > 0 && currentIndex > 0) {
            // dragOffset > 0 moves towards PREVIOUS tab (leftwards in DOM)
            const prevMetrics = getTabMetrics(items[currentIndex - 1]?.id);
            if (prevMetrics) {
              const fraction = Math.min(1, Math.max(0, dragOffset / effectiveVpWidth));
              targetWidth = currentMetrics.width + fraction * (prevMetrics.width - currentMetrics.width) + 16;
              targetOffset = Math.max(0, (currentMetrics.offset + fraction * (prevMetrics.offset - currentMetrics.offset)) - 8);
            }
          }
        }
      }

      setIndicatorStyle({
        width: targetWidth,
        offset: targetOffset,
      });
      setIsReady(true);
    };

    updateIndicator();

    if (!isDragging) {
      const timer = setTimeout(updateIndicator, 50);
      window.addEventListener("resize", updateIndicator);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", updateIndicator);
      };
    }
  }, [activeTab, isRTL, items, dragOffset, isDragging, viewportWidth]);

  // Auto scroll active tab into view when settling
  useEffect(() => {
    if (isDragging) return;
    const el = tabsRef.current[activeTab];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab, isDragging, items]);

  const handleTabClick = (item) => {
    if (controlledOnTabClick) {
      controlledOnTabClick(item);
      return;
    }

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
            isReady ? "opacity-100" : "opacity-0"
          }`}
          style={{
            width: indicatorStyle.width ? indicatorStyle.width : 0,
            transform: isRTL
              ? `translateX(-${indicatorStyle.offset}px)`
              : `translateX(${indicatorStyle.offset}px)`,
            transition: isDragging
              ? "none"
              : "transform 300ms cubic-bezier(0.25, 1, 0.5, 1), width 300ms cubic-bezier(0.25, 1, 0.5, 1)",
            willChange: "transform, width",
          }}
        />

        <div
          className="flex min-w-max h-[32px] items-center gap-[20px] px-3.5 py-0 relative whitespace-nowrap"
          role="tablist"
        >
          {items.map((item) => {
            const isActive = activeTab === item.id;
            // The lessons tab translates based on active RTL language.
            // Course tabs originate from the backend database in authentic Persian UTF-8.
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