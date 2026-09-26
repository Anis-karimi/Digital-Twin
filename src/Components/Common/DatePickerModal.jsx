import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check } from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import {
  toPersianDigits,
  JALALI_MONTH_NAMES,
  GREGORIAN_MONTH_NAMES,
  JALALI_WEEK_DAYS,
  GREGORIAN_WEEK_DAYS,
  getDaysInJalaliMonth,
  getDaysInGregorianMonth,
  gregorianToJalali,
  jalaliToGregorian,
  parseIsoDate,
  formatIsoDate,
  getTodayIsoDate,
  getJalaliDayOfWeek,
  getGregorianDayOfWeek,
} from "@/utils/dateUtils";

export const DatePickerModal = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  title,
}) => {
  const { isRTL, t } = useContext(AppContext);

  // Today values
  const todayIso = getTodayIsoDate();
  const parsedToday = parseIsoDate(todayIso);
  const todayJalali = gregorianToJalali(
    parsedToday.gy,
    parsedToday.gm,
    parsedToday.gd
  );

  // Parse initial selected date or fallback to today
  const initialIso = selectedDate || todayIso;
  const initialParsed = parseIsoDate(initialIso) || parsedToday;
  const initialJalali = gregorianToJalali(
    initialParsed.gy,
    initialParsed.gm,
    initialParsed.gd
  );

  // State for temporary selection inside the picker
  const [tempIso, setTempIso] = useState(initialIso);

  // View state: 'calendar', 'months', 'years'
  const [viewMode, setViewMode] = useState("calendar");

  // Navigation state (year & month)
  const [navYear, setNavYear] = useState(
    isRTL ? initialJalali.jy : initialParsed.gy
  );
  const [navMonth, setNavMonth] = useState(
    isRTL ? initialJalali.jm : initialParsed.gm
  );

  // Reset navigation when modal opens or selectedDate changes
  useEffect(() => {
    if (isOpen) {
      const p = parseIsoDate(selectedDate || todayIso) || parsedToday;
      setTempIso(selectedDate || todayIso);
      if (isRTL) {
        const j = gregorianToJalali(p.gy, p.gm, p.gd);
        setNavYear(j.jy);
        setNavMonth(j.jm);
      } else {
        setNavYear(p.gy);
        setNavMonth(p.gm);
      }
      setViewMode("calendar");
    }
  }, [isOpen, selectedDate, isRTL]);

  if (!isOpen) return null;

  // Navigation handlers
  const handlePrevMonth = () => {
    if (navMonth === 1) {
      setNavMonth(12);
      setNavYear((prev) => prev - 1);
    } else {
      setNavMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 12) {
      setNavMonth(1);
      setNavYear((prev) => prev + 1);
    } else {
      setNavMonth((prev) => prev + 1);
    }
  };

  // Jump to today
  const handleJumpToToday = () => {
    setTempIso(todayIso);
    if (isRTL) {
      setNavYear(todayJalali.jy);
      setNavMonth(todayJalali.jm);
    } else {
      setNavYear(parsedToday.gy);
      setNavMonth(parsedToday.gm);
    }
    setViewMode("calendar");
  };

  // Select day handler
  const handleDaySelect = (day) => {
    let iso = "";
    if (isRTL) {
      const { gy, gm, gd } = jalaliToGregorian(navYear, navMonth, day);
      iso = formatIsoDate(gy, gm, gd);
    } else {
      iso = formatIsoDate(navYear, navMonth, day);
    }
    setTempIso(iso);
  };

  // Confirm selection
  const handleConfirm = () => {
    if (tempIso) {
      onSelectDate(tempIso);
    }
    onClose();
  };

  // Compute calendar days
  const daysInMonth = isRTL
    ? getDaysInJalaliMonth(navYear, navMonth)
    : getDaysInGregorianMonth(navYear, navMonth);

  const startDayOfWeek = isRTL
    ? getJalaliDayOfWeek(navYear, navMonth, 1)
    : getGregorianDayOfWeek(navYear, navMonth, 1);

  // Selected date parsed for current view comparison
  const tempParsed = parseIsoDate(tempIso);
  const tempJalali = tempParsed
    ? gregorianToJalali(tempParsed.gy, tempParsed.gm, tempParsed.gd)
    : null;

  const isDaySelected = (day) => {
    if (isRTL) {
      return (
        tempJalali &&
        tempJalali.jy === navYear &&
        tempJalali.jm === navMonth &&
        tempJalali.jd === day
      );
    } else {
      return (
        tempParsed &&
        tempParsed.gy === navYear &&
        tempParsed.gm === navMonth &&
        tempParsed.gd === day
      );
    }
  };

  const isDayToday = (day) => {
    if (isRTL) {
      return (
        todayJalali.jy === navYear &&
        todayJalali.jm === navMonth &&
        todayJalali.jd === day
      );
    } else {
      return (
        parsedToday.gy === navYear &&
        parsedToday.gm === navMonth &&
        parsedToday.gd === day
      );
    }
  };

  const monthNames = isRTL ? JALALI_MONTH_NAMES : GREGORIAN_MONTH_NAMES;
  const currentMonthName = monthNames[navMonth - 1] || "";
  const weekDays = isRTL ? JALALI_WEEK_DAYS : GREGORIAN_WEEK_DAYS;

  // Generate Year Range for year selector
  const yearStart = isRTL ? 1395 : 2018;
  const yearEnd = isRTL ? 1415 : 2038;
  const yearsList = [];
  for (let y = yearStart; y <= yearEnd; y++) {
    yearsList.push(y);
  }

  const defaultTitle = t("selectDate");

  const modalContent = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      dir={isRTL ? "rtl" : "ltr"}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || defaultTitle}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[340px] bg-white dark:bg-neutral-scale1300 rounded-[20px] shadow-2xl border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden flex flex-col ${
          isRTL ? "font-vazir" : "font-inter"
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-primery-700 dark:bg-neutral-scale1200 text-white">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-neutral-scale70" />
            <h3 className={`text-base font-semibold text-neutral-scale70 ${isRTL ? "fa-title-3" : "en-title-3"}`}>
              {title || defaultTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month & Year Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-scale100 dark:border-neutral-scale1100 bg-neutral-scale80 dark:bg-neutral-scale1400/50">
          <button
            type="button"
            onClick={isRTL ? handleNextMonth : handlePrevMonth}
            aria-label={isRTL ? t("nextMonth") : t("prevMonth")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-scale1000 dark:text-neutral-scale300 hover:bg-white dark:hover:bg-neutral-scale1200 hover:shadow-sm transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "months" ? "calendar" : "months")}
              className={`px-2.5 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                viewMode === "months"
                  ? "bg-primery-700 text-white"
                  : "text-primery-800 dark:text-neutral-scale70 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200"
              }`}
            >
              {currentMonthName}
            </button>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === "years" ? "calendar" : "years")}
              className={`px-2.5 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                viewMode === "years"
                  ? "bg-primery-700 text-white"
                  : "text-neutral-scale1000 dark:text-neutral-scale200 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200"
              }`}
            >
              {isRTL ? toPersianDigits(navYear) : navYear}
            </button>
          </div>

          <button
            type="button"
            onClick={isRTL ? handlePrevMonth : handleNextMonth}
            aria-label={isRTL ? t("prevMonth") : t("nextMonth")}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-scale1000 dark:text-neutral-scale300 hover:bg-white dark:hover:bg-neutral-scale1200 hover:shadow-sm transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 min-h-[280px] flex flex-col justify-center">
          {viewMode === "calendar" && (
            <div>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekDays.map((d) => (
                  <span
                    key={d.index}
                    className="text-xs font-medium text-neutral-scale700 dark:text-neutral-scale400 py-1"
                    title={d.full}
                  >
                    {d.short}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty padding slots */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-9 h-9" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const selected = isDaySelected(day);
                  const today = isDayToday(day);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDaySelect(day)}
                      className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-all cursor-pointer ${
                        selected
                          ? "bg-primery-700 text-white font-bold shadow-md scale-105"
                          : today
                          ? "border border-primery-600 text-primery-800 dark:text-primery-300 font-semibold hover:bg-primery-50 dark:hover:bg-neutral-scale1200"
                          : "text-neutral-scale1800 dark:text-neutral-scale100 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200"
                      }`}
                    >
                      {isRTL ? toPersianDigits(day) : day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === "months" && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {monthNames.map((name, index) => {
                const mNumber = index + 1;
                const isSelectedMonth = navMonth === mNumber;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setNavMonth(mNumber);
                      setViewMode("calendar");
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isSelectedMonth
                        ? "bg-primery-700 text-white font-bold shadow-sm"
                        : "text-neutral-scale1800 dark:text-neutral-scale100 bg-neutral-scale80 dark:bg-neutral-scale1200 hover:bg-primery-100 dark:hover:bg-neutral-scale1100"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === "years" && (
            <div className="grid grid-cols-3 gap-2 py-2 max-h-[240px] overflow-y-auto px-1">
              {yearsList.map((y) => {
                const isSelectedYear = navYear === y;

                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setNavYear(y);
                      setViewMode("calendar");
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isSelectedYear
                        ? "bg-primery-700 text-white font-bold shadow-sm"
                        : "text-neutral-scale1800 dark:text-neutral-scale100 bg-neutral-scale80 dark:bg-neutral-scale1200 hover:bg-primery-100 dark:hover:bg-neutral-scale1100"
                    }`}
                  >
                    {isRTL ? toPersianDigits(y) : y}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-scale80 dark:bg-neutral-scale1400/80 border-t border-neutral-scale100 dark:border-neutral-scale1100">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-primery-700 dark:text-primery-300 hover:bg-primery-50 dark:hover:bg-neutral-scale1200 transition-colors cursor-pointer"
          >
            {t("today")}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-scale700 dark:text-neutral-scale400 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 transition-colors cursor-pointer"
            >
              {t("cancel")}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-primery-700 hover:bg-primery-800 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t("confirm")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default DatePickerModal;
