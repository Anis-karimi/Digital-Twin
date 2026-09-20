
import { useId, useRef, useState, useEffect } from "react";
import Trash_Full from "@/assets/icons/Trash_Full.svg?react";
import File_Add from "@/assets/icons/File_Add.svg?react";
import { ArrowLeft, Pencil, Save } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import Calendar from "@/assets/icons/Calendar_Days.svg?react";
import Enable from "@/assets/icons/Enable.svg";
import Disable from "@/assets/icons/Disable.svg";
import { useNavigate, useParams } from "react-router-dom";
import { BACKEND_URL } from "@/Services/BackendConfige";
import { courses } from "@/data/courses";

const detailCards = [
  {
    id: "course-name",
    title: "Course name",
    type: "text",
    value: "سیستم عامل",
    cardClassName: "h-[75px]",
  },
  {
    id: "course-start-date",
    title: "Course start date",
    type: "date",
    value: "2026-03-01",
    icon: Calendar,
    iconAlt: "Calendar",
    cardClassName: "h-[75px]",
  },
  {
    id: "course-end-date",
    title: "Course end date",
    type: "date",
    value: "2026-07-01",
    icon: Calendar,
    iconAlt: "Calendar",
    cardClassName: "h-[75px]",
  },
  {
    id: "description",
    title: "Description",
    type: "description-with-action",
    value:
      "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی",
    actionIcon: Pencil,
    actionAlt: "Edit description",
    cardClassName: "h-[111px]",
  },
];

const accessLevels = [
  { id: "private", label: "Private" },
  { id: "public", label: "Public" },
];

