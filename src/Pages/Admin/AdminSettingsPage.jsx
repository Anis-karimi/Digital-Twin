import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Sun,
  Moon,
  Globe,
  LogOut,
  Info,
  Server,
  Database,
  Cpu,
  FileText,
  ChevronLeft,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";

export const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const { isRTL, language, toggleLanguage, logoutUser, currentUser } =
    useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    if (logoutUser) {
      logoutUser();
    }
    navigate("/", { replace: true });
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden relative transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="w-full h-[65px] flex items-center justify-between px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-neutral-scale1200 flex items-center justify-center text-white shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-white text-sm font-bold leading-tight truncate ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "تنظیمات و وضعیت سیستم" : "System Settings"}
            </h1>
            <p className="text-white/70 text-[10px] leading-tight truncate">
              {isRTL
                ? "مدیریت دسترسی و پیکربندی سامانه"
                : "Administration & Configuration"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-[85px]">
        {/* Admin Profile Card */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-base shrink-0 border border-purple-200 dark:border-purple-800/40">
            ADM
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                {currentUser?.first_name
                  ? `${currentUser.first_name} ${currentUser.last_name || ""}`
                  : isRTL
                    ? "مدیر ارشد سامانه"
                    : "System Administrator"}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>{isRTL ? "مدیر سامانه" : "Admin"}</span>
              </span>
            </div>
            <p className="text-xs text-start text-neutral-scale700 dark:text-neutral-scale400 font-mono mt-0.5">
              @{currentUser?.username || "admin"}
            </p>
          </div>
        </section>

        {/* Display & Language Settings */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex flex-col gap-2.5 shadow-xs">
          <h3 className="text-xs text-start font-bold text-neutral-scale900 dark:text-neutral-scale200 px-1">
            {isRTL ? "تنظیمات کاربری و ظاهر" : "Appearance & Language"}
          </h3>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-scale100 dark:bg-neutral-scale1100 flex items-center justify-center shrink-0">
                {isDark ? (
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 block">
                  {isRTL ? "حالت پوسته" : "Theme Mode"}
                </span>
                <span className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400">
                  {isDark
                    ? isRTL
                      ? "تاریک"
                      : "Dark"
                    : isRTL
                      ? "روشن"
                      : "Light"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-scale100 dark:bg-neutral-scale1000 text-neutral-scale900 dark:text-white hover:bg-neutral-scale200 transition-colors cursor-pointer"
            >
              {isDark ? (isRTL ? "روشن" : "Light") : isRTL ? "تاریک" : "Dark"}
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-neutral-scale100 dark:bg-neutral-scale1100 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 block">
                  {isRTL ? "زبان سامانه" : "Interface Language"}
                </span>
                <span className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400">
                  {language === "fa" ? "فارسی" : "English"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-scale100 dark:bg-neutral-scale1000 text-neutral-scale900 dark:text-white hover:bg-neutral-scale200 transition-colors cursor-pointer"
            >
              {language === "fa" ? "English" : "فارسی"}
            </button>
          </div>
        </section>

        {/* System Diagnostic Information */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex flex-col gap-2.5 shadow-xs">
          <h3 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200 px-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-scale500" />
            <span>{isRTL ? "وضعیت سرویس‌های سامانه" : "System Status"}</span>
          </h3>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 flex flex-col items-center text-center">
              <Server className="w-3.5 h-3.5 text-emerald-500 mb-1" />
              <span className="text-[9px] text-neutral-scale600 dark:text-neutral-scale400">
                {isRTL ? "سرویس اصلی" : "Main Svc"}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {isRTL ? "آنلاین" : "Online"}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 flex flex-col items-center text-center">
              <Database className="w-3.5 h-3.5 text-emerald-500 mb-1" />
              <span className="text-[9px] text-neutral-scale600 dark:text-neutral-scale400">
                {isRTL ? "داده‌گاه" : "PostgreSQL"}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {isRTL ? "متصل" : "Ready"}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 flex flex-col items-center text-center">
              <Cpu className="w-3.5 h-3.5 text-emerald-500 mb-1" />
              <span className="text-[9px] text-neutral-scale600 dark:text-neutral-scale400">
                {isRTL ? "مدل هوش" : "AI Models"}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {isRTL ? "فعال" : "Active"}
              </span>
            </div>
          </div>
        </section>

        {/* System Prompts Navigation */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex flex-col gap-2.5 shadow-xs">
          <h3 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200 px-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-neutral-scale500" />
            <span>{isRTL ? "مدیریت پرامپت‌های سیستم" : "System Prompts"}</span>
          </h3>

          <button
            type="button"
            onClick={() => navigate("/admin/system-prompts")}
            className="w-full p-3 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 hover:border-primery-300 dark:hover:border-neutral-scale900 flex items-center gap-3 text-start transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-primery-50 dark:bg-neutral-scale1100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-primery-700 dark:text-neutral-scale200" />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 block">
                {isRTL ? "پرامپت‌های سیستم" : "System Prompts"}
              </span>

              <span className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 block mt-1">
                {isRTL
                  ? "مشاهده و ویرایش پرامپت‌های سامانه"
                  : "View and edit system prompts"}
              </span>
            </div>

            <ChevronLeft
              className={`w-4 h-4 text-neutral-scale500 group-hover:text-primery-700 dark:group-hover:text-white transition-all shrink-0 ${
                isRTL ? "" : "rotate-180"
              }`}
            />
          </button>
        </section>

        {/* Logout Action */}
        <section className="pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>{isRTL ? "خروج از حساب مدیریت" : "Sign Out"}</span>
          </button>
        </section>
      </div>
    </main>
  );
};

export default AdminSettingsPage;
