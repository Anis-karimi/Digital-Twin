import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useState, useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { HomeDropdownMenu } from "@/Components/HomeDropdownMenu";
import { HomeChatFeedSection } from "@/Components/HomeChatFeedSection";
import { LessonsNavBar } from "@/Components/LessonsNavBar";
import menu from "@/assets/icons/menu.svg?react";
import Bell from "@/assets/icons/Bell.svg?react";
import { useNavigate } from "react-router-dom";

const headerActions = [
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

export const TeacherHome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh relative overflow-hidden mx-auto"
      data-id={isRTL ? "teacher-home-page-fa" : "teacher-home-page-en"}
    >
      <header
        className="absolute top-0 left-0 w-full h-[65px] flex z-10"
        aria-label={isRTL ? "سربرگ صفحه" : "Page header"}
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
                }}
                className="relative flex h-6 w-6 items-center justify-center cursor-pointer"
              >
                <Icon className="w-6 h-6 text-neutral-scale70" />
              </button>
            ))}
          </div>
        </div>
      </header>

      <section
        aria-label={isRTL ? "نوار درس‌ها" : "Lessons Nav Bar"}
        className="absolute top-[60px] left-0 w-full z-10"
      >
        <LessonsNavBar />
      </section>

      <section
        aria-label={isRTL ? "گفتگوهای درسی" : "Course chat feed"}
        className="absolute top-[110px] left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden"
      >
        <HomeChatFeedSection />
      </section>

      {/* ✅ OVERLAY MENU */}
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
};
