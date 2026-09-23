import "@/styles/Allpages.css";
import "@/styles/fonts.css";

import { useState, useContext, useEffect, useRef } from "react";
import { AppContext } from "@/Context/AppContext";
import { HomeDropdownMenu } from "@/Components/HomeDropdownMenu";
import { StudentsChatFeedSection } from "@/Components/StudentsChatFeedSection";
import { LessonsNavBar } from "@/Components/LessonsNavBar";

import menu from "@/assets/icons/menu.svg?react";
import Bell from "@/assets/icons/Bell.svg?react";
import user from "@/assets/icons/user2.svg?react";

import { useNavigate, useParams } from "react-router-dom";
import { navigationApi } from "@/api";

const headerActions = [
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

export const TeacherLessonsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigate = useNavigate();
  const { lessonId } = useParams();
  const { isRTL } = useContext(AppContext);

  // ==========================================
  // Swipe state
  // ==========================================

  const [lessonItems, setLessonItems] = useState([]);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // ==========================================
  // Get lesson order from API
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    navigationApi
      .getLessonTabs()
      .then((tabs) => {
        if (!isMounted) return;

        if (Array.isArray(tabs) && tabs.length > 0) {
          setLessonItems(tabs);
        }
      })
      .catch((err) => {
        console.warn("Failed to load lesson tabs for swipe navigation:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // Find current lesson index
  // ==========================================

  const currentIndex = lessonItems.findIndex((item) => item.id === lessonId);

  // ==========================================
  // Navigate to previous / next lesson
  // ==========================================

  const navigateToIndex = (index) => {
    if (index < 0 || index >= lessonItems.length) {
      return;
    }

    const item = lessonItems[index];

    // "lessons" represents Home
    if (item.id === "lessons") {
      navigate("/");
      return;
    }

    navigate(`/TeacherLessonsPage/${item.id}`);
  };

  // ==========================================
  // Touch Start
  // ==========================================

  const handleTouchStart = (e) => {
    // فقط یک انگشت
    if (e.touches.length !== 1) return;

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;

    setIsSwiping(false);
    setSwipeOffset(0);
  };

  // ==========================================
  // Touch Move
  // ==========================================

  const handleTouchMove = (e) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      e.touches.length !== 1
    ) {
      return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // اگر حرکت بیشتر عمودی باشد،
    // اجازه می‌دهیم اسکرول معمولی صفحه انجام شود.
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }

    // هنوز حرکت افقی به اندازه کافی شروع نشده
    if (Math.abs(deltaX) < 5) {
      return;
    }

    setIsSwiping(true);

    /*
      کمی مقاومت در انتهای لیست ایجاد می‌کنیم.
      یعنی اگر روی اولین یا آخرین صفحه باشیم،
      صفحه فقط مقدار کمی حرکت می‌کند و برمی‌گردد.
    */

    let offset = deltaX;

    const isAtFirstPage = currentIndex <= 0;
    const isAtLastPage =
      currentIndex >= 0 && currentIndex === lessonItems.length - 1;

    // LTR:
    // swipe left => deltaX منفی => next
    // swipe right => deltaX مثبت => previous

    if (isRTL) {
      // فارسی
      if (isAtFirstPage && deltaX < 0) {
        offset = deltaX * 0.25;
      }

      if (isAtLastPage && deltaX > 0) {
        offset = deltaX * 0.25;
      }
    } else {
      // انگلیسی
      if (isAtFirstPage && deltaX > 0) {
        offset = deltaX * 0.25;
      }

      if (isAtLastPage && deltaX < 0) {
        offset = deltaX * 0.25;
      }
    }

    setSwipeOffset(offset);
  };

  // ==========================================
  // Touch End
  // ==========================================

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const threshold = 70;
    const offset = swipeOffset;

    touchStartX.current = null;
    touchStartY.current = null;

    // اگر حرکت خیلی کم بوده، فقط برگرد سر جای خودش
    if (!isSwiping || Math.abs(offset) < threshold) {
      setSwipeOffset(0);
      setIsSwiping(false);
      return;
    }

    // ========================================
    // Determine target based on direction
    // ========================================

    let targetIndex = null;
    let exitOffset = 0;

    if (isRTL) {
      // ======================================
      // فارسی
      // Swipe RIGHT → Next
      // Swipe LEFT  → Previous
      // ======================================

      if (offset > threshold) {
        // Swipe Right → Next
        if (currentIndex < lessonItems.length - 1) {
          targetIndex = currentIndex + 1;
          exitOffset = window.innerWidth;
        }
      } else if (offset < -threshold) {
        // Swipe Left → Previous
        if (currentIndex > 0) {
          targetIndex = currentIndex - 1;
          exitOffset = -window.innerWidth;
        }
      }
    } else {
      // ======================================
      // انگلیسی
      // Swipe LEFT  → Next
      // Swipe RIGHT → Previous
      // ======================================

      if (offset < -threshold) {
        // Swipe Left → Next
        if (currentIndex < lessonItems.length - 1) {
          targetIndex = currentIndex + 1;
          exitOffset = -window.innerWidth;
        }
      } else if (offset > threshold) {
        // Swipe Right → Previous
        if (currentIndex > 0) {
          targetIndex = currentIndex - 1;
          exitOffset = window.innerWidth;
        }
      }
    }

    // ========================================
    // Navigate
    // ========================================

    if (targetIndex !== null) {
      setSwipeOffset(exitOffset);

      setTimeout(() => {
        navigateToIndex(targetIndex);

        requestAnimationFrame(() => {
          setSwipeOffset(0);
        });
      }, 180);
    } else {
      setSwipeOffset(0);
    }

    setIsSwiping(false);
  };

  // ==========================================
  // Touch Cancel
  // ==========================================

  const handleTouchCancel = () => {
    touchStartX.current = null;
    touchStartY.current = null;

    setSwipeOffset(0);
    setIsSwiping(false);
  };

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh relative overflow-hidden mx-auto"
      data-id={isRTL ? "teacher-lesson-page-fa" : "teacher-home-page-en"}
    >
      {/* ==========================================
          HEADER
      ========================================== */}

      <header
        className="absolute top-0 left-0 w-full h-[65px] flex z-10"
        aria-label={isRTL ? "سربرگ درس" : "Page header"}
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
            {headerActions.map(({ id, label, labelFa, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={isRTL ? labelFa : label}
                onClick={() => {
                  if (id === "more") {
                    setIsMenuOpen(true);
                  }

                  if (id === "notifications") {
                    navigate("/TeacherNotification");
                  }

                  if (id === "students") {
                    navigate(`/TeacherContacts/${lessonId}`);
                  }
                }}
                className="relative flex h-6 w-6 items-center justify-center cursor-pointer"
              >
                <Icon className="w-6 h-6 text-neutral-scale70" />
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ==========================================
          LESSON NAV BAR
      ========================================== */}

      <section
        aria-label={isRTL ? "نوار درس‌ها" : "Lessons Nav Bar"}
        className="absolute top-[60px] left-0 w-full z-10"
      >
        <LessonsNavBar />
      </section>

      {/* ==========================================
          SWIPEABLE CONTENT
      ========================================== */}

      <section
        aria-label={isRTL ? "پیام‌های درس" : "Course chat feed"}
        className="absolute top-[105px] left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden"
        style={{
          transform: `translateX(${swipeOffset}px)`,

          transition: isSwiping
            ? "none"
            : "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",

          touchAction: "pan-y",
          willChange: "transform",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <StudentsChatFeedSection lessonId={lessonId} />
      </section>

      {/* ==========================================
          OVERLAY MENU
      ========================================== */}

      <div className="relative">
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu */}
            <div
              className={`absolute top-3 ${
                isRTL ? "left-4" : "right-4"
              } mt-2 z-50 overflow-hidden rounded-lg shadow-lg`}
            >
              <HomeDropdownMenu />
            </div>
          </>
        )}
      </div>
    </main>
  );
};;