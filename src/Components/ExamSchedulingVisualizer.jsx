import React, { useState, useMemo, useRef, useEffect, useContext } from "react";
import {
  CalendarDays,
  Users,
  AlertTriangle,
  X,
  Layers,
  RefreshCw,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock3,
} from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import { toPersianDigits } from "@/utils/dateUtils";
import { getAdminExamsSchedule } from "@/api";

const HOUR_ROW_HEIGHT = 180; // Extended timeline scale (180px/hr) for generous spacing and clear time boundaries

export const ExamSchedulingVisualizer = ({ embedded = false }) => {
  const { isRTL, language } = useContext(AppContext);

  // Font family selector: Vazirmatn for Persian, Inter for English
  const fontClass = isRTL ? "font-vazir" : "font-inter";

  // Real backend schedule state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [daysData, setDaysData] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState(null);

  // Drawer / Bottom sheet state for detailed conflict inspection
  const [activeDrawerGroup, setActiveDrawerGroup] = useState(null);

  // Horizontal scroller ref & mouse-drag scroll state
  const dateScrollerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Digits formatter according to current active language
  const formatDigits = (val) => {
    if (val === null || val === undefined) return "";
    return isRTL ? toPersianDigits(val) : String(val);
  };

  // Format decimal hour to HH:MM string with correct font & digits
  const formatHourString = (hourDecimal) => {
    const h = Math.floor(hourDecimal);
    const m = Math.round((hourDecimal - h) * 60);
    const hStr = String(h).padStart(2, "0");
    const mStr = String(m).padStart(2, "0");
    return isRTL
      ? `${toPersianDigits(hStr)}:${toPersianDigits(mStr)}`
      : `${hStr}:${mStr}`;
  };

  // Fetch real exam schedule data from backend
  const fetchScheduleData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await getAdminExamsSchedule();
      const days = res?.days || [];
      setDaysData(days);

      if (days.length > 0) {
        setSelectedDayId((prev) => {
          if (prev && days.some((d) => d.id === prev)) {
            return prev;
          }
          // Prioritize today if present in days
          const todayItem = days.find((d) => d.isToday);
          if (todayItem) {
            return todayItem.id;
          }
          return days[0].id;
        });
      }
    } catch (err) {
      console.error("Failed to load admin exams schedule:", err);
      setError(
        err?.message ||
          (isRTL
            ? "خطا در دریافت زمان‌بندی آزمون‌ها از سرور"
            : "Failed to load schedule from server")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  // Selected Day resolution
  const selectedDay = useMemo(() => {
    if (!daysData || daysData.length === 0) return null;
    return daysData.find((d) => d.id === selectedDayId) || daysData[0];
  }, [daysData, selectedDayId]);

  // Dynamic Timeline Range based on active exams (default 08:00 to 22:00)
  const { timelineStartHour, timelineEndHour, totalHours } = useMemo(() => {
    let start = 8;
    let end = 22;
    if (selectedDay?.exams && selectedDay.exams.length > 0) {
      selectedDay.exams.forEach((ex) => {
        if (ex.start_h !== undefined && ex.start_h < start) {
          start = Math.max(0, Math.floor(ex.start_h));
        }
        if (ex.end_h !== undefined && ex.end_h > end) {
          end = Math.min(24, Math.ceil(ex.end_h));
        }
      });
    }
    return {
      timelineStartHour: start,
      timelineEndHour: end,
      totalHours: end - start,
    };
  }, [selectedDay]);

  const timelineTotalHeight = totalHours * HOUR_ROW_HEIGHT;

  const hoursArray = useMemo(() => {
    const list = [];
    for (let h = timelineStartHour; h <= timelineEndHour; h++) {
      list.push(h);
    }
    return list;
  }, [timelineStartHour, timelineEndHour]);

  // Smooth mouse-drag handlers for horizontal date scroller
  const handleMouseDown = (e) => {
    if (!dateScrollerRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - dateScrollerRef.current.offsetLeft;
    scrollLeftRef.current = dateScrollerRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !dateScrollerRef.current) return;
    e.preventDefault();
    const x = e.pageX - dateScrollerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    dateScrollerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  // Clamped position helpers for vertical timeline
  const getTimelineTop = (hourDecimal) => {
    const clamped = Math.max(timelineStartHour, Math.min(timelineEndHour, hourDecimal));
    const offset = clamped - timelineStartHour;
    return offset * HOUR_ROW_HEIGHT;
  };

  const getTimelineHeight = (startH, endH) => {
    const clampedStart = Math.max(timelineStartHour, Math.min(timelineEndHour, startH));
    const clampedEnd = Math.max(timelineStartHour, Math.min(timelineEndHour, endH));
    const duration = Math.max(0.2, clampedEnd - clampedStart);
    return duration * HOUR_ROW_HEIGHT;
  };


  // Loading state
  if (loading) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f1f0f0] dark:bg-neutral-scale1400 ${fontClass}`}
      >
        <div className="w-9 h-9 border-3 border-primery-700/20 border-t-primery-700 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70">
          {isRTL ? "در حال دریافت زمان‌بندی آزمون‌ها..." : "Loading exam schedules..."}
        </p>
        <p className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 mt-1">
          {isRTL ? "دریافت اطلاعات آزمون‌های ثبت‌شده از پایگاه داده" : "Fetching scheduled exams from database"}
        </p>
      </div>
    );
  }

  // Error state
  if (error && (!daysData || daysData.length === 0)) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f1f0f0] dark:bg-neutral-scale1400 ${fontClass}`}
      >
        <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 mb-1">
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchScheduleData(true)}
          className="mt-3 px-4 py-2 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isRTL ? "تلاش مجدد" : "Retry"}</span>
        </button>
      </div>
    );
  }

  // Active day display strings based on language setting
  const selectedDaySubtitle = isRTL
    ? selectedDay?.dateStr || ""
    : `${selectedDay?.gregorianDayFull || ""}, ${selectedDay?.gregorianMonth || ""} ${selectedDay?.gregorianDayNumber || ""}, ${selectedDay?.gregorianDateStr?.split("/")[0] || ""}`;

  const totalStudentsToday =
    selectedDay?.exams?.reduce((sum, ex) => sum + (ex.studentCount || 0), 0) || 0;

  const hasExamsToday = Boolean(
    selectedDay && selectedDay.examGroups && selectedDay.examGroups.length > 0
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full flex-1 flex flex-col bg-[#f1f0f0] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 select-none overflow-hidden relative ${fontClass} transition-colors duration-200`}
    >
      {/* ================= 1. Top Header: Horizontal Week Date Scroller ================= */}
      <header className="sticky top-0 z-20 bg-neutral-scale70 dark:bg-neutral-scale1300 border-b border-neutral-scale200 dark:border-neutral-scale1100 px-3 py-2.5 shrink-0 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primery-50 dark:bg-neutral-scale1200 border border-primery-200 dark:border-neutral-scale1000 flex items-center justify-center text-primery-700 dark:text-primery-300 shrink-0">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5 leading-tight truncate">
                <span>{isRTL ? "پایش زمان‌بندی آزمون‌ها" : "Exam Schedule Overview"}</span>
              </h2>
              <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 block truncate">
                {selectedDaySubtitle} • {formatDigits(selectedDay?.exams?.length || 0)}{" "}
                {isRTL ? "آزمون ثبت‌شده" : "scheduled exams"}
              </span>
            </div>
          </div>

          {/* Quick telemetry badge + Refresh button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchScheduleData(true)}
              disabled={refreshing}
              title={isRTL ? "بروزرسانی داده‌ها" : "Refresh data"}
              className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 flex items-center justify-center text-neutral-scale1000 dark:text-neutral-scale400 hover:text-primery-700 dark:hover:text-primery-300 cursor-pointer shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primery-700" : ""}`} />
            </button>

            {/* Total students enrolled badge */}
            <div className="flex items-center gap-1 bg-white dark:bg-neutral-scale1200 px-2 py-1 rounded-xl border border-neutral-scale200 dark:border-neutral-scale1000 shadow-2xs">
              <Users className="w-3 h-3 text-primery-700 dark:text-primery-400" />
              <span className={`text-[10px] font-bold text-neutral-scale1800 dark:text-neutral-scale70 ${fontClass}`}>
                {formatDigits(totalStudentsToday)} {isRTL ? "دانشجو" : "std"}
              </span>
            </div>
          </div>
        </div>

        {/* Date Scroller Pills (Drag with mouse or touch) */}
        <div
          ref={dateScrollerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 w-full cursor-grab active:cursor-grabbing select-none touch-pan-x"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {daysData.map((day) => {
            const isSelected = day.id === selectedDayId;
            const displayDayName = isRTL ? day.dayName : day.gregorianDayName;
            const displayDayNumber = isRTL ? day.dayNumber : day.gregorianDayNumber;
            const examCount = day.exams?.length || 0;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => {
                  if (hasDraggedRef.current) {
                    hasDraggedRef.current = false;
                    return;
                  }
                  setSelectedDayId(day.id);
                }}
                className={`relative flex-1 min-w-[56px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primery-700 text-white shadow-xs scale-[1.02] border border-primery-800 dark:border-primery-600"
                    : "bg-white dark:bg-neutral-scale1200 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1100 text-neutral-scale1800 dark:text-neutral-scale70 border border-neutral-scale200 dark:border-neutral-scale1000 shadow-2xs"
                }`}
              >
                {/* Blue line on top of Today's pill */}
                {day.isToday && (
                  <div
                    className="absolute -top-[3px] inset-x-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.9)] z-10"
                    title={isRTL ? "امروز" : "Today"}
                  />
                )}

                <span
                  className={`text-[10px] font-medium leading-none mb-1 ${
                    isSelected ? "text-white/90" : "text-neutral-scale800 dark:text-neutral-scale400"
                  }`}
                >
                  {displayDayName}
                </span>

                <span className={`text-xs font-bold leading-none mb-1 ${fontClass}`}>
                  {displayDayNumber}
                </span>

                {/* Exam count indicator */}
                <div className="flex items-center gap-1">
                  {examCount > 0 ? (
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${fontClass} ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-primery-50 dark:bg-neutral-scale1100 text-primery-700 dark:text-primery-300"
                      }`}
                    >
                      {formatDigits(examCount)} {isRTL ? "آزمون" : "ex"}
                    </span>
                  ) : day.isToday ? (
                    <span
                      className={`text-[8px] font-bold text-blue-500 dark:text-blue-300 leading-none ${
                        isSelected ? "text-blue-100" : ""
                      }`}
                    >
                      {isRTL ? "امروز" : "Today"}
                    </span>
                  ) : (
                    <span className="text-[8px] text-neutral-scale400 dark:text-neutral-scale800 leading-none">
                      -
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* ================= 2. Main Body: Empty State vs Timeline ================= */}
      {!hasExamsToday ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none min-h-[380px]">
          <div className="w-16 h-16 rounded-3xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-center text-neutral-scale700 dark:text-neutral-scale400 mb-3.5 shadow-xs">
            <CalendarX2 className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70">
            {isRTL ? "هیچ آزمونی در این تاریخ زمان‌بندی نشده است" : "No exams scheduled on this date"}
          </h3>
          <p className="text-xs text-neutral-scale800 dark:text-neutral-scale400 mt-1.5 max-w-xs leading-relaxed">
            {isRTL
              ? "می‌توانید روزهای دارای آزمون را از نوار تقویم بالای صفحه انتخاب فرمایید."
              : "Please select other dates from the top bar to inspect scheduled exams."}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar pb-16">
          <div
            className="relative w-full"
            style={{ height: `${timelineTotalHeight + 40}px` }}
          >
            {/* A. Background Full Hour Lines & Labels */}
            {hoursArray.map((hour, idx) => {
              const topY = idx * HOUR_ROW_HEIGHT;

              return (
                <div
                  key={hour}
                  className="absolute inset-x-0 flex items-start"
                  style={{ top: `${topY}px`, height: `${HOUR_ROW_HEIGHT}px` }}
                >
                  {/* Left/Right Gutter: Full Hour Label */}
                  <div className="w-14 sm:w-16 shrink-0 flex items-start pt-1 px-1.5 text-neutral-scale800 dark:text-neutral-scale400 select-none">
                    <span
                      className={`text-[11px] font-bold leading-none text-neutral-scale1400 dark:text-neutral-scale300 ${fontClass}`}
                    >
                      {formatHourString(hour)}
                    </span>
                  </div>

                  {/* Horizontal Divider Line across Track */}
                  <div className="flex-1 h-full border-t border-neutral-scale200/70 dark:border-neutral-scale1100/60" />
                </div>
              );
            })}

            {/* B. Scheduled Overlapping Exam Groups */}
            {selectedDay &&
              (selectedDay.examGroups || []).map((group) => {
                const topY = getTimelineTop(group.startHour);
                const height = getTimelineHeight(group.startHour, group.endHour);
                const cardHeight = Math.max(76, Math.round(height - 4));
                const displayTimeLabel = isRTL ? group.timeLabel : group.timeLabelEn || group.timeLabel;
                const hasConflict = group.hasConflict || group.exams.length > 1;
                const isSingleExam = !hasConflict && group.exams.length === 1;
                const singleExam = isSingleExam ? group.exams[0] : null;

                if (isSingleExam) {
                  return (
                    <div
                      key={group.id}
                      onClick={() => setActiveDrawerGroup(group)}
                      className="absolute right-16 left-2 sm:right-20 sm:left-4 rounded-xl px-3 py-2 z-10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border border-neutral-scale200 dark:border-neutral-scale1100 hover:border-primery-400 dark:hover:border-primery-600 bg-white/95 dark:bg-neutral-scale1300 text-neutral-scale1800 dark:text-neutral-scale70 flex flex-col justify-between shadow-xs overflow-hidden rtl:border-r-4 rtl:border-r-primery-600 dark:rtl:border-r-primery-400 ltr:border-l-4 ltr:border-l-primery-600 dark:ltr:border-l-primery-400"
                      style={{
                        top: `${topY + 2}px`,
                        height: `${cardHeight}px`,
                      }}
                    >
                      {/* Top Row: Time Badge + Course Name + Department Pill */}
                      <div className="flex items-center justify-between gap-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 bg-primery-50 dark:bg-primery-950/60 text-primery-800 dark:text-primery-300 border border-primery-200 dark:border-primery-800/80 flex items-center gap-1 ${fontClass}`}
                          >
                            <Clock3 className="w-2.5 h-2.5 text-primery-700 dark:text-primery-400 shrink-0" />
                            <span>{displayTimeLabel}</span>
                          </div>
                          <span className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                            {singleExam?.course}
                          </span>
                        </div>

                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 bg-neutral-scale100 dark:bg-neutral-scale1200 text-neutral-scale1000 dark:text-neutral-scale400 border border-neutral-scale200 dark:border-neutral-scale1000">
                          <BookOpen className="w-2.5 h-2.5 text-primery-700 dark:text-primery-400" />
                          <span className="truncate max-w-[60px] sm:max-w-[80px]">
                            {singleExam?.department || (isRTL ? "تک‌آزمون" : "Single")}
                          </span>
                        </span>
                      </div>

                      {/* Middle Title if card is tall (>= 95px) */}
                      {cardHeight >= 95 && singleExam?.examTitle && singleExam?.examTitle !== singleExam?.course && (
                        <div className="my-auto py-0.5">
                          <p className="text-[11px] text-neutral-scale900 dark:text-neutral-scale300 font-medium truncate">
                            {singleExam.examTitle}
                          </p>
                        </div>
                      )}

                      {/* Bottom Row: Professor Avatar & Name + Student Count */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-scale200/70 dark:border-neutral-scale1100 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full ${singleExam?.avatarBg || "bg-primery-700"} text-white font-bold text-[9px] flex items-center justify-center border border-white dark:border-neutral-scale1300 shadow-xs shrink-0 ${fontClass}`}
                          >
                            {singleExam?.avatarText || "است"}
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-medium text-neutral-scale1400 dark:text-neutral-scale300 truncate max-w-[140px]">
                            {singleExam?.professorName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold shrink-0 text-neutral-scale1400 dark:text-neutral-scale300">
                          <Users className="w-3 h-3 text-primery-700 dark:text-primery-400" />
                          <span className={fontClass}>
                            {formatDigits(singleExam?.studentCount || group.totalStudents)} {isRTL ? "دانشجو" : "stud."}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={group.id}
                    onClick={() => setActiveDrawerGroup(group)}
                    className="absolute right-16 left-2 sm:right-20 sm:left-4 rounded-xl px-3 py-2 z-10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border bg-amber-50/95 dark:bg-neutral-scale1300 border-amber-300 dark:border-amber-900/60 hover:border-amber-400 text-amber-950 dark:text-amber-100 flex flex-col justify-between shadow-xs overflow-hidden rtl:border-r-4 rtl:border-r-amber-500 ltr:border-l-4 ltr:border-l-amber-500"
                    style={{
                      top: `${topY + 2}px`,
                      height: `${cardHeight}px`,
                    }}
                  >
                    {/* Header row: time badge + title */}
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900 flex items-center gap-1 ${fontClass}`}
                        >
                          <Clock3 className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400 shrink-0" />
                          <span>{displayTimeLabel}</span>
                        </span>
                        <span className="text-[11px] font-bold truncate">
                          {formatDigits(group.exams.length)} {isRTL ? "آزمون همپوشان" : "Overlapping Exams"}
                        </span>
                      </div>

                      {/* Conflict Badge */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span className={fontClass}>
                          {isRTL ? "تداخل زمانی" : "Overlap"}
                        </span>
                      </span>
                    </div>

                    {/* Center / Bottom row: Stacked Avatars & Students count */}
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/80 dark:border-neutral-scale1100 shrink-0">
                      {/* Stacked Avatar Group of Professors */}
                      <div className="flex items-center -space-x-1.5 rtl:space-x-reverse min-w-0">
                        {group.exams.slice(0, 3).map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className={`w-5 h-5 rounded-full ${ex.avatarBg || "bg-primery-700"} text-white font-bold text-[9px] flex items-center justify-center border border-white dark:border-neutral-scale1300 shadow-xs shrink-0 ${fontClass}`}
                            title={`${ex.professorName} (${ex.course})`}
                          >
                            {ex.avatarText || "است"}
                          </div>
                        ))}
                        {group.exams.length > 3 && (
                          <div className="w-5 h-5 rounded-full bg-neutral-scale300 dark:bg-neutral-scale1000 text-neutral-scale1800 dark:text-neutral-scale70 font-bold text-[8px] flex items-center justify-center border border-white dark:border-neutral-scale1300 shadow-xs shrink-0">
                            +{group.exams.length - 3}
                          </div>
                        )}
                        <span className="text-[10px] text-neutral-scale900 dark:text-neutral-scale400 font-medium mr-1.5 rtl:mr-1.5 ltr:ml-1.5 truncate max-w-[130px]">
                          {group.exams
                            .map((e) => e.professorName)
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .join("، ")}
                        </span>
                      </div>

                      {/* Total active students count */}
                      <div className="flex items-center gap-1 text-[10px] font-bold shrink-0 text-neutral-scale1400 dark:text-neutral-scale300">
                        <Users className="w-3 h-3 text-primery-700 dark:text-primery-400" />
                        <span className={fontClass}>
                          {formatDigits(group.totalStudents)} {isRTL ? "دانشجو" : "stud."}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ================= 3. Bottom Sheet (Drawer) for Exam Details ================= */}
      {activeDrawerGroup && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setActiveDrawerGroup(null)}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
          />

          {/* Slide-up Sheet */}
          <div
            className={`relative z-10 w-full md:w-[360px] mx-auto bg-neutral-scale70 dark:bg-neutral-scale1300 border-t border-neutral-scale200 dark:border-neutral-scale1100 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out ${fontClass}`}
          >
            {/* Drag Handle Bar */}
            <div
              onClick={() => setActiveDrawerGroup(null)}
              className="w-12 h-1.5 bg-neutral-scale300 dark:bg-neutral-scale1000 rounded-full mx-auto my-2.5 shrink-0 cursor-pointer"
              title={isRTL ? "بستن پنل" : "Close drawer"}
            />

            {/* Sheet Header */}
            <div className="px-4 pb-3 border-b border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    activeDrawerGroup.hasConflict || activeDrawerGroup.exams.length > 1
                      ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-900"
                      : "bg-primery-100 dark:bg-primery-950/70 text-primery-800 dark:text-primery-400 border border-primery-300 dark:border-primery-900"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-2">
                    <span>{isRTL ? "جزئیات آزمون‌های این بازه" : "Exam Schedule Details"}</span>
                  </h3>
                  <span className={`text-[11px] text-neutral-scale800 dark:text-neutral-scale400 block ${fontClass}`}>
                    {isRTL
                      ? `${selectedDay?.dayName} ${selectedDay?.dayNumber} ${selectedDay?.month}`
                      : `${selectedDay?.gregorianDayFull}, ${selectedDay?.gregorianMonth} ${selectedDay?.gregorianDayNumber}`}{" "}
                    • {isRTL ? activeDrawerGroup.timeLabel : activeDrawerGroup.timeLabelEn || activeDrawerGroup.timeLabel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDrawerGroup(null)}
                className="w-7 h-7 rounded-full bg-neutral-scale100 hover:bg-neutral-scale200 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 text-neutral-scale1400 dark:text-neutral-scale200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Scrollable Body */}
            <div className="p-4 pb-12 space-y-4 overflow-y-auto flex-1 no-scrollbar text-xs">
              {/* Real Metric Summary Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white dark:bg-neutral-scale1400 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
                  <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 font-medium flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-primery-700 dark:text-primery-400" />
                    {isRTL ? "تعداد آزمون‌ها:" : "Total Exams:"}
                  </span>
                  <span className={`text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 mt-1 ${fontClass}`}>
                    {formatDigits(activeDrawerGroup.exams.length)} {isRTL ? "آزمون" : "exams"}
                  </span>
                </div>

                <div className="bg-white dark:bg-neutral-scale1400 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
                  <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 font-medium flex items-center gap-1">
                    <Users className="w-3 h-3 text-primery-700 dark:text-primery-400" />
                    {isRTL ? "مجموع دانشجویان:" : "Total Students:"}
                  </span>
                  <span className={`text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 mt-1 ${fontClass}`}>
                    {formatDigits(activeDrawerGroup.totalStudents)} {isRTL ? "نفر" : "students"}
                  </span>
                </div>
              </div>

              {/* List of Exams in this window */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-scale1800 dark:text-neutral-scale70 text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    {isRTL ? "اساتید و آزمون‌ها:" : "Professors & Exams:"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeDrawerGroup.exams.length > 1
                        ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300"
                        : "bg-neutral-scale100 dark:bg-neutral-scale1100 text-neutral-scale1400 dark:text-neutral-scale300"
                    } ${fontClass}`}
                  >
                    {activeDrawerGroup.exams.length > 1
                      ? isRTL
                        ? "همپوشانی زمانی دارند"
                        : "Concurrent overlap"
                      : isRTL
                      ? "بدون تداخل"
                      : "No overlap"}
                  </span>
                </div>

                <div className="space-y-2">
                  {activeDrawerGroup.exams.map((ex, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-xl p-3 flex flex-col gap-2 hover:border-neutral-scale300 dark:hover:border-neutral-scale1000 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full ${ex.avatarBg || "bg-primery-700"} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${fontClass}`}
                          >
                            {ex.avatarText || "است"}
                          </div>
                          <div>
                            <h4 className="font-bold text-neutral-scale1800 dark:text-neutral-scale70 text-xs leading-snug">
                              {ex.professorName}
                            </h4>
                            <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 block">
                              {ex.department}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg bg-neutral-scale100 dark:bg-neutral-scale1100 border border-neutral-scale200 dark:border-neutral-scale1000 text-primery-700 dark:text-primery-300 shrink-0 ${fontClass}`}
                        >
                          {isRTL
                            ? ex.timeRange
                            : ex.startTimeStr && ex.endTimeStr
                            ? `${ex.startTimeStr} - ${ex.endTimeStr}`
                            : ex.timeRange}
                        </span>
                      </div>

                      <div className="bg-neutral-scale80 dark:bg-neutral-scale1300 rounded-lg p-2 flex items-center justify-between text-[11px] text-neutral-scale1800 dark:text-neutral-scale70">
                        <div>
                          <span className="font-bold block text-neutral-scale1800 dark:text-neutral-scale70">
                            {ex.course}
                          </span>
                          <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400">
                            {ex.examTitle}
                          </span>
                        </div>

                        <div className="text-left rtl:text-left ltr:text-right shrink-0">
                          <span className={`font-bold text-primery-700 dark:text-primery-400 block ${fontClass}`}>
                            {formatDigits(ex.studentCount)} {isRTL ? "نفر" : "std"}
                          </span>
                          {ex.impact && (
                            <span className="text-[9px] text-neutral-scale800 dark:text-neutral-scale400">
                              {ex.impact}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveDrawerGroup(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-scale200 hover:bg-neutral-scale300 dark:bg-neutral-scale1100 dark:hover:bg-neutral-scale1000 text-neutral-scale1800 dark:text-neutral-scale70 font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
              >
                <span>{isRTL ? "بستن پنل جزئیات" : "Close Panel"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSchedulingVisualizer;
