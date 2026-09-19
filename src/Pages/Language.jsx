import { ArrowLeft } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css"
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";


const languageOptions = [
  {
    id: "english",
    label: "English",
    value: "en",
    labelClassName:
      "en-body text-left [direction:rtl] relative w-36 mt-[-1.00px] mr-[-5.00px] text-neutral-scale1800 dark:text-neutral-scale70",
    direction: "ltr",
    lang: "en",
  },
  {
    id: "persian",
    label: "فارسی",
    value: "fa",
    labelClassName:
      "fa-body text-left [direction:rtl] relative w-36 mt-[-1.00px] mr-[-5.00px] text-neutral-scale1800 dark:text-neutral-scale70 ",
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
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh flex flex-col gap-[15px] mx-auto">
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
            Language
          </h1>
        </div>
      </header>
      <section
        className="ml-px w-full h-[88px] flex"
        aria-labelledby={`${groupId}-legend`}
      >
        <div className="w-full h-[88px] flex">
          <div className="mt-[5px] mx-3.5 w-full h-[78px] ml-3.5 relative bg-neutral-scale70  dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden">
            <fieldset className="border-0 m-0 p-0">
              <legend id={`${groupId}-legend`} className="sr-only">
                Select language
              </legend>
              <div className="flex flex-col w-[169px] items-start gap-2.5 pl-[5px] pr-0 py-0 relative top-2.5 left-3">
                {languageOptions.map((option) => {
                  const checked = selectedLanguage === option.value;

                  return (
                    <label
                      key={option.id}
                      className="flex items-center gap-2.5 relative self-stretch w-full flex-[0_0_auto] cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={groupId}
                        value={option.value}
                        checked={checked}
                        onChange={() => setSelectedLanguage(option.value)}
                        className="sr-only"
                        aria-label={option.label}
                      />
                      <RadioIndicator checked={checked} />
                      <span
                        className={option.labelClassName}
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
        </div>
      </section>
    </main>
  );
};


