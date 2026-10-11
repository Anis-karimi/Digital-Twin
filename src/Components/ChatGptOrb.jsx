import React, { useMemo } from "react";

/**
 * ChatGptOrb
 * 
 * SOTA VisionOS & Apple Intelligence Fluid AI Voice Orb:
 * - Multi-layer chromatic fluid core with organic breathing rhythm
 * - Soft soundwave audio-reactive halo (no harsh ping borders)
 * - Swirling orbital aurora when thinking / generating questions
 * - Crystalline glass refraction bezel with smooth specular highlights
 * 
 * @param {Object} props
 * @param {"idle"|"speaking"|"listening"|"thinking"} [props.state="idle"] Current AI voice state
 * @param {number} [props.size=64] Diameter in pixels
 * @param {number} [props.voiceLevel=0] Real-time audio amplitude (0 to 1)
 * @param {string} [props.className=""] Optional additional CSS classes
 */
export const ChatGptOrb = ({
  state = "idle",
  size = 64,
  voiceLevel = 0,
  className = "",
}) => {
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isThinking = state === "thinking";

  // Dynamic scale multiplier based on voice activity
  const voiceScale = useMemo(() => {
    if (isSpeaking || isListening) {
      return 1 + Math.min(0.2, Math.max(0, voiceLevel) * 0.35);
    }
    return 1;
  }, [isSpeaking, isListening, voiceLevel]);

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: size * 1.4,
        height: size * 1.4,
      }}
    >
      {/* Layer 1: Soft Ambient Diffusion Aura */}
      <div
        className={`absolute rounded-full transition-all duration-700 blur-2xl ${
          isSpeaking
            ? "bg-gradient-to-tr from-sky-400/40 via-blue-500/35 to-indigo-500/40 scale-125"
            : isListening
            ? "bg-gradient-to-tr from-purple-500/40 via-violet-500/35 to-rose-400/40 scale-120"
            : isThinking
            ? "bg-gradient-to-tr from-amber-400/35 via-sky-400/40 to-indigo-500/35 animate-spin scale-115"
            : "bg-gradient-to-tr from-sky-500/25 via-indigo-500/20 to-teal-400/25 scale-100"
        }`}
        style={{
          width: size,
          height: size,
          animationDuration: isThinking ? "3.5s" : undefined,
        }}
      />

      {/* Layer 2: Organic Soundwave Ripple Rings (Smooth Audio Halo) */}
      {(isSpeaking || isListening) && (
        <>
          <div
            className="absolute rounded-full border border-sky-400/30 dark:border-sky-300/25 animate-pulse"
            style={{
              width: size * (1.1 + voiceLevel * 0.25),
              height: size * (1.1 + voiceLevel * 0.25),
              transition: "width 0.15s ease-out, height 0.15s ease-out",
            }}
          />
          <div
            className="absolute rounded-full border border-indigo-400/20 dark:border-indigo-300/15"
            style={{
              width: size * (1.25 + voiceLevel * 0.35),
              height: size * (1.25 + voiceLevel * 0.35),
              transition: "width 0.25s ease-out, height 0.25s ease-out",
            }}
          />
        </>
      )}

      {/* Layer 3: Main Glass Orb Chamber */}
      <div
        className="relative rounded-full flex items-center justify-center overflow-hidden transition-transform duration-200"
        style={{
          width: size,
          height: size,
          transform: `scale(${voiceScale})`,
          boxShadow: isSpeaking
            ? "0 0 25px rgba(56, 189, 248, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.3)"
            : isListening
            ? "0 0 22px rgba(168, 85, 247, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.3)"
            : isThinking
            ? "0 0 20px rgba(245, 158, 11, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.3)"
            : "0 0 15px rgba(56, 189, 248, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Dynamic Fluid Gradient Core */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-700 ${
            isThinking
              ? "animate-spin"
              : isSpeaking
              ? "animate-pulse"
              : ""
          }`}
          style={{
            background: isSpeaking
              ? "radial-gradient(circle at 40% 30%, #e0f2fe 0%, #38bdf8 35%, #4f46e5 75%, #1e1b4b 100%)"
              : isListening
              ? "radial-gradient(circle at 40% 30%, #fae8ff 0%, #c084fc 35%, #7c3aed 75%, #31104b 100%)"
              : isThinking
              ? "radial-gradient(circle at 40% 30%, #fef08a 0%, #38bdf8 45%, #6366f1 80%, #0f172a 100%)"
              : "radial-gradient(circle at 40% 30%, #bae6fd 0%, #0ea5e9 40%, #312e81 80%, #030712 100%)",
            animationDuration: isThinking ? "3s" : isSpeaking ? "2s" : undefined,
          }}
        />

        {/* VisionOS High-Refraction Rim & Top Sheen */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.25) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
          }}
        />

        {/* Luminous Inner Core Ambient Focus */}
        <div
          className={`w-4 h-4 rounded-full bg-white/90 blur-xs transition-transform duration-300 ${
            isSpeaking || isListening ? "scale-110 opacity-90" : "scale-100 opacity-70"
          }`}
        />
      </div>
    </div>
  );
};

export default ChatGptOrb;
