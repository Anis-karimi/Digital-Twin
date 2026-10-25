/**
 * @file index.js
 * @description Export voice features and normalizer utilities.
 */

export {
  normalizeTextForTTS,
  warmupQuestionNormalization,
  preNormalizeText,
  postSanitizeText,
  isPersianText,
  detectTextLanguage,
  resolveParenthesesTerms,
  disambiguateTechnicalPersian,
  enhancePunctuationForTTS
} from "./voiceTextNormalizer";

export { default as voiceTextNormalizer } from "./voiceTextNormalizer";

export {
  WebRtcVoiceActivityDetector,
  WEBRTC_AUDIO_CONSTRAINTS,
  downsampleTo16k,
  floatToInt16PCM,
} from "./webrtcVAD";

export { useWebRtcVAD } from "./useWebRtcVAD";
