import { useState } from "react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { ArrowLeft, MoreVertical } from "lucide-react";
import Block from "@/assets/icons/Block.svg?react";
import { useParams } from "react-router-dom";
import { students } from "@/data/students";
import { courses } from "@/data/courses";

const avatarColors = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-lime-400",
  "bg-green-400",
  "bg-emerald-400",
  "bg-teal-400",
  "bg-cyan-400",
  "bg-sky-400",
  "bg-blue-400",
  "bg-indigo-400",
  "bg-violet-400",
  "bg-purple-400",
  "bg-fuchsia-400",
  "bg-pink-400",
  "bg-rose-400",
  "bg-red-500",
  "bg-blue-500",
  "bg-purple-500",
];

const getAvatarColor = (id) => {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getInitials = (title) => {
  const words = title.trim().split(/\s+/);

  if (words.length >= 2) {
    return `${words[0][0]}\u200C${words[1][0]}`;
  }

  return words[0]?.[0] || "";
};

export const TeacherContacts = () => {
  const [openMenu, setOpenMenu] = useState(null);

  // وضعیت ظاهری Block / Unblock
  // مقدار اولیه از student.blocked خوانده می‌شود
  const [blockedStudents, setBlockedStudents] = useState({});

  const { lessonId } = useParams();

  const lessonStudents = students.filter(
    (student) => student.lessonId === lessonId,
  );

  const currentCourse = courses.find((course) => course.id === lessonId);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  // تغییر ظاهری وضعیت Block / Unblock
  const handleBlockToggle = (studentId) => {
    setBlockedStudents((prev) => ({
      ...prev,
      [studentId]:
        prev[studentId] !== undefined
          ? !prev[studentId]
          : !students.find((student) => student.id === studentId)?.blocked,
    }));

    setOpenMenu(null);
  };

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col">
      <header className="w-full h-[65px] flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
        <div className="w-full h-full relative">
          <button
            type="button"
            aria-label="بازگشت"
            onClick={handleBack}
            className="absolute top-1/2 -translate-y-1/2 left-[15px] w-6 h-6 text-white"
          >
            <ArrowLeft className="!w-6 !h-6" />
          </button>

          <h1 className="absolute top-1/2 -translate-y-1/2 left-16 fa-title-1 text-white text-center whitespace-nowrap [direction:rtl]">
            {currentCourse?.title}
          </h1>
        </div>
      </header>

      <section
        className="w-full min-h-0 px-3 pt-2.5 pb-4"
        aria-label="فهرست دانشجویان"
      >
        <div className="w-full h-full overflow-y-auto rounded-[20px] bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100">
          <ul className="w-full list-none m-0 p-2.5">
            {lessonStudents.length === 0 ? (
              <li className="w-full h-full min-h-[500px] flex items-center justify-center">
                <p
                  className="fa-body-medium text-neutral-scale700 dark:text-neutral-scale200 text-center"
                  dir="rtl"
                >
                  هنوز دانشجویی در این درس ثبت‌نام نکرده است.
                </p>
              </li>
            ) : (
              lessonStudents.map((student, index) => {
                // اگر دانشجو قبلاً در state تغییر کرده، همان را استفاده کن
                // در غیر این صورت مقدار اولیه student.blocked را استفاده کن
                const isBlocked =
                  blockedStudents[student.id] !== undefined
                    ? blockedStudents[student.id]
                    : student.blocked;

                return (
                  <li
                    key={student.id}
                    className="relative flex items-center h-[62px] w-full"
                  >
                    {/* Avatar */}
                    {student.photo_url ? (
                      <img
                        src={student.photo_url}
                        alt={student.title}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${getAvatarColor(
                          student.id,
                        )}`}
                        aria-hidden="true"
                      >
                        <span className="text-white fa-titles-3">
                          {getInitials(student.title)}
                        </span>
                      </div>
                    )}

                    {/* Student information */}
                    <div className="flex-1 min-w-0 ml-3 text-left">
                      <div
                        className="fa-title-3 text-black dark:text-neutral-scale70 truncate"
                        dir="ltr"
                      >
                        {student.title}

                        {isBlocked && (
                          <Block
                            className="inline-block ml-1 text-neutral-scale1000 dark:text-neutral-scale300"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div
                        className={`en-caption-1 truncate mt-0.5 ${
                          student.status === "online"
                            ? "text-primery-800 dark:text-neutral-scale200"
                            : "text-neutral-scale800 dark:text-neutral-scale200"
                        }`}
                        dir="ltr"
                      >
                        {student.status || ""}
                      </div>
                    </div>

                    {/* Three dots */}
                    <button
                      type="button"
                      aria-label={`گزینه‌های ${student.title}`}
                      aria-expanded={openMenu === index}
                      onClick={() =>
                        setOpenMenu(openMenu === index ? null : index)
                      }
                      className="w-6 h-6 shrink-0 flex items-center justify-center ml-2"
                    >
                      <MoreVertical
                        className="w-5 h-5 dark:text-neutral-scale70"
                        aria-hidden="true"
                      />
                    </button>

                    {/* Menu */}
                    {openMenu === index && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenu(null)}
                          aria-hidden="true"
                        />

                        <div
                          role="menu"
                          className="absolute right-0 top-5 z-50 w-24 rounded-md bg-white shadow-effects-drop-shadow-bottom"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleBlockToggle(student.id)}
                            className="w-full px-1 py-1 flex items-center justify-center gap-1  en-body text-neutral-scale1000"
                          >
                            {/* آیکن فقط وقتی دانشجو Block نیست نمایش داده می‌شود */}
                            {!isBlocked && <Block aria-hidden="true" />}

                            {/* متن */}
                            <span>{isBlocked ? "Unblock" : "Block"}</span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Divider */}
                    {index < lessonStudents.length - 1 && (
                      <div className="absolute bottom-0 left-[60px] right-0 h-px bg-neutral-scale90 dark:bg-neutral-scale1200" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>
    </main>
  );
};
