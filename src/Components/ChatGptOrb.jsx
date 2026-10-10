import React, { useMemo } from "react";

/**
 * ChatGptOrb
 * 
 * SOTA ChatGPT Voice Mode Dynamic AI Orb:
 * - Multi-layer fluid chromatic mesh with radiant center core
 * - Fluid breathing / pulsation in idle mode
 * - Sound wave halo and ripples when speaking or listening
 * - Swirling orbital aurora when thinking / submitting
 * 
 * @param {Object} props
 * @param {"idle"|"speaking"|"listening"|"thinking"} [props.state="idle"]
 * @param {number} [props.size=68] Diameter in pixels
 * @param {number} [props.voiceLevel=0] Real-time audio amplitude (0 to 1)
 * @param {string} [props.className=""]
 */
export const ChatGptOrb = ({
  state = "idle",
  size = 68,
  voiceLevel = 0,
  className = "",
}) => {
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isThinking = state === "thinking";

  // Dynamic scale multiplier based on voice activity
  const voiceScale = useMemo(() => {
    if (isSpeaking || isListening) {
      return 1 + Math.min(0.25, Math.max(0, voiceLevel) * 0.4);
    }
    return 1;
  }, [isSpeaking, isListening, voiceLevel]);

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: size * 1.5,
        height: size * 1.5,
      }}
    >
      {/* Outer Soundwave Ripples (when speaking or listening) */}
      {(isSpeaking || isListening) && (
        <>
          <div
            className="absolute rounded-full border border-sky-400/40 animate-ping"
            style={{
              width: size * 1.15,
              height: size * 1.15,
              animationDuration: isSpeaking ? "1.4s" : "2s",
            }}
          />
          <div
            className="absolute rounded-full border border-purple-400/30 animate-pulse"
            style={{
              width: size * 1.35,
              height: size * 1.35,
              filter: "blur(2px)",
            }}
          />
        </>
      )}

      {/* Ambient Diffusion Bloom / Aurora Glow */}
      <div
        className={`absolute rounded-full transition-all duration-500 blur-xl ${
          isSpeaking
            ? "bg-gradient-to-tr from-sky-400/50 via-indigo-500/50 to-emerald-400/50 scale-125"
            : isListening
            ? "bg-gradient-to-tr from-purple-500/50 via-rose-500/40 to-sky-400/50 scale-115"
            : isThinking
            ? "bg-gradient-to-tr from-amber-400/40 via-sky-500/50 to-indigo-500/40 animate-spin scale-120"
            : "bg-gradient-to-tr from-sky-500/30 via-indigo-500/30 to-teal-400/30 scale-100"
        }`}
        style={{
          width: size,
          height: size,
          animationDuration: isThinking ? "4s" : undefined,
        }}
      />

      {/* Core Orb Container */}
      <div
        className="relative rounded-full flex items-center justify-center overflow-hidden transition-transform duration-200"
        style={{
          width: size,
          height: size,
          transform: `scale(${voiceScale})`,
          boxShadow: isSpeaking
            ? "0 0 35px rgba(56, 189, 248, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.8)"
            : isListening
            ? "0 0 30px rgba(168, 85, 247, 0.6), inset 0 0 18px rgba(255, 255, 255, 0.7)"
            : isThinking
            ? "0 0 25px rgba(245, 158, 11, 0.5), inset 0 0 15px rgba(255, 255, 255, 0.6)"
            : "0 0 20px rgba(56, 189, 248, 0.4), inset 0 0 12px rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Dynamic Multi-Stop Gradient Mesh */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 ${
            isThinking
              ? "animate-spin"
              : isSpeaking
              ? "animate-pulse"
              : "animate-liquid-float"
          }`}
          style={{
            background: isSpeaking
              ? "radial-gradient(circle at 35% 35%, #ffffff 0%, #38bdf8 30%, #6366f1 65%, #0f172a 100%)"
              : isListening
              ? "radial-gradient(circle at 35% 35%, #ffffff 0%, #c084fc 30%, #e11d48 65%, #0f172a 100%)"
              : isThinking
              ? "radial-gradient(circle at 35% 35%, #ffffff 0%, #facc15 30%, #0284c7 70%, #0f172a 100%)"
              : "radial-gradient(circle at 35% 35%, #ffffff 0%, #38bdf8 35%, #4f46e5 70%, #090d16 100%)",
            animationDuration: isThinking ? "2.5s" : isSpeaking ? "1.8s" : "3.5s",
          }}
        />

        {/* Liquid Glass Highlight Arc */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.35) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
          }}
        />

        {/* Center Glowing White Hotspot */}
        <div
          className={`w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_15px_#ffffff] transition-all duration-300 ${
            isSpeaking || isListening ? "scale-125 opacity-95" : "scale-100 opacity-80"
          }`}
        />
      </div>
    </div>
  );
};

export default ChatGptOrb;
