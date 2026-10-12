import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";

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

const STUDENT_TABS = [
  { id: "chats", path: "/Student", component: StudentHome },
  { id: "explore", path: "/StudentExplore", component: StudentExplore },
  { id: "exams", path: "/StudentExams", component: StudentExams },
  { id: "settings", path: "/StudentSettings", component: StudentSettings },
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

  const currentIndex = getStudentTabIndex(location.pathname);
  const isMainTab = currentIndex !== -1;

  const [activeIndex, setActiveIndex] = useState(Math.max(currentIndex, 0));

  const [swipeIndex, setSwipeIndex] = useState(null);

  // Only the initial page is mounted on first load.
  // Once mounted, a page stays mounted when switching tabs.
  const [mountedPages, setMountedPages] = useState(() =>
    currentIndex === -1 ? [] : [currentIndex],
  );

  const isExamLive =
    location.pathname.toLowerCase().includes("/studentexam/") ||
    location.pathname.toLowerCase().includes("/biometrics");

  useEffect(() => {
    if (!isMainTab) return;

    setActiveIndex(currentIndex);

    // Mount the page corresponding to the current URL if needed.
    setMountedPages((prev) =>
      prev.includes(currentIndex) ? prev : [...prev, currentIndex],
    );

    const swiper = swiperRef.current;

    if (swiper && !swiper.destroyed) {
      requestAnimationFrame(() => {
        if (swiper.destroyed) return;

        swiper.update();
        swiper.slideTo(currentIndex, 0, false);
      });
    }
  }, [location.pathname, currentIndex, isMainTab]);

  const handleSwiperChange = (swiper) => {
    setSwipeIndex(null);
    const index = swiper.activeIndex;

    if (index < 0 || index >= STUDENT_TABS.length) return;

    setActiveIndex(index);

    // Mount the destination page when the user swipes to it.
    // Keep it mounted afterward to preserve its component state.
    setMountedPages((prev) => (prev.includes(index) ? prev : [...prev, index]));

    const targetTab = STUDENT_TABS[index];
    const currentPath = normalizePath(location.pathname);
    const targetPath = normalizePath(targetTab.path);

    if (currentPath !== targetPath) {
      navigate(targetTab.path, { replace: true });
    }
  };

  const renderTab = (tab, index) => {
    const Page = tab.component;

    return (
      <div className="w-full min-w-0 overflow-hidden" data-student-tab={tab.id}>
        {mountedPages.includes(index) && <Page />}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen w-full min-w-0 overflow-x-hidden transition-all duration-200 ${
        isRTL ? "font-vazir" : "font-inter"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      {isMainTab ? (
        <div className="w-full min-w-0 overflow-hidden">
          <Swiper
            className="student-tabs-swiper"
            dir="ltr"
            key="student-main-tabs"
            onSwiper={(swiper) => {
              swiperRef.current = swiper;

              const index = Math.max(getStudentTabIndex(location.pathname), 0);

              setActiveIndex(index);
              setMountedPages((prev) =>
                prev.includes(index) ? prev : [...prev, index],
              );

              requestAnimationFrame(() => {
                if (swiper.destroyed) return;

                swiper.update();
                swiper.slideTo(index, 0, false);
              });
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
            onSlideChange={handleSwiperChange}
            slidesPerView={1}
            slidesPerGroup={1}
            spaceBetween={0}
            speed={220}
            threshold={10}
            touchAngle={45}
            simulateTouch={true}
            allowTouchMove={true}
            resistance={true}
            resistanceRatio={0.5}
            allowSlidePrev={true}
            allowSlideNext={true}
            watchOverflow={true}
            loop={false}
            rewind={false}
            style={{
              width: "100%",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            {STUDENT_TABS.map((tab, index) => (
              <SwiperSlide
                key={tab.id}
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
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
          <StudentNavigationBar swipeIndex={swipeIndex} />
        </FooterGlass>
      )}
    </div>
  );
};