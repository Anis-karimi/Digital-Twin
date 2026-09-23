import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import "@/styles/fonts.css";

import Chat from "@/assets/icons/Chat.svg?react";
import Explor from "@/assets/icons/explor.svg?react";
import Settings from "@/assets/icons/Settings.svg?react";

import ChatFilled from "@/assets/icons/ChatFull.svg?react";
import SettingsFilled from "@/assets/icons/SettingsFull.svg?react";

export const StudentNavigationBar = () => {
  const { t, isRTL } = useContext(AppContext);
  const location = useLocation();

  const navItems = [
    {
      id: "chats",
      label: t("chats"),

      wrapperClassName: "relative w-[65px] h-12 mt-[-3.00px] mb-[-3.00px]",

      contentClassName:
        "relative left-2.5 w-[46px] h-10 flex flex-col gap-[0.3px]",

      iconWrapperClassName: "ml-[9.3px] w-[25.81px] h-[24.66px] flex",

      icon: Chat,
      iconActive: ChatFilled,

      iconClassName: "flex-1 w-[20.35px]",

      labelClassName: `w-11 h-[15px] ${
        isRTL ? "fa-caption-1" : "en-caption-1"
      } text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap`,
    },

    {
      id: "explor",
      label: t("courses"),

      wrapperClassName: "relative w-[90px] h-12 mt-[-3.00px] mb-[-3.00px]",

      contentClassName:
        "relative top-1 left-[11px] w-[70px] h-10 flex flex-col gap-1.5",

      iconWrapperClassName: "ml-6 w-[21px] h-[15px] flex",

      icon: Explor,

      iconClassName:
        "flex-1 w-[19px] text-neutral-scale1400 dark:text-neutral-scale70",

      labelClassName: `w-[68px] h-[15px] text-neutral-scale1800 dark:text-neutral-scale70 ${
        isRTL ? "fa-caption-1" : "en-caption-1"
      } text-center whitespace-nowrap`,
    },

    {
      id: "settings",
      label: t("settings"),

      activeClassName:
        "relative w-[73px] h-12 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[23px]",

      wrapperClassName: "relative w-[73px] h-12 mt-[-3.00px] mb-[-3.00px]",

      contentClassName:
        "relative top-px left-3 w-[51px] h-10 flex flex-col gap-[3px]",

      iconWrapperClassName: "ml-3.5 w-[22px] h-[21px] flex",

      icon: Settings,
      iconActive: SettingsFilled,

      iconClassName: "flex-1 w-[19.33px]",

      labelClassName: `w-[49px] h-4 ${
        isRTL ? "fa-caption-1" : "en-caption-1"
      } text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap`,
    },
  ];

  const isHomePage =
    location.pathname === "/student" || location.pathname === "/StudentHome";

  const isCoursesPage = location.pathname === "/StudentCourses";

  const isSettingsPage = location.pathname === "/StudentSettings";

  return (
    <nav
      className="w-50 h-[60px] shrink-0 flex bg-[#f8fcfd] dark:bg-neutral-scale1300 rounded-[30px] overflow-hidden shadow-[0px_-1px_3px_0.1px_#2828281a,0px_1px_3px_0.1px_#2828281a,1px_0px_3px_0.1px_#00000040,-1px_0px_3px_0.1px_#2828281a]"
      aria-label="Bottom navigation"
    >
      <div className="flex mt-1.5 w-[250px] h-[43px] mx-[1px] relative items-center justify-center gap-2">
        {/* ================= Chats ================= */}

        {isHomePage ? (
          <div className="relative w-[65px] h-12 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[27px]">
            <div className={navItems[0].contentClassName}>
              <div className={navItems[0].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[0].iconActive || navItems[0].icon;

                  return (
                    <Icon
                      className={`${navItems[0].iconClassName} text-primery-1000`}
                    />
                  );
                })()}
              </div>

              <div
                className={`${navItems[0].labelClassName} text-primery-1000 dark:text-primery-1000 en-caption-3 text-center whitespace-nowrap`}
              >
                {navItems[0].label}
              </div>
            </div>
          </div>
        ) : (
          <Link to="/student" className={navItems[0].wrapperClassName}>
            <div className={navItems[0].contentClassName}>
              <div className={navItems[0].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[0].icon;

                  return (
                    <Icon
                      className={`${navItems[0].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
                    />
                  );
                })()}
              </div>

              <div className={navItems[0].labelClassName}>
                {navItems[0].label}
              </div>
            </div>
          </Link>
        )}

        {/* ================= My Courses ================= */}

        {isCoursesPage ? (
          <div className="relative w-[90px] h-11 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[23px]">
            <div className={navItems[1].contentClassName}>
              <div className={navItems[1].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[1].iconActive || navItems[1].icon;

                  return (
                    <Icon
                      className={`${navItems[1].iconClassName} text-primery-1000`}
                    />
                  );
                })()}
              </div>

              <div
                className={`${navItems[1].labelClassName} text-primery-1000 dark:text-primery-1000 en-caption-3 text-center whitespace-nowrap`}
              >
                {navItems[1].label}
              </div>
            </div>
          </div>
        ) : (
          <Link to="/StudentCourses" className={navItems[1].wrapperClassName}>
            <div className={navItems[1].contentClassName}>
              <div className={navItems[1].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[1].icon;

                  return (
                    <Icon
                      className={`${navItems[1].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
                    />
                  );
                })()}
              </div>

              <div className={navItems[1].labelClassName}>
                {navItems[1].label}
              </div>
            </div>
          </Link>
        )}

        {/* ================= Settings ================= */}

        {isSettingsPage ? (
          <div className="relative w-[73px] h-12 mt-[-3.00px] mb-[-3.00px] bg-primery-90 rounded-[27px]">
            <div className={navItems[2].contentClassName}>
              <div className={navItems[2].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[2].iconActive || navItems[2].icon;

                  return (
                    <Icon
                      className={`${navItems[2].iconClassName} text-primery-1000`}
                    />
                  );
                })()}
              </div>

              <div
                className={`${navItems[2].labelClassName} text-primery-1000 dark:text-primery-1000 en-caption-3 text-center whitespace-nowrap`}
              >
                {navItems[2].label}
              </div>
            </div>
          </div>
        ) : (
          <Link to="/StudentSettings" className={navItems[2].wrapperClassName}>
            <div className={navItems[2].contentClassName}>
              <div className={navItems[2].iconWrapperClassName}>
                {(() => {
                  const Icon = navItems[2].icon;

                  return (
                    <Icon
                      className={`${navItems[2].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
                    />
                  );
                })()}
              </div>

              <div className={navItems[2].labelClassName}>
                {navItems[2].label}
              </div>
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
};
