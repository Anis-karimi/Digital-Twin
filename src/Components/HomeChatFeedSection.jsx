import { useContext } from "react";
import "@/styles/Allpages.css";
import AI from "@/assets/images/AI.png";
import { courses } from "@/data/courses";
import { useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { formatChatDate } from "@/utils/dateFormatter";

export const HomeChatFeedSection = () => {
  const chats = courses;
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  return (
    <section
      className="w-full h-full overflow-x-hidden"
      aria-label={isRTL ? "فهرست گفتگوهای درسی" : "Course chats list"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-col w-full items-start gap-2.5 p-2.5 pb-[80px]">
        <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
          {chats.map((item, index) => {
            const displayTitle = isRTL
              ? item.titleFa || item.title
              : item.titleEn || item.title;

            return (
              <article
                key={item.id}
                onClick={() => navigate(`/ChatArea/course/${item.id}`)}
                className={`relative w-full min-h-[55px] flex items-center gap-3 py-1 cursor-pointer ${
                  isRTL ? "flex-row text-right" : "flex-row text-left"
                }`}
              >
                {/* Avatar / Logo - on RIGHT in RTL, on LEFT in LTR */}
                <img
                  className="absolute top-0 left-0 w-[47px] h-[47px] rounded-full object-cover"
                  alt={item.title}
                  src={AI}
                />

                <h2
                  dir={isPersianTitle ? "rtl" : "ltr"}
                  className={`
                  absolute
                  top-px
                  left-[60px]
                  max-w-[200px]

                  overflow-hidden
                  whitespace-nowrap
                  text-ellipsis

                  ${isPersianTitle ? "fa-body text-right" : "en-body text-left"}

                   text-black dark:text-neutral-scale70
                  
                `}
                >
                  {item.title}
                </h2>

                <p
                  dir={isPersian ? "rtl" : "ltr"}
                  className={` 
                  absolute
                  top-[28px]
                  left-[60px]
                  max-w-[225px]

                  overflow-hidden
                  text-ellipsis
                  whitespace-nowra                  
                  ${isPersian ? "fa-caption-2  text-right" : "en-caption-2  text-left"}

                  text-neutral-scale1000 dark:text-neutral-scale300
                  
              `}
                >
                  {item.preview || "Type something..."}
                </p>

                <time
                  dir={isPersianDate ? "rtl" : "ltr"}
                  className={` 
                  absolute
                  top-1
                  right-[5px]

                  w-fit
                  max-w-[80px]

                  ${isPersianDate ? "fa-caption-2 text-right" : "en-caption-2  text-left"}

                  whitespace-nowrap

                  text-neutral-scale700
                  dark:text-neutral-scale300
                  
                `}
                >
                  {item.date}
                </time>

                {item.unreadCount > 0 && (
                  <div
                    className="
                    absolute
                    top-[25px]
                    right-[5px]

                    w-fit
                    min-w-[18px]
                    h-[18px]
                    px-[4px]

                    rounded-full
                    bg-primery-1000
                    dark:bg-neutral-scale400

                  <p
                    className={`truncate text-neutral-scale1000 dark:text-neutral-scale300 ${
                      isRTL ? "fa-caption-2 text-right" : "en-caption-2 text-left"
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
                      isRTL ? "fa-caption-2 text-left" : "en-caption-2 text-right"
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

                {/* Bottom Separator line */}
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
      </div>
    </section>
  );
};