import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";

import { AppContext } from "@/Context/AppContext";
import { navigationApi } from "@/api";
import { HomeDropdownMenu } from "@/Components/HomeDropdownMenu";
import { LessonsNavBar } from "@/Components/LessonsNavBar";
import { HomeChatFeedSection } from "@/Components/HomeChatFeedSection";
import { StudentsChatFeedSection } from "@/Components/StudentsChatFeedSection";

import MenuIcon from "@/assets/icons/menu.svg?react";
import BellIcon from "@/assets/icons/Bell.svg?react";
import UserIcon from "@/assets/icons/user2.svg?react";

import { lessonItems as defaultLessonItems } from "@/data/LessonsNavBar";

export const TeacherConversationsPage = () => {
  const { isRTL } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [items, setItems] = useState(defaultLessonItems);

  // Viewport measurement
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(360);

  // Swipe & Touch state
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchStartTime = useRef(0);
  const directionLocked = useRef(null); // null | "horizontal" | "vertical"

  // Fetch dynamic tabs from API
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
        console.warn("Failed to load navigation tabs for conversations page:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Track viewport width
  useEffect(() => {
    if (!viewportRef.current) return;

    const updateWidth = () => {
      if (viewportRef.current) {
        setViewportWidth(viewportRef.current.clientWidth || 360);
      }
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(viewportRef.current);
    window.addEventListener("resize", updateWidth);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  // Determine active tab ID from route
  const getActiveTabId = useCallback(() => {
    if (params.lessonId) return params.lessonId;
    const match = location.pathname.match(/\/TeacherLessonsPage\/([^/]+)/);
    if (match) return match[1];
    return "lessons";
  }, [params.lessonId, location.pathname]);

  const activeTabId = getActiveTabId();

  // Find index of current active tab
  const currentIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeTabId)
  );

  // Navigate to target tab
  const navigateToTab = useCallback(
    (item, replace = true) => {
      if (item.id === "lessons") {
        navigate("/", { replace });
      } else {
        navigate(`/TeacherLessonsPage/${item.id}`, { replace });
      }
    },
    [navigate]
  );

  // Reset drag on route change
  useEffect(() => {
    setDragOffset(0);
    setIsDragging(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const wasDraggingRef = useRef(false);

  // Touch Handlers
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    directionLocked.current = null;
    wasDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Detect direction in early gesture
    if (!directionLocked.current) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        directionLocked.current = "vertical";
        return;
      }
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        directionLocked.current = "horizontal";
        wasDraggingRef.current = true;
        setIsDragging(true);
      }
    }

    if (directionLocked.current !== "horizontal") {
      return;
    }

    // Apply elastic resistance at bounds
    let effectiveDeltaX = deltaX;
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === items.length - 1;

    if (isRTL) {
      // In RTL: deltaX > 0 goes to NEXT (index + 1)
      // deltaX < 0 goes to PREV (index - 1)
      if (deltaX > 0 && isLast) {
        effectiveDeltaX = deltaX * 0.25;
      } else if (deltaX < 0 && isFirst) {
        effectiveDeltaX = deltaX * 0.25;
      }
    } else {
      // In LTR: deltaX < 0 goes to NEXT (index + 1)
      // deltaX > 0 goes to PREV (index - 1)
      if (deltaX < 0 && isLast) {
        effectiveDeltaX = deltaX * 0.25;
      } else if (deltaX > 0 && isFirst) {
        effectiveDeltaX = deltaX * 0.25;
      }
    }

    setDragOffset(effectiveDeltaX);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;

    const deltaX = dragOffset;
    const elapsed = Date.now() - touchStartTime.current;
    const width = viewportWidth || 360;
    const wasHorizontal = directionLocked.current === "horizontal";

    touchStartX.current = null;
    touchStartY.current = null;
    directionLocked.current = null;

    if (!wasHorizontal || Math.abs(deltaX) < 5) {
      setIsDragging(false);
      setDragOffset(0);
      wasDraggingRef.current = false;
      return;
    }

    // Mark as having dragged so click events on child cards are absorbed
    setTimeout(() => {
      wasDraggingRef.current = false;
    }, 120);

    // Thresholds: 20% distance or fast flick (> 0.35 px/ms)
    const velocity = Math.abs(deltaX) / Math.max(1, elapsed);
    const distanceThreshold = width * 0.2;
    const isFlick = velocity > 0.35 && Math.abs(deltaX) > 25;
    const passed = Math.abs(deltaX) > distanceThreshold || isFlick;

    let targetIndex = currentIndex;

    if (passed) {
      if (isRTL) {
        // In RTL: swipe right (deltaX > 0) -> Next; swipe left (deltaX < 0) -> Prev
        if (deltaX > 0 && currentIndex < items.length - 1) {
          targetIndex = currentIndex + 1;
        } else if (deltaX < 0 && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        }
      } else {
        // In LTR: swipe left (deltaX < 0) -> Next; swipe right (deltaX > 0) -> Prev
        if (deltaX < 0 && currentIndex < items.length - 1) {
          targetIndex = currentIndex + 1;
        } else if (deltaX > 0 && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        }
      }
    }

    setIsDragging(false);
    setDragOffset(0);

    if (targetIndex !== currentIndex && items[targetIndex]) {
      navigateToTab(items[targetIndex], true);
    }
  };

  const handleTouchCancel = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    directionLocked.current = null;
    setIsDragging(false);
    setDragOffset(0);
    wasDraggingRef.current = false;
  };

  // Mouse drag support for desktop/testing
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    touchStartTime.current = Date.now();
    directionLocked.current = null;
    wasDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.clientX - touchStartX.current;
    const deltaY = e.clientY - touchStartY.current;

    if (!directionLocked.current) {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX)) {
        directionLocked.current = "vertical";
        return;
      }
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        directionLocked.current = "horizontal";
        wasDraggingRef.current = true;
        setIsDragging(true);
      }
    }

    if (directionLocked.current !== "horizontal") return;

    let effectiveDeltaX = deltaX;
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === items.length - 1;

    if (isRTL) {
      if (deltaX > 0 && isLast) effectiveDeltaX = deltaX * 0.25;
      else if (deltaX < 0 && isFirst) effectiveDeltaX = deltaX * 0.25;
    } else {
      if (deltaX < 0 && isLast) effectiveDeltaX = deltaX * 0.25;
      else if (deltaX > 0 && isFirst) effectiveDeltaX = deltaX * 0.25;
    }

    setDragOffset(effectiveDeltaX);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh relative overflow-hidden mx-auto"
      data-id={
        isRTL
          ? activeTabId === "lessons"
            ? "teacher-home-page-fa"
            : "teacher-lesson-page-fa"
          : activeTabId === "lessons"
            ? "teacher-home-page-en"
            : "teacher-lesson-page-en"
      }
    >
      {/* ==================================================
          HEADER
      ================================================== */}
      <header
        className="absolute top-0 left-0 w-full h-[65px] flex z-20"
        aria-label={
          isRTL
            ? activeTabId === "lessons"
              ? "سربرگ صفحه"
              : "سربرگ درس"
            : "Page header"
        }
      >
        <div
          className="w-full h-[65px] flex items-center justify-between px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <h1
            className={`${
              isRTL ? "fa-title-1" : "en-title-1"
            } text-[#f7f7f7] text-center whitespace-nowrap`}
          >
            {isRTL ? "دوقلوی دیجیتال" : "Digital Twin"}
          </h1>

          <div className="flex items-center gap-3">
            {/* Students roster & online statuses icon */}
            <button
              type="button"
              aria-label={isRTL ? "دانشجویان" : "Students"}
              onClick={() =>
                navigate(`/TeacherContacts/${activeTabId !== "lessons" ? activeTabId : "os"}`)
              }
              className="relative flex h-6 w-6 items-center justify-center cursor-pointer transition-transform active:scale-95"
              title={isRTL ? "مشاهده لیست و وضعیت آنلاین دانشجویان" : "View students & online status"}
            >
              <UserIcon className="w-6 h-6 text-neutral-scale70" />
            </button>

            {/* Notifications */}
            <button
              type="button"
              aria-label={isRTL ? "اعلان‌ها" : "Notifications"}
              onClick={() => navigate("/TeacherNotification")}
              className="relative flex h-6 w-6 items-center justify-center cursor-pointer transition-transform active:scale-95"
            >
              <BellIcon className="w-6 h-6 text-neutral-scale70" />
            </button>

            {/* More Menu */}
            <button
              type="button"
              aria-label={isRTL ? "گزینه‌های بیشتر" : "More options"}
              onClick={() => setIsMenuOpen(true)}
              className="relative flex h-6 w-6 items-center justify-center cursor-pointer transition-transform active:scale-95"
            >
              <MenuIcon className="w-6 h-6 text-neutral-scale70" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================
          LESSONS NAV BAR (Animated indicator tracking)
      ================================================== */}
      <section
        aria-label={isRTL ? "نوار درس‌ها" : "Lessons Nav Bar"}
        className="absolute top-[60px] left-0 w-full z-20"
      >
        <LessonsNavBar
          activeTab={activeTabId}
          onTabClick={(item) => navigateToTab(item, false)}
          items={items}
          dragOffset={dragOffset}
          isDragging={isDragging}
          viewportWidth={viewportWidth}
        />
      </section>

      {/* ==================================================
          OVERLAY DROPDOWN MENU
      ================================================== */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            className={`absolute top-3 ${
              isRTL ? "left-4" : "right-4"
            } mt-2 z-50 overflow-hidden rounded-lg shadow-lg`}
          >
            <HomeDropdownMenu />
          </div>
        </>
      )}

      {/* ==================================================
          SWIPEABLE PRE-RENDERED VIEWS TRACK
      ================================================== */}
      <section
        ref={viewportRef}
        aria-label={isRTL ? "بخش گفتگوها" : "Conversations track"}
        className="absolute top-[105px] left-0 right-0 bottom-0 overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClickCapture={(e) => {
          if (wasDraggingRef.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <div className="relative w-full h-full">
          {items.map((item, index) => {
            // Slide positioning based on layout direction
            const offsetPx = isRTL
              ? (currentIndex - index) * viewportWidth + dragOffset
              : (index - currentIndex) * viewportWidth + dragOffset;

            // Only hide distant slides beyond immediate neighbors for performance
            const isDistant = Math.abs(currentIndex - index) > 2;

            return (
              <div
                key={item.id}
                className="absolute inset-0 w-full h-full overflow-y-auto overflow-x-hidden"
                style={{
                  transform: `translate3d(${offsetPx}px, 0, 0)`,
                  transition: isDragging
                    ? "none"
                    : "transform 300ms cubic-bezier(0.25, 1, 0.5, 1)",
                  willChange: "transform",
                  visibility: isDistant ? "hidden" : "visible",
                }}
              >
                {item.id === "lessons" ? (
                  <HomeChatFeedSection />
                ) : (
                  <StudentsChatFeedSection lessonId={item.id} />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default TeacherConversationsPage;
