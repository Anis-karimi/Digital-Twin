import { useContext, useState } from "react";
import "@/styles/Allpages.css";
import { Trash2 } from "lucide-react";
import QuoteSvg from "@/assets/icons/quote-svgrepo-com.svg?react";
import { AppContext } from "@/Context/AppContext";

export const MessageBubble = ({
  text,
  time,
  isMine,
  classNames,
  comments = [],
  onDeleteComment,
  canDeleteComment = false,
}) => {
  const { t } = useContext(AppContext);
  const [deletingCommentIds, setDeletingCommentIds] = useState(() => new Set());
  const isPersian = /[\u0600-\u06FF]/.test(text);

  const dir = isPersian ? "rtl" : "ltr";

  const textClass = isPersian ? "text-right font-vazir" : "text-left font-inter";

  const handleDeleteComment = (commentId) => {
    if (deletingCommentIds.has(commentId)) return;
    setDeletingCommentIds((prev) => new Set(prev).add(commentId));
    setTimeout(() => {
      onDeleteComment?.(commentId);
    }, 300);
  };

  // Parse basic Markdown bold syntax and line breaks
  const formatText = (text) => {
    // Strip bullet asterisks from lists
    text = text.replace(/(^|\n)\s*\\?\*\s+/g, "$1");

    const paragraphs = text.split(/\n+/);

    return paragraphs.map((paragraph, index) => {
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={index} className={index > 0 ? "mt-2" : ""}>
          {parts.map((part, partIndex) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
            }

            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className={isMine ? classNames.myBubble : classNames.otherBubble}>
      <p className={`${classNames.messageText} ${textClass}`} dir={dir}>
        {formatText(text)}
      </p>

      {/* Telegram Quoted Messages / Teacher Comments */}
      {comments && comments.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-2">
          {comments.map((c, cIdx) => {
            const rawTeacherName = (c.teacher_name || "").trim();
            const teacherDisplayName = rawTeacherName
              ? (rawTeacherName.startsWith("استاد") ? rawTeacherName : `استاد ${rawTeacherName}`)
              : "استاد";
            const isDeleting = deletingCommentIds.has(c.id);

            return (
              <div
                key={c.id || cIdx}
                className={`comment-motion-item ${isDeleting ? "is-deleting" : ""}`}
              >
                <div className="comment-motion-inner">
                  <div
                    className="relative rounded-xl bg-[#edf5fd] dark:bg-[#182533] p-2.5 pr-4 pl-3 shadow-2xs select-text overflow-hidden comment-box-card"
                    dir="rtl"
                  >
                    {/* Telegram Vertical Accent Line - Flush to edge & covering 100% height */}
                    <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#2481cc] dark:bg-[#52a2f6]" />

                    {/* Top Row: Teacher Name on Right, Quotation Symbol on Left */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-xs text-[#2481cc] dark:text-[#52a2f6] font-vazir truncate">
                        {teacherDisplayName}
                      </span>

                      {/* Authentic Bold Telegram Quotation Mark Symbol from quote-svgrepo-com */}
                      <QuoteSvg className="w-3.5 h-3.5 text-[#2481cc] dark:text-[#52a2f6] shrink-0" />
                    </div>

                    {/* Quoted Comment Text */}
                    <p className="text-xs sm:text-[13px] text-neutral-800 dark:text-neutral-100 font-vazir leading-relaxed text-right whitespace-pre-wrap">
                      {c.comment || c.text}
                    </p>

                    {/* Bottom Row: Delete Comment Action in Corner & Timestamp */}
                    <div className="flex items-center justify-between mt-1.5 pt-0.5" dir="rtl">
                      {c.time ? (
                        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono" dir="ltr">
                          {c.time}
                        </span>
                      ) : (
                        <span />
                      )}

                      {canDeleteComment && onDeleteComment ? (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComment(c.id);
                          }}
                          className="w-5 h-5 flex items-center justify-center rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-500/10 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-400/15 transition-all duration-200 cursor-pointer active:scale-75 group select-none disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t("deleteComment") || "حذف نظر"}
                          aria-label={t("deleteComment") || "حذف نظر"}
                        >
                          <Trash2
                            className={`w-3 h-3 transition-transform duration-200 ${
                              isDeleting
                                ? "scale-75 text-red-500 rotate-12"
                                : "group-hover:scale-115 group-active:scale-75"
                            }`}
                          />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end mt-1" dir="ltr">
        <span className={classNames.messageTime}>{time}</span>
      </div>
    </div>
  );
};

