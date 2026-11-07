import { useContext, useCallback } from "react";
import { AppContext } from "@/Context/AppContext";
import { translations, getTranslation } from "./translations";

/**
 * Custom React hook to conveniently access translations anywhere
 */
export const useTranslation = () => {
  const context = useContext(AppContext);
  const language =
    context?.language ||
    (typeof localStorage !== "undefined" && localStorage.getItem("language")) ||
    "fa";
  const isRTL = context?.isRTL ?? (language === "fa" || language === "ar");

  const t = useCallback(
    (key, fallback = "", params = null) =>
      getTranslation(language, key, fallback, params),
    [language]
  );

  return {
    t,
    language,
    isRTL,
    strings: translations[language] || translations.fa,
  };
};

