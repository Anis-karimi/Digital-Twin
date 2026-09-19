import "@/styles/Allpages.css";
import AI from "@/assets/images/AI.png";
import { courses } from "@/data/courses";
import { useNavigate } from "react-router-dom";
import "@/styles/fonts.css"

export const HomeChatFeedSection = () => {
  const chats = courses;
  const navigate = useNavigate();

  return (
    <section
      className="w-full h-full overflow-x-hidden"
      aria-label="فهرست گفتگوهای درسی"
    >
      <div className="flex flex-col w-full items-start gap-2.5 p-2.5 pb-[80px]">
        <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
          {chats.map((item, index) => {
            const isPersian = /[\u0600-\u06FF]/.test(item.preview || "");
            const isPersianDate = /[\u0600-\u06FF]/.test(item.date || "");
            const isPersianTitle = /[\u0600-\u06FF]/.test(item.title || "");

            return (
              <article
                key={item.id}
                onClick={() => navigate(`/ChatArea/course/${item.id}`)}
                className="relative w-full h-[55px] cursor-pointer"
              >
                {index !== chats.length - 1 && (
                  <div className="absolute top-[54px] left-[50px] right-0 border-t border-neutral-scale90 dark:border-neutral-scale1300" />
                )}

                <img
                  className="absolute top-0 left-0 w-[50px] h-[50px] rounded-full object-cover"
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

                  ${isPersianTitle ? "fa-title-3 text-right" : "en-title-3 text-left"}

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

                    flex
                    items-center
                    justify-center
                  "
                  >
                    <span className="text-white leading-none relative top-[1px] fa-caption-2  ">
                      {item.unreadCount > 99 ? "99+" : item.unreadCount}
                    </span>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};