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

  const items =
    controlledItems && controlledItems.length > 0
      ? controlledItems
      : internalItems;

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

  // Helper to measure tab element (always LTR coordinates)
  const getTabMetrics = (tabId) => {
    const el = tabsRef.current[tabId];
    const container = containerRef.current;
    if (!el || !container) return null;

    const width = el.offsetWidth;
    const offset = el.offsetLeft;

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

      // Interpolate between current and adjacent tab during swipe drag
      if (isDragging && dragOffset !== 0) {
        const currentIndex = items.findIndex((item) => item.id === activeTab);
        const effectiveVpWidth = viewportWidth > 0 ? viewportWidth : 360;

        // In LTR: dragOffset < 0 moves towards NEXT tab (rightwards in DOM)
        if (dragOffset < 0 && currentIndex < items.length - 1) {
          const nextMetrics = getTabMetrics(items[currentIndex + 1]?.id);
          if (nextMetrics) {
            const fraction = Math.min(
              1,
              Math.max(0, -dragOffset / effectiveVpWidth),
            );
            targetWidth =
              currentMetrics.width +
              fraction * (nextMetrics.width - currentMetrics.width) +
              16;
            targetOffset = Math.max(
              0,
              currentMetrics.offset +
                fraction * (nextMetrics.offset - currentMetrics.offset) -
                8,
            );
          }
        } else if (dragOffset > 0 && currentIndex > 0) {
          // dragOffset > 0 moves towards PREVIOUS tab (leftwards in DOM)
          const prevMetrics = getTabMetrics(items[currentIndex - 1]?.id);
          if (prevMetrics) {
            const fraction = Math.min(
              1,
              Math.max(0, dragOffset / effectiveVpWidth),
            );
            targetWidth =
              currentMetrics.width +
              fraction * (prevMetrics.width - currentMetrics.width) +
              16;
            targetOffset = Math.max(
              0,
              currentMetrics.offset +
                fraction * (prevMetrics.offset - currentMetrics.offset) -
                8,
            );
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
  }, [activeTab, items, dragOffset, isDragging, viewportWidth]);

  // Auto scroll active tab into view when settling
  useEffect(() => {
    if (isDragging) return;
    const el = tabsRef.current[activeTab];
    const container = containerRef.current;
    if (!el || !container) return;

    const containerWidth = container.clientWidth;
    const elLeft = el.offsetLeft;
    const elWidth = el.offsetWidth;
    const targetScroll = elLeft - containerWidth / 2 + elWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: "smooth",
    });
  }, [activeTab, isDragging, items]);

  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const dragDeltaXRef = useRef(0);

  // Stop native events from bubbling up to parent swipers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stopPropagation = (e) => {
      e.stopPropagation();
    };

    container.addEventListener("touchstart", stopPropagation, {
      passive: true,
    });
    container.addEventListener("touchmove", stopPropagation, { passive: true });
    container.addEventListener("touchend", stopPropagation, { passive: true });
    container.addEventListener("touchcancel", stopPropagation, {
      passive: true,
    });
    container.addEventListener("mousedown", stopPropagation);
    container.addEventListener("pointerdown", stopPropagation);

    return () => {
      container.removeEventListener("touchstart", stopPropagation);
      container.removeEventListener("touchmove", stopPropagation);
      container.removeEventListener("touchend", stopPropagation);
      container.removeEventListener("touchcancel", stopPropagation);
      container.removeEventListener("mousedown", stopPropagation);
      container.removeEventListener("pointerdown", stopPropagation);
    };
  }, []);

  const finishDrag = (deltaX) => {
    const threshold = 35;
    const currentIndex = items.findIndex((item) => item.id === activeTab);

    // In LTR:
    // Dragging left (deltaX < -threshold) moves to next tab
    // Dragging right (deltaX > threshold) moves to prev tab
    if (deltaX < -threshold) {
      if (currentIndex < items.length - 1) {
        handleTabClick(items[currentIndex + 1]);
      } else if (currentIndex === items.length - 1) {
        // At the end of the lessons, navigate to the parent Courses tab
        sessionStorage.setItem(
          "last_teacher_lesson",
          items[currentIndex]?.id || "lessons",
        );
        navigate("/TeacherCourses");
      }
    } else if (deltaX > threshold) {
      if (currentIndex > 0) {
        handleTabClick(items[currentIndex - 1]);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMouseDownRef.current) return;
      const deltaX = e.pageX - startXRef.current;
      if (Math.abs(deltaX) > 5) {
        hasDraggedRef.current = true;
        dragDeltaXRef.current = deltaX;
        if (containerRef.current) {
          containerRef.current.scrollLeft = startScrollLeftRef.current - deltaX;
        }
      }
    };

    const handleMouseUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;
      if (hasDraggedRef.current) {
        finishDrag(dragDeltaXRef.current);
      }
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 50);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeTab, items]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    dragDeltaXRef.current = 0;
    if (containerRef.current) {
      startScrollLeftRef.current = containerRef.current.scrollLeft;
    }
  };

  const handleTouchStart = (e) => {
    hasDraggedRef.current = false;
    if (e.touches && e.touches[0]) {
      startXRef.current = e.touches[0].pageX;
      startYRef.current = e.touches[0].pageY;
      dragDeltaXRef.current = 0;
      if (containerRef.current) {
        startScrollLeftRef.current = containerRef.current.scrollLeft;
      }
    }
  };

  const handleTouchMove = (e) => {
    if (!e.touches || !e.touches[0]) return;
    const currentX = e.touches[0].pageX;
    const currentY = e.touches[0].pageY;
    const deltaX = currentX - startXRef.current;
    const deltaY = currentY - startYRef.current;

    if (
      !hasDraggedRef.current &&
      Math.abs(deltaY) > Math.abs(deltaX) &&
      Math.abs(deltaY) > 8
    ) {
      return;
    }

    if (Math.abs(deltaX) > 6) {
      hasDraggedRef.current = true;
      dragDeltaXRef.current = deltaX;
    }
  };

  const handleTouchEnd = () => {
    if (hasDraggedRef.current) {
      finishDrag(dragDeltaXRef.current);
    }
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  };

  const handleTabClick = (item) => {
    if (hasDraggedRef.current) return;

    if (controlledOnTabClick) {
      controlledOnTabClick(item);
      return;
    }

    if (item.id === "lessons") {
      navigate("/Teacher");
      return;
    }

    navigate(`/TeacherLessonsPage/${item.id}`);
  };

  return (
    <nav
      aria-label="Lessons"
      dir="ltr"
      className="flex w-full h-16 items-start gap-2.5 p-2.5 z-40 swiper-no-swiping"
    >
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="relative flex-1 grow h-[36px] bg-[#f8fcfd] dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[20px] overflow-x-auto overflow-y-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shadow-[0px_-1px_3px_0.1px_#2828281a,0px_1px_3px_0.1px_#2828281a,1px_0px_3px_0.1px_#2828281a,-1px_0px_3px_0.1px_#2828281a] swiper-no-swiping cursor-grab active:cursor-grabbing select-none"
      >
        {/* Active tab indicator */}
        <div
          className={`absolute top-1 left-0 h-[26px] bg-primery-90 dark:bg-primery-900/40 rounded-[21px] pointer-events-none ${
            isReady ? "opacity-100" : "opacity-0"
          }`}
          style={{
            width: indicatorStyle.width ? indicatorStyle.width : 0,
            transform: `translateX(${indicatorStyle.offset}px)`,
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
            const displayLabel =
              item.id === "lessons"
                ? isRTL
                  ? item.labelFa || item.label || "درس‌ها"
                  : item.labelEn || item.label || "Lessons"
                : item.labelFa || item.label || "سیستم عامل";
            const isPersianLabel = /[\u0600-\u06FF]/.test(displayLabel);

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
                } ${isActive ? "h-6" : "h-5"} shrink-0 flex items-center gap-1.5 cursor-pointer select-none`}
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
                        isPersianLabel
                          ? "fa-caption-2 font-vazir"
                          : "en-caption-2 font-inter"
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
                          isPersianLabel
                            ? "fa-caption-3 font-vazir font-bold"
                            : "en-caption-3 font-inter font-bold"
                        } text-center whitespace-nowrap`
                      : `text-neutral-scale1200 dark:text-primery-90 ${
                          isPersianLabel
                            ? "fa-caption-1 font-vazir"
                            : "en-caption-1 font-inter"
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
