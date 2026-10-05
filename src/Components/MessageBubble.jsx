import { useContext, useState } from "react";
import "@/styles/Allpages.css";
import {
  Trash2,
  X,
  Check,
  Loader2,
  Play,
  Pause,
} from "lucide-react";
import QuoteSvg from "@/assets/icons/quote-svgrepo-com.svg?react";
import { AppContext } from "@/Context/AppContext";
import { formatChatTime } from "@/utils/dateFormatter";
import { cleanMessageText, isPersianText } from "@/utils/textUtils";
import * as Popover from "@radix-ui/react-popover";

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
  commentAction = null,
  commentInputOpen = false,
  commentInputText = "",
  setCommentInputText,
  onSaveComment,
  onCloseComment,
  isSubmittingComment = false,
  teacherName = "",
}) => {
  const { t, isRTL } = useContext(AppContext);
  const [deletingCommentIds, setDeletingCommentIds] = useState(() => new Set());
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const clean = cleanMessageText(text);
  const isPersian = isPersianText(clean);
  const isServerErrorMessage = clean.includes(
    "مشکلی در ارتباط با سرور به وجود آمد",
  );

  const dir = isPersian ? "rtl" : "ltr";

  const textClass = isPersian
    ? "text-right font-vazir"
    : "text-left font-inter";

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
          <div
            key={index}
            className="flex items-start gap-1.5 my-1 ms-1 leading-relaxed"
          >
            <span className="text-neutral-400 dark:text-neutral-500 select-none text-sm shrink-0 leading-relaxed">
              •
            </span>
            <div className="flex-1 leading-relaxed">{renderedParts}</div>
          </div>
        );
      }

      if (numMatch) {
        return (
          <div
            key={index}
            className="flex items-start gap-1.5 my-1 ms-1 leading-relaxed"
          >
            <span className="font-semibold text-neutral-500 dark:text-neutral-400 select-none text-xs shrink-0 leading-relaxed">
              {numMatch[1]}.
            </span>
            <div className="flex-1 leading-relaxed">{renderedParts}</div>
          </div>
        );
      }

      return (
        <div
          key={index}
          className={index > 0 ? "mt-2 leading-relaxed" : "leading-relaxed"}
        >
          {renderedParts}
        </div>
      );
    });
  };

  return (
    <Popover.Root
      open={!isMine && isActionsOpen}
      onOpenChange={(open) => {
        if (!isMine) setIsActionsOpen(open);
      }}
    >
      <Popover.Anchor asChild>
        <div
          onClick={(e) => {
            if (isMine) return;

            if (
              e.target instanceof Element &&
              e.target.closest("button, textarea, input, a, [role='button']")
            ) {
              return;
            }

            setIsActionsOpen((prev) => !prev);
          }}
          className={`${isMine ? classNames.myBubble : classNames.otherBubble} ${
            !isMine ? "cursor-pointer" : ""
          }`}
        >
          <div className={`${classNames.messageText} ${textClass}`} dir={dir}>
            {formatText(clean)}
          </div>

          {/* Telegram Quoted Messages / Teacher Comments */}
          {comments && comments.length > 0 && (
            <div className="mt-2.5 flex flex-col gap-2">
              {comments.map((c, cIdx) => {
                const rawTeacherName = (c.teacher_name || "").trim();
                const teacherDisplayName = rawTeacherName
                  ? rawTeacherName.startsWith("استاد") ||
                    rawTeacherName.startsWith("دکتر")
                    ? rawTeacherName
                    : `استاد ${rawTeacherName}`
                  : "استاد";
                const isDeleting = deletingCommentIds.has(c.id);
                const isUnread = Boolean(
                  isStudentViewer &&
                  !c.is_read &&
                  (!c.read_by ||
                    !currentUserId ||
                    !c.read_by.includes(String(currentUserId))),
                );
                const isHighlighted =
                  highlightCommentId &&
                  String(c.id) === String(highlightCommentId);

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
                        <div
                          className="flex items-center justify-between mt-1.5 pt-0.5"
                          dir="rtl"
                        >
                          {c.time || c.created_at ? (
                            <span
                              className="text-[10px] text-neutral-400 dark:text-neutral-500 font-vazir"
                              dir="ltr"
                            >
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

          {/* Inline Comment Input INSIDE Message Bubble */}
          {commentInputOpen && (
            <div
              className={`relative w-full mt-2.5 p-3 ${
                isRTL ? "pr-4 pl-3" : "pl-4 pr-3"
              } bg-[#edf5fd] dark:bg-[#182533] rounded-xl shadow-md shadow-[#2481cc]/10 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-200 select-text overflow-hidden`}
              dir={isRTL ? "rtl" : "ltr"}
            >
              {/* Accent Line */}
              <div
                className={`absolute ${
                  isRTL ? "right-0" : "left-0"
                } top-0 bottom-0 w-[4px] bg-[#2481cc] dark:bg-[#52a2f6]`}
              />

              {/* Header */}
              <div className="flex items-center justify-between text-xs border-b border-[#2481cc]/20 dark:border-[#52a2f6]/20 pb-1.5">
                <span className="font-bold text-xs text-[#2481cc] dark:text-[#52a2f6] font-vazir truncate">
                  {teacherName
                    ? teacherName.startsWith("استاد") ||
                      teacherName.startsWith("دکتر")
                      ? teacherName
                      : `استاد ${teacherName}`
                    : isMine
                    ? t("writeStudentComment") || "افزودن نظر استاد روی پیام دانشجو"
                    : t("writeComment") || "افزودن نظر استاد روی پیام بات"}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <QuoteSvg className="w-3.5 h-3.5 text-[#2481cc] dark:text-[#52a2f6] shrink-0" />

                  <button
                    type="button"
                    onClick={onCloseComment}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                autoFocus
                rows={2}
                value={commentInputText}
                onChange={(e) => setCommentInputText?.(e.target.value)}
                placeholder={
                  isMine
                    ? t("commentStudentPlaceholder") ||
                      "توضیحات یا نکات راهنمایی خود را درباره پیام دانشجو بنویسید..."
                    : t("commentPlaceholder") ||
                      "توضیحات یا نکات اصلاحی خود را درباره پاسخ بات بنویسید..."
                }
                className="w-full resize-none text-xs sm:text-sm p-2 rounded-xl bg-white dark:bg-[#121c27] border border-[#2481cc]/30 dark:border-[#52a2f6]/30 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#2481cc] font-vazir leading-relaxed"
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    commentInputText.trim()
                  ) {
                    e.preventDefault();
                    onSaveComment?.();
                  }
                }}
              />

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onCloseComment}
                  className="px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-scale1200 rounded-lg transition-colors cursor-pointer"
                >
                  {t("cancelComment") || "انصراف"}
                </button>

                <button
                  type="button"
                  disabled={!commentInputText.trim() || isSubmittingComment}
                  onClick={onSaveComment}
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

          {/* Message Time & Comment Action */}
          <div className="flex items-center justify-between mt-2" dir="ltr">
            <div className="flex items-center">{commentAction}</div>

            <span className={classNames.messageTime}>
              {formatChatTime(createdAt || time, isRTL)}
            </span>
          </div>
        </div>
      </Popover.Anchor>

      {!isMine && (
        <Popover.Portal>
          <Popover.Content
            dir="ltr"
            side="bottom"
            align="end"
            sideOffset={3}
            collisionPadding={12}
            avoidCollisions
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={`
              z-[9999]
              ${isServerErrorMessage ? "w-[150px]" : "w-[180px]"}
              min-w-[150px]
              max-w-[250px]
              rounded-3xl
              border border-white/40
              dark:border-white/10
              bg-white/75
              dark:bg-[#182533]/55
              backdrop-blur-xl
              backdrop-saturate-150
              shadow-lg
              outline-none
              pl-[2px]
            `}
          >
            {isServerErrorMessage ? (
              <div
                className="
                  flex
                  items-center
                  justify-center
                  min-h-6
                  px-1
                  py-1
                  text-[10px]
                  text-neutral-600
                  dark:text-neutral-300
                  font-vazir
                  whitespace-nowrap
                "
                dir="rtl"
              >
                هیچ صدایی برای پخش وجود ندارد
              </div>
            ) : (
              <div className="flex items-center gap-2" dir="ltr">
                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlaying((prev) => !prev);
                  }}
                  className="
                    flex
                    items-center
                    justify-center
                    w-6
                    h-6
                    shrink-0
                    rounded-full
                    bg-primery-500
                    text-white
                    hover:opacity-90
                    transition
                  "
                >
                  {isPlaying ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                  )}
                </button>

                {/* Fake Waveform */}
                <div
                  className="
                    flex
                    items-center
                    gap-[1.5px]
                    flex-1
                    h-7
                    cursor-pointer
                  "
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {[
                    12, 20, 16, 25, 18, 30, 22, 14, 28, 20, 32, 24, 17, 27, 21,
                    13, 24, 30, 18, 26, 15, 22, 29, 17, 23, 14, 20, 27, 18, 24,
                  ].map((height, index) => (
                    <div
                      key={index}
                      className={`
                        w-[2px]
                        rounded-full
                        transition-colors
                        ${
                          isPlaying && index < 16
                            ? "bg-primery-500"
                            : "bg-neutral-300 dark:bg-neutral-600"
                        }
                      `}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Voice Duration */}
                <span
                  className="
                    shrink-0
                    text-[11px]
                    text-neutral-500
                    dark:text-neutral-400
                    tabular-nums
                    pr-[8px]
                    pt-[1px]
                  "
                >
                  0:24
                </span>
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
};

