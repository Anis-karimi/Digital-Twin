import { Outlet } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { TeacherNavigationBar } from "@/Components/TeacherNavigationBar";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import { FooterGlass } from "@/Components/FooterGlass";
import "@/styles/fonts.css";

export const AdaptiveLayout = () => {
  const { language, isRTL, role, currentUser } = useContext(AppContext);

  const isStudent =
    role === "student" ||
    currentUser?.user_type === "STUDENT" ||
    currentUser?.role === "student" ||
    localStorage.getItem("user_role") === "student";

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
        {isStudent ? <StudentNavigationBar /> : <TeacherNavigationBar />}
      </FooterGlass>
    </div>
  );
};
