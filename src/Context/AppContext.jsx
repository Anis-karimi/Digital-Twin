import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState("teacher"); // Default: teacher
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "fa";
  });
  const [selectedResources, setSelectedResources] = useState([]); // Teacher selected resource documents

  const isRTL = language === "fa";

  useEffect(() => {
    localStorage.setItem("language", language);
    const root = document.documentElement;

    if (language === "fa") {
      root.setAttribute("dir", "rtl");
      root.setAttribute("lang", "fa");
      root.classList.add("rtl");
      root.classList.remove("ltr");
    } else {
      root.setAttribute("dir", "ltr");
      root.setAttribute("lang", "en");
      root.classList.add("ltr");
      root.classList.remove("rtl");
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "fa" ? "en" : "fa"));
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        toggleLanguage,
        isRTL,
        selectedResources,
        setSelectedResources,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
