import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";

import { AppContext } from "@/Context/AppContext";
import { navigationApi, notificationsApi } from "@/api";
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
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

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

    notificationsApi
      .getUnreadNotificationsCount()
      .then((res) => {
        if (isMounted && res && typeof res.count === "number") {
          setUnreadNotificationsCount(res.count);
        }
      })
      .catch(() => {});

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

  // Helper to test if current pathname is a lesson route
  const isLessonPath = useCallback((path) => {
    const p = (path || "").toLowerCase().replace(/\/+$/, "") || "/";
    return p === "/" || p.startsWith("/teacherlessonspage");
  }, []);

  // Determine active lesson tab ID from route
  const getLessonIdFromPath = useCallback(() => {
    if (params.lessonId) return params.lessonId;
    const match = location.pathname.match(/\/TeacherLessonsPage\/([^/]+)/i);
    if (match) return match[1];
    if (location.pathname === "/") return "lessons";
    return null;
  }, [params.lessonId, location.pathname]);

  const [activeTabId, setActiveTabId] = useState(() => {
    const fromPath = getLessonIdFromPath();
    if (fromPath) return fromPath;
    const saved = sessionStorage.getItem("last_teacher_lesson");
    if (saved && saved !== "lessons") return saved;
    return "lessons";
  });

  // Sync activeTabId ONLY when route is a lesson route
  useEffect(() => {
    if (!isLessonPath(location.pathname)) return;

    const fromPath = getLessonIdFromPath() || "lessons";
    setActiveTabId(fromPath);
    sessionStorage.setItem("last_teacher_lesson", fromPath);
  }, [location.pathname, getLessonIdFromPath, isLessonPath]);

  // Find index of current active tab
  const currentIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeTabId)
  );

  // Navigate to target tab (ONLY when on a lesson route)
  const navigateToTab = useCallback(
    (item, replace = true) => {
      if (!isLessonPath(location.pathname)) return;

      if (item.id === "lessons") {
        navigate("/", { replace });
      } else {
        navigate(`/TeacherLessonsPage/${item.id}`, { replace });
      }
    },
    [navigate, location.pathname, isLessonPath]
  );

  // Reset drag state on route change
  useEffect(() => {
    setDragOffset(0);
    setIsDragging(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Reference to lesson Swiper
  const lessonSwiperRef = useRef(null);

  // Sync lesson Swiper when currentIndex changes (ONLY when on a lesson route)
  useEffect(() => {
    if (!isLessonPath(location.pathname)) return;

    const swiper = lessonSwiperRef.current;
    if (swiper && !swiper.destroyed && swiper.activeIndex !== currentIndex) {
      swiper.slideTo(currentIndex, 240, false);
    }
  }, [currentIndex, location.pathname, isLessonPath]);

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
            {location.pathname !== "/" && (
              <button
                type="button"
                aria-label={isRTL ? "دانشجویان" : "Students"}
                onClick={() =>
                  navigate(
                    `/TeacherContacts/${activeTabId !== "lessons" ? activeTabId : "os"}`,
                  )
                }
                className="relative flex h-6 w-6 items-center justify-center cursor-pointer transition-transform active:scale-95"
                title={
                  isRTL
                    ? "مشاهده لیست و وضعیت آنلاین دانشجویان"
                    : "View students & online status"
                }
              >
                <UserIcon className="w-6 h-6 text-neutral-scale70" />
              </button>
            )}

            {/* Notifications */}
            <button
              type="button"
              aria-label={isRTL ? "اعلان‌ها" : "Notifications"}
              onClick={() => navigate("/TeacherNotification")}
              className="relative flex h-6 w-6 items-center justify-center cursor-pointer transition-transform active:scale-95"
            >
              <BellIcon className="w-6 h-6 text-neutral-scale70" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-primery-700 animate-pulse" />
              )}
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
          SWIPEABLE PRE-RENDERED VIEWS TRACK (Nested Swiper)
      ================================================== */}
      <section
        ref={viewportRef}
        aria-label={isRTL ? "بخش گفتگوها" : "Conversations track"}
        className="absolute top-[105px] left-0 right-0 bottom-0 overflow-hidden"
      >
        <Swiper
          className="teacher-lessons-swiper w-full h-full"
          dir="ltr"
          nested={true}
          touchReleaseOnEdges={true}
          slidesPerView={1}
          slidesPerGroup={1}
          spaceBetween={0}
          speed={240}
          threshold={8}
          touchAngle={45}
          simulateTouch={true}
          allowTouchMove={true}
          resistance={true}
          resistanceRatio={0.5}
          onSwiper={(swiper) => {
            lessonSwiperRef.current = swiper;
            swiper.slideTo(currentIndex, 0, false);
          }}
          onSlideChange={(swiper) => {
            if (!isLessonPath(location.pathname)) return;

            const newIndex = swiper.activeIndex;
            if (newIndex >= 0 && newIndex < items.length) {
              const item = items[newIndex];
              if (item && item.id !== activeTabId) {
                setActiveTabId(item.id);
                sessionStorage.setItem("last_teacher_lesson", item.id);
                navigateToTab(item, true);
              }
            }
          }}
          onTouchMove={(swiper) => {
            setIsDragging(true);
            const delta = swiper.touches.currentX - swiper.touches.startX;
            setDragOffset(delta);
          }}
          onTouchEnd={() => {
            setIsDragging(false);
            setDragOffset(0);
          }}
          style={{ width: "100%", height: "100%" }}
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} className="w-full h-full overflow-hidden">
              <div className="w-full h-full overflow-y-auto overflow-x-hidden">
                {item.id === "lessons" ? (
                  <HomeChatFeedSection />
                ) : (
                  <StudentsChatFeedSection lessonId={item.id} />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    </main>
  );
};

export default TeacherConversationsPage;
