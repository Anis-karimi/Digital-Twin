import { ChevronRight, ArrowLeft, NotebookPen, GraduationCap, Library } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate } from "react-router-dom";
import { courses } from "@/data/courses";

export const TeacherResource = () => {
  const navigate = useNavigate();

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden">
      <header className="w-full h-[65px] flex">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate("/TeacherSettings")}
            type="button"
            aria-label="Go back"
            className="text-white absolute top-1/2 -translate-y-1/2 left-[15px] w-6 h-6 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="!w-6 !h-6 text-neutral-scale70" />
          </button>

          <h1 className="absolute top-1/2 -translate-y-1/2 left-16 en-title-1 text-neutral-scale70 text-center whitespace-nowrap">
            Resourse Managmant
          </h1>
        </div>
      </header>

      <section
        aria-labelledby="resource-course-selection"
        className="w-full flex-1 min-h-0 mt-[15px] mb-[20px]"
      >
        <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden">
          <div className="mt-[5px] w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[25px]">
            <p
              id="resource-course-selection"
              className="text-left ml-[23px] fa-body-medium text-primery-800 dark:text-neutral-scale70 whitespace-nowrap [direction:rtl]"
            >
              Select a course to upload your file
            </p>

            <div className="flex flex-col w-full gap-[15px] mt-[20px] px-[22px]">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  aria-label={`Select course ${course.title}`}
                  className="flex items-center rounded-[7px] border border-neutral-scale200 bg-neutral-scale80 dark:bg-neutral-scale1200 justify-between w-full cursor-pointer px-[12px] py-[10px]"
                  onClick={() => navigate(`/TeacherCourseDoc/${course.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center rounded-[7px] border border-neutral-scale200 bg-neutral-scale80 dark:bg-neutral-scale1200">
                      <NotebookPen className="!w-4 !h-4 text-neutral-scale1800 dark:text-neutral-scale70" />
                    </div>

                    <span className="fa-body text-neutral-scale1800 dark:text-neutral-scale70 whitespace-nowrap [direction:rtl]">
                      {course.title}
                    </span>
                  </div>

                  <ChevronRight className="!w-4 !h-4 text-neutral-scale1800 dark:text-neutral-scale70" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
