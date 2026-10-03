import { useState, useRef, useEffect, useCallback } from "react";
import { Mic } from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";

/**
 * Reusable Voice Microphone Button with Press-and-Hold Language Selector.
 * 
 * Behavior:
 * - Simple Click (anywhere on button or badge): Start / Stop voice recording using current language.
 * - Press & Hold (held for >= 400ms): Opens floating language selector menu (Fa: 8881, En: 8882).
 * - Language selection persisted to localStorage ("voice_lang") and synchronized across tabs.
 * - Flat, clean menu design matching original reference without inset/sunken boxes.
 */
export const VoiceMicButton = ({
  recording = false,
  recordingOrbState = null,
  orbSize = 32,
  orbColor = "#38bdf8",
  onStartRecording,
  onStopRecording,
  voiceLang: controlledLang,
  onLanguageChange,
  disabled = false,
  className = "",
  buttonClassName = "",
  iconClassName = "",
  badgeClassName = "",
  menuClassName = "",
  isRTL = false,
  title,
}) => {
  const [internalLang, setInternalLang] = useState(() => {
    return localStorage.getItem("voice_lang") || "fa";
  });

  const currentLang = controlledLang || internalLang;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const holdTimerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const containerRef = useRef(null);

  // Sync language with custom event across components
  useEffect(() => {
    const handleSync = (e) => {
      if (e?.detail && (e.detail === "fa" || e.detail === "en")) {
        setInternalLang(e.detail);
      }
    };
    window.addEventListener("voice-language-changed", handleSync);
    return () => window.removeEventListener("voice-language-changed", handleSync);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  const selectLanguage = useCallback((lang) => {
    setInternalLang(lang);
    localStorage.setItem("voice_lang", lang);
    onLanguageChange?.(lang);
    window.dispatchEvent(new CustomEvent("voice-language-changed", { detail: lang }));
    setIsMenuOpen(false);
  }, [onLanguageChange]);

  const handlePointerDown = (e) => {
    if (disabled || (e.button !== undefined && e.button !== 0)) return;

    if (recording) {
      // If already recording, next click will just stop recording
      return;
    }

    isLongPressRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    holdTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsMenuOpen(true);
    }, 400); // 400ms threshold for press-and-hold
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleClick = (e) => {
    if (disabled) return;

    if (isLongPressRef.current) {
      // Was a long press that opened the menu; suppress recording toggle
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
      return;
    }

    if (recording) {
      onStopRecording?.();
    } else {
      onStartRecording?.(currentLang);
    }
  };

  const badgeText = currentLang === "en" ? "En" : "Fa";

  const defaultTitle = recording
    ? isRTL ? "توقف ضبط صدا" : "Stop recording"
    : currentLang === "en"
    ? isRTL ? "ضبط صدا" : "Voice input"
    : isRTL ? "ضبط صدا" : "Voice input";

  const isAbsolute = className.includes("absolute");

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className={`select-none ${isAbsolute ? "" : "relative inline-flex items-center justify-center"} ${className}`}
    >
      {/* Floating Language Menu (Opens strictly on Press & Hold) */}
      {isMenuOpen && (
        <div
          dir="ltr"
          className={`absolute bottom-[calc(100%+8px)] ${
            isAbsolute ? "right-0" : isRTL ? "right-0" : "left-0 sm:left-auto sm:right-0"
          } bg-[#282828] text-white rounded-2xl p-1.5 shadow-2xl border border-white/10 z-50 min-w-[130px] animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex flex-col">
            {/* Continuous vertical divider line */}
            <div className="absolute top-1 bottom-1 left-[42px] w-[1px] bg-white/20 pointer-events-none" />

            {/* Persian Option */}
            <button
              type="button"
              onClick={() => selectLanguage("fa")}
              className="w-full flex items-center text-xs py-2 px-2.5 rounded-xl transition-colors cursor-pointer select-none text-white hover:bg-white/10"
            >
              <span
                className={`w-6 text-center tracking-wider shrink-0 font-inter text-xs ${
                  currentLang === "fa" ? "font-bold text-white" : "font-normal text-neutral-300"
                }`}
              >
                Fa
              </span>
              <span className="w-4 shrink-0" />
              <span
                className={`flex-1 text-left font-inter text-xs ${
                  currentLang === "fa" ? "font-bold text-white" : "font-normal text-neutral-300"
                }`}
              >
                Persian
              </span>
            </button>

            {/* English Option */}
            <button
              type="button"
              onClick={() => selectLanguage("en")}
              className="w-full flex items-center text-xs py-2 px-2.5 rounded-xl transition-colors cursor-pointer select-none text-white hover:bg-white/10"
            >
              <span
                className={`w-6 text-center tracking-wider shrink-0 font-inter text-xs ${
                  currentLang === "en" ? "font-bold text-white" : "font-normal text-neutral-300"
                }`}
              >
                En
              </span>
              <span className="w-4 shrink-0" />
              <span
                className={`flex-1 text-left font-inter text-xs ${
                  currentLang === "en" ? "font-bold text-white" : "font-normal text-neutral-300"
                }`}
              >
                English
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Microphone Button / Morphing Orb */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        title={title || defaultTitle}
        aria-label={title || defaultTitle}
        className="group relative w-full h-full flex items-center justify-center cursor-pointer select-none bg-transparent border-0 p-0 focus:outline-none"
      >
        {/* Layer 1: Frosted Microphone Circle Button (Idle State) */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            recording && recordingOrbState
              ? "opacity-0 scale-50 -rotate-45 pointer-events-none"
              : "opacity-100 scale-100 rotate-0 pointer-events-auto"
          }`}
        >
          <div
            className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
              recording && !recordingOrbState ? "animate-pulse" : ""
            } ${buttonClassName}`}
          >
            <Mic
              className={`transition-all duration-300 ${
                recording
                  ? "text-red-500 scale-110 animate-pulse"
                  : "text-sky-300 group-hover:scale-105"
              } ${iconClassName}`}
            />
          </div>

          {/* Language Badge on Corner (Clicks pass through to button via pointer-events-none) */}
          <span
            className={`pointer-events-none absolute z-20 min-w-[16px] h-[16px] px-1 rounded-full bg-[#1e1e1e] text-white font-inter text-[9px] font-bold flex items-center justify-center border border-white/20 shadow-xs select-none transition-all duration-300 ${
              recording && !recordingOrbState ? "ring-1 ring-red-400" : ""
            } ${badgeClassName || "-top-0.5 -left-0.5"}`}
          >
            {badgeText}
          </span>
        </div>

        {/* Layer 2: ThinkingOrb (Active Morph State - No boxed container, button itself is the orb) */}
        {recordingOrbState && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              recording
                ? "opacity-100 scale-100 rotate-0 pointer-events-auto drop-shadow-[0_0_18px_rgba(56,189,248,0.65)] hover:scale-110 active:scale-95"
                : "opacity-0 scale-40 rotate-45 pointer-events-none"
            }`}
          >
            {/* Ambient soft glow aura */}
            <div className="absolute inset-0 rounded-full bg-sky-400/25 blur-md pointer-events-none animate-pulse" />
            <ThinkingOrb
              state={recordingOrbState}
              size={64}
              theme="dark"
              color={orbColor || "#38bdf8"}
              paused={!recording}
              style={{
                width: 64,
                height: 64,
                transform: "scale(0.72)",
                transformOrigin: "center",
              }}
            />
          </div>
        )}
      </button>
    </div>
  );
};

export default VoiceMicButton;
