import { useContext, useState, useEffect, useCallback } from "react";
import "@/styles/Allpages.css";
import AI from "@/assets/images/AI.png";
import { coursesApi } from "@/api";
import { useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { formatChatDate } from "@/utils/dateFormatter";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { isPersianText } from "@/utils/textUtils";

export const HomeChatFeedSection = () => {
  const [chats, setChats] = useState([]);
  const navigate = useNavigate();
  const { isRTL, t } = useContext(AppContext);

  const fetchChats = useCallback(() => {
    coursesApi.getCourses().then((data) => {
      if (Array.isArray(data)) {
        setChats(data);
      }
    });
  }, []);

  useEffect(() => {
    fetchChats();
    window.addEventListener("focus", fetchChats);
    return () => {
      window.removeEventListener("focus", fetchChats);
    };
  }, [fetchChats]);

  return (
    <section
      className="w-full h-full overflow-x-hidden"
      aria-label={t("courseChatsList")}
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
                  src={resolveMediaUrl(item.photo_url) || AI}
                  onError={(e) => {
                    e.currentTarget.src = AI;
                  }}
                />

                {/* Content info */}
                <div className={`flex flex-col flex-1 min-w-0 justify-center ${isRTL ? "text-right" : "text-left"}`}>
                  <h2
                    className={`truncate text-black dark:text-neutral-scale70 ${
                      isRTL ? "fa-title-3 font-vazir text-right" : "en-title-3 font-vazir text-left"
                    }`}
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    {displayTitle}
                  </h2>
                  {/* Last message preview */}
                  {(() => {
                    const previewText =
                      item.preview || t("typeSomething");
                    const isPreviewPersian = isPersianText(previewText);
                    return (
                      <p
                        dir={isRTL ? "rtl" : "ltr"}
                        className={`truncate text-neutral-scale1000 dark:text-neutral-scale300 ${
                          isRTL
                            ? "fa-caption-2 font-vazir text-right"
                            : isPreviewPersian
                            ? "en-caption-2 font-vazir text-left"
                            : "en-caption-2 font-inter text-left"
                        }`}
                      >
                        {previewText}
                      </p>
                    );
                  })()}
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