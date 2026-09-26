import { useEffect, useRef, useContext, useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquareQuote, X, Check, Loader2 } from "lucide-react";
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
}) => {
  const bottomRef = useRef(null);
  const { isRTL, t } = useContext(AppContext);
  const thinkingDots = useAnimatedText(isLoading, "dots");

  const [activeCommentMessageId, setActiveCommentMessageId] = useState(null);
  const [commentInputText, setCommentInputText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

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
                className={`flex flex-col max-w-[75%] ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <MessageBubble
                  text={message.text}
                  time={message.time}
                  isMine={isMine}
                  classNames={classNames}
                  comments={message.comments || []}
                  onDeleteComment={(commentId) => onDeleteComment?.(message.id, commentId)}
                  canDeleteComment={canComment}
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
                                ? (t("studentLiked") || "پسندیده")
                                : (t("studentDisliked") || "نپسندیده")
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

                      {/* Add Comment Button for Teacher */}
                      {canComment && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCommentMessageId(
                              activeCommentMessageId === message.id ? null : message.id
                            );
                            setCommentInputText("");
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs select-none ${
                            activeCommentMessageId === message.id
                              ? "bg-[#2481cc] text-white dark:bg-[#52a2f6] shadow-[#2481cc]/20"
                              : "bg-[#edf5fd] hover:bg-[#e4effc] text-[#2481cc] dark:bg-[#182533] dark:hover:bg-[#203244] dark:text-[#52a2f6] border border-[#2481cc]/30 dark:border-[#52a2f6]/30"
                          }`}
                        >
                          <QuoteSvg className="w-3.5 h-3.5 shrink-0" />
                          <span>{t("addComment") || "کامنت گذاشتن"}</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Telegram-Style Comment Box */}
                    {activeCommentMessageId === message.id && (
                      <div
                        className={`relative w-full max-w-[340px] p-3 ${
                          isRTL ? "pr-4 pl-3" : "pl-4 pr-3"
                        } bg-[#edf5fd] dark:bg-[#182533] rounded-xl shadow-md shadow-[#2481cc]/10 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-200 select-text overflow-hidden`}
                        dir={isRTL ? "rtl" : "ltr"}
                      >
                        {/* Telegram Vertical Accent Line - Flush to edge & covering 100% height */}
                        <div
                          className={`absolute ${
                            isRTL ? "right-0" : "left-0"
                          } top-0 bottom-0 w-[4px] bg-[#2481cc] dark:bg-[#52a2f6]`}
                        />

                        <div className="flex items-center justify-between text-xs border-b border-[#2481cc]/20 dark:border-[#52a2f6]/20 pb-1.5">
                          <span className="font-bold text-xs text-[#2481cc] dark:text-[#52a2f6] font-vazir truncate">
                            {teacherName
                              ? (teacherName.startsWith("استاد") || teacherName.startsWith("دکتر")
                                  ? teacherName
                                  : `استاد ${teacherName}`)
                              : (t("writeComment") || "افزودن نظر استاد روی پیام بات")}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Authentic Bold Telegram Quotation Mark Symbol */}
                            <QuoteSvg className="w-3.5 h-3.5 text-[#2481cc] dark:text-[#52a2f6] shrink-0" />

                            <button
                              type="button"
                              onClick={() => setActiveCommentMessageId(null)}
                              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <textarea
                          autoFocus
                          rows={2}
                          value={commentInputText}
                          onChange={(e) => setCommentInputText(e.target.value)}
                          placeholder={
                            t("commentPlaceholder") ||
                            "توضیحات یا نکات اصلاحی خود را درباره پاسخ بات بنویسید..."
                          }
                          className="w-full resize-none text-xs sm:text-sm p-2 rounded-xl bg-white dark:bg-[#121c27] border border-[#2481cc]/30 dark:border-[#52a2f6]/30 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#2481cc] font-vazir leading-relaxed"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && commentInputText.trim()) {
                              e.preventDefault();
                              handleSaveComment(message.id);
                            }
                          }}
                        />

                        <div className="flex items-center justify-end gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setActiveCommentMessageId(null)}
                            className="px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-scale1200 rounded-lg transition-colors cursor-pointer"
                          >
                            {t("cancelComment") || "انصراف"}
                          </button>

                          <button
                            type="button"
                            disabled={!commentInputText.trim() || isSubmittingComment}
                            onClick={() => handleSaveComment(message.id)}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#2481cc] hover:bg-[#1b70b5] dark:bg-[#52a2f6] dark:hover:bg-[#3d91ea] rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmittingComment ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>{t("saveComment") || "ثبت نظر"}</span>
                          </button>
                        </div>
                      </div>
                    )}
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