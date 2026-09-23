import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { translations, getTranslation } from "./translations";

/**
 * Custom React hook to conveniently access translations anywhere
 */
export const useTranslation = () => {
  const context = useContext(AppContext);
  const language = context?.language || "fa";
  const isRTL = context?.isRTL ?? (language === "fa");

  const t = (key, fallback = "") => getTranslation(language, key, fallback);

  return {
    t,
    language,
    isRTL,
    strings: translations[language] || translations.fa,
  };
};
