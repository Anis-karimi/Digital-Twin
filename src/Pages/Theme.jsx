import { ArrowLeft, ArrowRight } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useId, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/Context/ThemeContext";
import { AppContext } from "@/Context/AppContext";

const themeOptions = [
  { id: "light", labelEn: "Light", labelFa: "روشن" },
  { id: "dark", labelEn: "Dark", labelFa: "تاریک" },
];

export const Theme = () => {
  const radioGroupName = useId();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { isRTL } = useContext(AppContext);
  const selectedTheme = isDark ? "dark" : "light";

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <main
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col gap-[15px]"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000 items-center px-4">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="text-white w-8 h-8 cursor-pointer flex items-center justify-center shrink-0"
          >
            <BackIcon className="!w-6 !h-6" />
          </button>

          <h1
            className={`flex-1 mx-2 text-neutral-scale70 whitespace-nowrap truncate ${
              isRTL ? "fa-title-1 font-vazir text-right" : "en-title-1 font-inter text-left"
            }`}
          >
            {isRTL ? "پوسته" : "Theme"}
          </h1>
        </div>
      </header>

      <section
        className="w-full h-[88px] flex px-3.5"
        aria-labelledby="theme-selection-heading"
      >
        <div className="w-full h-[78px] relative bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden p-3 flex items-center">
          <fieldset className="border-0 m-0 p-0 w-full">
            <legend id="theme-selection-heading" className="sr-only">
              {isRTL ? "انتخاب پوسته" : "Select theme"}
            </legend>

            <div className="flex flex-col items-start gap-2.5">
              {themeOptions.map((option) => {
                const isSelected = selectedTheme === option.id;

                return (
                  <label
                    key={option.id}
                    htmlFor={option.id}
                    className="flex items-center gap-2.5 relative self-stretch w-full cursor-pointer text-neutral-scale1800 dark:text-neutral-scale70"
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

                    {/* Custom radio button UI */}
                    <span className="relative w-4 h-4 rounded-full border border-neutral-scale1800 dark:border-neutral-scale70 flex items-center justify-center shrink-0">
                      {isSelected && (
                        <span className="absolute w-2 h-2 rounded-full bg-neutral-scale1800 dark:bg-neutral-scale70" />
                      )}
                    </span>

                    <span
                      className={
                        isRTL ? "fa-body font-vazir" : "en-body font-inter"
                      }
                    >
                      {isRTL ? option.labelFa : option.labelEn}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      </section>
    </main>
  );
};


