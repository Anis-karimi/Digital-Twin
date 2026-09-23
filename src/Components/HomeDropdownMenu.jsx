import Log_Out from "@/assets/icons/Log_Out_Black.svg?react";
import LineHomeDropDown from "@/assets/icons/LineHomeDropDown.svg";
import Light from "@/assets/icons/Light.svg?react";
import Night from "@/assets/icons/Night.svg?react";
import "@/styles/Allpages.css";
import { useTheme } from "@/Context/ThemeContext";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut as LucideLogOut } from "lucide-react";
import "@/styles/fonts.css";

export const HomeDropdownMenu = () => {
  const { isDark, toggleTheme } = useTheme();
  const { isRTL, logoutUser, currentUser, t } = useContext(AppContext);
  const navigate = useNavigate();

  const captionClass = isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter";

  const themeLabel = isDark ? t("dayMode") : t("nightMode");

  const handleLogout = () => {
    if (logoutUser) {
      logoutUser();
    }
    navigate("/login");
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <nav
      aria-label={t("userMenu")}
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 w-full min-w-[145px] flex flex-col rounded-xl p-1.5 shadow-lg"
    >
      {/* THEME BUTTON */}
      <button
        type="button"
        aria-label={themeLabel}
        onClick={toggleTheme}
        className="w-full flex items-center gap-2.5 cursor-pointer hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 rounded-lg px-2 py-1.5 transition-colors text-left"
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0">
          {isDark ? (
            <Light className="w-4 h-4 text-neutral-scale1800 dark:text-neutral-scale70" />
          ) : (
            <Night className="w-4 h-4 text-neutral-scale1800 dark:text-neutral-scale70" />
          )}
        </div>

        <span
          className={`whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 text-xs ${captionClass}`}
        >
          {themeLabel}
        </span>
      </button>

      {/* LOGIN / SWITCH ACCOUNT */}
      <button
        type="button"
        onClick={handleGoToLogin}
        className="w-full flex items-center gap-2.5 cursor-pointer hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 rounded-lg px-2 py-1.5 transition-colors text-left"
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0 text-primery-700 dark:text-neutral-scale70">
          <LogIn className="w-3.5 h-3.5" />
        </div>

        <span
          className={`whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 text-xs ${captionClass}`}
        >
          {t("switchRole")}
        </span>
      </button>

      <img
        className="w-full h-1 my-0.5 opacity-60"
        alt=""
        src={LineHomeDropDown}
        aria-hidden="true"
      />

      {/* LOGOUT */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-2.5 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg px-2 py-1.5 transition-colors text-left group"
      >
        <div className="w-4 h-4 flex items-center justify-center shrink-0 text-red-500">
          <LucideLogOut
            className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`}
          />
        </div>

        <span
          className={`whitespace-nowrap text-red-600 dark:text-red-400 group-hover:text-red-700 text-xs ${captionClass}`}
        >
          {t("logoutAccount")}
        </span>
      </button>
    </nav>
  );
};