import React, { useState, useMemo, useRef, useEffect, useContext } from "react";
import {
  CalendarDays,
  Clock3,
  Server,
  Users,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  X,
  Sparkles,
  CheckCircle2,
  Info,
  ArrowRight,
  TrendingUp,
  Cpu,
  Zap,
  Layers,
  RefreshCw,
} from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import { toPersianDigits } from "@/utils/dateUtils";
import { getAdminExamsSchedule } from "@/api";

const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 22;
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR; // 14 hours (08:00 to 22:00)
const HOUR_ROW_HEIGHT = 64; // px per hour on mobile
const TIMELINE_TOTAL_HEIGHT = TOTAL_HOURS * HOUR_ROW_HEIGHT;

export const ExamSchedulingVisualizer = ({
  onConfirmSchedule,
  defaultDurationMinutes = 90,
  initialStartHour = 10.0,
  embedded = false,
}) => {
  const { isRTL, language } = useContext(AppContext);

  // Font family selector: Vazirmatn for Persian, Inter for English
  const fontClass = isRTL ? "font-vazir" : "font-inter";

  // Real backend schedule state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [daysData, setDaysData] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState(null);

  // Proposed Exam Slot State
  const [slotStartHour, setSlotStartHour] = useState(initialStartHour);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(defaultDurationMinutes);
  const slotDurationHours = slotDurationMinutes / 60;
  const slotEndHour = slotStartHour + slotDurationHours;

  // Drawer / Bottom sheet state for detailed conflict inspection
  const [activeDrawerGroup, setActiveDrawerGroup] = useState(null);

  // Booking confirmation state
  const [isConfirmed, setIsConfirmed] = useState(false);

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
    const clamped = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR, hourDecimal));
    const offset = clamped - TIMELINE_START_HOUR;
    return offset * HOUR_ROW_HEIGHT;
  };

  const getTimelineHeight = (startH, endH) => {
    const clampedStart = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR, startH));
    const clampedEnd = Math.max(TIMELINE_START_HOUR, Math.min(TIMELINE_END_HOUR, endH));
    const duration = Math.max(0.4, clampedEnd - clampedStart);
    return duration * HOUR_ROW_HEIGHT;
  };

  // Evaluate Server Capacity Status for proposed slot
  const slotCapacityEvaluation = useMemo(() => {
    if (!selectedDay) {
      return {
        status: "safe",
        badgeLabel: isRTL ? "ایمن" : "Safe",
        alertText: "",
        totalProjectedLoad: 15,
        freeCapacity: 85,
        overlappingExamsCount: 0,
        overlappingStudentsCount: 0,
        colorScheme: {
          text: "text-emerald-700 dark:text-emerald-300",
          bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
          border: "border-emerald-500 dark:border-emerald-400",
          badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
          badgeBorder: "border-emerald-300 dark:border-emerald-800",
          barColor: "bg-emerald-500",
        },
      };
    }

    const startH = Math.floor(slotStartHour);
    const endH = Math.ceil(slotEndHour);
    let maxHourlyLoad = 0;
    let overlappingExamsCount = 0;
    let overlappingStudentsCount = 0;

    for (let h = startH; h <= endH; h++) {
      const load = Number(selectedDay.hourlyLoad?.[h] ?? selectedDay.hourlyLoad?.[String(h)] ?? 12);
      if (load > maxHourlyLoad) maxHourlyLoad = load;
    }

    (selectedDay.examGroups || []).forEach((group) => {
      if (slotStartHour < group.endHour && slotEndHour > group.startHour) {
        overlappingExamsCount += (group.exams || []).length;
        overlappingStudentsCount += group.totalStudents || 0;
      }
    });

    const projectedAdditionalLoadPercent = 10;
    const totalProjectedLoad = Math.min(100, maxHourlyLoad + projectedAdditionalLoadPercent);
    const freeCapacity = Math.max(0, 100 - totalProjectedLoad);

    let status = "safe";
    let badgeLabel = "";
    let alertText = "";
    let colorScheme = {
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
      border: "border-emerald-500 dark:border-emerald-400",
      badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
      badgeBorder: "border-emerald-300 dark:border-emerald-900",
      barColor: "bg-emerald-500",
    };

    if (totalProjectedLoad > 80 || overlappingStudentsCount > 300) {
      status = "critical";
      badgeLabel = isRTL ? "ریسک تداخل بالا" : "High Conflict Risk";
      alertText = isRTL
        ? `تنها ${formatDigits(freeCapacity)}٪ ظرفیت آزاد سرور باقی مانده است. پیشنهاد می‌شود زمان دیگری انتخاب شود.`
        : `Only ${freeCapacity}% server capacity remaining. High congestion danger.`;
      colorScheme = {
        text: "text-rose-700 dark:text-rose-400",
        bg: "bg-rose-500/15 dark:bg-rose-500/20",
        border: "border-rose-500 dark:border-rose-400",
        badgeBg: "bg-rose-100 dark:bg-rose-950/80",
        badgeBorder: "border-rose-300 dark:border-rose-900",
        barColor: "bg-rose-500",
      };
    } else if (totalProjectedLoad >= 50 || overlappingStudentsCount > 100) {
      status = "moderate";
      badgeLabel = isRTL ? "ترافیک متوسط (پایش فعال)" : "Moderate Overlap";
      alertText = isRTL
        ? `${formatDigits(freeCapacity)}٪ ظرفیت آزاد. امکان برگزاری وجود دارد ولی نیازمند مانیتورینگ است.`
        : `${freeCapacity}% capacity available. Safe but active monitoring advised.`;
      colorScheme = {
        text: "text-amber-800 dark:text-amber-300",
        bg: "bg-amber-500/15 dark:bg-amber-500/20",
        border: "border-amber-500 dark:border-amber-400",
        badgeBg: "bg-amber-100 dark:bg-amber-950/80",
        badgeBorder: "border-amber-300 dark:border-amber-900",
        barColor: "bg-amber-500",
      };
    } else {
      status = "safe";
      badgeLabel = isRTL ? "ظرفیت سرور: کاملاً ایمن" : "Server Overlap: Safe";
      alertText = isRTL
        ? `${formatDigits(freeCapacity)}٪ ظرفیت آزاد سرور. شرایط ایده‌آل برای برگزاری بدون افت سرعت.`
        : `${freeCapacity}% free server capacity. Ideal conditions for smooth exams.`;
      colorScheme = {
        text: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
        border: "border-emerald-500 dark:border-emerald-400",
        badgeBg: "bg-emerald-100 dark:bg-emerald-950/80",
        badgeBorder: "border-emerald-300 dark:border-emerald-900",
        barColor: "bg-emerald-500",
      };
    }

    return {
      status,
      badgeLabel,
      alertText,
      totalProjectedLoad,
      freeCapacity,
      overlappingExamsCount,
      overlappingStudentsCount,
      colorScheme,
    };
  }, [slotStartHour, slotEndHour, selectedDay, isRTL]);

  // Handle clicking on the timeline track to move the proposed slot
  const handleTimelineTrackClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickedHourExact = TIMELINE_START_HOUR + clickY / HOUR_ROW_HEIGHT;
    // Snap to nearest 30 minutes (0.5 hour)
    const snappedHour = Math.round(clickedHourExact * 2) / 2;
    // Bound within timeline
    const maxStart = TIMELINE_END_HOUR - slotDurationHours;
    const clampedHour = Math.max(TIMELINE_START_HOUR, Math.min(maxStart, snappedHour));
    setSlotStartHour(clampedHour);
    setIsConfirmed(false);
  };

  const hoursArray = useMemo(() => {
    const list = [];
    for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
      list.push(h);
    }
    return list;
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={`w-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#f1f0f0] dark:bg-neutral-scale1400 ${fontClass}`}
      >
        <div className="w-9 h-9 border-3 border-primery-700/20 border-t-primery-700 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70">
          {isRTL ? "در حال دریافت زمان‌بندی آزمون‌ها و بار سرور..." : "Loading exam schedules & server load..."}
        </p>
        <p className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 mt-1">
          {isRTL ? "ارتباط با پایگاه داده و محاسبه خوشه‌های همپوشانی" : "Connecting to database and computing cluster overlaps"}
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

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full flex-1 flex flex-col bg-[#f1f0f0] dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 select-none overflow-hidden relative ${fontClass} transition-colors duration-200`}
    >
      {/* ================= 1. Top Header: Horizontal Week Date Scroller (Drag-to-Scroll) ================= */}
      <header className="sticky top-0 z-20 bg-neutral-scale70 dark:bg-neutral-scale1300 border-b border-neutral-scale200 dark:border-neutral-scale1100 px-3 py-2.5 shrink-0 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primery-50 dark:bg-neutral-scale1200 border border-primery-200 dark:border-neutral-scale1000 flex items-center justify-center text-primery-700 dark:text-primery-300 shrink-0">
              <Server className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5 leading-tight truncate">
                <span>{isRTL ? "پایش بار سرور و زمان‌بندی" : "Server Capacity & Scheduling"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-bold shrink-0">
                  {isRTL ? "زنده" : "LIVE"}
                </span>
              </h2>
              <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400 block truncate">
                {selectedDaySubtitle} • {isRTL ? "ظرفیت کل: ۱۰۰۰ کلاینت" : "Capacity: 1000 Clients"}
              </span>
            </div>
          </div>

          {/* Quick telemetry badge + Refresh button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fetchScheduleData(true)}
              disabled={refreshing}
              title={isRTL ? "بروزرسانی زنده" : "Live refresh"}
              className="w-6 h-6 rounded-lg bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 flex items-center justify-center text-neutral-scale1000 dark:text-neutral-scale400 hover:text-primery-700 dark:hover:text-primery-300 cursor-pointer shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin text-primery-700" : ""}`} />
            </button>

            <div className="flex items-center gap-1 bg-white dark:bg-neutral-scale1200 px-2 py-1 rounded-xl border border-neutral-scale200 dark:border-neutral-scale1000 shadow-2xs">
              <Cpu className="w-3 h-3 text-primery-700 dark:text-primery-400 animate-pulse" />
              <span className={`text-[10px] font-bold text-neutral-scale1800 dark:text-neutral-scale70 ${fontClass}`}>
                {selectedDay ? formatDigits(selectedDay.overallLoad) : "0"}%
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
            const dotColor =
              day.overallLoad > 80
                ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]"
                : day.overallLoad >= 50
                ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)]"
                : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]";

            const displayDayName = isRTL ? day.dayName : day.gregorianDayName;
            const displayDayNumber = isRTL ? day.dayNumber : day.gregorianDayNumber;

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
                  setIsConfirmed(false);
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

                {/* Server Load Indicator Dot + Today marker */}
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  {day.isToday && (
                    <span className={`text-[8px] font-bold text-blue-500 dark:text-blue-300 leading-none ${isSelected ? "text-blue-100" : ""}`}>
                      {isRTL ? "امروز" : "Today"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* ================= 2. Duration Selector & Quick Guidance Strip ================= */}
      <div className="bg-neutral-scale70/80 dark:bg-neutral-scale1300/80 border-b border-neutral-scale200 dark:border-neutral-scale1100 px-3 py-2 flex items-center justify-between text-xs shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-1 text-neutral-scale800 dark:text-neutral-scale400">
          <Clock3 className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium text-neutral-scale1400 dark:text-neutral-scale300">
            {isRTL ? "مدت آزمون:" : "Exam Duration:"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[30, 60, 90, 120].map((dur) => (
            <button
              key={dur}
              type="button"
              onClick={() => {
                setSlotDurationMinutes(dur);
                setIsConfirmed(false);
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                slotDurationMinutes === dur
                  ? "bg-primery-700 text-white shadow-xs"
                  : "bg-white dark:bg-neutral-scale1200 text-neutral-scale900 dark:text-neutral-scale400 hover:text-neutral-scale1800 dark:hover:text-neutral-scale70 border border-neutral-scale200 dark:border-neutral-scale1000"
              }`}
            >
              {formatDigits(dur)} {isRTL ? "دقیقه" : "min"}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 3. Main Body: Dual-Track Vertical Timeline ================= */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar pb-32">
        <div
          className="relative w-full"
          style={{ height: `${TIMELINE_TOTAL_HEIGHT + 40}px` }}
        >
          {/* A. Background Hour Lines & Time Labels */}
          {hoursArray.map((hour, idx) => {
            const topY = idx * HOUR_ROW_HEIGHT;
            const hourLoad = Number(
              selectedDay?.hourlyLoad?.[hour] ?? selectedDay?.hourlyLoad?.[String(hour)] ?? 12
            );
            const isHigh = hourLoad > 80;
            const isMedium = hourLoad >= 50 && hourLoad <= 80;

            return (
              <div
                key={hour}
                className="absolute inset-x-0 flex items-start"
                style={{ top: `${topY}px`, height: `${HOUR_ROW_HEIGHT}px` }}
              >
                {/* Left Gutter: Time Label + Server Load Bar */}
                <div className="w-14 sm:w-16 shrink-0 flex flex-col items-center justify-start pt-1 text-neutral-scale800 dark:text-neutral-scale400">
                  <span className={`text-[11px] font-bold leading-none text-neutral-scale1400 dark:text-neutral-scale300 ${fontClass}`}>
                    {formatHourString(hour)}
                  </span>
                  <span
                    className={`text-[9px] mt-1 px-1 rounded font-bold ${fontClass} ${
                      isHigh
                        ? "text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900"
                        : isMedium
                        ? "text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900"
                        : "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900"
                    }`}
                  >
                    {formatDigits(hourLoad)}%
                  </span>
                </div>

                {/* Vertical Continuous Server Load Heatmap Segment */}
                <div className="w-1.5 self-stretch rounded-full mx-1 relative overflow-hidden bg-neutral-scale200 dark:bg-neutral-scale1200">
                  <div
                    className={`w-full h-full rounded-full transition-all duration-300 ${
                      isHigh
                        ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                        : isMedium
                        ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>

                {/* Horizontal Divider Line across Main Track */}
                <div className="flex-1 h-full border-t border-neutral-scale200/80 dark:border-neutral-scale1100/70 relative">
                  {/* Subtle Half-hour dashed divider */}
                  <div className="absolute top-1/2 inset-x-0 border-t border-neutral-scale200/40 dark:border-neutral-scale1100/30 border-dashed" />
                </div>
              </div>
            );
          })}

          {/* B. Main Track Clickable Overlay for placing slot */}
          <div
            onClick={handleTimelineTrackClick}
            className="absolute top-0 bottom-0 right-16 left-2 sm:right-20 sm:left-4 z-0 cursor-pointer"
            title={isRTL ? "برای جابجایی بازه زمانی، روی ساعت مورد نظر ضربه بزنید" : "Tap to reposition exam slot"}
          />

          {/* Empty state hint if day has 0 exams */}
          {selectedDay && (!selectedDay.examGroups || selectedDay.examGroups.length === 0) && (
            <div className="absolute top-6 right-18 left-4 p-4 rounded-2xl bg-white/70 dark:bg-neutral-scale1300/70 border border-dashed border-emerald-300 dark:border-emerald-800 text-center pointer-events-none shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">
                {isRTL ? "کل ظرفیت سرور در این روز آزاد است" : "Full server capacity available"}
              </span>
              <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400">
                {isRTL ? "هیچ آزمون همپوشانی در این تاریخ ثبت نشده است." : "No conflicting exams scheduled on this date."}
              </span>
            </div>
          )}

          {/* C. Scheduled Overlapping Exam Groups (Unified Summary Cards) */}
          {selectedDay &&
            (selectedDay.examGroups || []).map((group) => {
              const topY = getTimelineTop(group.startHour);
              const height = getTimelineHeight(group.startHour, group.endHour);
              const isRose = group.serverLoad > 80;
              const isAmber = group.serverLoad >= 50 && group.serverLoad <= 80;
              const displayTimeLabel = isRTL ? group.timeLabel : group.timeLabelEn || group.timeLabel;

              return (
                <div
                  key={group.id}
                  onClick={() => setActiveDrawerGroup(group)}
                  className={`absolute right-16 left-2 sm:right-20 sm:left-4 rounded-xl p-2.5 z-10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border flex flex-col justify-between shadow-xs ${
                    isRose
                      ? "bg-rose-50/95 dark:bg-neutral-scale1300 border-rose-300 dark:border-rose-900/60 hover:border-rose-400 text-rose-950 dark:text-rose-100"
                      : isAmber
                      ? "bg-amber-50/95 dark:bg-neutral-scale1300 border-amber-300 dark:border-amber-900/60 hover:border-amber-400 text-amber-950 dark:text-amber-100"
                      : "bg-white/95 dark:bg-neutral-scale1300 border-neutral-scale200 dark:border-neutral-scale1100 hover:border-primery-400 dark:hover:border-primery-600 text-neutral-scale1800 dark:text-neutral-scale70"
                  }`}
                  style={{
                    top: `${topY + 2}px`,
                    height: `${Math.max(54, height - 4)}px`,
                  }}
                >
                  {/* Header row: time badge + load badge */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${fontClass} ${
                          isRose
                            ? "bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900"
                            : isAmber
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900"
                            : "bg-neutral-scale100 dark:bg-neutral-scale1200 text-neutral-scale1400 dark:text-neutral-scale300 border border-neutral-scale200 dark:border-neutral-scale1000"
                        }`}
                      >
                        {displayTimeLabel}
                      </span>
                      <span className="text-[11px] font-bold truncate">
                        {group.exams.length > 1
                          ? isRTL
                            ? `${formatDigits(group.exams.length)} آزمون همپوشان`
                            : `${group.exams.length} Overlapping Exams`
                          : group.exams[0]?.course || group.exams[0]?.examTitle}
                      </span>
                    </div>

                    {/* Load badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                        isRose
                          ? "bg-rose-600 text-white shadow-xs animate-pulse"
                          : isAmber
                          ? "bg-amber-500 text-slate-900"
                          : "bg-emerald-600 text-white shadow-xs"
                      }`}
                    >
                      <Server className="w-2.5 h-2.5" />
                      <span className={fontClass}>{formatDigits(group.serverLoad)}%</span>
                    </span>
                  </div>

                  {/* Center / Bottom row: Stacked Avatars & Students count */}
                  <div
                    className={`flex items-center justify-between mt-1 pt-1 border-t ${
                      isRose
                        ? "border-rose-200/80 dark:border-neutral-scale1100"
                        : isAmber
                        ? "border-amber-200/80 dark:border-neutral-scale1100"
                        : "border-neutral-scale200/80 dark:border-neutral-scale1100"
                    }`}
                  >
                    {/* Stacked Avatar Group of Professors */}
                    <div className="flex items-center -space-x-1.5 rtl:space-x-reverse min-w-0">
                      {group.exams.slice(0, 3).map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className={`w-5 h-5 rounded-full ${ex.avatarBg || "bg-primery-700"} text-white font-bold text-[9px] flex items-center justify-center border-2 border-white dark:border-neutral-scale1300 shadow-xs shrink-0 ${fontClass}`}
                          title={`${ex.professorName} (${ex.course})`}
                        >
                          {ex.avatarText || "است"}
                        </div>
                      ))}
                      {group.exams.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-neutral-scale300 dark:bg-neutral-scale1000 text-neutral-scale1800 dark:text-neutral-scale70 font-bold text-[8px] flex items-center justify-center border-2 border-white dark:border-neutral-scale1300 shadow-xs shrink-0">
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

          {/* D. Interactive New Exam Slot Preview (Dashed primary border + floating badge) */}
          <div
            className={`absolute right-16 left-2 sm:right-20 sm:left-4 rounded-xl z-20 pointer-events-none border-2 border-dashed ${slotCapacityEvaluation.colorScheme.border} ${slotCapacityEvaluation.colorScheme.bg} flex flex-col justify-between p-2.5 transition-all duration-300 ease-out`}
            style={{
              top: `${getTimelineTop(slotStartHour)}px`,
              height: `${Math.max(50, getTimelineHeight(slotStartHour, slotEndHour))}px`,
            }}
          >
            {/* Top row inside slot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primery-600 dark:bg-primery-400 animate-ping" />
                <span className={`text-[11px] font-bold text-neutral-scale1800 dark:text-neutral-scale70 ${fontClass}`}>
                  {formatHourString(slotStartHour)} - {formatHourString(slotEndHour)}
                </span>
                <span className="text-[10px] text-primery-700 dark:text-primery-300 font-semibold">
                  ({isRTL ? "آزمون انتخابی شما" : "Your Slot"})
                </span>
              </div>

              {/* Status pill */}
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-2xs border ${slotCapacityEvaluation.colorScheme.badgeBorder} ${slotCapacityEvaluation.colorScheme.badgeBg} ${slotCapacityEvaluation.colorScheme.text}`}
              >
                {slotCapacityEvaluation.status === "safe" ? (
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                ) : slotCapacityEvaluation.status === "moderate" ? (
                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400 animate-bounce" />
                )}
                <span>{slotCapacityEvaluation.badgeLabel}</span>
              </div>
            </div>

            {/* Bottom info inside slot */}
            <div className="flex items-center justify-between text-[10px] text-neutral-scale1000 dark:text-neutral-scale400 font-medium">
              <span className={fontClass}>
                {isRTL
                  ? `ظرفیت آزاد باقی‌مانده: ${formatDigits(slotCapacityEvaluation.freeCapacity)}٪`
                  : `Free: ${slotCapacityEvaluation.freeCapacity}%`}
              </span>
              <span className="text-primery-700 dark:text-primery-400 font-bold underline cursor-pointer pointer-events-auto">
                {isRTL ? "تغییر زمان یا بررسی تداخل" : "Change time"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. Bottom Sheet (Drawer) for Overlapping Details (Z-[9999]) ================= */}
      {activeDrawerGroup && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setActiveDrawerGroup(null)}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
          />

          {/* Slide-up Sheet (aligned to mobile viewport width md:w-[360px]) */}
          <div className={`relative z-10 w-full md:w-[360px] mx-auto bg-neutral-scale70 dark:bg-neutral-scale1300 border-t border-neutral-scale200 dark:border-neutral-scale1100 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out ${fontClass}`}>
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
                    activeDrawerGroup.serverLoad > 80
                      ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900"
                      : activeDrawerGroup.serverLoad >= 50
                      ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-900"
                      : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-2">
                    <span>{isRTL ? "جزئیات تداخل و بار ترافیکی سرور" : "Conflict & Server Breakdown"}</span>
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

            {/* Sheet Scrollable Body with bottom safe-area padding pb-20 */}
            <div className="p-4 pb-20 space-y-4 overflow-y-auto flex-1 no-scrollbar text-xs">
              {/* Visual Server Capacity Gauge / Progress Bar */}
              <div className="bg-white dark:bg-neutral-scale1400 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-scale1800 dark:text-neutral-scale70 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    {isRTL ? "وضعیت اشغال پهنای باند و منابع:" : "Server Capacity Allocated:"}
                  </span>
                  <span
                    className={`font-bold ${fontClass} ${
                      activeDrawerGroup.serverLoad > 80
                        ? "text-rose-600 dark:text-rose-400"
                        : activeDrawerGroup.serverLoad >= 50
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatDigits(activeDrawerGroup.serverLoad)}%
                  </span>
                </div>

                {/* Multi-Segment Capacity Bar */}
                <div className="w-full h-3 rounded-full bg-neutral-scale200 dark:bg-neutral-scale1200 overflow-hidden flex p-0.5 border border-neutral-scale200 dark:border-neutral-scale1000">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      activeDrawerGroup.serverLoad > 80
                        ? "bg-rose-500"
                        : activeDrawerGroup.serverLoad >= 50
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${activeDrawerGroup.serverLoad}%` }}
                  />
                </div>

                <div className={`flex items-center justify-between text-[10px] text-neutral-scale800 dark:text-neutral-scale400 pt-0.5 ${fontClass}`}>
                  <span>
                    {formatDigits(activeDrawerGroup.totalStudents)} {isRTL ? "دانشجو آنلاین" : "Active Students"}
                  </span>
                  <span>
                    {formatDigits(Math.max(0, 1000 - activeDrawerGroup.totalStudents))}{" "}
                    {isRTL ? "اسلات سرور آزاد" : "Slots Free"}
                  </span>
                </div>
              </div>

              {/* List of Conflicting Exams in this window */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-scale1800 dark:text-neutral-scale70 text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    {isRTL ? "اساتید و آزمون‌های همزمان در این بازه:" : "Concurrent Exams & Professors:"}
                  </span>
                  <span className={`text-[10px] text-neutral-scale800 dark:text-neutral-scale400 font-semibold ${fontClass}`}>
                    {formatDigits(activeDrawerGroup.exams.length)} {isRTL ? "آزمون" : "exams"}
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
                          <span className="text-[9px] text-neutral-scale800 dark:text-neutral-scale400">{ex.impact}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI / Smart Scheduling Recommendation */}
              <div className="bg-primery-50 dark:bg-neutral-scale1200 border border-primery-200 dark:border-primery-800/60 rounded-2xl p-3 text-xs space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-primery-800 dark:text-primery-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                  <span>{isRTL ? "پیشنهاد هوشمند توزیع بار:" : "Smart Recommendation:"}</span>
                </div>
                <p className="text-[11px] text-neutral-scale1400 dark:text-neutral-scale300 leading-relaxed">
                  {isRTL
                    ? "برای پیشگیری از افت پهنای باند و ازدحام سرور، می‌توانید ساعت آزمون را به بازه خلوت‌تری خارج از این تداخل انتقال دهید."
                    : "To prevent bandwidth degradation and congestion, you can shift this exam to a quieter time slot."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    let bestHour = 16.0;
                    if (selectedDay?.hourlyLoad) {
                      let minLoad = 999;
                      for (let h = 8; h <= 20; h++) {
                        const l = Number(selectedDay.hourlyLoad[h] ?? selectedDay.hourlyLoad[String(h)] ?? 15);
                        if (l < minLoad) {
                          minLoad = l;
                          bestHour = h;
                        }
                      }
                    }
                    setSlotStartHour(bestHour);
                    setActiveDrawerGroup(null);
                  }}
                  className="mt-1 w-full py-2 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isRTL ? "انتقال خودکار آزمون به ساعت با کمترین ترافیک" : "Auto-shift to Lowest Load Slot"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. Sticky Bottom Action Bar ================= */}
      <footer className="sticky bottom-0 z-30 bg-neutral-scale70/95 dark:bg-neutral-scale1300/95 backdrop-blur-md border-t border-neutral-scale200 dark:border-neutral-scale1100 p-3 shadow-lg flex flex-col gap-2 shrink-0 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                slotCapacityEvaluation.status === "safe"
                  ? "bg-emerald-500 animate-pulse"
                  : slotCapacityEvaluation.status === "moderate"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500 animate-ping"
              }`}
            />
            <div>
              <span className={`text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 block ${fontClass}`}>
                {formatHourString(slotStartHour)} - {formatHourString(slotEndHour)}
              </span>
              <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale400">
                {formatDigits(slotDurationMinutes)} {isRTL ? "دقیقه" : "min"} • {slotCapacityEvaluation.badgeLabel}
              </span>
            </div>
          </div>

          {/* Conflict trigger button */}
          <button
            type="button"
            onClick={() => {
              if (selectedDay && selectedDay.examGroups && selectedDay.examGroups.length > 0) {
                setActiveDrawerGroup(selectedDay.examGroups[0]);
              }
            }}
            className="text-[11px] font-bold text-primery-700 dark:text-primery-400 hover:text-primery-800 underline flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{isRTL ? "مشاهده تداخل‌ها" : "View conflicts"}</span>
          </button>
        </div>

        {/* CTA Button */}
        {isConfirmed ? (
          <div className="w-full h-10 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRTL ? "زمان آزمون با موفقیت ثبت گردید" : "Exam Slot Booked Successfully"}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsConfirmed(true);
              if (onConfirmSchedule && selectedDay) {
                onConfirmSchedule({
                  day: selectedDay,
                  startHour: slotStartHour,
                  endHour: slotEndHour,
                  durationMinutes: slotDurationMinutes,
                  startTimeString: formatHourString(slotStartHour),
                  endTimeString: formatHourString(slotEndHour),
                });
              }
            }}
            className={`w-full h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-sm ${
              slotCapacityEvaluation.status === "critical"
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                : "bg-primery-700 hover:bg-primery-800 text-white shadow-xs"
            }`}
          >
            <span>{isRTL ? "تأیید و ثبت زمان‌بندی آزمون" : "Confirm & Schedule Exam"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        )}
      </footer>
    </div>
  );
};

export default ExamSchedulingVisualizer;
