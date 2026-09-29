import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useState, useEffect, useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { HomeDropdownMenu } from "@/Components/HomeDropdownMenu";
import { HomeChatFeedSection } from "@/Components/HomeChatFeedSection";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import menu from "@/assets/icons/menuWhite.svg?react";
import Bell from "@/assets/icons/Bell.svg?react";
import { FooterGlass } from "@/Components/FooterGlass";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "@/api";

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

export const StudentHome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  useEffect(() => {
    let isMounted = true;
    notificationsApi
      .getUnreadNotificationsCount()
      .then((data) => {
        if (isMounted && data && typeof data.count === "number") {
          setUnreadNotifsCount(data.count);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1500 w-full md:w-[360px] h-dvh relative overflow-hidden mx-auto"
      data-id={isRTL ? "student-home-page-fa" : "student-home-page-en"}
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
                    navigate("/StudentNotification");
                  }
                }}
                className="relative flex h-6 w-6 items-center justify-center cursor-pointer"
              >
                <Icon className="w-6 h-6 text-neutral-scale70" />
                {id === "notifications" && unreadNotifsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-primery-700 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section
        aria-label="Course chat feed"
        className="absolute top-[60px] left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden"
      >
        <HomeChatFeedSection />
      </section>

      <FooterGlass>
        <StudentNavigationBar />
      </FooterGlass>

      {/* ✅ OVERLAY MENU (added only) */}
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
