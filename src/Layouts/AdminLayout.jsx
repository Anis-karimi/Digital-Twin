import { Outlet } from "react-router-dom";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { AdminNavigationBar } from "@/Components/AdminNavigationBar";
import { FooterGlass } from "@/Components/FooterGlass";
import "@/styles/fonts.css";

export const AdminLayout = () => {
  const { language, isRTL } = useContext(AppContext);

  return (
    <div
      className={`h-full h-dvh w-full min-w-0 overflow-hidden flex flex-col bg-[#f1f0f0] dark:bg-neutral-scale1400 transition-all duration-200 ${
        isRTL ? "font-vazir" : "font-inter"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      <Outlet />

      <FooterGlass>
        <AdminNavigationBar />
      </FooterGlass>
    </div>
  );
};

export default AdminLayout;
