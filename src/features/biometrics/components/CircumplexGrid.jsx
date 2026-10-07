/**
 * @file CircumplexGrid.jsx
 * @description Russell's 2D Affective Circumplex (Valence-Arousal) Component.
 * Visualizes continuous emotional state and the 4 clinical quadrants:
 * Q1: تمرکز و انگیزش (Flow & Eustress)
 * Q2: اضطراب و استرس (Distress & Anxiety)
 * Q3: خستگی و فرسودگی (Burnout & Fatigue)
 * Q4: آرامش و تعادل (Calm & Quiescence)
 */

import React from "react";

const QUADRANT_COLORS = {
  Q1: "#22c55e", // سبز: تمرکز و جریان
  Q2: "#ef4444", // قرمز: اضطراب و استرس
  Q3: "#f59e0b", // کهربایی: خستگی
  Q4: "#38bdf8", // آبی فیروزه‌ای: آرامش
};

const QUADRANT_PERSIAN_TITLES = {
  Q1: "تمرکز و انگیزش (Flow)",
  Q2: "اضطراب و استرس (Distress)",
  Q3: "خستگی ذهنی (Fatigue)",
  Q4: "آرامش و تعادل (Calm)",
};

export function CircumplexGrid({
  valence = 0.0,
  arousal = 0.0,
  quadrant = "Q1",
  quadrantTitle = "تمرکز و جریان ذهنی",
  calibratedMood = "Neutral",
  size = 240,
}) {
  // Normalize [-1, 1] to [6%, 94%]
  const dotX = Math.max(6, Math.min(94, ((valence + 1.0) / 2.0) * 100));
  const dotY = Math.max(6, Math.min(94, ((1.0 - arousal) / 2.0) * 100));

  const activeColor = QUADRANT_COLORS[quadrant] || "#38bdf8";
  const displayTitle = QUADRANT_PERSIAN_TITLES[quadrant] || quadrantTitle;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 2D Plane */}
      <div
        className="relative bg-slate-950/80 rounded-xl border border-slate-700/60 overflow-hidden shadow-inner backdrop-blur-sm"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Horizontal Center Axis (Valence = 0) */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 z-[1]" />

        {/* Vertical Center Axis (Arousal = 0) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 z-[1]" />

        {/* Quadrant Watermarks */}
        <span className="absolute top-2 right-2 text-[10px] font-semibold text-emerald-400/40 select-none">
          Q1: تمرکز
        </span>
        <span className="absolute top-2 left-2 text-[10px] font-semibold text-rose-400/40 select-none">
          Q2: اضطراب
        </span>
        <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-amber-400/40 select-none">
          Q3: خستگی
        </span>
        <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-sky-400/40 select-none">
          Q4: آرامش
        </span>

        {/* Axis Labels */}
        <span className="absolute top-1/2 right-1 -translate-y-1/2 text-[9px] font-mono text-slate-500 select-none">
          +V
        </span>
        <span className="absolute top-1/2 left-1 -translate-y-1/2 text-[9px] font-mono text-slate-500 select-none">
          -V
        </span>
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 select-none">
          +A
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500 select-none">
          -A
        </span>

        {/* Live Affect Dot */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full z-10 transition-all duration-300 ease-out"
          style={{
            left: `${dotX}%`,
            top: `${dotY}%`,
            backgroundColor: activeColor,
            boxShadow: `0 0 14px ${activeColor}, 0 0 4px #fff`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Numerical Coordinate & Quadrant Badge */}
      <div
        className="flex items-center justify-between text-xs"
        style={{ width: `${size}px` }}
      >
        <span className="text-slate-400 font-mono">
          V:{" "}
          <strong
            className={valence >= 0 ? "text-emerald-400" : "text-rose-400"}
          >
            {valence >= 0 ? `+${valence.toFixed(2)}` : valence.toFixed(2)}
          </strong>
          {" | "}
          A:{" "}
          <strong
            className={arousal >= 0 ? "text-amber-400" : "text-sky-400"}
          >
            {arousal >= 0 ? `+${arousal.toFixed(2)}` : arousal.toFixed(2)}
          </strong>
        </span>

        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-semibold border"
          style={{
            backgroundColor: `${activeColor}20`,
            color: activeColor,
            borderColor: `${activeColor}50`,
          }}
        >
          {quadrant}: {calibratedMood || displayTitle}
        </span>
      </div>
    </div>
  );
}

export default CircumplexGrid;
