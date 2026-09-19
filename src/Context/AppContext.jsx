import { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [role, setRole] = useState("teacher"); // پیش‌فرض: استاد
  const [language, setLanguage] = useState("en"); // پیش‌فرض: انگلیسی
  const [selectedResources, setSelectedResources] = useState([]); // منابع انتخاب شده استاد

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        language,
        setLanguage,
        selectedResources,
        setSelectedResources,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

