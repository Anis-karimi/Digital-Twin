import { ArrowLeft, ArrowRight } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useId, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";

const languageOptions = [
  {
    id: "english",
    label: "English",
    value: "en",
    labelClassName:
      "en-body text-left relative w-36 mt-[-1.00px] mr-[-5.00px] text-neutral-scale1800 dark:text-neutral-scale70",
    direction: "ltr",
    lang: "en",
  },
  {
    id: "persian",
    label: "فارسی",
    value: "fa",
    labelClassName:
      "fa-body text-left relative w-36 mt-[-1.00px] mr-[-5.00px] text-neutral-scale1800 dark:text-neutral-scale70",
    direction: "rtl",
    lang: "fa",
  },
];

const RadioIndicator = ({ checked }) => (
  <span className="relative shrink-0 w-4 h-4 rounded-full border border-neutral-scale1800 dark:border-neutral-scale70 flex items-center justify-center">
    {checked && (
      <span
        aria-hidden="true"
        className="absolute w-2 h-2 rounded-full bg-neutral-scale1800 dark:bg-neutral-scale70"
      />
    )}
  </span>
);

export const Language = () => {
  const groupId = useId();
  const navigate = useNavigate();
  const { language, setLanguage, isRTL } = useContext(AppContext);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <main
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh flex flex-col gap-[15px] mx-auto"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <header className="w-full h-[65px] flex">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000 items-center px-4">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="text-white w-6 h-6 cursor-pointer flex items-center justify-center"
          >
            <BackIcon className="!w-6 !h-6" />
          </button>

          <h1
            className={`mx-auto text-neutral-scale70 text-center whitespace-nowrap ${
              isRTL ? "fa-title-1" : "en-title-1"
            }`}
          >
            {isRTL ? "انتخاب زبان" : "Language"}
          </h1>

          <div className="w-6" aria-hidden="true" />
        </div>
      </header>

      <section
        className="w-full h-[88px] flex px-3.5"
        aria-labelledby={`${groupId}-legend`}
      >
        <div className="w-full h-[78px] relative bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden p-3 flex items-center">
          <fieldset className="border-0 m-0 p-0 w-full">
            <legend id={`${groupId}-legend`} className="sr-only">
              {isRTL ? "انتخاب زبان" : "Select language"}
            </legend>
            <div className="flex flex-col items-start gap-2.5">
              {languageOptions.map((option) => {
                const checked = language === option.value;

                return (
                  <label
                    key={option.id}
                    className="flex items-center gap-2.5 relative self-stretch w-full cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={groupId}
                      value={option.value}
                      checked={checked}
                      onChange={() => setLanguage(option.value)}
                      className="sr-only"
                      aria-label={option.label}
                    />
                    <RadioIndicator checked={checked} />
                    <span
                      className={
                        option.value === "fa"
                          ? "fa-body text-neutral-scale1800 dark:text-neutral-scale70"
                          : "en-body text-neutral-scale1800 dark:text-neutral-scale70"
                      }
                      dir={option.direction}
                      lang={option.lang}
                    >
                      {option.label}
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
