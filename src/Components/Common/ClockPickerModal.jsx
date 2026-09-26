import { useState, useEffect, useRef, useContext, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Clock, Check, AlertCircle } from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import { toPersianDigits } from "@/utils/dateUtils";

/**
 * Parses "HH:MM" string into { hours: number, minutes: number, total: number }
 */
export const parseTimeString = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) {
    return { hours: 10, minutes: 0, total: 600 };
  }
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  const validH = Math.max(0, Math.min(23, h));
  const validM = Math.max(0, Math.min(59, m));
  return { hours: validH, minutes: validM, total: validH * 60 + validM };
};

/**
 * Formats hours and minutes into "HH:MM"
 */
export const formatTimeString = (hours, minutes) => {
  const hh = String(Math.max(0, Math.min(23, hours))).padStart(2, "0");
  const mm = String(Math.max(0, Math.min(59, minutes))).padStart(2, "0");
  return `${hh}:${mm}`;
};

/**
 * Core interactive Analog Clock Dial view.
 * Supports dragging the clock hand, direct typing, AM/PM, and minTime restrictions.
 */
export const AnalogClockDialView = ({
  value = "10:00",
  minTime = null,
  onChange,
  onConfirm,
  onClose,
  showActions = false,
  title = "",
}) => {
  const { isRTL } = useContext(AppContext);
  const dialRef = useRef(null);

  const parsedInitial = useMemo(() => parseTimeString(value), [value]);
  const parsedMin = useMemo(() => (minTime ? parseTimeString(minTime) : null), [minTime]);

  const [hour, setHour] = useState(parsedInitial.hours);
  const [minute, setMinute] = useState(parsedInitial.minutes);
  const [mode, setMode] = useState("hour"); // 'hour' | 'minute'
  const [isPM, setIsPM] = useState(parsedInitial.hours >= 12);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [hourInput, setHourInput] = useState(String(parsedInitial.hours).padStart(2, "0"));
  const [minuteInput, setMinuteInput] = useState(String(parsedInitial.minutes).padStart(2, "0"));

  // Keep internal state synchronized with external value
  useEffect(() => {
    const p = parseTimeString(value);
    setHour(p.hours);
    setMinute(p.minutes);
    setHourInput(String(p.hours).padStart(2, "0"));
    setMinuteInput(String(p.minutes).padStart(2, "0"));
    setIsPM(p.hours >= 12);
    setErrorMessage("");
  }, [value]);

  // Keep inputs in sync
  useEffect(() => {
    setHourInput(String(hour).padStart(2, "0"));
  }, [hour]);

  useEffect(() => {
    setMinuteInput(String(minute).padStart(2, "0"));
  }, [minute]);

  // Emit change upward
  const notifyChange = useCallback(
    (newH, newM) => {
      const formatted = formatTimeString(newH, newM);
      if (onChange) onChange(formatted);
    },
    [onChange]
  );

  // Direct typing handler for Hour
  const handleHourInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setHourInput(val);

    if (val !== "") {
      let num = parseInt(val, 10);
      if (num >= 0 && num <= 23) {
        if (parsedMin && num < parsedMin.hours) {
          setErrorMessage(
            isRTL
              ? `ساعت نمی‌تواند کمتر از ${parsedMin.hours} باشد.`
              : `Hour cannot be less than ${parsedMin.hours}.`
          );
          num = parsedMin.hours;
        } else {
          setErrorMessage("");
        }

        setHour(num);
        setIsPM(num >= 12);
        notifyChange(num, minute);
      }
    }
  };

  // Direct typing handler for Minute
  const handleMinuteInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setMinuteInput(val);

    if (val !== "") {
      let num = parseInt(val, 10);
      if (num >= 0 && num <= 59) {
        if (parsedMin && hour === parsedMin.hours && num < parsedMin.minutes) {
          setErrorMessage(
            isRTL
              ? `دقیقه نمی‌تواند کمتر از ${parsedMin.minutes} باشد.`
              : `Minute cannot be less than ${parsedMin.minutes}.`
          );
          num = parsedMin.minutes;
        } else {
          setErrorMessage("");
        }

        setMinute(num);
        notifyChange(hour, num);
      }
    }
  };

  // AM / PM Toggle
  const handleToggleAMPM = (pmVal) => {
    setIsPM(pmVal);
    let newH = hour;
    if (pmVal && newH < 12) newH += 12;
    if (!pmVal && newH >= 12) newH -= 12;

    if (parsedMin && newH * 60 + minute < parsedMin.total) {
      newH = parsedMin.hours;
      setMinute(parsedMin.minutes);
      setIsPM(parsedMin.hours >= 12);
      setErrorMessage(
        isRTL
          ? `ساعت نمی‌تواند کمتر از ${minTime} باشد.`
          : `Time cannot be earlier than ${minTime}.`
      );
    } else {
      setErrorMessage("");
    }

    setHour(newH);
    notifyChange(newH, minute);
  };

  // Dial Geometry & Angles
  const numberRadius = 78;
  const centerX = 115;
  const centerY = 115;

  const handAngle = useMemo(() => {
    if (mode === "hour") {
      const h12 = hour % 12 || 12;
      return h12 * 30; // 30 deg per hour
    } else {
      return minute * 6; // 6 deg per minute
    }
  }, [mode, hour, minute]);

  // Pointer move calculation
  const updateFromPointer = (clientX, clientY) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    if (mode === "hour") {
      let rawH12 = Math.round(deg / 30) % 12;
      if (rawH12 === 0) rawH12 = 12;

      let newH24 = isPM ? (rawH12 === 12 ? 12 : rawH12 + 12) : rawH12 === 12 ? 0 : rawH12;

      if (parsedMin) {
        const candidateTotal = newH24 * 60 + minute;
        if (candidateTotal < parsedMin.total) {
          newH24 = parsedMin.hours;
          if (newH24 * 60 + minute < parsedMin.total) {
            setMinute(parsedMin.minutes);
          }
          setIsPM(parsedMin.hours >= 12);
          setErrorMessage(
            isRTL
              ? `عقربه نمی‌تواند کمتر از ساعت ${minTime} عقب برود.`
              : `Hand cannot move earlier than ${minTime}.`
          );
        } else {
          setErrorMessage("");
        }
      }

      setHour(newH24);
      notifyChange(newH24, minute);
    } else {
      let rawM = Math.round(deg / 6) % 60;

      if (parsedMin) {
        const candidateTotal = hour * 60 + rawM;
        if (candidateTotal < parsedMin.total) {
          rawM = parsedMin.minutes;
          setErrorMessage(
            isRTL
              ? `عقربه نمی‌تواند کمتر از ${minTime} عقب برود.`
              : `Hand cannot move earlier than ${minTime}.`
          );
        } else {
          setErrorMessage("");
        }
      }

      setMinute(rawM);
      notifyChange(hour, rawM);
    }
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (mode === "hour") {
      setMode("minute");
    }
  };

  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const activeNumbers = mode === "hour" ? hourNumbers : minuteNumbers;

  const rad = (handAngle - 90) * (Math.PI / 180);
  const handTipX = centerX + numberRadius * Math.cos(rad);
  const handTipY = centerY + numberRadius * Math.sin(rad);

  const renderNumberItems = (colorClass) =>
    activeNumbers.map((num, i) => {
      const angleDeg = i * 30 - 90;
      const angleRad = angleDeg * (Math.PI / 180);
      const x = centerX + numberRadius * Math.cos(angleRad);
      const y = centerY + numberRadius * Math.sin(angleRad);

      return (
        <div
          key={num}
          style={{
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            transform: "translate(-50%, -50%)",
          }}
          className={`w-7 h-7 flex items-center justify-center font-bold pointer-events-none font-vazir text-xs select-none ${colorClass}`}
        >
          {isRTL
            ? toPersianDigits(mode === "minute" ? String(num).padStart(2, "0") : num)
            : mode === "minute"
            ? String(num).padStart(2, "0")
            : num}
        </div>
      );
    });

  return (
    <div className="w-full flex flex-col items-center font-vazir select-none">
      {/* Optional Top Title */}
      {title && (
        <div className="w-full pb-2 mb-2 border-b border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-100">
            <Clock className="w-3.5 h-3.5 text-primery-700" />
            <span>{title}</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Digital Time Display & Direct Typing Inputs */}
      <div className="w-full flex flex-col items-center gap-2 pt-1 pb-2">
        <div className="flex items-center justify-center gap-2 select-none" dir="ltr">
          {/* Hour Block */}
          <div
            onClick={() => setMode("hour")}
            className={`flex items-center justify-center px-3.5 py-1.5 rounded-xl border-2 transition-all duration-250 ease-out cursor-pointer ${
              mode === "hour"
                ? "bg-primery-50 dark:bg-primery-950/40 border-primery-700 text-primery-700 dark:text-sky-300 shadow-sm scale-105"
                : "bg-neutral-100 dark:bg-[#1c2733] border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70"
            }`}
          >
            <input
              type="text"
              inputMode="numeric"
              value={hourInput}
              onChange={handleHourInputChange}
              onFocus={() => setMode("hour")}
              className="w-10 text-center text-2xl font-bold bg-transparent focus:outline-none font-vazir cursor-pointer"
            />
          </div>

          <span className="text-xl font-bold text-neutral-400 pb-1">:</span>

          {/* Minute Block */}
          <div
            onClick={() => setMode("minute")}
            className={`flex items-center justify-center px-3.5 py-1.5 rounded-xl border-2 transition-all duration-250 ease-out cursor-pointer ${
              mode === "minute"
                ? "bg-primery-50 dark:bg-primery-950/40 border-primery-700 text-primery-700 dark:text-sky-300 shadow-sm scale-105"
                : "bg-neutral-100 dark:bg-[#1c2733] border-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70"
            }`}
          >
            <input
              type="text"
              inputMode="numeric"
              value={minuteInput}
              onChange={handleMinuteInputChange}
              onFocus={() => setMode("minute")}
              className="w-10 text-center text-2xl font-bold bg-transparent focus:outline-none font-vazir cursor-pointer"
            />
          </div>

          {/* AM / PM Selector */}
          <div className="flex flex-col gap-1 ml-1.5">
            <button
              type="button"
              onClick={() => handleToggleAMPM(false)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all duration-250 active:scale-95 ease-out cursor-pointer font-vazir ${
                !isPM
                  ? "bg-primery-700 text-white shadow-xs scale-105"
                  : "bg-neutral-100 dark:bg-[#1c2733] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/60"
              }`}
            >
              {isRTL ? "صبح" : "AM"}
            </button>
            <button
              type="button"
              onClick={() => handleToggleAMPM(true)}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all duration-250 active:scale-95 ease-out cursor-pointer font-vazir ${
                isPM
                  ? "bg-primery-700 text-white shadow-xs scale-105"
                  : "bg-neutral-100 dark:bg-[#1c2733] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/60"
              }`}
            >
              {isRTL ? "عصر" : "PM"}
            </button>
          </div>
        </div>

        {/* Mode Selector Badges: Hour / Minute */}
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => setMode("hour")}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-250 active:scale-95 ease-out cursor-pointer font-vazir ${
              mode === "hour"
                ? "bg-primery-700 text-white shadow-xs scale-105"
                : "bg-neutral-100 dark:bg-[#1c2733] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/60"
            }`}
          >
            {isRTL ? "تنظیم ساعت" : "Set Hour"}
          </button>
          <button
            type="button"
            onClick={() => setMode("minute")}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all duration-250 active:scale-95 ease-out cursor-pointer font-vazir ${
              mode === "minute"
                ? "bg-primery-700 text-white shadow-xs scale-105"
                : "bg-neutral-100 dark:bg-[#1c2733] text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/60"
            }`}
          >
            {isRTL ? "تنظیم دقیقه" : "Set Minute"}
          </button>
        </div>

        {/* Min Time Alert or Info */}
        {minTime && (
          <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 mt-1 rounded-full border border-amber-500/25 flex items-center gap-1 font-vazir">
            <span>{isRTL ? `حداقل مجاز پایان: ${minTime}` : `Minimum allowed: ${minTime}`}</span>
          </div>
        )}

        {errorMessage && (
          <div className="text-[10px] text-red-500 flex items-center gap-1 font-vazir mt-0.5 animate-in fade-in">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Circular Clock Dial */}
      <div className="py-2.5 flex items-center justify-center select-none">
        <div
          ref={dialRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-[230px] h-[230px] rounded-full bg-[#f4f7fb] dark:bg-[#1a2530] border border-neutral-scale200 dark:border-neutral-scale1000 shadow-inner relative cursor-pointer touch-none overflow-hidden select-none"
        >
          {/* Base Layer: Dark Numbers (visible when not covered by the blue knob) */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {renderNumberItems("text-neutral-700 dark:text-neutral-200")}
          </div>

          {/* SVG Clock Hand Needle & Tip */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
            viewBox="0 0 230 230"
          >
            {/* Center Pivot Pin */}
            <circle cx={centerX} cy={centerY} r="4.5" fill="var(--primery-700, #1e90c7)" />

            {/* Hand Line with smooth spring motion when not dragging */}
            <line
              x1={centerX}
              y1={centerY}
              x2={handTipX}
              y2={handTipY}
              stroke="var(--primery-700, #1e90c7)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                transition: isDragging ? "none" : "all 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />

            {/* Blue Knob at Hand Tip: Sits under the clipped white layer, covers base dark layer */}
            <circle
              cx={handTipX}
              cy={handTipY}
              r="15"
              fill="var(--primery-700, #1e90c7)"
              className="drop-shadow-sm"
              style={{
                transition: isDragging ? "none" : "all 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </svg>

          {/* Top Layer: White Numbers clipped precisely to the Blue Knob circle */}
          <div
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{
              clipPath: `circle(15px at ${handTipX}px ${handTipY}px)`,
              WebkitClipPath: `circle(15px at ${handTipX}px ${handTipY}px)`,
              transition: isDragging
                ? "none"
                : "clip-path 260ms cubic-bezier(0.34, 1.56, 0.64, 1), -webkit-clip-path 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {renderNumberItems("text-white font-extrabold drop-shadow-xs")}
          </div>
        </div>
      </div>

      {/* Action Buttons (used when embedded standalone) */}
      {showActions && (
        <div className="w-full pt-3 mt-1 flex items-center gap-2 border-t border-neutral-scale200/60 dark:border-neutral-scale1100/60">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-600 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center font-vazir"
            >
              {isRTL ? "انصراف" : "Cancel"}
            </button>
          )}

          {onConfirm && (
            <button
              type="button"
              onClick={() => {
                const formatted = formatTimeString(hour, minute);
                if (parsedMin && hour * 60 + minute < parsedMin.total) {
                  onConfirm(minTime);
                } else {
                  onConfirm(formatted);
                }
                if (onClose) onClose();
              }}
              className="flex-1 py-2 rounded-xl bg-primery-700 hover:bg-primery-800 text-white text-xs font-bold transition-all shadow-md shadow-primery-700/25 flex items-center justify-center gap-1 cursor-pointer font-vazir active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isRTL ? "تایید ساعت" : "Confirm"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Modal Wrapper for Clock Dial.
 * Opens as an on-demand popup just like DatePickerModal!
 */
export const ClockPickerModal = ({
  isOpen,
  onClose,
  initialTime = "10:00",
  minTime = null,
  onConfirm,
  title,
}) => {
  const { isRTL } = useContext(AppContext);
  const [currentTime, setCurrentTime] = useState(initialTime);

  useEffect(() => {
    if (isOpen) {
      setCurrentTime(initialTime);
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      const parsedCurrent = parseTimeString(currentTime);
      const parsedMin = minTime ? parseTimeString(minTime) : null;
      if (parsedMin && parsedCurrent.total < parsedMin.total) {
        onConfirm(minTime);
      } else {
        onConfirm(currentTime);
      }
    }
    if (onClose) onClose();
  };

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
        aria-label={title || (isRTL ? "تنظیم ساعت" : "Select Time")}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-[340px] bg-white dark:bg-neutral-scale1300 rounded-[20px] shadow-2xl border border-neutral-scale100 dark:border-neutral-scale1100 overflow-hidden flex flex-col font-vazir animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-primery-700 dark:bg-neutral-scale1200 text-white">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-neutral-scale70" />
            <h3 className={`text-base font-semibold text-neutral-scale70 ${isRTL ? "fa-title-3" : "en-title-3"}`}>
              {title || (isRTL ? "تنظیم ساعت با عقربه" : "Select Time")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col items-center">
          <AnalogClockDialView
            value={currentTime}
            minTime={minTime}
            onChange={(newTime) => setCurrentTime(newTime)}
            showActions={false}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-scale80 dark:bg-neutral-scale1400/80 border-t border-neutral-scale100 dark:border-neutral-scale1100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-scale700 dark:text-neutral-scale400 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 transition-colors cursor-pointer"
          >
            {isRTL ? "انصراف" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-primery-700 hover:bg-primery-800 text-white shadow-sm transition-colors cursor-pointer active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isRTL ? "تایید ساعت" : "Confirm"}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default ClockPickerModal;
