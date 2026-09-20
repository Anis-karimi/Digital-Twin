import { useEffect, useRef, useContext } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { useAnimatedText } from "@/Hooks/useAnimatedText";
import "@/styles/Allpages.css";
import { AppContext } from "@/Context/AppContext";
import { formatChatDate } from "@/utils/dateFormatter";

// Utility to detect if text requires RTL layout
const isTextRTL = (text) => {
  return /[\u0600-\u06FF]/.test(text);
};

export const ChatMessages = ({ messages, classNames, isLoading, onFeedback }) => {
  const bottomRef = useRef(null);
  const { isRTL } = useContext(AppContext);
  const thinkingDots = useAnimatedText(isLoading, "dots");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  let lastDate = null;

  return (
    <div className={classNames.messagesContainer} dir="ltr">
      {messages.map((message) => {
        const showDate = message.date !== lastDate;
        lastDate = message.date;
        const isMine = message.sender === "me";

        return (
          <div key={message.id}>
            {showDate && (
              <div className={classNames.dateContainer}>
                <div
                  className={`${classNames.dateBadge} ${
                    isRTL ? "font-vazir" : "font-inter"
                  }`}
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  {formatChatDate(message.date, isRTL)}
                </div>
              </div>
            )}

            <div
              className={`flex w-full ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex flex-col max-w-[75%] ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <MessageBubble
                  text={message.text}
                  time={message.time}
                  isMine={isMine}
                  classNames={classNames}
                />

                {/* AI Feedback */}
                {!isMine && (
                  <div className="flex items-center gap-1 mt-1 ml-2">
                    {/* Like */}
                    <button
                      type="button"
                      onClick={() => onFeedback(message.id, "like")}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
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
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
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

      {/* AI streaming thinking indicator */}
      {isLoading && (
        <div className="flex justify-start w-full px-2 py-1">
          <div
            className={`bg-neutral-scale80 dark:bg-neutral-scale1300 text-neutral-scale1400 dark:text-neutral-scale100 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[18px] rounded-bl-[6px] px-3 py-1.5 max-w-[75%] opacity-80 ${
              isRTL ? "fa-body" : "en-body"
            }`}
          >
            {isRTL ? `در حال پاسخ‌گویی${thinkingDots}` : `Thinking${thinkingDots}`}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};