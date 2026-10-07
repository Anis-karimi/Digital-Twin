import { Sparkles, Activity, ShieldCheck } from "lucide-react";
import { LiquidCircularGauge } from "./LiquidCircularGauge";

/**
 * LiquidGaugesTrio
 * 
 * Luxury Liquid Glass Biometric & Assessment HUD:
 * 1. CERTAINTY (تسلط علمی و تسلط بر مباحث)
 * 2. STRESS (سنجش استرس و تنش صدا - شیفت دینامیک به رنگ قرمز هنگام استرس بالا)
 * 3. COMPOSURE (آرامش، اعتماد به نفس و تمرکز)
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
      className={`w-full max-w-[365px] mx-auto rounded-3xl p-3 relative overflow-hidden transition-all duration-300 select-none ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.04) 45%, rgba(56, 189, 248, 0.08) 100%), rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(28px) saturate(200%)",
        WebkitBackdropFilter: "blur(28px) saturate(200%)",
        border: "1px solid rgba(255, 255, 255, 0.24)",
        boxShadow:
          "0 14px 40px -4px rgba(0, 0, 0, 0.55), inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.45), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.35)",
      }}
    >
      {/* Glossy Liquid Glass Top Sheen */}
      <div className="absolute top-0 inset-x-0 h-[45%] bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none rounded-t-[23px]" />

      {/* Dynamic ambient color glow on corners */}
      <div className="absolute -top-8 -left-8 w-24 h-24 bg-sky-500/15 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />

      {/* 3 Columns HUD Grid */}
      <div className="relative z-10 flex items-center justify-between gap-1 sm:gap-2">
        {/* 1. Certainty (تسلط) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all">
          <LiquidCircularGauge
            percentage={certainty}
            type="certainty"
            size={54}
            isRTL={isRTL}
          />
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span className="text-[11px] font-bold text-white font-vazir">
                {isRTL ? "تسلط" : "Mastery"}
              </span>
            </div>
            <span className="text-[9px] font-semibold text-sky-300 font-vazir px-2 py-0.5 rounded-full bg-sky-400/15 border border-sky-400/25">
              {certainty >= 75
                ? isRTL ? "عالی" : "High"
                : isRTL ? "مطلوب" : "Good"}
            </span>
          </div>
        </div>

        {/* Divider Light Ray 1 */}
        <div className="w-[1px] h-14 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

        {/* 2. Stress (استرس - With Dynamic Color Alert) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all">
          <LiquidCircularGauge
            percentage={stress}
            type="stress"
            size={54}
            isRTL={isRTL}
          />
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <Activity
                className={`w-3 h-3 ${
                  isHighStress
                    ? "text-rose-400 animate-pulse"
                    : isMediumStress
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              />
              <span className="text-[11px] font-bold text-white font-vazir">
                {isRTL ? "استرس" : "Stress"}
              </span>
            </div>
            <span
              className={`text-[9px] font-bold font-vazir px-2 py-0.5 rounded-full transition-colors ${
                isHighStress
                  ? "text-rose-200 bg-rose-500/30 border border-rose-400/50 shadow-[0_0_10px_rgba(239,68,68,0.4)] animate-pulse"
                  : isMediumStress
                  ? "text-amber-300 bg-amber-400/15 border border-amber-400/30"
                  : "text-emerald-300 bg-emerald-400/15 border border-emerald-400/30"
              }`}
            >
              {isHighStress
                ? isRTL ? "هشدار" : "Alert"
                : isMediumStress
                ? isRTL ? "متعادل" : "Moderate"
                : isRTL ? "آرام" : "Calm"}
            </span>
          </div>
        </div>

        {/* Divider Light Ray 2 */}
        <div className="w-[1px] h-14 bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

        {/* 3. Composure (تمرکز) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all">
          <LiquidCircularGauge
            percentage={composure}
            type="composure"
            size={54}
            isRTL={isRTL}
          />
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span className="text-[11px] font-bold text-white font-vazir">
                {isRTL ? "تمرکز" : "Focus"}
              </span>
            </div>
            <span className="text-[9px] font-semibold text-purple-300 font-vazir px-2 py-0.5 rounded-full bg-purple-400/15 border border-purple-400/25">
              {composure >= 70
                ? isRTL ? "پایدار" : "Steady"
                : isRTL ? "متوسط" : "Normal"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGaugesTrio;
