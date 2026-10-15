import { useRef, memo } from "react";
import { toPersianDigits } from "@/utils/dateUtils";

/**
 * Single 3D Split-Flap Digit Card
 * Uses full-bleed layers with CSS clip-path to guarantee 100% mathematical
 * sub-pixel text alignment between the upper and lower halves.
 */
const FlipCard = memo(({ digit, dimensions, isUrgent }) => {
  // Synchronously track digit transitions during render to prevent 1-frame flicker
  const stateRef = useRef({
    current: digit,
    previous: digit,
    flipKey: 0,
  });

  if (stateRef.current.current !== digit) {
    stateRef.current = {
      previous: stateRef.current.current,
      current: digit,
      flipKey: stateRef.current.flipKey + 1,
    };
  }

  const { current, previous, flipKey } = stateRef.current;

  const topSurface = isUrgent
    ? "linear-gradient(180deg, rgba(68, 18, 34, 0.88) 0%, rgba(38, 10, 22, 0.94) 50%, rgba(28, 8, 18, 0.94) 100%)"
    : "linear-gradient(180deg, rgba(40, 48, 64, 0.86) 0%, rgba(22, 28, 40, 0.92) 50%, rgba(16, 20, 30, 0.95) 100%)";

  const bottomSurface = isUrgent
    ? "linear-gradient(180deg, rgba(28, 8, 18, 0.94) 0%, rgba(35, 10, 20, 0.94) 50%, rgba(56, 14, 28, 0.90) 100%)"
    : "linear-gradient(180deg, rgba(16, 20, 30, 0.95) 0%, rgba(20, 26, 38, 0.94) 50%, rgba(32, 40, 56, 0.90) 100%)";

  const textClass = `font-mono font-bold tracking-tight select-none leading-none ${
    dimensions.fontSize
  } ${isUrgent ? "text-rose-100" : "text-white"}`;

  const textStyle = {
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.45)",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div
      className={`relative ${dimensions.card} rounded-[7px] select-none shrink-0`}
      style={{
        perspective: "240px",
        boxShadow: isUrgent
          ? "0 6px 16px -3px rgba(0, 0, 0, 0.6), 0 0 12px rgba(244, 63, 94, 0.25)"
          : "0 6px 14px -3px rgba(0, 0, 0, 0.55)",
      }}
    >
      {/* 1. Static Upper Half (Reveals NEW digit underneath falling flap) */}
      <div
        className="absolute inset-0 rounded-[7px] flex items-center justify-center overflow-hidden"
        style={{
          background: topSurface,
          clipPath: "inset(0 0 50% 0)",
          WebkitClipPath: "inset(0 0 50% 0)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.16)",
        }}
      >
        <span className={textClass} style={textStyle}>
          {current}
        </span>
      </div>

      {/* 2. Static Lower Half (Base layer showing NEW digit) */}
      <div
        className="absolute inset-0 rounded-[7px] flex items-center justify-center overflow-hidden"
        style={{
          background: bottomSurface,
          clipPath: "inset(50% 0 0 0)",
          WebkitClipPath: "inset(50% 0 0 0)",
          boxShadow: "inset 0 -1px 0 rgba(255, 255, 255, 0.06)",
        }}
      >
        <span className={textClass} style={textStyle}>
          {current}
        </span>
      </div>

      {/* 3. Active 3D Flipping Flaps (Triggered on digit change) */}
      {flipKey > 0 && (
        <div
          key={flipKey}
          className="absolute inset-0 pointer-events-none"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Lower Mask: Holds OLD digit visible while top flap is still falling (0% -> 50% of animation) */}
          <div
            className="absolute inset-0 rounded-[7px] flex items-center justify-center overflow-hidden sfc-old-bottom"
            style={{
              background: bottomSurface,
              clipPath: "inset(50% 0 0 0)",
              WebkitClipPath: "inset(50% 0 0 0)",
              boxShadow: "inset 0 -1px 0 rgba(255, 255, 255, 0.06)",
            }}
          >
            <span className={textClass} style={textStyle}>
              {previous}
            </span>
          </div>

          {/* Falling Top Flap (OLD digit): Rotates from 0deg to -90deg around center axis */}
          <div
            className="absolute inset-0 rounded-[7px] flex items-center justify-center overflow-hidden sfc-flap-top"
            style={{
              background: topSurface,
              clipPath: "inset(0 0 50% 0)",
              WebkitClipPath: "inset(0 0 50% 0)",
              transformOrigin: "50% 50%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.18)",
            }}
          >
            <span className={textClass} style={textStyle}>
              {previous}
            </span>
            {/* Progressive darkening shadow as flap angles down */}
            <div className="absolute inset-0 bg-black sfc-shadow-top pointer-events-none" />
          </div>

          {/* Unfolding Bottom Flap (NEW digit): Rotates from +90deg to 0deg around center axis */}
          <div
            className="absolute inset-0 rounded-[7px] flex items-center justify-center overflow-hidden sfc-flap-bottom"
            style={{
              background: bottomSurface,
              clipPath: "inset(50% 0 0 0)",
              WebkitClipPath: "inset(50% 0 0 0)",
              transformOrigin: "50% 50%",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              boxShadow:
                "inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 10px rgba(0, 0, 0, 0.45)",
            }}
          >
            <span className={textClass} style={textStyle}>
              {current}
            </span>
            {/* Shadow fading out as bottom flap settles flat */}
            <div className="absolute inset-0 bg-black sfc-shadow-bottom pointer-events-none" />
          </div>
        </div>
      )}

      {/* Subtle Glass Outer Border */}
      <div
        className="absolute inset-0 rounded-[7px] pointer-events-none z-20"
        style={{
          border: isUrgent
            ? "1px solid rgba(251, 113, 133, 0.32)"
            : "1px solid rgba(255, 255, 255, 0.13)",
        }}
      />

      {/* Ultra-Subtle Hairline Center Seam (Barely perceptible precision cut) */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] pointer-events-none z-20"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.12) 100%)",
        }}
      />
    </div>
  );
});

