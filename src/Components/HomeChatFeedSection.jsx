import { useContext, useState, useEffect } from "react";
import "@/styles/Allpages.css";
import AI from "@/assets/images/AI.png";
import { coursesApi } from "@/api";
import { useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { formatChatDate } from "@/utils/dateFormatter";

export const HomeChatFeedSection = () => {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  useEffect(() => {
    let isMounted = true;
    coursesApi.getCourses().then((data) => {
      if (isMounted && Array.isArray(data)) {
        setChats(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      className="w-full h-full overflow-x-hidden"
      aria-label={isRTL ? "فهرست گفتگوهای درسی" : "Course chats list"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-col w-full items-start gap-2.5 p-2.5 pb-[80px]">
        <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
          {chats.map((item, index) => {
            // Course names always come from backend in Persian and do not translate on UI language change
            const displayTitle = item.titleFa || item.title || "سیستم عامل";

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
                  className="w-[50px] h-[50px] rounded-full object-cover shrink-0"
                  alt={displayTitle}
                  src={AI}
                />

                {/* Content info */}
                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <h2
                    className={`truncate text-black dark:text-neutral-scale70 fa-title-3 font-vazir ${
                      isRTL ? "text-right" : "text-left"
                    }`}
                    dir="rtl"
                  >
                    {displayTitle}
                  </h2>

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