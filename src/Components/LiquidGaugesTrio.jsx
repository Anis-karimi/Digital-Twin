import { Sparkles, Activity, ShieldCheck } from "lucide-react";
import { LiquidCircularGauge } from "./LiquidCircularGauge";

/**
 * LiquidGaugesTrio
 *
 * Ultra-Translucent Floating Glass Biometric HUD Dock:
 * Houses the 3 volumetric fluid gauges inside a crystal-clear frosted
 * glass bar that lets the live webcam feed refract naturally underneath:
 * 1. Mastery / Certainty (تسلط علمی)
 * 2. Stress / Affective Tension (سطح استرس)
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

  const isLowFocus = composure < 45;
  const isMediumFocus = composure >= 45 && composure < 65;

  const stressStatus = isHighStress
    ? isRTL
      ? "بالا"
      : "High"
    : isMediumStress
    ? isRTL
      ? "متوسط"
      : "Fair"
    : isRTL
    ? "آرام"
    : "Calm";

  const masteryStatus =
    certainty >= 80
      ? isRTL
        ? "عالی"
        : "Great"
      : certainty >= 60
      ? isRTL
        ? "خوب"
        : "Good"
      : isRTL
      ? "متوسط"
      : "Fair";

  const composureStatus =
    composure >= 80
      ? isRTL
        ? "پایدار"
        : "Steady"
      : composure >= 65
      ? isRTL
        ? "مطلوب"
        : "Normal"
      : composure >= 45
      ? isRTL
        ? "انحراف"
        : "Drifting"
      : isRTL
      ? "هشدار"
      : "Alert";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`relative w-full max-w-[360px] mx-auto rounded-2xl px-2.5 py-1.5 select-none pointer-events-none overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(15, 23, 42, 0.28) 50%, rgba(255, 255, 255, 0.05) 100%)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        boxShadow:
          "0 8px 24px -4px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.22)",
      }}
    >
      <div className="relative z-10 flex items-center justify-between">
        {/* 1. Mastery Pod (تسلط) */}
        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          <LiquidCircularGauge
            percentage={certainty}
            type="certainty"
            size={42}
            isRTL={isRTL}
          />
          <div className="flex flex-col items-start leading-tight min-w-0">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-300 shrink-0 drop-shadow-[0_0_5px_rgba(56,189,248,0.6)]" />
              <span className="text-[11px] font-bold text-white font-vazir truncate [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">
                {isRTL ? "تسلط" : "Mastery"}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]" />
              <span className="text-[9.5px] font-semibold text-sky-200 font-vazir [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">
                {masteryStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Translucent Vertical Hairline */}
        <div className="w-px h-7 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0 mx-0.5" />

        {/* 2. Stress Pod (استرس) */}
        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          <LiquidCircularGauge
            percentage={stress}
            type="stress"
            size={42}
            isRTL={isRTL}
          />
          <div className="flex flex-col items-start leading-tight min-w-0">
            <div className="flex items-center gap-1">
              <Activity
                className={`w-3 h-3 shrink-0 ${
                  isHighStress
                    ? "text-rose-300 animate-pulse"
                    : isMediumStress
                    ? "text-amber-300"
                    : "text-emerald-300"
                }`}
              />
              <span className="text-[11px] font-bold text-white font-vazir truncate [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">
                {isRTL ? "استرس" : "Stress"}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isHighStress
                    ? "bg-rose-400 animate-ping"
                    : isMediumStress
                    ? "bg-amber-400"
                    : "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]"
                }`}
              />
              <span
                className={`text-[9.5px] font-semibold font-vazir [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)] ${
                  isHighStress
                    ? "text-rose-200"
                    : isMediumStress
                    ? "text-amber-200"
                    : "text-emerald-200"
                }`}
              >
                {stressStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Translucent Vertical Hairline */}
        <div className="w-px h-7 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0 mx-0.5" />

        {/* 3. Focus / Composure Pod (تمرکز) */}
        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          <LiquidCircularGauge
            percentage={composure}
            type="composure"
            size={42}
            isRTL={isRTL}
          />
          <div className="flex flex-col items-start leading-tight min-w-0">
            <div className="flex items-center gap-1">
              <ShieldCheck
                className={`w-3 h-3 shrink-0 ${
                  isLowFocus
                    ? "text-rose-300 animate-pulse"
                    : isMediumFocus
                    ? "text-amber-300"
                    : "text-purple-300"
                }`}
              />
              <span className="text-[11px] font-bold text-white font-vazir truncate [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)]">
                {isRTL ? "تمرکز" : "Focus"}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLowFocus
                    ? "bg-rose-400 animate-ping"
                    : isMediumFocus
                    ? "bg-amber-400"
                    : "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.9)]"
                }`}
              />
              <span
                className={`text-[9.5px] font-semibold font-vazir [text-shadow:_0_1px_2px_rgba(0,0,0,0.8)] ${
                  isLowFocus
                    ? "text-rose-200"
                    : isMediumFocus
                    ? "text-amber-200"
                    : "text-purple-200"
                }`}
              >
                {composureStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGaugesTrio;
