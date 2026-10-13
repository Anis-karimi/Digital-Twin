import React, { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { AppContext } from "@/Context/AppContext";
import { TeacherNavigationBar } from "@/Components/TeacherNavigationBar";
import { FooterGlass } from "@/Components/FooterGlass";

import { TeacherHome } from "@/Pages/Teacher/TeacherHome";
import { TeacherCourses } from "@/Pages/Teacher/TeacherCoursesPage";
import { TeacherExams } from "@/Pages/Teacher/TeacherExamsPage";
import { TeacherSettings } from "@/Pages/Teacher/TeacherSettings";

import "@/styles/fonts.css";

const MemoTeacherHome = React.memo(TeacherHome);
const MemoTeacherCourses = React.memo(TeacherCourses);
const MemoTeacherExams = React.memo(TeacherExams);
const MemoTeacherSettings = React.memo(TeacherSettings);

const TEACHER_TABS = [
  { id: "chats", path: "/", component: MemoTeacherHome },
  { id: "courses", path: "/TeacherCourses", component: MemoTeacherCourses },
  { id: "exams", path: "/TeacherExams", component: MemoTeacherExams },
  { id: "settings", path: "/TeacherSettings", component: MemoTeacherSettings },
];

const normalizePath = (pathname) =>
  pathname.toLowerCase().replace(/\/+$/, "") || "/";

const getTeacherTabIndex = (pathname) => {
  const path = normalizePath(pathname);

  if (path === "/" || path.startsWith("/teacherlessonspage")) {
    return 0;
  }
  if (path === "/teachercourses") {
    return 1;
  }
  if (path === "/teacherexams") {
    return 2;
  }
  if (
    path === "/teachersettings" ||
    path === "/language" ||
    path === "/theme"
  ) {
    return 3;
  }

  return -1;
};

export const TeacherLayout = () => {
  const { language, isRTL } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const swiperRef = useRef(null);
  const isSwipingRef = useRef(false);

  const currentIndex = getTeacherTabIndex(location.pathname);
  const isMainTab = currentIndex !== -1;

  const [activeIndex, setActiveIndex] = useState(Math.max(currentIndex, 0));
  const [swipeIndex, setSwipeIndex] = useState(null);

  // Pre-mount all tabs so initial swipes are completely smooth and ready with zero blank screens or layout jumps.
  const [mountedPages] = useState(() => [0, 1, 2, 3]);

  useEffect(() => {
    window.scrollTo({ left: 0 });
    if (document.scrollingElement) {
      document.scrollingElement.scrollLeft = 0;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isMainTab) return;

    if (isSwipingRef.current) {
      isSwipingRef.current = false;
      setActiveIndex(currentIndex);
      return;
    }

    setActiveIndex(currentIndex);

    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed && swiper.activeIndex !== currentIndex) {
      swiper.slideTo(currentIndex, 240, false);
    }
  }, [location.pathname, currentIndex, isMainTab]);

  const handleSlideTransitionEnd = (swiper) => {
    setSwipeIndex(null);
    const index = swiper.activeIndex;

    if (index < 0 || index >= TEACHER_TABS.length) return;

    setActiveIndex(index);

    const targetTab = TEACHER_TABS[index];
    const currentPath = normalizePath(location.pathname);

    let targetPath = normalizePath(targetTab.path);
    if (index === 0) {
      const lastLesson = sessionStorage.getItem("last_teacher_lesson");
      if (lastLesson && lastLesson !== "lessons") {
        targetPath = `/teacherlessonspage/${lastLesson.toLowerCase()}`;
      }
    }

    if (currentPath !== targetPath) {
      isSwipingRef.current = true;
      if (index === 0) {
        const lastLesson = sessionStorage.getItem("last_teacher_lesson");
        if (lastLesson && lastLesson !== "lessons") {
          navigate(`/TeacherLessonsPage/${lastLesson}`, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        navigate(targetTab.path, { replace: true });
      }
    }
  };

  const renderTab = (tab, index) => {
    const Page = tab.component;

    return (
      <div className="w-full h-full min-w-0 overflow-hidden" data-teacher-tab={tab.id}>
        {mountedPages.includes(index) && <Page />}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen w-full min-w-0 overflow-x-hidden transition-colors duration-200 ${
        isRTL ? "font-vazir" : "font-inter"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      {isMainTab ? (
        <div className="w-full min-w-0 overflow-hidden" dir="ltr">
          <Swiper
            className="teacher-tabs-swiper"
            dir="ltr"
            key="teacher-main-tabs"
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              const index = Math.max(getTeacherTabIndex(location.pathname), 0);
              setActiveIndex(index);
              swiper.slideTo(index, 0, false);
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
            }}
            onTouchMove={(swiper) => {
              const index = swiper.progress * (TEACHER_TABS.length - 1);
              setSwipeIndex(
                Math.max(0, Math.min(TEACHER_TABS.length - 1, index)),
              );
            }}
            onSliderMove={(swiper) => {
              const index = swiper.progress * (TEACHER_TABS.length - 1);
              setSwipeIndex(
                Math.max(0, Math.min(TEACHER_TABS.length - 1, index)),
              );
            }}
            onTouchEnd={() => {
              setSwipeIndex(null);
            }}
            onSlideChangeTransitionEnd={handleSlideTransitionEnd}
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
            allowSlidePrev={true}
            allowSlideNext={true}
            noSwiping={true}
            noSwipingClass="swiper-no-swiping"
            noSwipingSelector=".swiper-no-swiping"
            watchOverflow={true}
            loop={false}
            rewind={false}
            style={{
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {TEACHER_TABS.map((tab, index) => (
              <SwiperSlide key={tab.id} className="w-full h-full overflow-hidden">
                {renderTab(tab, index)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <Outlet />
      )}

      <FooterGlass>
        <TeacherNavigationBar
          swipeIndex={swipeIndex}
          activeTabId={TEACHER_TABS[activeIndex]?.id}
        />
      </FooterGlass>
    </div>
  );
};