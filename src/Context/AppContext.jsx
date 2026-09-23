import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { authApi } from "@/api/new/auth.api";
import { translations, getTranslation } from "@/translations";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [sessionToken, setSessionToken] = useState(() => {
    return localStorage.getItem("session_token") || null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("current_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    const savedRole = localStorage.getItem("user_role");
    if (savedRole) return savedRole.toLowerCase();
    const saved = localStorage.getItem("current_user");
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return (parsed?.role || parsed?.user_type || "teacher").toLowerCase();
    } catch {
      return "teacher";
    }
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "fa";
  });
  const [selectedResources, setSelectedResources] = useState([]);

  const isRTL = language === "fa";
  const isAuthenticated = Boolean(sessionToken);

  const t = useCallback(
    (key, fallback = "") => getTranslation(language, key, fallback),
    [language]
  );

  const strings = useMemo(
    () => translations[language] || translations.fa,
    [language]
  );

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

    const token = localStorage.getItem("token") || localStorage.getItem("session_token");
    if (token) {
      authApi.updateUserSettings({ language }).catch((err) => {
        console.warn("Failed to persist language to new backend:", err);
      });
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "fa" ? "en" : "fa"));
  };

  const loginUser = (user, token) => {
    setCurrentUser(user);
    setSessionToken(token);
    const userRole = (user?.user_type || user?.role || "teacher").toLowerCase();
    setRole(userRole);
    if (user?.language) {
      setLanguage(user.language);
    }
    if (user?.theme) {
      localStorage.setItem("theme", user.theme);
      const root = document.documentElement;
      if (user.theme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
    localStorage.setItem("current_user", JSON.stringify(user));
    localStorage.setItem("session_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user_role", userRole);
  };

  const logoutUser = () => {
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem("current_user");
    localStorage.removeItem("session_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
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
        t,
        strings,
        translations,
        selectedResources,
        setSelectedResources,
        sessionToken,
        currentUser,
        isAuthenticated,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}