FlipCard.displayName = "FlipCard";

/**
 * FlipDownClock
 *
 * Realistic, box-free 3D Split-Flap Countdown Clock with crisp white numerals.
 *
 * @param {Object} props
 * @param {number} [props.seconds=0] Remaining time in seconds
 * @param {"sm"|"md"|"lg"} [props.size="md"] Card size preset
 * @param {boolean} [props.usePersianDigits=false] Optional Persian digit conversion
 * @param {number} [props.urgentThreshold=60] Seconds threshold for subtle red urgency state
 * @param {string} [props.className=""] Additional wrapper classes
 */
export const FlipDownClock = ({
  seconds = 0,
  size = "md",
  usePersianDigits = false,
  urgentThreshold = 60,
  className = "",
}) => {
  const totalSec = Math.max(0, Math.floor(Number(seconds) || 0));
  const minsStr = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const secsStr = String(totalSec % 60).padStart(2, "0");
  const isUrgent = totalSec > 0 && totalSec <= urgentThreshold;

  const formatChar = (ch) => (usePersianDigits ? toPersianDigits(ch) : ch);

  const sizeMap = {
    sm: {
      card: "w-[20px] h-[28px]",
      fontSize: "text-[14px]",
      dot: "w-[3px] h-[3px]",
      gap: "gap-[3px]",
    },
    md: {
      card: "w-[23px] h-[32px]",
      fontSize: "text-[16px]",
      dot: "w-[3.5px] h-[3.5px]",
      gap: "gap-[4px]",
    },
    lg: {
      card: "w-[28px] h-[38px]",
      fontSize: "text-[20px]",
      dot: "w-[4px] h-[4px]",
      gap: "gap-[5px]",
    },
  };

  const dimensions = sizeMap[size] || sizeMap.md;

  return (
    <div
      dir="ltr"
      className={`inline-flex items-center ${dimensions.gap} select-none ${className}`}
      aria-label={`${minsStr}:${secsStr}`}
    >
      <style>{`
        @keyframes sfcFallTop {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(-90deg);
          }
        }
        @keyframes sfcUnfoldBottom {
          0% {
            transform: rotateX(90deg);
          }
          100% {
            transform: rotateX(0deg);
          }
        }
        @keyframes sfcHideOldBottom {
          0%, 49.9% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }
        @keyframes sfcShadowTop {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 0.45;
          }
        }
        @keyframes sfcShadowBottom {
          0% {
            opacity: 0.4;
          }
          100% {
            opacity: 0;
          }
        }
        .sfc-flap-top {
          animation: sfcFallTop 0.26s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards;
          z-index: 15;
        }
        .sfc-flap-bottom {
          transform: rotateX(90deg);
          animation: sfcUnfoldBottom 0.28s cubic-bezier(0.215, 0.61, 0.355, 1) 0.25s forwards;
          z-index: 16;
        }
        .sfc-old-bottom {
          animation: sfcHideOldBottom 0.52s linear forwards;
          z-index: 12;
        }
        .sfc-shadow-top {
          animation: sfcShadowTop 0.26s ease-in forwards;
        }
        .sfc-shadow-bottom {
          animation: sfcShadowBottom 0.28s ease-out 0.25s forwards;
        }
      `}</style>

      {/* Minutes Cards */}
      <div className="flex items-center gap-[3px]">
        <FlipCard
          digit={formatChar(minsStr[0])}
          dimensions={dimensions}
          isUrgent={isUrgent}
        />
        <FlipCard
          digit={formatChar(minsStr[1])}
          dimensions={dimensions}
          isUrgent={isUrgent}
        />
      </div>

      {/* Minimal Floating Colon Dots */}
      <div className="flex flex-col items-center justify-center gap-1.5 px-0.5">
        <span
          className={`${dimensions.dot} rounded-full transition-colors duration-300 ${
            isUrgent
              ? "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)] animate-pulse"
              : "bg-white/75 shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
          }`}
        />
        <span
          className={`${dimensions.dot} rounded-full transition-colors duration-300 ${
            isUrgent
              ? "bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.8)] animate-pulse"
              : "bg-white/75 shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
          }`}
        />
      </div>

      {/* Seconds Cards */}
      <div className="flex items-center gap-[3px]">
        <FlipCard
          digit={formatChar(secsStr[0])}
          dimensions={dimensions}
          isUrgent={isUrgent}
        />
        <FlipCard
          digit={formatChar(secsStr[1])}
          dimensions={dimensions}
          isUrgent={isUrgent}
        />
      </div>
    </div>
  );
};

export default FlipDownClock;
