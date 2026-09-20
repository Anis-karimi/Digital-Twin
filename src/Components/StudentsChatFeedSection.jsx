import { useContext } from "react";
import "@/styles/Allpages.css";
import { students } from "@/data/students";
import { useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { formatChatDate } from "@/utils/dateFormatter";

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
  const words = title.trim().split(/\s+/);

  if (words.length >= 2) {
    return `${words[0][0]}\u200C${words[1][0]}`;
  }

  return words[0]?.[0] || "";
};

export const StudentsChatFeedSection = ({ lessonId }) => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const chats = students.filter(
    (student) => String(student.lessonId) === String(lessonId),
  );

  const handleStudentClick = (studentId) => {
    navigate(`/ChatArea/student/${studentId}`, {
      state: {
        backTo: `/TeacherLessonsPage/${lessonId}`,
      },
    });
  };

  return (
    <section
      className="w-full h-full overflow-x-hidden"
      aria-label={isRTL ? "فهرست دانشجویان درس" : "Course students list"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={`flex flex-col w-full items-start gap-2.5 p-2.5 pb-[80px] ${
          chats.length === 0 ? "h-full" : ""
        }`}
      >
        {chats.length === 0 ? (
          <div className="w-full flex-1 flex items-center justify-center p-4">
            <p className="fa-body-medium text-neutral-scale700 dark:text-neutral-scale300 text-center">
              {isRTL
                ? "هنوز دانشجویی در این درس ثبت‌نام نکرده است."
                : "No students have enrolled in this course yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            {chats.map((item, index) => {
              return (
                <article
                  key={item.id}
                  onClick={() => handleStudentClick(item.id)}
                  className={`relative w-full min-h-[55px] flex items-center gap-3 py-1 cursor-pointer ${
                    isRTL ? "flex-row text-right" : "flex-row text-left"
                  }`}
                >
                  {/* Avatar / Logo - on RIGHT in RTL, on LEFT in LTR */}
                  {item.photo_url ? (
                    <img
                      className="w-[50px] h-[50px] rounded-full object-cover shrink-0"
                      alt={item.title}
                      src={item.photo_url}
                    />
                  ) : (
                    <div
                      className={`w-[50px] h-[50px] rounded-full flex items-center justify-center shrink-0 ${getAvatarColor(
                        item.id,
                      )} text-white font-semibold ${
                        isRTL ? "fa-caption-1" : "en-caption-1"
                      }`}
                    >
                      {getInitials(item.title)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <h2
                      className={`truncate text-black dark:text-neutral-scale70 ${
                        isRTL ? "fa-body text-right" : "en-body text-left"
                      }`}
                    >
                      {item.title}
                    </h2>

                    <p
                      className={`truncate text-neutral-scale1000 dark:text-neutral-scale300 ${
                        isRTL
                          ? "fa-caption-2 text-right"
                          : "en-caption-2 text-left"
                      }`}
                    >
                      {item.preview ||
                        (isRTL ? "پیامی بنویسید..." : "Type something...")}
                    </p>
                  </div>

                  {/* Date & Unread count - on LEFT in RTL, on RIGHT in LTR */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-0.5 min-w-[65px]">
                    <time
                      className={`text-neutral-scale700 dark:text-neutral-scale300 whitespace-nowrap ${
                        isRTL
                          ? "fa-caption-2 text-left"
                          : "en-caption-2 text-right"
                      }`}
                    >
                      {formatChatDate(item.date, isRTL)}
                    </time>

                    {item.unreadCount > 0 && (
                      <div className="min-w-[18px] h-[18px] px-[4px] rounded-full bg-primery-1000 dark:bg-neutral-scale400 flex items-center justify-center">
                        <span
                          className={`text-white dark:text-black leading-none relative top-[0.5px] ${
                            isRTL ? "fa-caption-2" : "en-caption-2"
                          }`}
                        >
                          {item.unreadCount > 99 ? "+99" : item.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Separator Line */}
                  {index !== chats.length - 1 && (
                    <div
                      className={`absolute bottom-0 ${
                        isRTL ? "right-[62px] left-0" : "left-[62px] right-0"
                      } border-b border-neutral-scale90 dark:border-neutral-scale1300`}
                    />
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
