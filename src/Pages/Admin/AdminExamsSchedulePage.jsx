import React, { useContext, useState } from "react";
import {
  CalendarClock,
  Sun,
  Moon,
  CheckCircle2,
  Globe,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { ExamSchedulingVisualizer } from "@/Components/ExamSchedulingVisualizer";

export const AdminExamsSchedulePage = () => {
  const { isRTL, language, toggleLanguage } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState("");

  const handleConfirmSchedule = (scheduleData) => {
    setScheduleSuccessMsg(
      isRTL
        ? `زمان آزمون با موفقیت برای روز ${scheduleData.day.dayName} ساعت ${scheduleData.startTimeString} تا ${scheduleData.endTimeString} نهایی شد.`
        : `Exam schedule confirmed for ${scheduleData.day.gregorianDayFull || scheduleData.day.dayName} from ${scheduleData.startTimeString} to ${scheduleData.endTimeString}.`
    );

    setTimeout(() => {
      setScheduleSuccessMsg("");
    }, 5000);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden relative transition-colors duration-200"
    >
      {/* Top Header - Consistent with AdminCoursesPage and AdminUsersPage */}
      <header className="w-full h-[65px] flex items-center justify-between px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-neutral-scale1200 flex items-center justify-center text-white shrink-0">
            <CalendarClock className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-white text-sm font-bold leading-tight truncate ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "پایش زمان‌بندی و بار سرور" : "Exam Schedule & Server Load"}
            </h1>
            <p className="text-white/70 text-[10px] leading-tight truncate">
              {isRTL ? "مدیریت همپوشانی و ظرفیت اساتید" : "Master Capacity & Conflict View"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="h-7 px-2 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center gap-1 text-white text-[10px] font-bold transition-all cursor-pointer shrink-0"
            title={language === "fa" ? "تغییر زبان به انگلیسی" : "Switch to Persian"}
          >
            <Globe className="w-3 h-3 text-white" />
            <span className={isRTL ? "font-inter" : "font-vazir"}>{language === "fa" ? "EN" : "فا"}</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </header>

      {/* Success Banner if scheduled */}
      {scheduleSuccessMsg && (
        <div className="bg-emerald-600 dark:bg-emerald-700 text-white px-3 py-2 text-xs font-vazir flex items-center gap-2 animate-in slide-in-from-top duration-200 shrink-0 shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="leading-tight">{scheduleSuccessMsg}</span>
        </div>
      )}

      {/* Visualizer Component (Offset by bottom nav height) */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden pb-[75px]">
        <ExamSchedulingVisualizer
          onConfirmSchedule={handleConfirmSchedule}
          defaultDurationMinutes={90}
          initialStartHour={10.0}
        />
      </div>
    </main>
  );
};

export default AdminExamsSchedulePage;
