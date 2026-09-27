import { Outlet } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import { FooterGlass } from "@/Components/FooterGlass";
import "@/styles/fonts.css";

export const StudentLayout = () => {
  const { language, isRTL } = useContext(AppContext);

  return (
    <div
      className={`min-h-screen transition-all duration-200 ${
        isRTL ? "font-vazir" : "font-inter"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      <Outlet />

      <FooterGlass>
        <StudentNavigationBar />
      </FooterGlass>
    </div>
  );
};