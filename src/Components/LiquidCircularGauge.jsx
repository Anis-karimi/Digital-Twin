import { useId, useMemo } from "react";
import { toPersianDigits } from "@/utils/dateUtils";

/**
 * LiquidCircularGauge
 *
 * Translucent 3D Volumetric Liquid Sphere Gauge:
 * - See-through refractive glass chamber (no opaque dark fill)
 * - 3D spherical volume shading (darkened curvature edges + glowing subsurface core)
 * - Dual-layer translucent oscillating waves + 3D elliptical meniscus surface
 * - Clean outer precision progress arc
 *
 * @param {Object} props
 * @param {number} [props.percentage=50] Value between 0 and 100
 * @param {"certainty"|"stress"|"composure"} [props.type="certainty"] Metric type
 * @param {number} [props.size=46] Diameter in pixels
 * @param {boolean} [props.isRTL=true] RTL layout direction
 */
export const LiquidCircularGauge = ({
  percentage = 50,
  type = "certainty",
  size = 46,
  isRTL = true,
}) => {
  const uniqueId = useId().replace(/:/g, "_");
  const clampedPercent = Math.min(100, Math.max(0, Math.round(percentage)));

  // Outer precision ring (r = 45.5) & inner 3D glass sphere (r = 39)
  const outerRadius = 45.5;
  const innerRadius = 39;
  const circumference = 2 * Math.PI * outerRadius; // ~285.88
  const strokeDashoffset =
    circumference - (clampedPercent / 100) * circumference;

  // Vertical liquid level inside the sphere (y = 89 is 0%, y = 11 is 100%)
  const chamberTop = 50 - innerRadius; // 11
  const chamberHeight = innerRadius * 2; // 78
  const liquidLevelY =
    chamberTop + chamberHeight - (clampedPercent / 100) * chamberHeight;

  // Dynamic translucent volumetric color & wave physics palette
  const theme = useMemo(() => {
    if (type === "stress") {
      if (clampedPercent > 65) {
        // High Stress -> Translucent Ruby / Crimson Plasma
        return {
          ringLight: "#fecdd3",
          ringMain: "#f43f5e",
          frontTop: "rgba(251, 113, 133, 0.42)",
          frontMid: "rgba(225, 29, 72, 0.58)",
          frontBottom: "rgba(159, 18, 57, 0.78)",
          backWave: "rgba(244, 63, 94, 0.32)",
          subsurfaceGlow: "rgba(253, 164, 175, 0.55)",
          meniscusFill: "rgba(254, 205, 211, 0.32)",
          crest: "rgba(255, 228, 230, 0.85)",
          track: "rgba(244, 63, 94, 0.16)",
          glow: "rgba(244, 63, 94, 0.38)",
          waveDurFront: "1.7s",
          waveDurBack: "2.4s",
          waveAmp: 3.6,
        };
      }
      if (clampedPercent > 40) {
        // Moderate Stress -> Translucent Amber Nectar
        return {
          ringLight: "#fef08a",
          ringMain: "#f59e0b",
          frontTop: "rgba(251, 191, 36, 0.40)",
          frontMid: "rgba(217, 119, 6, 0.55)",
          frontBottom: "rgba(146, 64, 14, 0.74)",
          backWave: "rgba(245, 158, 11, 0.30)",
          subsurfaceGlow: "rgba(253, 224, 71, 0.50)",
          meniscusFill: "rgba(254, 240, 138, 0.28)",
          crest: "rgba(254, 249, 195, 0.82)",
          track: "rgba(245, 158, 11, 0.16)",
          glow: "rgba(245, 158, 11, 0.32)",
          waveDurFront: "2.6s",
          waveDurBack: "3.6s",
          waveAmp: 2.8,
        };
      }
      // Calm Stress -> Translucent Emerald Aqua
      return {
        ringLight: "#a7f3d0",
        ringMain: "#10b981",
        frontTop: "rgba(52, 211, 153, 0.38)",
        frontMid: "rgba(16, 185, 129, 0.52)",
        frontBottom: "rgba(6, 95, 70, 0.72)",
        backWave: "rgba(16, 185, 129, 0.28)",
        subsurfaceGlow: "rgba(110, 231, 183, 0.52)",
        meniscusFill: "rgba(167, 243, 208, 0.28)",
        crest: "rgba(209, 250, 229, 0.85)",
        track: "rgba(16, 185, 129, 0.16)",
        glow: "rgba(16, 185, 129, 0.32)",
        waveDurFront: "3.4s",
        waveDurBack: "4.6s",
        waveAmp: 2.4,
      };
    }

    if (type === "composure") {
      if (clampedPercent < 45) {
        return {
          ringLight: "#fecdd3",
          ringMain: "#f43f5e",
          frontTop: "rgba(251, 113, 133, 0.42)",
          frontMid: "rgba(225, 29, 72, 0.58)",
          frontBottom: "rgba(159, 18, 57, 0.76)",
          backWave: "rgba(244, 63, 94, 0.32)",
          subsurfaceGlow: "rgba(253, 164, 175, 0.55)",
          meniscusFill: "rgba(254, 205, 211, 0.30)",
          crest: "rgba(255, 228, 230, 0.85)",
          track: "rgba(244, 63, 94, 0.16)",
          glow: "rgba(244, 63, 94, 0.38)",
          waveDurFront: "1.9s",
          waveDurBack: "2.7s",
          waveAmp: 3.2,
        };
      }
      if (clampedPercent < 65) {
        return {
          ringLight: "#fef08a",
          ringMain: "#eab308",
          frontTop: "rgba(250, 204, 21, 0.40)",
          frontMid: "rgba(202, 138, 4, 0.54)",
          frontBottom: "rgba(133, 77, 14, 0.74)",
          backWave: "rgba(234, 179, 8, 0.28)",
          subsurfaceGlow: "rgba(254, 240, 138, 0.50)",
          meniscusFill: "rgba(254, 240, 138, 0.26)",
          crest: "rgba(254, 249, 195, 0.82)",
          track: "rgba(234, 179, 8, 0.16)",
          glow: "rgba(234, 179, 8, 0.32)",
          waveDurFront: "2.8s",
          waveDurBack: "3.9s",
          waveAmp: 2.6,
        };
      }
      // Optimal Focus -> Translucent Amethyst Elixir
      return {
        ringLight: "#e9d5ff",
        ringMain: "#a855f7",
        frontTop: "rgba(192, 132, 252, 0.40)",
        frontMid: "rgba(147, 51, 234, 0.54)",
        frontBottom: "rgba(88, 28, 135, 0.74)",
        backWave: "rgba(168, 85, 247, 0.30)",
        subsurfaceGlow: "rgba(216, 180, 254, 0.55)",
        meniscusFill: "rgba(233, 213, 255, 0.28)",
        crest: "rgba(243, 232, 255, 0.85)",
        track: "rgba(168, 85, 247, 0.16)",
        glow: "rgba(168, 85, 247, 0.34)",
        waveDurFront: "3.3s",
        waveDurBack: "4.4s",
        waveAmp: 2.5,
      };
    }

    // Default: Mastery / Certainty -> Translucent Cyan / Sapphire Fluid
    return {
      ringLight: "#bae6fd",
      ringMain: "#38bdf8",
      frontTop: "rgba(56, 189, 248, 0.40)",
      frontMid: "rgba(2, 132, 199, 0.54)",
      frontBottom: "rgba(12, 74, 110, 0.74)",
      backWave: "rgba(14, 165, 233, 0.30)",
      subsurfaceGlow: "rgba(125, 211, 252, 0.55)",
      meniscusFill: "rgba(186, 230, 253, 0.28)",
      crest: "rgba(224, 242, 254, 0.88)",
      track: "rgba(56, 189, 248, 0.16)",
      glow: "rgba(56, 189, 248, 0.34)",
      waveDurFront: "3.2s",
      waveDurBack: "4.3s",
      waveAmp: 2.6,
    };
  }, [type, clampedPercent]);

  // Wave paths for 3D volumetric sloshing
  const amp = theme.waveAmp;
  const backAmp = amp * 0.9;
  const frontWaveBody = `M 0 0 Q 25 ${-amp} 50 0 T 100 0 T 150 0 T 200 0 L 200 110 L 0 110 Z`;
  const frontWaveCrest = `M 0 0 Q 25 ${-amp} 50 0 T 100 0 T 150 0 T 200 0`;
  const backWaveBody = `M 0 -1.5 Q 25 ${backAmp - 1.5} 50 -1.5 T 100 -1.5 T 150 -1.5 T 200 -1.5 L 200 110 L 0 110 Z`;

  const formattedPercent = isRTL
    ? `${toPersianDigits(clampedPercent)}٪`
    : `${clampedPercent}%`;

  return (
    <div
      className="relative rounded-full flex items-center justify-center select-none shrink-0"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.04) 0%, rgba(15, 23, 42, 0.18) 68%, rgba(2, 6, 23, 0.38) 100%)",
        backdropFilter: "blur(10px) saturate(160%)",
        WebkitBackdropFilter: "blur(10px) saturate(160%)",
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.32), 0 0 12px -2px ${theme.glow}, inset 0 0 6px rgba(255, 255, 255, 0.12)`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-hidden rounded-full pointer-events-none"
      >
        <defs>
          <clipPath id={`sphereClip_${uniqueId}`}>
            <circle cx="50" cy="50" r={innerRadius} />
          </clipPath>

          {/* Translucent Volumetric Vertical Liquid Gradient */}
          <linearGradient
            id={`volumetricFluid_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={theme.frontTop} />
            <stop offset="45%" stopColor={theme.frontMid} />
            <stop offset="100%" stopColor={theme.frontBottom} />
          </linearGradient>

          {/* Inner Subsurface Scattering Caustic Glow (Gives 3D Volume at Bottom) */}
          <radialGradient
            id={`subsurface_${uniqueId}`}
            cx="50%"
            cy="82%"
            r="46%"
          >
            <stop offset="0%" stopColor={theme.subsurfaceGlow} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* 3D Spherical Curvature Shading (Darkens Edges to Create 3D Orb Depth) */}
          <radialGradient
            id={`sphereVolume_${uniqueId}`}
            cx="50%"
            cy="45%"
            r="50%"
          >
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <stop offset="64%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="88%" stopColor="rgba(2, 6, 23, 0.38)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.24)" />
          </radialGradient>

          {/* Outer Precision Ring Gradient */}
          <linearGradient
            id={`outerArc_${uniqueId}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={theme.ringLight} />
            <stop offset="100%" stopColor={theme.ringMain} />
          </linearGradient>
        </defs>

        {/* 1. Outer Recessed Track */}
        <circle
          cx="50"
          cy="50"
          r={outerRadius}
          fill="none"
          stroke={theme.track}
          strokeWidth="2.8"
        />

        {/* 2. Outer Active Progress Arc */}
        <circle
          cx="50"
          cy="50"
          r={outerRadius}
          fill="none"
          stroke={`url(#outerArc_${uniqueId})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{
            transition: "stroke-dashoffset 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {/* 3. Translucent 3D Spherical Liquid Chamber */}
        <g clipPath={`url(#sphereClip_${uniqueId})`}>
          {/* Ultra-sheer glass base so webcam feed refracts through */}
          <circle
            cx="50"
            cy="50"
            r={innerRadius}
            fill="rgba(255, 255, 255, 0.03)"
          />

          <g
            style={{
              transform: `translateY(${liquidLevelY}px)`,
              transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            {/* Rear Parallax Wave */}
            <g>
              <path d={backWaveBody} fill={theme.backWave} />
              <animateTransform
                attributeName="transform"
                type="translate"
                from="-100 0"
                to="0 0"
                dur={theme.waveDurBack}
                repeatCount="indefinite"
              />
            </g>

            {/* 3D Elliptical Meniscus Surface Plane */}
            <ellipse
              cx="50"
              cy="0"
              rx="37"
              ry="3.2"
              fill={theme.meniscusFill}
            />

            {/* Front Translucent Volumetric Wave */}
            <g>
              <path
                d={frontWaveBody}
                fill={`url(#volumetricFluid_${uniqueId})`}
              />
              <path
                d={frontWaveCrest}
                fill="none"
                stroke={theme.crest}
                strokeWidth="1.3"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="-100 0"
                dur={theme.waveDurFront}
                repeatCount="indefinite"
              />
            </g>
          </g>

          {/* Bottom Subsurface Caustic Illumination (Volumetric Core) */}
          {clampedPercent > 8 && (
            <circle
              cx="50"
              cy="50"
              r={innerRadius}
              fill={`url(#subsurface_${uniqueId})`}
            />
          )}

          {/* 3D Spherical Edge Shading & Rim Refraction */}
          <circle
            cx="50"
            cy="50"
            r={innerRadius}
            fill={`url(#sphereVolume_${uniqueId})`}
          />
        </g>
      </svg>

      {/* Crisp Floating Percentage Readout */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <span
          className={`font-extrabold tracking-tight text-white ${
            size < 46 ? "text-[10px]" : "text-[11px]"
          } ${isRTL ? "font-vazir" : "font-inter"}`}
          style={{
            textShadow:
              "0 1px 3px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.55)",
          }}
        >
          {formattedPercent}
        </span>
      </div>
    </div>
  );
};

export default LiquidCircularGauge;
