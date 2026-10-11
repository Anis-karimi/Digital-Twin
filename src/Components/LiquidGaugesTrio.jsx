import { Sparkles, Activity, ShieldCheck } from "lucide-react";
import { LiquidCircularGauge } from "./LiquidCircularGauge";

/**
 * LiquidGaugesTrio
 * 
 * VisionOS-Grade Frosted Glass Biometric HUD:
 * Organizes the 3 real-time exam telemetry indicators into an integrated,
 * cohesive floating glass dock:
 * 1. Mastery / Certainty (تسلط علمی)
 * 2. Stress / Audio Agitation (سطح استرس)
 * 3. Focus / Gaze Composure (تمرکز نگاه)
 * 
 * @param {Object} props
 * @param {number} [props.certainty=82]
 * @param {number} [props.stress=32]
 * @param {number} [props.composure=92]
 * @param {boolean} [props.isRTL=true]
 * @param {string} [props.className=""]
 */
export const LiquidGaugesTrio = ({
  certainty = 82,
  stress = 32,
  composure = 92,
  isRTL = true,
  className = "",
}) => {
  const isHighStress = stress > 65;
  const isMediumStress = stress > 40 && stress <= 65;

  const stressStatus = isHighStress
    ? (isRTL ? "بالا" : "High")
    : isMediumStress
    ? (isRTL ? "متوسط" : "Fair")
    : (isRTL ? "آرام" : "Calm");

  const masteryStatus = certainty >= 80
    ? (isRTL ? "عالی" : "Great")
    : certainty >= 60
    ? (isRTL ? "خوب" : "Good")
    : (isRTL ? "متوسط" : "Fair");

  const composureStatus = composure >= 80
    ? (isRTL ? "پایدار" : "Steady")
    : composure >= 55
    ? (isRTL ? "مطلوب" : "Normal")
    : (isRTL ? "هشدار" : "Alert");

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full max-w-[360px] mx-auto rounded-2xl bg-white/10 dark:bg-neutral-scale1400/50 backdrop-blur-xl border border-white/20 dark:border-white/10 px-3 py-2 shadow-xl flex items-center justify-between gap-1 select-none pointer-events-none transition-all duration-300 ${className}`}
    >
      {/* 1. Mastery Pod */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <LiquidCircularGauge
          percentage={certainty}
          type="certainty"
          size={46}
          isRTL={isRTL}
        />
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="text-[11px] font-bold text-neutral-scale900 dark:text-neutral-scale100 font-vazir">
              {isRTL ? "تسلط" : "Mastery"}
            </span>
          </div>
          <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-300 mt-0.5">
            {masteryStatus}
          </span>
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="w-px h-7 bg-black/10 dark:bg-white/10 shrink-0" />

      {/* 2. Stress Pod */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <LiquidCircularGauge
          percentage={stress}
          type="stress"
          size={46}
          isRTL={isRTL}
        />
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1">
            <Activity
              className={`w-3 h-3 shrink-0 ${
                isHighStress
                  ? "text-rose-400 animate-pulse"
                  : isMediumStress
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            />
            <span className="text-[11px] font-bold text-neutral-scale900 dark:text-neutral-scale100 font-vazir">
              {isRTL ? "استرس" : "Stress"}
            </span>
          </div>
          <span
            className={`text-[9px] font-semibold mt-0.5 ${
              isHighStress
                ? "text-rose-600 dark:text-rose-300"
                : isMediumStress
                ? "text-amber-600 dark:text-amber-300"
                : "text-emerald-600 dark:text-emerald-300"
            }`}
          >
            {stressStatus}
          </span>
        </div>
      </div>

      {/* Hairline Divider */}
      <div className="w-px h-7 bg-black/10 dark:bg-white/10 shrink-0" />

      {/* 3. Focus / Composure Pod */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <LiquidCircularGauge
          percentage={composure}
          type="composure"
          size={46}
          isRTL={isRTL}
        />
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="text-[11px] font-bold text-neutral-scale900 dark:text-neutral-scale100 font-vazir">
              {isRTL ? "تمرکز" : "Focus"}
            </span>
          </div>
          <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-300 mt-0.5">
            {composureStatus}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiquidGaugesTrio;
