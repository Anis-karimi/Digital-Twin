import { useContext } from "react";
import ClearHistory from "@/assets/icons/broom-cleaning-icon.svg?react";
import Search from "@/assets/icons/Search-Black.svg?react";
import Download from "@/assets/icons/Download.svg?react";
import { AppContext } from "@/Context/AppContext";

const menuItems = [
  {
    id: "search",
    label: "Search",
    labelFa: "جستجو",
    type: "icon",
    Icon: Search,
  },
  {
    id: "download-pdf",
    label: "Download PDF",
    labelFa: "دانلود PDF",
    type: "icon",
    Icon: Download,
  },
  {
    id: "clear-history",
    label: "Clear History",
    labelFa: "پاک کردن تاریخچه",
    type: "icon",
    Icon: ClearHistory,
  },
];

export const ChatDropdownMenu = ({
  onSearch,
  onDownloadPdf,
  onClearHistory,
  className = "",
}) => {
  const { isRTL } = useContext(AppContext);

  const handlers = {
    search: onSearch,
    "download-pdf": onDownloadPdf,
    "clear-history": onClearHistory,
  };

  return (
    <div
      className={`flex min-h-[102px] w-full min-w-[140px] ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="relative flex min-h-[102px] w-[140px] flex-col items-start gap-2.5 rounded-2xl bg-neutral-scale70 dark:bg-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 py-2 px-3 shadow-[0px_1px_5px_#00000040]">
        <div className="flex w-full flex-col items-start gap-[12px]">
          {menuItems.map((item) => {
            const handleClick = handlers[item.id];
            const Icon = item.Icon;
            const displayLabel = isRTL ? item.labelFa : item.label;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={displayLabel}
                onClick={handleClick}
                className={`flex items-center gap-2.5 w-full cursor-pointer ${
                  isRTL ? "flex-row text-right" : "flex-row text-left"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-black dark:text-neutral-scale70" />

                <span
                  className={`${
                    isRTL ? "fa-caption-2" : "en-caption-2"
                  } whitespace-nowrap text-black dark:text-neutral-scale70`}
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
