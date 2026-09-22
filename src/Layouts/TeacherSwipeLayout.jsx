import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { AppContext } from "@/Context/AppContext";
import { navigationApi } from "@/api";

import { LessonsNavBar } from "@/Components/LessonsNavBar";
import { HomeDropdownMenu } from "@/Components/HomeDropdownMenu";

import menu from "@/assets/icons/menu.svg?react";
import Bell from "@/assets/icons/Bell.svg?react";
import user from "@/assets/icons/user2.svg?react";

import { TeacherHomeContent } from "@/Pages/Teacher/TeacherHome";
import { TeacherLessonsContent } from "@/Pages/Teacher/TeacherLessonPage";

import { lessonItems as defaultLessonItems } from "@/data/LessonsNavBar";

const SWIPE_THRESHOLD = 60;
const SWIPE_ANIMATION_DURATION = 220;

export const TeacherSwipeLayout = () => {
  const { isRTL } = useContext(AppContext);

  const navigate = useNavigate();
  const location = useLocation();

  const viewportRef = useRef(null);

  const touchStartRef = useRef({
    x: 0,
    y: 0,
  });

  const viewportWidthRef = useRef(0);

  const [items, setItems] = useState(defaultLessonItems);

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ==================================================
  // Current page
  // ==================================================

  const isHome = location.pathname === "/";

  const lessonMatch = location.pathname.match(/^\/TeacherLessonsPage\/([^/]+)/);

  const currentLessonId = lessonMatch ? lessonMatch[1] : null;

  const isLessonPage = Boolean(currentLessonId);

  // ==================================================
  // Fetch lesson navigation
  // Same API used by LessonsNavBar
  // ==================================================

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
        console.warn(
          "Failed to load navigation tabs for swipe, using defaults:",
          err,
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ==================================================
  // Home item
  // ==================================================

  const homeItem = {
    id: "lessons",
    label: "درس‌ها",
    labelFa: "درس‌ها",
    labelEn: "Lessons",
  };

  // ==================================================
  // Find current lesson
  // ==================================================

  const currentLessonIndex = items.findIndex(
    (item) => item.id === currentLessonId,
  );

  // ==================================================
  // Previous / Next
  // ==================================================

  let previousItem = null;
  let nextItem = null;

  if (isHome) {
    // Home -> first lesson
    nextItem = items.find((item) => item.id !== "lessons") || null;
  }

  if (isLessonPage) {
    // ----------------------------------------------
    // Previous
    // ----------------------------------------------

    if (currentLessonIndex > 0) {
      const candidate = items[currentLessonIndex - 1];

      if (candidate?.id === "lessons") {
        previousItem = homeItem;
      } else {
        previousItem = candidate;
      }
    } else {
      // First lesson -> Home
      previousItem = homeItem;
    }

    // ----------------------------------------------
    // Next
    // ----------------------------------------------

    if (currentLessonIndex >= 0 && currentLessonIndex < items.length - 1) {
      const candidate = items[currentLessonIndex + 1];

      if (candidate?.id !== "lessons") {
        nextItem = candidate;
      }
    }
  }

  // ==================================================
  // Header actions
  // ==================================================

  const homeHeaderActions = [
    {
      id: "notifications",
      label: "Notifications",
      labelFa: "اعلان‌ها",
      icon: Bell,
    },
    {
      id: "more",
      label: "More options",
      labelFa: "گزینه‌های بیشتر",
      icon: menu,
    },
  ];

  const lessonHeaderActions = [
    {
      id: "students",
      label: "Students",
      labelFa: "دانشجویان",
      icon: user,
    },
    {
      id: "notifications",
      label: "Notifications",
      labelFa: "اعلان‌ها",
      icon: Bell,
    },
    {
      id: "more",
      label: "More options",
      labelFa: "گزینه‌های بیشتر",
      icon: menu,
    },
  ];

  const headerActions = isHome ? homeHeaderActions : lessonHeaderActions;

  // ==================================================
  // Header actions
  // ==================================================

  const handleHeaderAction = (id) => {
    if (id === "more") {
      setIsMenuOpen(true);
    }

    if (id === "notifications") {
      navigate("/TeacherNotification");
    }

    if (id === "students" && currentLessonId) {
      navigate(`/TeacherContacts/${currentLessonId}`);
    }
  };

  // ==================================================
  // Reset after navigation
  // ==================================================

  useEffect(() => {
    setSwipeOffset(0);
    setIsSwiping(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  // ==================================================
  // Touch Start
  // ==================================================

  const handleTouchStart = (event) => {
    if (!viewportRef.current) return;

    viewportWidthRef.current = viewportRef.current.clientWidth;

    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    setIsSwiping(true);
  };

  // ==================================================
  // Touch Move
  // ==================================================

  const handleTouchMove = (event) => {
    const touch = event.touches[0];

    const deltaX = touch.clientX - touchStartRef.current.x;

    const deltaY = touch.clientY - touchStartRef.current.y;

    // Vertical movement should remain normal scrolling
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 10) {
      setSwipeOffset(0);
      return;
    }

    if (Math.abs(deltaX) < 5) return;

    // No next page
    if (deltaX < 0 && !nextItem) {
      setSwipeOffset(deltaX * 0.2);
      return;
    }

    // No previous page
    if (deltaX > 0 && !previousItem) {
      setSwipeOffset(deltaX * 0.2);
      return;
    }

    setSwipeOffset(deltaX);
  };

  // ==================================================
  // Touch End
  // ==================================================

  const handleTouchEnd = () => {
    const offset = swipeOffset;
    const width = viewportWidthRef.current;

    if (!width) {
      setSwipeOffset(0);
      setIsSwiping(false);
      return;
    }

    const shouldGoNext = offset < -SWIPE_THRESHOLD && nextItem;

    const shouldGoPrevious = offset > SWIPE_THRESHOLD && previousItem;

    // ==================================================
    // NEXT
    // ==================================================

    if (shouldGoNext) {
      setSwipeOffset(-width);
      setIsSwiping(false);

      setTimeout(() => {
        if (nextItem.id === "lessons") {
          navigate("/");
        } else {
          navigate(`/TeacherLessonsPage/${nextItem.id}`);
        }
      }, SWIPE_ANIMATION_DURATION);

      return;
    }

    // ==================================================
    // PREVIOUS
    // ==================================================

    if (shouldGoPrevious) {
      setSwipeOffset(width);
      setIsSwiping(false);

      setTimeout(() => {
        if (previousItem.id === "lessons") {
          navigate("/");
        } else {
          navigate(`/TeacherLessonsPage/${previousItem.id}`);
        }
      }, SWIPE_ANIMATION_DURATION);

      return;
    }

    // ==================================================
    // CANCEL
    // ==================================================

    setSwipeOffset(0);
    setIsSwiping(false);
  };

  // ==================================================
  // Render adjacent page
  // ==================================================

  const renderPageContent = (item) => {
    if (!item) return null;

    if (item.id === "lessons") {
      return (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden">
          <TeacherHomeContent />
        </div>
      );
    }

    return (
      <div className="w-full h-full overflow-y-auto overflow-x-hidden">
        <TeacherLessonsContent lessonId={item.id} />
      </div>
    );
  };

  // ==================================================
  // MAIN
  // ==================================================

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh relative overflow-hidden mx-auto"
      data-id={
        isRTL
          ? isHome
            ? "teacher-home-page-fa"
            : "teacher-lesson-page-fa"
          : isHome
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
          isRTL ? (isHome ? "سربرگ صفحه" : "سربرگ درس") : "Page header"
        }
      >
        <div
          className="w-full h-[65px] flex items-center justify-between px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <h1
            className={`${isRTL ? "fa-title-1" : "en-title-1"} text-[#f7f7f7] text-center whitespace-nowrap`}
          >
            {isRTL ? "دوقلوی دیجیتال" : "Digital Twin"}
          </h1>

          <div className="flex items-center gap-3">
            {headerActions.map(({ id, label, labelFa, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={isRTL ? labelFa : label}
                onClick={() => handleHeaderAction(id)}
                className="relative flex h-6 w-6 items-center justify-center cursor-pointer"
              >
                <Icon className="w-6 h-6 text-neutral-scale70" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ==================================================
          LESSONS NAV BAR
      ================================================== */}

      <section
        aria-label={isRTL ? "نوار درس‌ها" : "Lessons Nav Bar"}
        className="absolute top-[60px] left-0 w-full z-20"
      >
        <LessonsNavBar />
      </section>

      {/* ==================================================
          MENU
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
          SWIPE AREA
      ================================================== */}

      <section
        ref={viewportRef}
        className="absolute top-[105px] left-0 right-0 bottom-0 overflow-hidden"
        style={{
          touchAction: "pan-y",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            width: "300%",
            transform: `translateX(calc(-33.333333% + ${swipeOffset}px))`,
            transition: isSwiping
              ? "none"
              : `transform ${SWIPE_ANIMATION_DURATION}ms ease-out`,
          }}
        >
          {/* Previous */}
          <div className="w-1/3 h-full shrink-0 overflow-hidden">
            {renderPageContent(previousItem)}
          </div>

          {/* Current */}
          <div className="w-1/3 h-full shrink-0 overflow-hidden">
            <Outlet />
          </div>

          {/* Next */}
          <div className="w-1/3 h-full shrink-0 overflow-hidden">
            {renderPageContent(nextItem)}
          </div>
        </div>
      </section>
    </main>
  );
};
