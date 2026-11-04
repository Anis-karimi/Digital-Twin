/**
 * @file ActionUnitMeters.jsx
 * @description FACS Action Units & Ocular Telemetry Progress Bars.
 * Visualizes AU4 (brow lowerer / distress), AU12 (lip corner puller / smile),
 * AU15 (lip corner depress / frown), and AU45 (blink intensity) with live blink BPM.
 */

import React from "react";
import { useTranslation } from "@/translations/useTranslation";

export function ActionUnitMeters({ actionUnits = {}, blinkBpm = 0.0 }) {
  const { t } = useTranslation();
  const au4 = actionUnits?.AU04_brow_lowerer || 0.0;
  const au12 = actionUnits?.AU12_lip_corner_puller || 0.0;
  const au15 = actionUnits?.AU15_lip_corner_depress || 0.0;
  const au45 = actionUnits?.AU45_blink_closure || 0.0;

  const meters = [
    { label: t("eyebrowTighteningAU4"), value: au4, color: "#ef4444" },
    { label: t("smileLipCornerAU12"), value: au12, color: "#22c55e" },
    { label: t("lipCornerDepressorAU15"), value: au15, color: "#f59e0b" },
    { label: t("eyeBlinkAU45"), value: au45, color: "#38bdf8" },
  ];

  return (
    <div className="flex flex-col gap-2.5 w-full text-slate-200">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-300">
          {t("facsUnits")}
        </span>
        <span className="text-xs font-bold text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-500/20">
          {t("blinkRate", "", { bpm: blinkBpm ? blinkBpm.toFixed(1) : "0.0" })}
        </span>
      </div>

      {meters.map((m) => (
        <div key={m.label} className="flex items-center gap-2 text-xs">
          <span className="w-44 text-slate-400 truncate">{m.label}</span>
          <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, m.value * 100))}%`,
                backgroundColor: m.color,
                boxShadow: `0 0 8px ${m.color}66`,
              }}
            />
          </div>
          <span className="w-10 text-left font-mono font-bold text-slate-100">
            {m.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ActionUnitMeters;
