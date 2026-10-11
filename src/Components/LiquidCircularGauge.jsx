import { useId, useMemo } from "react";
import { toPersianDigits } from "@/utils/dateUtils";

/**
 * LiquidCircularGauge
 * 
 * Precision VisionOS-Grade Glassmorphism Biometric Gauge:
 * - Ultra-clear frosted glass disc with subtle optical refraction
 * - High-precision gradient progress ring with smooth rounded terminals
 * - Dynamic theme adaptation for Mastery, Stress, and Focus
 * - Clean, legible typography with Persian digit localization
 * 
 * @param {Object} props
 * @param {number} [props.percentage=50] Value between 0 and 100
 * @param {"certainty"|"stress"|"composure"} [props.type="certainty"] Metric type
 * @param {number} [props.size=54] Diameter in pixels
 * @param {boolean} [props.isRTL=true] RTL layout direction
 */
export const LiquidCircularGauge = ({
  percentage = 50,
  type = "certainty",
  size = 54,
  isRTL = true,
}) => {
  const uniqueId = useId().replace(/:/g, "_");
  const clampedPercent = Math.min(100, Math.max(0, Math.round(percentage)));

  // Radius and circumference
  const radius = 37;
  const circumference = 2 * Math.PI * radius; // ~232.48
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Refined chromatic palette for each metric
  const theme = useMemo(() => {
    if (type === "stress") {
      if (clampedPercent > 65) {
        // High Stress -> Radiant Crimson / Rose
        return {
          primary: "#f43f5e",
          secondary: "#e11d48",
          light: "#fda4af",
          glow: "rgba(244, 63, 94, 0.45)",
          track: "rgba(244, 63, 94, 0.16)",
          chipText: isRTL ? "بالا" : "High",
          chipBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          pulse: true,
        };
      }
      if (clampedPercent > 40) {
        // Moderate Stress -> Warm Amber
        return {
          primary: "#f59e0b",
          secondary: "#d97706",
          light: "#fde68a",
          glow: "rgba(245, 158, 11, 0.4)",
          track: "rgba(245, 158, 11, 0.15)",
          chipText: isRTL ? "متوسط" : "Normal",
          chipBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          pulse: false,
        };
      }
      // Low Stress -> Serene Emerald Mint
      return {
        primary: "#10b981",
        secondary: "#059669",
        light: "#6ee7b7",
        glow: "rgba(16, 185, 129, 0.4)",
        track: "rgba(16, 185, 129, 0.15)",
        chipText: isRTL ? "طبیعی" : "Optimal",
        chipBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        pulse: false,
      };
    }

    if (type === "composure") {
      // Focus & Composure -> Royal Violet / Indigo
      return {
        primary: "#8b5cf6",
        secondary: "#7c3aed",
        light: "#c4b5fd",
        glow: "rgba(139, 92, 246, 0.45)",
        track: "rgba(139, 92, 246, 0.16)",
        chipText: isRTL ? "متمرکز" : "Focused",
        chipBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        pulse: false,
      };
    }

    // Default: Certainty & Scientific Mastery -> Vivid Sky Blue / Cyan
    return {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      light: "#7dd3fc",
      glow: "rgba(14, 165, 233, 0.45)",
      track: "rgba(14, 165, 233, 0.16)",
      chipText: isRTL ? "عالی" : "Great",
      chipBg: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      pulse: false,
    };
  }, [type, clampedPercent, isRTL]);

  const formattedPercent = isRTL
    ? `${toPersianDigits(clampedPercent)}٪`
    : `${clampedPercent}%`;

  return (
    <div
      className={`relative rounded-full flex items-center justify-center select-none transition-all duration-300 ${
        theme.pulse ? "animate-pulse" : ""
      }`}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 15%, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 60%, rgba(15, 23, 42, 0.25) 100%)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.22)",
        boxShadow: `0 4px 14px -1px rgba(0, 0, 0, 0.25), 0 0 10px ${theme.glow}, inset 0 1px 1px rgba(255, 255, 255, 0.4), inset 0 -1px 1px rgba(0, 0, 0, 0.2)`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-hidden rounded-full pointer-events-none p-0.5"
      >
        <defs>
          {/* Subtle Linear Stroke Gradient */}
          <linearGradient
            id={`ringGrad_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={theme.light} />
            <stop offset="65%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>

          {/* Top Specular Rim Reflection */}
          <linearGradient
            id={`topRim_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Inner Glass Chamber */}
        <circle cx="50" cy="50" r="45" fill="rgba(255, 255, 255, 0.02)" />

        {/* Background Track Ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={theme.track}
          strokeWidth="4"
        />

        {/* Active Progress Line */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#ringGrad_${uniqueId})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 4px ${theme.glow})`,
          }}
        />

        {/* Delicate Glass Specular Cap */}
        <ellipse
          cx="50"
          cy="22"
          rx="22"
          ry="6"
          fill={`url(#topRim_${uniqueId})`}
        />
      </svg>

      {/* Centered Percentage Value */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span
          className={`font-black tracking-tight text-white ${
            size < 56 ? "text-[11px]" : "text-xs"
          } ${isRTL ? "font-vazir" : "font-inter"}`}
          style={{
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.4)",
          }}
        >
          {formattedPercent}
        </span>
      </div>
    </div>
  );
};

export default LiquidCircularGauge;
