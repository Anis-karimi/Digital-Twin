import { useContext } from "react";
import ClearHistory from "@/assets/icons/broom-cleaning-icon.svg?react";
import Search from "@/assets/icons/Search-Black.svg?react";
import Download from "@/assets/icons/Download.svg?react";
import { Camera, Trash2, FileText } from "lucide-react";
import { AppContext } from "@/Context/AppContext";

export const ChatDropdownMenu = ({
  onSearch,
  onDownloadPdf,
  onClearHistory,
  onChangePhoto,
  onDeletePhoto,
  onCourseSettings,
  hasPhoto = false,
  isCourseChat = false,
  className = "",
}) => {
  const { isRTL } = useContext(AppContext);

  const items = [];

  if (isCourseChat && onCourseSettings) {
    items.push({
      id: "course-settings",
      label: "Course Details",
      labelFa: "مشخصات و اسناد درس",
      Icon: FileText,
      handler: onCourseSettings,
      danger: false,
    });
  }

  if (isCourseChat && onChangePhoto) {
    items.push({
      id: "change-photo",
      label: hasPhoto ? "Change Photo" : "Upload Photo",
      labelFa: hasPhoto ? "تغییر عکس درس" : "انتخاب عکس درس",
      Icon: Camera,
      handler: onChangePhoto,
      danger: false,
    });
  }

  if (isCourseChat && onDeletePhoto) {
    items.push({
      id: "delete-photo",
      label: "Remove Photo",
      labelFa: "حذف عکس درس",
      Icon: Trash2,
      handler: onDeletePhoto,
      danger: true,
    });
  }

  if (onSearch) {
    items.push({
      id: "search",
      label: "Search",
      labelFa: "جستجو",
      Icon: Search,
      handler: onSearch,
      danger: false,
    });
  }

  if (onDownloadPdf) {
    items.push({
      id: "download-pdf",
      label: "Download PDF",
      labelFa: "دانلود PDF",
      Icon: Download,
      handler: onDownloadPdf,
      danger: false,
    });
  }

  if (onClearHistory) {
    items.push({
      id: "clear-history",
      label: "Clear History",
      labelFa: "پاک کردن تاریخچه",
      Icon: ClearHistory,
      handler: onClearHistory,
      danger: true,
    });
  }

  return (
    <div
      className={`flex min-h-[102px] w-full min-w-[155px] ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="relative flex min-h-[102px] w-[160px] flex-col items-start gap-2.5 rounded-2xl bg-neutral-scale70 dark:bg-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 py-2.5 px-3 shadow-[0px_2px_8px_#00000030]">
        <div className="flex w-full flex-col items-start gap-[11px]">
          {items.map((item) => {
            const Icon = item.Icon;
            const displayLabel = isRTL ? item.labelFa : item.label;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={displayLabel}
                onClick={item.handler}
                className={`flex items-center gap-2.5 w-full cursor-pointer hover:opacity-80 transition-opacity ${
                  isRTL ? "flex-row text-right" : "flex-row text-left"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    item.danger
                      ? "text-red-500"
                      : "text-black dark:text-neutral-scale70"
                  }`}
                />

                <span
                  className={`${
                    isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
                  } whitespace-nowrap ${
                    item.danger
                      ? "text-red-500"
                      : "text-black dark:text-neutral-scale70"
                  }`}
                >
                  {displayLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatDropdownMenu;
