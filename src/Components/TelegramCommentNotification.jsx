import { useEffect, useState } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import QuoteSvg from "@/assets/icons/quote-svgrepo-com.svg?react";
import { playTelegramNotificationSound } from "@/utils/telegramSound";
import { formatChatTime } from "@/utils/dateFormatter";

export const TelegramCommentNotification = ({
  comment,
  onView,
  onClose,
  isRTL = true,
  autoDismissMs = 7000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!comment) return;

    // Trigger sound and entrance animation
    playTelegramNotificationSound();
    const enterTimer = setTimeout(() => setIsVisible(true), 50);

    let dismissTimer;
    if (autoDismissMs > 0) {
      dismissTimer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);
    }

    return () => {
      clearTimeout(enterTimer);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [comment?.id]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!comment) return null;

  const rawTeacherName = (comment.teacher_name || "").trim();
  const teacherDisplayName = rawTeacherName
    ? rawTeacherName.startsWith("استاد") || rawTeacherName.startsWith("دکتر")
      ? rawTeacherName
      : `استاد ${rawTeacherName}`
    : "استاد";

  const commentSnippet = comment.comment || comment.text || "";

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-32px)] max-w-[380px] transition-all duration-350 ease-out select-none ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-8 scale-95 pointer-events-none"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        onClick={() => {
          onView?.(comment);
          handleDismiss();
        }}
        className="group relative flex flex-col gap-1.5 p-3 pr-4 pl-3 rounded-2xl bg-white/95 dark:bg-[#182533]/95 backdrop-blur-md border border-[#2481cc]/30 dark:border-[#52a2f6]/35 shadow-xl shadow-[#2481cc]/15 cursor-pointer hover:shadow-[#2481cc]/25 transition-all overflow-hidden"
      >
        {/* Telegram Vertical Accent Line */}
        <div
          className={`absolute ${
            isRTL ? "right-0" : "left-0"
          } top-0 bottom-0 w-[4.5px] bg-[#2481cc] dark:bg-[#52a2f6]`}
        />

        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Telegram Quote Icon Pill */}
            <div className="w-6 h-6 rounded-full bg-[#edf5fd] dark:bg-[#121c27] flex items-center justify-center shrink-0 border border-[#2481cc]/30 dark:border-[#52a2f6]/30">
              <QuoteSvg className="w-3.5 h-3.5 text-[#2481cc] dark:text-[#52a2f6]" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-xs sm:text-[13px] text-[#2481cc] dark:text-[#52a2f6] font-vazir truncate">
                {teacherDisplayName}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2481cc]/10 dark:bg-[#52a2f6]/20 text-[#2481cc] dark:text-[#52a2f6] font-vazir shrink-0">
                {isRTL ? "نظر جدید" : "New Comment"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-vazir">
              {formatChatTime(comment.created_at || comment.time, isRTL) || (isRTL ? "اکنون" : "Just now")}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="بستن اعلان"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Comment Message Snippet */}
        <p className="text-xs sm:text-[12.5px] text-neutral-800 dark:text-neutral-100 font-vazir line-clamp-2 leading-relaxed">
          {commentSnippet}
        </p>

        {/* Action Link Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800/60 mt-0.5">
          <span className="text-[11px] font-semibold text-[#2481cc] dark:text-[#52a2f6] flex items-center gap-1 group-hover:underline">
            <span>{isRTL ? "مشاهده و رفتن به پیام" : "View message"}</span>
            {isRTL ? (
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            )}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {isRTL ? "تلگرام دوقلوی دیجیتال" : "Digital Twin"}
          </span>
        </div>
      </div>
    </div>
  );
};
export default TelegramCommentNotification;
