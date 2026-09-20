import { useState } from "react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { TeacherNavigationBar } from "@/Components/TeacherNavigationBar";
import { CoursesOverviewSection } from "@/Components/CoursesOverviewSection";
import { FooterGlass } from "@/Components/FooterGlass";
import vector2 from "./vector-2.svg";
import vector5 from "./vector-5.svg";
import { MobileFrameLayout } from "@/Components/MobileFrameLayout";

export const TeacherMyCourses = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <MobileFrameLayout>
      <main className="bg-neutral-scale70 relative min-h-[800px] min-w-[360px] w-full">
        <header className="absolute left-0 top-0 flex h-[76px] w-[360px] bg-transparent">
          <form
            className="relative ml-[5px] mt-11 flex h-8 w-[350px] items-center gap-[105px] rounded-[20px] border border-solid border-[#d1d1d6] bg-neutral-scale80 py-[7px] pl-[13px] pr-[15px]"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <label className="sr-only" htmlFor="course-search">
              Search courses
            </label>
            <div className="relative h-4 w-[15px]" aria-hidden="true">
              <img
                className="absolute left-[7.50%] top-[7.81%] h-[92.19%] w-[92.50%]"
                alt=""
                src={vector5}
              />
            </div>
            <input
              id="course-search"
              className="absolute left-[38px] top-[7px] border-none bg-transparent p-0 font-EN-inter-caption-1 text-[length:var(--EN-inter-caption-1-font-size)] font-[number:var(--EN-inter-caption-1-font-weight)] leading-[var(--EN-inter-caption-1-line-height)] tracking-[var(--EN-inter-caption-1-letter-spacing)] text-[#aeaeb2] [font-style:var(--EN-inter-caption-1-font-style)]"
              placeholder="Search courses"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button
              className="absolute left-[93.14%] top-[35.94%] h-[28.12%] w-[2.57%]"
              type="button"
              aria-label="Clear course search"
              onClick={clearSearch}
            >
              <img
                className="absolute left-[-5.56%] top-[-5.56%] h-[105.56%] w-[105.56%]"
                alt=""
                src={vector2}
              />
            </button>
          </form>
        </header>
        <CoursesOverviewSection />
        <FooterGlass>
          <TeacherNavigationBar />
        </FooterGlass>
      </main>
    </MobileFrameLayout>
  );
};
