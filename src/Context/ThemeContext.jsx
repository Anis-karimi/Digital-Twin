import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "@/api/new/auth.api";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setTheme = (theme) => setIsDark(theme === "dark");

  useEffect(() => {
    const root = document.documentElement;
    const themeStr = isDark ? "dark" : "light";

    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    const token = localStorage.getItem("token") || localStorage.getItem("session_token");
    if (token) {
      authApi.updateUserSettings({
        theme: themeStr,
        appearance: { theme: themeStr },
      }).catch((err) => {
        console.warn("Failed to persist theme to new backend:", err);
      });
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);