import { Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import { FooterGlass } from "@/Components/FooterGlass";
import "@/styles/fonts.css";

export const StudentLayout = () => {
  const { language, isRTL } = useContext(AppContext);
  const location = useLocation();

  const isExamLive =
    location.pathname.toLowerCase().includes("/studentexam/") ||
    location.pathname.toLowerCase().startsWith("/studentexam/") ||
    location.pathname.toLowerCase().includes("/biometrics");

  return (
    <div
      className={`min-h-screen transition-all duration-200 ${
        isRTL ? "font-vazir" : "font-inter"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      <Outlet />

      {!isExamLive && (
        <FooterGlass>
          <StudentNavigationBar />
        </FooterGlass>
      )}
    </div>
  );
};