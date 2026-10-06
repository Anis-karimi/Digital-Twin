import { useEffect, useRef, useContext, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import QuoteSvg from "@/assets/icons/quote-svgrepo-com.svg?react";
import { MessageBubble } from "./MessageBubble";
import { useAnimatedText } from "@/Hooks/useAnimatedText";
import "@/styles/Allpages.css";
import { AppContext } from "@/Context/AppContext";
import { formatChatDate } from "@/utils/dateFormatter";

// Utility to detect if text requires RTL layout
const isTextRTL = (text) => {
  return /[\u0600-\u06FF]/.test(text);
};

export const ChatMessages = ({
  messages,
  classNames,
  isLoading,
  onFeedback,
  canComment = false,
  onAddComment,
  onDeleteComment,
  teacherName = "",
  readOnlyFeedback = false,
  isStudentViewer = false,
  currentUserId = null,
  highlightCommentId = null,
  onMarkCommentRead = null,
}) => {
  const bottomRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const { isRTL, t } = useContext(AppContext);
  const thinkingDots = useAnimatedText(isLoading, "dots");

  const [activeCommentMessageId, setActiveCommentMessageId] = useState(null);
  const [commentInputText, setCommentInputText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Auto-scroll on new incoming message or first load
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      bottomRef.current?.scrollIntoView({
        behavior: prevMessagesLengthRef.current === 0 ? "auto" : "smooth",
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  // Jump to specific comment when requested
  useEffect(() => {
    if (highlightCommentId) {
      const el = document.getElementById(`comment-${highlightCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightCommentId]);

  // Auto-mark comments as read when viewed on screen for at least 800ms
  useEffect(() => {
    if (!isStudentViewer || !onMarkCommentRead) return;

    const timerMap = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          const commentId = target.getAttribute("data-comment-id");
          const messageId = target.getAttribute("data-message-id");
          const isUnread = target.getAttribute("data-is-unread") === "true";

          if (!commentId || !messageId || !isUnread) return;

          if (entry.isIntersecting) {
            if (!timerMap.has(commentId)) {
              const timer = setTimeout(() => {
                onMarkCommentRead(messageId, commentId);
                timerMap.delete(commentId);
              }, 500);
              timerMap.set(commentId, timer);
            }
          } else {
            if (timerMap.has(commentId)) {
              clearTimeout(timerMap.get(commentId));
              timerMap.delete(commentId);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    const unreadEls = document.querySelectorAll('[data-is-unread="true"]');
    unreadEls.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      timerMap.forEach((t) => clearTimeout(t));
      timerMap.clear();
    };
  }, [messages, isStudentViewer, onMarkCommentRead]);

  const handleSaveComment = async (messageId) => {
    if (!commentInputText.trim() || isSubmittingComment) return;
    try {
      setIsSubmittingComment(true);
      await onAddComment?.(messageId, commentInputText.trim());
      setCommentInputText("");
      setActiveCommentMessageId(null);
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

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
                className={`flex flex-col w-fit max-w-[80%] ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <MessageBubble
                  messageId={message.id}
                  text={message.text}
                  time={message.time}
                  createdAt={message.created_at || message.createdAt}
                  isMine={isMine}
                  isError={message.isError || message.is_error}
                  classNames={classNames}
                  comments={message.comments || []}
                  onDeleteComment={(commentId) =>
                    onDeleteComment?.(message.id, commentId)
                  }
                  canDeleteComment={canComment}
                  isStudentViewer={isStudentViewer}
                  currentUserId={currentUserId}
                  highlightCommentId={highlightCommentId}
                  commentAction={
                    canComment ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCommentMessageId(
                            activeCommentMessageId === message.id
                              ? null
                              : message.id,
                          );
                          setCommentInputText("");
                        }}
                        className={`w-5 h-5 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer shadow-2xs select-none ${
                          activeCommentMessageId === message.id
                            ? "bg-[#2481cc] text-white dark:bg-[#52a2f6]"
                            : "bg-[#edf5fd] hover:bg-[#e4effc] text-[#2481cc] dark:bg-[#182533] dark:hover:bg-[#203244] dark:text-[#52a2f6] border border-[#2481cc]/30 dark:border-[#52a2f6]/30"
                        }`}
                        title={
                          isMine
                            ? (t("addStudentComment") || "کامنت گذاشتن روی پیام دانشجو")
                            : (t("addComment") || "کامنت گذاشتن")
                        }
                        aria-label={
                          isMine
                            ? (t("addStudentComment") || "کامنت گذاشتن روی پیام دانشجو")
                            : (t("addComment") || "کامنت گذاشتن")
                        }
                      >
                        <QuoteSvg className="w-3 h-3 shrink-0" />
                      </button>
                    ) : null
                  }
                  commentInputOpen={activeCommentMessageId === message.id}
                  commentInputText={commentInputText}
                  setCommentInputText={setCommentInputText}
                  onSaveComment={() => handleSaveComment(message.id)}
                  onCloseComment={() => setActiveCommentMessageId(null)}
                  isSubmittingComment={isSubmittingComment}
                  teacherName={teacherName}
                />

                {/* AI Feedback & Teacher Comment Actions on Bot Messages */}
                {!isMine && (
                  <div className="flex flex-col gap-1.5 mt-1 px-1">
                    <div className="flex items-center gap-2">
                      {/* ThumbsUp / ThumbsDown Feedback or Student Reaction Display */}
                      {readOnlyFeedback ? (
                        /* Read-only reaction circular badge for teacher: only show if student has reacted! */
                        message.feedback ? (
                          <div
                            className={`w-7 h-7 flex items-center justify-center rounded-full select-none cursor-default ${
                              message.feedback === "like"
                                ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                                : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                            }`}
                            title={
                              message.feedback === "like"
                                ? t("studentLiked") || "پسندیده"
                                : t("studentDisliked") || "نپسندیده"
                            }
                          >
                            {message.feedback === "like" ? (
                              <ThumbsUp className="w-4 h-4" />
                            ) : (
                              <ThumbsDown className="w-4 h-4" />
                            )}
                          </div>
                        ) : null
                      ) : (
                        /* Interactive Like / Dislike buttons for student */
                        <div className="flex items-center gap-0.5">
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
            className={`bg-neutral-scale80 dark:bg-neutral-scale1300 text-neutral-scale1400 dark:text-neutral-scale100 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[18px] rounded-bl-[6px] px-3 py-1.5 w-fit max-w-[80%] opacity-80 ${
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