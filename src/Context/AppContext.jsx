import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { authApi } from "@/api/new/auth.api";
import { translations, getTranslation } from "@/translations";

const sanitizeUser = (user) => {
  if (!user) return user;
  const clone = { ...user };
  const full = [clone.first_name, clone.last_name].filter(Boolean).join(" ").trim();
  const isTeacher =
    (clone.user_type && clone.user_type.toUpperCase() === "TEACHER") ||
    (clone.role && clone.role.toUpperCase() === "TEACHER") ||
    clone.username === "teacher";

  if (
    isTeacher &&
    (!full ||
      full === "استاد دیجیتال" ||
      full.includes("دیجیتال") ||
      full === "استاد" ||
      full.toLowerCase() === "teacher")
  ) {
    clone.first_name = "دکتر محمد";
    clone.last_name = "اله بخش";
  }
  return clone;
};

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [sessionToken, setSessionToken] = useState(() => {
    return localStorage.getItem("session_token") || null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("current_user");
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return sanitizeUser(parsed);
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

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("session_token");
    if (token) {
      authApi.getCurrentUserProfile().then((res) => {
        const u = sanitizeUser(res?.user || res);
        if (u && (u.first_name || u.username || u.name)) {
          setCurrentUser((prev) => ({ ...(prev || {}), ...u }));
          try {
            localStorage.setItem("current_user", JSON.stringify(u));
          } catch {}
        }
      }).catch(() => {});
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "fa" ? "en" : "fa"));
  };

  const loginUser = (user, token) => {
    const cleanUser = sanitizeUser(user);
    setCurrentUser(cleanUser);
    setSessionToken(token);
    const userRole = (cleanUser?.user_type || cleanUser?.role || "teacher").toLowerCase();
    setRole(userRole);
    if (cleanUser?.language) {
      setLanguage(cleanUser.language);
    }
    if (cleanUser?.theme) {
      localStorage.setItem("theme", cleanUser.theme);
      const root = document.documentElement;
      if (cleanUser.theme === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
    localStorage.setItem("current_user", JSON.stringify(cleanUser));
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


