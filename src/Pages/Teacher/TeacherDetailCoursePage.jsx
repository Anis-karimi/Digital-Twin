import { useId, useState } from "react";
import { ArrowLeft } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import Calendar from "@/assets/icons/Calendar_Days.svg?react";
import Edit from "@/assets/icons/Edit.svg?react";
import Enable from "@/assets/icons/Enable.svg";
import Disable from "@/assets/icons/Disable.svg";
import { useNavigate } from "react-router-dom";

const detailCards = [
  {
    id: "course-name",
    title: "Course name",
    type: "text-with-action",
    value: "سیستم عامل",
    actionIcon: Edit,
    actionAlt: "Edit course name",
    cardClassName: "h-[68px]",
  },
  {
    id: "course-start-date",
    title: "Course start date",
    type: "date",
    value: "1 March 2026",
    icon: Calendar,
    iconAlt: "Calendar",
    cardClassName: "h-[68px]",
  },
  {
    id: "course-end-date",
    title: "Course end date",
    type: "date",
    value: "1 July 2026",
    icon: Calendar,
    iconAlt: "Calendar",
    cardClassName: "h-[68px]",
  },
  {
    id: "description",
    title: "Description",
    type: "description-with-action",
    value:
      "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی",
    actionIcon: Edit,
    actionAlt: "Edit description",
    cardClassName: "h-[111px]",
  },
];

const accessLevels = [
  { id: "private", label: "Private" },
  { id: "public", label: "Public" },
];

const InfoCard = ({ card }) => {
  if (card.type === "text-with-action") {
    return (
      <section
        aria-labelledby={card.id}
        className={`text-left flex w-full relative flex-col items-start gap-3 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden shrink-0 ${card.cardClassName}`}
      >
        <h2
          id={card.id}
          className="relative self-stretch mt-[-1px] en-caption-3 text-primery-800 dark:text-neutral-scale70"
        >
          {card.title}
        </h2>

        <p className="relative self-stretch h-[61px] fa-caption-1 text-neutral-scale1100 dark:text-neutral-scale100 [direction:rtl]">
          {card.value}
        </p>

        <button
          type="button"
          aria-label={card.actionAlt}
          className="absolute top-2.5 right-[25px] w-4 h-[17px] cursor-pointer"
        >
          <span className="w-full h-full flex">
            {(() => {
              const Icon = card.actionIcon;

              return (
                <Icon className="flex-1 w-[10.67px] text-neutral-scale1000 dark:text-neutral-scale70" />
              );
            })()}
          </span>
        </button>
      </section>
    );
  }

  if (card.type === "date") {
    return (
      <section
        aria-labelledby={card.id}
        className={`text-left flex w-full relative flex-col items-start gap-3 px-[15px] py-2.5 bg-white  dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden shrink-0 ${card.cardClassName}`}
      >
        <h2
          id={card.id}
          className="relative self-stretch mt-[-1px] en-caption-3 text-primery-800 dark:text-neutral-scale70"
        >
          {card.title}
        </h2>

        <div
          className="absolute top-[39px] left-3 w-[22px] h-[21px]"
          aria-hidden="true"
        >
          {(() => {
            const Icon = card.icon;

            return (
              <Icon className="absolute w-[83.33%] h-[91.67%] top-[8.33%] left-[16.67%] text-neutral-scale1000 dark:text-neutral-scale70" />
            );
          })()}
        </div>

        <p className="absolute top-[41px] left-11 w-[102px] en-caption-1 text-neutral-scale1800 dark:text-neutral-scale70">
          {card.value}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby={card.id}
      className={`text-left flex w-full relative flex-col items-start gap-3 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden shrink-0 ${card.cardClassName}`}
    >
      <h2
        id={card.id}
        className="relative self-stretch mt-[-1px] en-caption-3 text-primery-800 dark:text-neutral-scale70"
      >
        {card.title}
      </h2>

      <p className="relative self-stretch h-[61px] fa-caption-1 text-neutral-scale1100 dark:text-neutral-scale100 [direction:rtl] text-right">
        {card.value}
      </p>

      <button
        type="button"
        aria-label={card.actionAlt}
        className="absolute top-2.5 right-[25px] w-4 h-[17px] cursor-pointer"
      >
        <span className="w-full h-full flex">
          {(() => {
            const Icon = card.actionIcon;

            return (
              <Icon className="flex-1 w-[10.67px] text-neutral-scale1000 dark:text-neutral-scale70" />
            );
          })()}
        </span>
      </button>
    </section>
  );
};

const AccessLevelCard = () => {
  const name = useId();
  const [selectedAccessLevel, setSelectedAccessLevel] = useState("private");

  return (
    <section
      aria-labelledby="course-access-level"
      className="text-left flex w-full h-[95px] shrink-0 relative flex-col items-start gap-3 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden"
    >
      <h2
        id="course-access-level"
        className="relative self-stretch mt-[-1px] en-caption-3 text-primery-800 dark:text-neutral-scale70"
      >
        Course access level
      </h2>

      <fieldset className="relative m-0 flex flex-col gap-[10px] border-0 p-0">
        <legend className="sr-only">Course access level</legend>

        {accessLevels.map((option) => {
          const checked = selectedAccessLevel === option.id;

          return (
            <label
              key={option.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="relative w-4 h-4 rounded-full border border-neutral-scale1800 dark:border-neutral-scale70 flex items-center justify-center">
                <input
                  type="radio"
                  name={name}
                  value={option.id}
                  checked={checked}
                  onChange={() => setSelectedAccessLevel(option.id)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {checked && (
                  <span
                    aria-hidden="true"
                    className="w-2 h-2 rounded-full bg-neutral-scale1800 dark:bg-neutral-scale70"
                  />
                )}
              </span>

              <span className="en-caption-1 text-neutral-scale1800 dark:text-neutral-scale70">
                {option.label}
              </span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
};

export const TeacherDetail = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const navigate = useNavigate();

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden">
      {/* Header */}
      <header className="w-full h-[65px] shrink-0 flex">
        <div className="w-full h-[65px] relative flex items-center justify-between bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          {/* Back + Title */}
          <div className="w-[184px] h-7 relative">
            <button
              onClick={() => navigate(-1)}
              type="button"
              aria-label="Go back"
              className="text-white absolute top-1/2 -translate-y-1/2 left-[15px] w-6 h-6 cursor-pointer"
            >
              <ArrowLeft className="!w-6 !h-6" />
            </button>

            <h1 className="absolute top-1/2 -translate-y-1/2 left-[59px] fa-title-1 text-white text-center whitespace-nowrap [direction:rtl]">
              سیستم عامل
            </h1>
          </div>

          {/* Toggle */}
          <div className="mr-[15px] w-[30px] h-4 relative">
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="Toggle course status"
              onClick={() => setNotificationsEnabled((prev) => !prev)}
              className="absolute inset-0 cursor-pointer"
            >
              <img
                className="absolute w-[101.67%] h-[103.12%] top-[-3.12%] left-0"
                alt=""
                aria-hidden="true"
                src={notificationsEnabled ? Enable : Disable}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Course Details */}
      <section
        aria-label="Course details"
        className="w-full flex-1 min-h-0 px-3.5 pt-2.5 pb-5"
      >
        <div className="w-full h-full flex flex-col gap-2.5 overflow-y-auto overflow-x-hidden">
          {detailCards.slice(0, 3).map((card) => (
            <InfoCard key={card.id} card={card} />
          ))}

          <AccessLevelCard />

          <InfoCard card={detailCards[3]} />
        </div>
      </section>
    </main>
  );
};
