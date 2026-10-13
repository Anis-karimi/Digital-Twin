import React, { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import { AppContext } from "@/Context/AppContext";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import { FooterGlass } from "@/Components/FooterGlass";

import { StudentHome } from "@/Pages/Student/StudentHome";
import { StudentExplore } from "@/Pages/Student/StudentExplorePage";
import { StudentExams } from "@/Pages/Student/StudentExamsPage";
import { StudentSettings } from "@/Pages/Student/StudentSettings";

import "@/styles/fonts.css";

const MemoStudentHome = React.memo(StudentHome);
const MemoStudentExplore = React.memo(StudentExplore);
const MemoStudentExams = React.memo(StudentExams);
const MemoStudentSettings = React.memo(StudentSettings);

const STUDENT_TABS = [
  { id: "chats", path: "/Student", component: MemoStudentHome },
  { id: "explore", path: "/StudentExplore", component: MemoStudentExplore },
  { id: "exams", path: "/StudentExams", component: MemoStudentExams },
  { id: "settings", path: "/StudentSettings", component: MemoStudentSettings },
];

const normalizePath = (pathname) =>
  pathname.toLowerCase().replace(/\/+$/, "") || "/";

const getStudentTabIndex = (pathname) => {
  const path = normalizePath(pathname);

  if (path === "/student" || path === "/studenthome" || path === "/students") {
    return 0;
  }

  return STUDENT_TABS.findIndex((tab) => normalizePath(tab.path) === path);
};

export const StudentLayout = () => {
  const { language, isRTL } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const swiperRef = useRef(null);
  const isSwipingRef = useRef(false);

  const currentIndex = getStudentTabIndex(location.pathname);
  const isMainTab = currentIndex !== -1;

  const [activeIndex, setActiveIndex] = useState(Math.max(currentIndex, 0));
  const [swipeIndex, setSwipeIndex] = useState(null);

  // Pre-mount all tabs so initial swipes are completely smooth and ready with zero blank screens or layout jumps.
  const [mountedPages] = useState(() => [0, 1, 2, 3]);

  const isExamLive =
    location.pathname.toLowerCase().includes("/studentexam/") ||
    location.pathname.toLowerCase().includes("/biometrics");

  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.scrollingElement) {
      document.scrollingElement.scrollLeft = 0;
      document.scrollingElement.scrollTop = 0;
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

    if (index < 0 || index >= STUDENT_TABS.length) return;

    setActiveIndex(index);

    const targetTab = STUDENT_TABS[index];
    const currentPath = normalizePath(location.pathname);
    const targetPath = normalizePath(targetTab.path);

    if (currentPath !== targetPath) {
      isSwipingRef.current = true;
      navigate(targetTab.path, { replace: true });
    }
  };

  const renderTab = (tab, index) => {
    const Page = tab.component;

    return (
      <div className="w-full h-full min-w-0 overflow-hidden" data-student-tab={tab.id}>
        {mountedPages.includes(index) && <Page />}
      </div>
    );
  };

  return (
    <div
      className={`h-full h-dvh w-full min-w-0 overflow-hidden flex flex-col bg-[#f1f0f0] dark:bg-neutral-scale1400 transition-colors duration-200 ${
        isRTL ? "font-vazir" : "font-inter"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      {isMainTab ? (
        <div className="w-full h-full flex-1 min-h-0 min-w-0 overflow-hidden" dir="ltr">
          <Swiper
            className="student-tabs-swiper w-full h-full"
            dir="ltr"
            key="student-main-tabs"
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              const index = Math.max(getStudentTabIndex(location.pathname), 0);
              setActiveIndex(index);
              swiper.slideTo(index, 0, false);
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.activeIndex);
            }}
            onTouchMove={(swiper) => {
              const index = swiper.progress * (STUDENT_TABS.length - 1);
              setSwipeIndex(
                Math.max(0, Math.min(STUDENT_TABS.length - 1, index)),
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
              height: "100%",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {STUDENT_TABS.map((tab, index) => (
              <SwiperSlide key={tab.id} className="w-full h-full overflow-hidden">
                {renderTab(tab, index)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <Outlet />
      )}

      {!isExamLive && (
        <FooterGlass>
          <StudentNavigationBar
            swipeIndex={swipeIndex}
            activeTabId={STUDENT_TABS[activeIndex]?.id}
          />
        </FooterGlass>
      )}
    </div>
  );
};