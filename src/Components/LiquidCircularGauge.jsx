import { useId, useMemo } from "react";
import { toPersianDigits } from "@/utils/dateUtils";

/**
 * LiquidCircularGauge
 * 
 * Circular Progress Ring Line Gauge in Liquid Glass style:
 * - Glowing circular stroke/line that smoothly sweeps around the circle
 * - Translucent Liquid Glass backdrop disc with specular rim
 * - Animated progress line with rounded caps and neon fluid glow
 * - Dynamic Stress Reaction (turns radiant red when elevated)
 * 
 * @param {Object} props
 * @param {number} props.percentage Value between 0 and 100
 * @param {"certainty"|"stress"|"composure"} [props.type="certainty"]
 * @param {number} [props.size=58] Diameter in pixels
 * @param {boolean} [props.isRTL=true]
 */
export const LiquidCircularGauge = ({
  percentage = 50,
  type = "certainty",
  size = 58,
  isRTL = true,
}) => {
  const uniqueId = useId().replace(/:/g, "_");
  const clampedPercent = Math.min(100, Math.max(0, Math.round(percentage)));

  // Radius and circumference for the progress circle
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Dynamic theme colors
  const theme = useMemo(() => {
    if (type === "stress") {
      if (clampedPercent > 65) {
        // High Stress -> Radiant Crimson / Ruby Red
        return {
          primary: "#ef4444",
          secondary: "#dc2626",
          light: "#f87171",
          glow: "rgba(239, 68, 68, 0.8)",
          track: "rgba(239, 68, 68, 0.2)",
          pulse: true,
        };
      }
      if (clampedPercent > 40) {
        // Moderate Stress -> Amber / Sunset Orange
        return {
          primary: "#f59e0b",
          secondary: "#d97706",
          light: "#fbbf24",
          glow: "rgba(245, 158, 11, 0.65)",
          track: "rgba(245, 158, 11, 0.18)",
          pulse: false,
        };
      }
      // Low Stress -> Calm Mint / Emerald Teal
      return {
        primary: "#10b981",
        secondary: "#059669",
        light: "#34d399",
        glow: "rgba(16, 185, 129, 0.55)",
        track: "rgba(16, 185, 129, 0.18)",
        pulse: false,
      };
    }

    if (type === "composure") {
      // Purple / Violet theme for Composure & Focus
      return {
        primary: "#a855f7",
        secondary: "#7c3aed",
        light: "#c084fc",
        glow: "rgba(168, 85, 247, 0.65)",
        track: "rgba(168, 85, 247, 0.18)",
        pulse: false,
      };
    }

    // Default / Certainty: Sky Blue / Cyan theme
    return {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      light: "#38bdf8",
      glow: "rgba(14, 165, 233, 0.65)",
      track: "rgba(14, 165, 233, 0.18)",
      pulse: false,
    };
  }, [type, clampedPercent]);

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
          "linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.08) 100%), rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.22)",
        boxShadow: `0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 0 16px ${theme.glow}, inset 0 1.5px 2px rgba(255, 255, 255, 0.5), inset 0 -1.5px 2px rgba(0, 0, 0, 0.35)`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-hidden rounded-full pointer-events-none p-1"
      >
        <defs>
          {/* Glowing Stroke Gradient */}
          <linearGradient
            id={`ringGrad_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={theme.light} />
            <stop offset="60%" stopColor={theme.primary} />
            <stop offset="100%" stopColor={theme.secondary} />
          </linearGradient>

          {/* Top Lens Reflection */}
          <linearGradient
            id={`topSheen_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient Inner Glass Chamber */}
        <circle cx="50" cy="50" r="44" fill="rgba(255, 255, 255, 0.03)" />

        {/* Background Track Ring (مسیر خاکستری/محو دایره) */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={theme.track}
          strokeWidth="6"
        />

        {/* Active Progress Line (خط محیطی که روی دایره پر و زیاد می‌شه) */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={`url(#ringGrad_${uniqueId})`}
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            filter: `drop-shadow(0 0 5px ${theme.glow})`,
          }}
        />

        {/* Outer Delicate Glass Bezel Rim */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="0.8"
        />

        {/* Top Gloss Arc */}
        <path
          d="M 26 22 Q 50 32 74 22 Q 50 16 26 22 Z"
          fill={`url(#topSheen_${uniqueId})`}
        />
      </svg>

      {/* Centered Percentage Value */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span
          className={`font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${
            size < 60 ? "text-[12px]" : "text-sm"
          } ${isRTL ? "font-vazir" : "font-inter"}`}
          style={{
            textShadow: "0 1px 4px rgba(0,0,0,0.95), 0 0 10px rgba(0,0,0,0.6)",
          }}
        >
          {formattedPercent}
        </span>
      </div>
    </div>
  );
};

export default LiquidCircularGauge;
