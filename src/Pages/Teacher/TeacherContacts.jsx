import { useState, useEffect, useContext } from "react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { ArrowLeft, ArrowRight, MoreVertical } from "lucide-react";
import Block from "@/assets/icons/Block.svg?react";
import { useParams, useNavigate } from "react-router-dom";
import { studentsApi, coursesApi } from "@/api";
import { AppContext } from "@/Context/AppContext";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { isPersianText } from "@/utils/textUtils";

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

  for (let i = 0; i < String(id).length; i++) {
    hash = String(id).charCodeAt(i) + ((hash << 5) - hash);
  }

  return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getInitials = (title) => {
  const words = (title || "").trim().split(/\s+/);

  if (words.length >= 2) {
    return `${words[0][0]}\u200C${words[1][0]}`;
  }

  return words[0]?.[0] || "";
};

export const TeacherContacts = () => {
  const [openMenu, setOpenMenu] = useState(null);
  const [blockedStudents, setBlockedStudents] = useState({});
  const [lessonStudents, setLessonStudents] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);

  const { lessonId } = useParams();
  const courseId = lessonId || "os";
  const navigate = useNavigate();
  const { isRTL, t } = useContext(AppContext);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    let isMounted = true;
    studentsApi.getStudentsByCourse(courseId).then((data) => {
      if (isMounted && Array.isArray(data)) {
        setLessonStudents(data);
      }
    });

    coursesApi.getCourseById(courseId).then((course) => {
      if (isMounted) {
        setCurrentCourse(course);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Toggle student blocked state
  const handleBlockToggle = async (studentId) => {
    const isCurrentlyBlocked =
      blockedStudents[studentId] !== undefined
        ? blockedStudents[studentId]
        : Boolean(lessonStudents.find((s) => s.id === studentId)?.blocked);

    const nextBlocked = !isCurrentlyBlocked;

    setBlockedStudents((prev) => ({
      ...prev,
      [studentId]: nextBlocked,
    }));
    setOpenMenu(null);

    try {
      await studentsApi.toggleBlockStudent(courseId, studentId, nextBlocked);
    } catch (error) {
      console.error("Failed to toggle block status:", error);
    }
  };

  return (
    <main
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000 items-center px-4">
          <button
            type="button"
            aria-label={t("back")}
            onClick={handleBack}
            className="text-white w-8 h-8 cursor-pointer flex items-center justify-center shrink-0"
          >
            <BackIcon className="!w-6 !h-6" />
          </button>

          <h1
            className={`flex-1 mx-2 text-neutral-scale70 whitespace-nowrap truncate font-vazir ${
              isRTL ? "fa-title-1 text-right" : "en-title-1 text-left"
            }`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            {currentCourse?.title}
          </h1>
        </div>
      </header>

      <section
        className="w-full flex-1 min-h-0 px-3 pt-2.5 pb-20"
        aria-label={t("courseStudentsList")}
      >
        <div className="w-full h-full overflow-y-auto rounded-[20px] bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100">
          <ul className="w-full list-none m-0 p-2.5">
            {lessonStudents.length === 0 ? (
              <li className="w-full h-full min-h-[500px] flex items-center justify-center">
                <p
                  className={`text-neutral-scale700 dark:text-neutral-scale200 text-center ${
                    isRTL ? "fa-body-medium font-vazir" : "en-body-medium font-inter"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {t("noStudentsEnrolled")}
                </p>
              </li>
            ) : (
              lessonStudents.map((student, index) => {
                const isBlocked =
                  blockedStudents[student.id] !== undefined
                    ? blockedStudents[student.id]
                    : student.blocked;

                const displayStatus =
                  student.status === "online"
                    ? t("online")
                    : isRTL
                    ? student.statusFa || student.status
                    : student.statusEn || student.status;

                return (
                  <li
                    key={student.id}
                    onClick={() =>
                      navigate(`/ChatArea/student/${student.id}`, {
                        state: {
                          studentId: student.id,
                          lessonId: courseId,
                          backTo: `/TeacherContacts/${courseId}`,
                        },
                      })
                    }
                    className="relative flex items-center h-[62px] w-full cursor-pointer hover:bg-neutral-scale50 dark:hover:bg-neutral-scale1200 px-2 rounded-xl transition-colors"
                  >
                    {/* Avatar with online badge */}
                    <div className="relative shrink-0">
                      {student.photo_url ? (
                        <img
                          src={resolveMediaUrl(student.photo_url)}
                          alt={student.title}
                          className="w-11 h-11 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center ${getAvatarColor(
                            student.id,
                          )}`}
                          aria-hidden="true"
                        >
                          <span className="text-white fa-titles-3 font-vazir">
                            {getInitials(student.title)}
                          </span>
                        </div>
                      )}
                      {(student.is_online || student.status === "online") && (
                        <span
                          className={`absolute bottom-0 ${
                            isRTL ? "left-0" : "right-0"
                          } w-3 h-3 bg-emerald-500 border-2 border-white dark:border-neutral-scale1300 rounded-full shadow-sm`}
                          title={isRTL ? "آنلاین" : "Online"}
                        />
                      )}
                    </div>

                    {/* Student information - student names from backend are always Persian and use Vazirmatn */}
                    <div
                      className={`flex-1 min-w-0 ${
                        isRTL ? "mr-3 text-right" : "ml-3 text-left"
                      }`}
                    >
                      <div
                        className={`truncate text-black dark:text-neutral-scale70 ${
                          isRTL
                            ? "fa-body font-vazir text-right"
                            : "en-body font-vazir text-left"
                        }`}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        {student.title}

                        {isBlocked && (
                          <Block
                            className={`inline-block ${
                              isRTL ? "mr-1.5" : "ml-1.5"
                            } w-[15px] h-[15px] text-neutral-scale1000 dark:text-neutral-scale300`}
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div
                        className={`truncate mt-0.5 ${
                          isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
                        } ${
                          student.is_online || student.status === "online"
                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                            : "text-neutral-scale800 dark:text-neutral-scale300"
                        }`}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        {displayStatus ||
                          (student.is_online || student.status === "online"
                            ? isRTL
                              ? "آنلاین"
                              : "Online"
                            : isRTL
                            ? "اخیراً آنلاین بوده"
                            : "Last seen recently")}
                      </div>
                    </div>

                    {/* Three dots menu button */}
                    <button
                      type="button"
                      aria-label={
                        isRTL
                          ? `گزینه‌های ${student.title}`
                          : `Options for ${student.title}`
                      }
                      aria-expanded={openMenu === index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === index ? null : index);
                      }}
                      className={`w-6 h-6 shrink-0 flex items-center justify-center ${
                        isRTL ? "mr-auto ml-1" : "ml-auto mr-1"
                      } cursor-pointer`}
                    >
                      <MoreVertical
                        className="w-4 h-4 dark:text-neutral-scale70"
                        aria-hidden="true"
                      />
                    </button>

                    {/* Menu */}
                    {openMenu === index && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(null);
                          }}
                          aria-hidden="true"
                        />

                        <div
                          role="menu"
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute ${
                            isRTL ? "left-2" : "right-2"
                          } top-8 z-50 min-w-[90px] rounded-md bg-white dark:bg-neutral-scale1200 shadow-effects-drop-shadow-bottom border border-neutral-scale100 dark:border-neutral-scale1000 py-1`}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleBlockToggle(student.id)}
                            className={`w-full px-2.5 py-1.5 flex items-center justify-center gap-1.5 ${
                              isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter"
                            } text-neutral-scale1000 dark:text-neutral-scale200 hover:bg-neutral-scale80 dark:hover:bg-neutral-scale1100 cursor-pointer`}
                          >
                            {!isBlocked && (
                              <Block
                                aria-hidden="true"
                                className="w-[15px] h-[15px]"
                              />
                            )}

                            <span>
                              {isBlocked ? t("unblock") : t("block")}
                            </span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Divider */}
                    {index < lessonStudents.length - 1 && (
                      <div
                        className={`absolute bottom-0 ${
                          isRTL ? "right-[60px] left-0" : "left-[60px] right-0"
                        } h-px bg-neutral-scale90 dark:bg-neutral-scale1200`}
                      />
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

