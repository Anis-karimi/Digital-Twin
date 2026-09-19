import { useEffect, useRef } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { useAnimatedText } from "@/Hooks/useAnimatedText";
import "@/styles/Allpages.css";

// تابع تشخیص راست‌چین/فارسی
const isRTL = (text) => {
  return /[\u0600-\u06FF]/.test(text);
};

export const ChatMessages = ({ messages, classNames, isLoading, onFeedback }) => {
  const bottomRef = useRef(null);
  const thinkingDots = useAnimatedText(isLoading, "dots");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  let lastDate = null;

  return (
    <div className={classNames.messagesContainer}>
      {messages.map((message) => {
        const showDate = message.date !== lastDate;

        lastDate = message.date;

        const rtl = isRTL(message.text);

        return (
          <div key={message.id}>
            {showDate && (
              <div className={classNames.dateContainer}>
                <div className={classNames.dateBadge}>{message.date}</div>
              </div>
            )}

            <div
              className={
                message.sender === "me"
                  ? classNames.myMessageRow
                  : classNames.otherMessageRow
              }
            >
              <div className="flex flex-col w-full items-start">
                <MessageBubble
                  text={message.text}
                  time={message.time}
                  isMine={message.sender === "me"}
                  classNames={classNames}
                  textClass={rtl ? "text-right" : "text-left"}
                  dir={rtl ? "rtl" : "ltr"}
                />

                {/* AI Feedback */}
                {message.sender === "other" && (
                  <div className="flex items-center gap-1 mt-1 ml-2">
                    {/* Like */}
                    <button
                      type="button"
                      onClick={() => onFeedback(message.id, "like")}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
                        message.feedback === "like"
                          ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                          : "text-neutral-scale600 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1300"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>

                    {/* Dislike */}
                    <button
                      type="button"
                      onClick={() => onFeedback(message.id, "dislike")}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 ${
                        message.feedback === "dislike"
                          ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                          : "text-neutral-scale600 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1300"
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 👇 این بخش فقط برای وقتی AI در حال تایپ است */}
      {isLoading && (
        <div className="flex justify-start w-full px-2 py-1">
          <div className="bg-neutral-scale80 text-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[18px] rounded-bl-[6px] px-3 py-1.5 max-w-[75%] opacity-70 en-body">
            Thinking{thinkingDots}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};