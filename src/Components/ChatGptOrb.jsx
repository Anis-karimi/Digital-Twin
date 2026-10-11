import React, { useMemo } from "react";
import { FluidOrb } from "./FluidOrb";

/**
 * ChatGptOrb
 * 
 * Powered by WebGL FluidOrb shader (https://jakobfisker.dk/en/ui/components/chat-gpt-orb):
 * - Real-time Fractional Brownian Motion (fBm) fluid simulation in GLSL
 * - Reactive state color modulation (speaking: #1A73F2, listening: #9333EA, thinking: #F59E0B, idle: #1A73F2)
 * - Voice level amplitude scaling and fluid speed modulation
 * - Soft ambient diffusion aura and audio ripple halo
 * 
 * @param {Object} props
 * @param {"idle"|"speaking"|"listening"|"thinking"} [props.state="idle"]
 * @param {number} [props.size=64]
 * @param {number} [props.voiceLevel=0]
 * @param {string} [props.color] Custom hex color override
 * @param {string} [props.className=""]
 */
export const ChatGptOrb = ({
  state = "idle",
  size = 64,
  voiceLevel = 0,
  color,
  className = "",
  style,
  ...props
}) => {
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isThinking = state === "thinking";

  // Derive active orb color based on voice state or manual prop
  const activeColor = useMemo(() => {
    if (color) return color;
    if (isSpeaking) return "#1A73F2";
    if (isListening) return "#9333EA";
    if (isThinking) return "#F59E0B";
    return "#1A73F2";
  }, [color, isSpeaking, isListening, isThinking]);

  // Dynamic fluid animation speed based on state & voice
  const activeSpeed = useMemo(() => {
    if (isSpeaking) return 1.4 + Math.min(1.0, voiceLevel * 1.5);
    if (isListening) return 1.2 + Math.min(0.8, voiceLevel * 1.2);
    if (isThinking) return 1.8;
    return 0.85;
  }, [isSpeaking, isListening, isThinking, voiceLevel]);

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
        ...style,
      }}
      {...props}
    >
      {/* Layer 1: Soft Ambient Diffusion Aura */}
      <div
        className="absolute rounded-full transition-all duration-700 blur-2xl pointer-events-none"
        style={{
          width: size,
          height: size,
          backgroundColor: activeColor,
          opacity: isSpeaking ? 0.45 : isListening ? 0.4 : isThinking ? 0.35 : 0.25,
          transform: `scale(${isSpeaking ? 1.3 : isListening ? 1.2 : 1})`,
        }}
      />

      {/* Layer 2: Organic Soundwave Ripple Rings */}
      {(isSpeaking || isListening) && (
        <>
          <div
            className="absolute rounded-full pointer-events-none border transition-all duration-150 animate-pulse"
            style={{
              width: size * (1.1 + voiceLevel * 0.25),
              height: size * (1.1 + voiceLevel * 0.25),
              borderColor: activeColor,
              opacity: 0.35,
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none border transition-all duration-200"
            style={{
              width: size * (1.25 + voiceLevel * 0.35),
              height: size * (1.25 + voiceLevel * 0.35),
              borderColor: activeColor,
              opacity: 0.2,
            }}
          />
        </>
      )}

      {/* Layer 3: WebGL Fluid Orb Core Chamber */}
      <div
        className="relative rounded-full flex items-center justify-center overflow-hidden transition-transform duration-200 shadow-2xl"
        style={{
          width: size,
          height: size,
          transform: `scale(${voiceScale})`,
        }}
      >
        <FluidOrb
          size={size}
          color={activeColor}
          speed={activeSpeed}
          className="w-full h-full"
        />

        {/* Subtle Specular Refraction Sheen on Top of Canvas */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 70%)",
            boxShadow: "inset 0 0.5px 1px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.25)",
          }}
        />
      </div>
    </div>
  );
};

export { FluidOrb } from "./FluidOrb";
export default ChatGptOrb;
