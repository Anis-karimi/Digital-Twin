import { ArrowLeft } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css"
import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/Context/ThemeContext";

const themeOptions = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export const Theme = () => {
  const radioGroupName = useId();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const selectedTheme = isDark ? "dark" : "light";

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col gap-[15px]">
      <header className="w-full h-[65px] flex">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label="Go back"
            className="text-white absolute top-1/2 -translate-y-1/2 left-[15px] w-6 h-6 cursor-pointer"
          >
            <ArrowLeft className="!w-6 !h-6" />
          </button>

          <h1 className="absolute top-1/2 -translate-y-1/2 left-16 en-title-1 text-neutral-scale70 text-center whitespace-nowrap">
            Theme
          </h1>
        </div>
      </header>
      <section
        className="-ml-px w-full  h-[88px] flex"
        aria-labelledby="theme-selection-heading"
      >
        <div className="w-full  h-[88px] flex">
          <div className="mt-[5px] mx-3.5 w-full h-[78px] relative bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden">
            <fieldset className="absolute inset-0 m-0 border-0 p-0">
              <legend id="theme-selection-heading" className="sr-only">
                Select theme
              </legend>

              <div className="flex flex-col w-full items-start gap-2.5 pl-[5px] pr-0 py-0 relative top-2.5 left-3">
                {themeOptions.map((option) => {
                  const isSelected = selectedTheme === option.id;

                  return (
                    <label
                      key={option.id}
                      htmlFor={option.id}
                      className="flex items-center gap-2.5 relative self-stretch w-full flex-[0_0_auto] cursor-pointer text-neutral-scale1800 dark:text-neutral-scale70"
                    >
                      <input
                        id={option.id}
                        type="radio"
                        name={radioGroupName}
                        value={option.id}
                        checked={isSelected}
                        onChange={() => {
                          if (
                            (option.id === "dark" && !isDark) ||
                            (option.id === "light" && isDark)
                          ) {
                            toggleTheme();
                          }
                        }}
                        className="sr-only"
                      />

                      {/* UI radio (کاملاً مستقیم، بدون RadioGroup) */}
                      <span className="relative w-4 h-4 rounded-full border border-neutral-scale1800 dark:border-neutral-scale70 flex items-center justify-center shrink-0">
                        {isSelected && (
                          <span className="absolute w-2 h-2 rounded-full bg-neutral-scale1800 dark:bg-neutral-scale70" />
                        )}
                      </span>

                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>
      </section>
    </main>
  );
};

