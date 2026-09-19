import { Outlet } from "react-router-dom";
import { TeacherNavigationBar } from "@/components/TeacherNavigationBar";
import { FooterGlass } from "@/Components/FooterGlass";

export const TeacherLayout = () => {
  return (
    <div className="min-h-screen">
      <Outlet />

      <FooterGlass>
        <TeacherNavigationBar />
      </FooterGlass>
    </div>
  );
};