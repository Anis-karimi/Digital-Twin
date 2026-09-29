import { useContext, useState } from "react";
import "@/styles/Allpages.css";
import { Trash2 } from "lucide-react";
import QuoteSvg from "@/assets/icons/quote-svgrepo-com.svg?react";
import { AppContext } from "@/Context/AppContext";
import { formatChatTime } from "@/utils/dateFormatter";
import { cleanMessageText, isPersianText } from "@/utils/textUtils";

export const MessageBubble = ({
  messageId,
  text,
  time,
  createdAt,
  isMine,
  classNames,
  comments = [],
  onDeleteComment,
  canDeleteComment = false,
  isStudentViewer = false,
  currentUserId = null,
  highlightCommentId = null,
}) => {
  const { t, isRTL } = useContext(AppContext);
  const [deletingCommentIds, setDeletingCommentIds] = useState(() => new Set());
  const clean = cleanMessageText(text);
  const isPersian = isPersianText(clean);

  const dir = isPersian ? "rtl" : "ltr";

  const textClass = isPersian ? "text-right font-vazir" : "text-left font-inter";

  const handleDeleteComment = (commentId) => {
    if (deletingCommentIds.has(commentId)) return;
    setDeletingCommentIds((prev) => new Set(prev).add(commentId));
    setTimeout(() => {
      onDeleteComment?.(commentId);
    }, 300);
  };

  // Parse basic Markdown bold, code, bullet lists, numbered lists, and line breaks
  const formatText = (contentStr) => {
    const cleaned = cleanMessageText(contentStr);
    if (!cleaned) return null;

    const paragraphs = cleaned.split(/\n+/);

    return paragraphs.map((paragraph, index) => {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) return null;

      // Check for bullet list item: '- item', '* item', '• item'
      const isBullet = /^\s*[-*•]\s+/.test(trimmedPara);
      // Check for numbered list item: '1. item' or '1) item'
      const numMatch = trimmedPara.match(/^\s*(\d+)[.)]\s+(.*)$/);

      let itemBody = trimmedPara;
      if (isBullet) {
        itemBody = trimmedPara.replace(/^\s*[-*•]\s+/, "");
      } else if (numMatch) {
        itemBody = numMatch[2];
      }

      // Split for bold (**bold**) and inline code (`code`)
      const parts = itemBody.split(/(\*\*.*?\*\*|`[^`]+`)/g);

      const renderedParts = parts.map((part, partIndex) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong key={partIndex} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 3) {
          return (
            <code
              key={partIndex}
              className="px-1.5 py-0.5 mx-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[11px] sm:text-xs"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={partIndex}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={index} className="flex items-start gap-1.5 my-1 ms-1 leading-relaxed">
            <span className="text-neutral-400 dark:text-neutral-500 select-none text-sm shrink-0 leading-relaxed">•</span>
            <div className="flex-1 leading-relaxed">{renderedParts}</div>
          </div>
        );
      }

      if (numMatch) {
        return (
          <div key={index} className="flex items-start gap-1.5 my-1 ms-1 leading-relaxed">
            <span className="font-semibold text-neutral-500 dark:text-neutral-400 select-none text-xs shrink-0 leading-relaxed">
              {numMatch[1]}.
            </span>
            <div className="flex-1 leading-relaxed">{renderedParts}</div>
          </div>
        );
      }

      return (
        <div key={index} className={index > 0 ? "mt-2 leading-relaxed" : "leading-relaxed"}>
          {renderedParts}
        </div>
      );
    });
  };

  return (
    <div className={isMine ? classNames.myBubble : classNames.otherBubble}>
      <div className={`${classNames.messageText} ${textClass}`} dir={dir}>
        {formatText(clean)}
      </div>

      {/* Telegram Quoted Messages / Teacher Comments */}
      {comments && comments.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-2">
          {comments.map((c, cIdx) => {
            const rawTeacherName = (c.teacher_name || "").trim();
            const teacherDisplayName = rawTeacherName
              ? (rawTeacherName.startsWith("استاد") || rawTeacherName.startsWith("دکتر")
                  ? rawTeacherName
                  : `استاد ${rawTeacherName}`)
              : "استاد";
            const isDeleting = deletingCommentIds.has(c.id);
            const isUnread = Boolean(
              isStudentViewer &&
              !c.is_read &&
              (!c.read_by || !currentUserId || !c.read_by.includes(String(currentUserId)))
            );
            const isHighlighted = highlightCommentId && String(c.id) === String(highlightCommentId);

            return (
              <div
                key={c.id || cIdx}
                className={`comment-motion-item ${isDeleting ? "is-deleting" : ""}`}
              >
                <div className="comment-motion-inner">
                  <div
                    id={`comment-${c.id}`}
                    data-comment-id={c.id}
                    data-message-id={messageId}
                    data-is-unread={isUnread ? "true" : "false"}
                    className={`relative rounded-xl bg-[#edf5fd] dark:bg-[#182533] p-2.5 pr-4 pl-3 shadow-2xs select-text overflow-hidden comment-box-card transition-all duration-300 ${
                      isUnread ? "is-unread" : ""
                    } ${isHighlighted ? "comment-highlight-pulse" : ""}`}
                    dir="rtl"
                  >
                    {/* Telegram Vertical Accent Line - Flush to edge & covering 100% height */}
                    <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#2481cc] dark:bg-[#52a2f6]" />

                    {/* Top Row: Teacher Name + Unread Badge on Right, Quotation Symbol on Left */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-[#2481cc] dark:text-[#52a2f6] font-vazir truncate">
                          {teacherDisplayName}
                        </span>
                        {isUnread && (
                          <span className="text-[9px] leading-tight px-1.5 py-0.5 rounded-full bg-[#2481cc] dark:bg-[#52a2f6] text-white font-vazir font-medium shrink-0 animate-pulse">
                            خوانده نشده
                          </span>
                        )}
                      </div>

                      {/* Authentic Bold Telegram Quotation Mark Symbol from quote-svgrepo-com */}
                      <QuoteSvg className="w-3.5 h-3.5 text-[#2481cc] dark:text-[#52a2f6] shrink-0" />
                    </div>

                    {/* Quoted Comment Text */}
                    <p className="text-xs sm:text-[13px] text-neutral-800 dark:text-neutral-100 font-vazir leading-relaxed text-right whitespace-pre-wrap">
                      {cleanMessageText(c.comment || c.text)}
                    </p>

                    {/* Bottom Row: Delete Comment Action in Corner & Timestamp */}
                    <div className="flex items-center justify-between mt-1.5 pt-0.5" dir="rtl">
                      {c.time || c.created_at ? (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-vazir" dir="ltr">
                          {formatChatTime(c.created_at || c.time, isRTL)}
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
        <span className={classNames.messageTime}>
          {formatChatTime(createdAt || time, isRTL)}
        </span>
      </div>
    </div>
  );
};

