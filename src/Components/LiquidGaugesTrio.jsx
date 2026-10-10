import { Sparkles, Activity, ShieldCheck } from "lucide-react";
import { LiquidCircularGauge } from "./LiquidCircularGauge";

/**
 * LiquidGaugesTrio
 * 
 * Floating Liquid Glass Biometric & Assessment Rings (Zero Box Background):
 * 1. CERTAINTY (تسلط علمی)
 * 2. STRESS (استرس و تنش صدا)
 * 3. COMPOSURE (تمرکز و پایش نگاه)
 * 
 * @param {Object} props
 * @param {number} [props.certainty=82]
 * @param {number} [props.stress=40]
 * @param {number} [props.composure=90]
 * @param {boolean} [props.isRTL=true]
 * @param {string} [props.className=""]
 */
export const LiquidGaugesTrio = ({
  certainty = 82,
  stress = 40,
  composure = 90,
  isRTL = true,
  className = "",
}) => {
  const isHighStress = stress > 65;
  const isMediumStress = stress > 40 && stress <= 65;

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`w-full max-w-[340px] mx-auto flex items-center justify-around gap-2 px-1 py-1 select-none pointer-events-none ${className}`}
    >
      {/* 1. Certainty (تسلط) */}
      <div className="flex flex-col items-center justify-center gap-1.5 transition-all">
        <LiquidCircularGauge
          percentage={certainty}
          type="certainty"
          size={58}
          isRTL={isRTL}
        />
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
            <span className="text-[11px] font-bold text-white font-vazir drop-shadow">
              {isRTL ? "تسلط" : "Mastery"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stress (استرس) */}
      <div className="flex flex-col items-center justify-center gap-1.5 transition-all">
        <LiquidCircularGauge
          percentage={stress}
          type="stress"
          size={58}
          isRTL={isRTL}
        />
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Activity
              className={`w-3 h-3 ${
                isHighStress
                  ? "text-rose-400 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                  : isMediumStress
                  ? "text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  : "text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]"
              }`}
            />
            <span className="text-[11px] font-bold text-white font-vazir drop-shadow">
              {isRTL ? "استرس" : "Stress"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Composure / Attention (تمرکز) */}
      <div className="flex flex-col items-center justify-center gap-1.5 transition-all">
        <LiquidCircularGauge
          percentage={composure}
          type="composure"
          size={58}
          isRTL={isRTL}
        />
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
            <span className="text-[11px] font-bold text-white font-vazir drop-shadow">
              {isRTL ? "تمرکز" : "Focus"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGaugesTrio;