const formatDate = (date) => {
  if (!date) return "Select date";

  const [year, month, day] = date.split("-");

  const dateObject = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  );

  return dateObject.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const InfoCard = ({ card }) => {
  if (card.type === "text") {
    return (
      <section
        aria-labelledby={card.id}
        className={`text-left flex w-full relative flex-col items-start gap-3 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden shrink-0 ${card.cardClassName}`}
      >
        <h2
          id={card.id}
          className="relative self-stretch mt-[-1px] en-body-medium text-primery-800 dark:text-neutral-scale70"
        >
          {card.title}
        </h2>

        <p className="relative self-stretch h-[61px] fa-caption-1 text-neutral-scale1300 dark:text-neutral-scale100 [direction:rtl]">
          {card.value}
        </p>
      </section>
    );
  }

  if (card.type === "text-with-action") {
    return (
      <section
        aria-labelledby={card.id}
        className={`text-left flex w-full relative flex-col items-start gap-3 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden shrink-0 ${card.cardClassName}`}
      >
        <h2
          id={card.id}
          className="relative self-stretch mt-[-1px] en-body-medium text-primery-800 dark:text-neutral-scale70"
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
    const [selectedDate, setSelectedDate] = useState(card.value || "");

    return (
      <section
        aria-labelledby={card.id}
        className={`text-left flex w-full relative flex-col items-start gap-3 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden shrink-0 ${card.cardClassName}`}
      >
        <h2
          id={card.id}
          className="relative self-stretch mt-[-1px] en-body-medium text-primery-800 dark:text-neutral-scale70"
        >
          {card.title}
        </h2>

        <div className="absolute top-[39px] left-3 w-[22px] h-[21px]">
          <label className="relative block w-full h-full cursor-pointer">
            {(() => {
              const Icon = card.icon;

              return (
                <Icon className="absolute w-[83.33%] h-[91.67%] top-[8.33%] left-[16.67%] text-neutral-scale1000 dark:text-neutral-scale70 pointer-events-none" />
              );
            })()}

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label={card.title}
            />
          </label>
        </div>

        <p className="absolute top-[41px] left-11 w-[180px] en-caption-1 text-neutral-scale1800 dark:text-neutral-scale70 whitespace-nowrap">
          {formatDate(selectedDate)}
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
        className="relative self-stretch mt-[-1px] en-body-medium text-primery-800 dark:text-neutral-scale70"
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
        className="relative self-stretch mt-[-1px] en-body-medium text-primery-800 dark:text-neutral-scale70"
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

export const TeacherCourseDoc = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const [files, setFiles] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const course = courses.find((course) => course.id === id);

    if (course) {
      setCourseTitle(course.title);
    }
  }, [id]);

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contexts`);
      const data = await res.json();

      const apiFiles = data.map((item, index) => ({
        id: Date.now() + index,
        name: item,
        deleteIcon: Trash_Full,
      }));

      setFiles(apiFiles);
    } catch (error) {
      console.error("Loading documents failed:", error);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${BACKEND_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }
      }

      const nextFiles = selectedFiles.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        deleteIcon: Trash_Full,
      }));

      setFiles((prev) => [...prev, ...nextFiles]);
    } catch (error) {
      console.error("Upload error:", error);
    }

    event.target.value = "";
  };

  const handleDelete = async (file) => {
    try {
      await fetch(`${BACKEND_URL}/api/contexts/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contexts: [file.name],
        }),
      });

      setFiles((prev) => prev.filter((item) => item.id !== file.id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col">
      {/* Header */}
      <header className="w-full h-[65px] -mt-px flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center justify-between bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label="بازگشت"
            className="text-white absolute top-1/2 -translate-y-1/2 left-[15px] w-6 h-6 cursor-pointer"
          >
            <ArrowLeft className="!w-6 !h-6" />
          </button>

          <h1 className="absolute top-1/2 -translate-y-1/2 left-[50px] fa-title-1 text-white text-center whitespace-nowrap [direction:rtl]">
            {courseTitle}
          </h1>

          {/* Course Status Toggle */}
          <div className="absolute right-[15px] top-1/2 -translate-y-1/2 w-[30px] h-4">
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

      {/* All Course Content */}
      <section
        className="w-full flex-1 min-h-0 px-3.5 pt-2.5 pb-20 overflow-y-auto overflow-x-hidden"
        aria-label="Course content"
      >
        <div className="w-full flex flex-col gap-2.5">
          {/* Course Documents */}
          <section
            className="w-full shrink-0 mt-[5px]"
            aria-label="Course documents"
          >
            <div className="relative w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[25px]">
              {/* Upload */}
              <div className="inline-flex items-center gap-[5px] absolute top-4.5 left-[15px]">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="inline-flex items-center gap-[5px] cursor-pointer"
                  aria-label="Upload New File"
                >
                  <File_Add className="!relative !w-7 !h-7 text-primery-700 dark:text-neutral-scale70" />

                  <span className="relative w-fit en-body-medium text-primery-800 dark:text-neutral-scale70 whitespace-nowrap">
                    Upload New File
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label="Choose files to upload"
                />
              </div>

              {/* Files */}
              <div className="mt-[50px] w-full px-5 min-h-0">
                <div className="flex flex-col gap-[10px]">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="group w-full flex items-center gap-[10px] px-[10px] py-[5px] rounded-[10px] border border-neutral-scale100 dark:border-neutral-scale1100 bg-neutral-scale80 dark:bg-neutral-scale1400 transition-colors duration-200 hover:bg-neutral-scale50 dark:hover:bg-neutral-scale1200"
                    >
                      {/* Document */}
                      <a
                        href={`${BACKEND_URL}/tmp/${encodeURIComponent(file.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 text-left flex-1 en-body text-neutral-scale1800 dark:text-neutral-scale70 truncate cursor-pointer"
                        title={file.name}
                      >
                        {file.name}
                      </a>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleDelete(file)}
                        aria-label={`Delete ${file.name}`}
                        className="shrink-0 w-[30px] h-[30px] rounded-[8px] flex items-center justify-center bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 cursor-pointer transition-colors duration-200 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1100"
                      >
                        <Trash_Full className="w-[17px] h-[17px]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Course Details */}
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

