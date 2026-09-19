import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useState } from "react";
import { HomeDropdownMenu } from "@/Components/HomeDropdownMenu";
import { HomeChatFeedSection } from "@/Components/HomeChatFeedSection";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import menu from "@/assets/icons/menu.svg?react";
import Bell from "@/assets/icons/Bell.svg?react";
import { FooterGlass } from "@/Components/FooterGlass";
import { useNavigate } from "react-router-dom";

const headerActions = [
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "more",
    label: "More options",
    icon: menu,
  },
];

export const StudentHome = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1500 w-full md:w-[360px] h-dvh relative overflow-hidden mx-auto"
      data-id="teacher-home-page-en"
    >
      <header
        className="absolute top-0 left-0 w-full h-[84px] flex z-10"
        aria-label="Page header"
      >
        <div className="w-full h-[84px] relative bg-primery-700 dark:bg-neutral-scale1500">
          <h1 className="absolute top-[calc(50.00%_+_2px)] left-0 w-[149px] en-title-1 text-[#f7f7f7] text-center whitespace-nowrap">
            Digital Twin
          </h1>

          <div className="absolute top-[calc(50.00%_+_3px)] right-0 flex items-center gap-3 pr-4">
            {headerActions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={label}
                onClick={() => {
                  if (id === "more") {
                    setIsMenuOpen(true);
                  }

                  if (id === "notifications") {
                    navigate("/TeacherNotification");
                  }
                }}
                className="relative flex h-6 w-6 items-center justify-center cursor-pointer"
              >
                <Icon className="w-6 h-6 text-neutral-scale70 " />
              </button>
            ))}
          </div>
        </div>
      </header>

      <section
        aria-label="Course chat feed"
        className="absolute top-[85px] left-0 right-0 bottom-0 overflow-y-auto overflow-x-hidden"
      >
        <HomeChatFeedSection />
      </section>

      <FooterGlass>
        <StudentNavigationBar />
      </FooterGlass>

      {/* ✅ OVERLAY MENU (added only) */}
      <div className="relative">
        {isMenuOpen && (
          <>
            {/* بک‌دراپ */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* منو */}
            <div className="absolute top-9 right-6 mt-2 z-50 overflow-hidden rounded-lg shadow-lg">
              <HomeDropdownMenu />
            </div>
          </>
        )}
      </div>
    </main>
  );
};
