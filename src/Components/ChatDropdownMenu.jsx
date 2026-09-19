import ClearHistory from "@/assets/icons/broom-cleaning-icon.svg?react";
import Search from "@/assets/icons/Search-Black.svg?react";
import Download from "@/assets/icons/Download.svg?react";

const menuItems = [
  {
    id: "search",
    label: "Search",
    type: "icon",
    Icon: Search,
  },
  {
    id: "download-pdf",
    label: "Download PDF",
    type: "icon",
    Icon: Download,
  },
  {
    id: "clear-history",
    label: "Clear History",
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
  const handlers = {
    search: onSearch,
    "download-pdf": onDownloadPdf,
    "clear-history": onClearHistory,
  };

  return (
    <div className={`flex min-h-[102px] w-full min-w-[132px] ${className}`}>
      <div className="relative flex h-[102px] w-[132px] flex-col items-start gap-2.5 rounded-2xl bg-neutral-scale70 dark:bg-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 py-1.5 pl-2.5 pr-2 shadow-[0px_1px_5px_#00000040]">
        <div className="relative mr-[-3.00px] flex w-[117px] flex-[0_0_auto] flex-col items-start gap-[15px]">
          {menuItems.map((item) => {
            const handleClick = handlers[item.id];
            const Icon = item.Icon;

            if (item.type === "icon") {
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.label}
                  onClick={handleClick}
                  className="relative h-5 w-[115px] cursor-pointer text-left"
                >
                  <Icon className="h-5 w-5 text-black dark:text-neutral-scale70" />

                  <span className="absolute left-[35px] top-0.5 text-center en-caption-2 whitespace-nowrap text-black dark:text-neutral-scale70">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={handleClick}
                className="relative flex-[0_0_auto] cursor-pointer"
              >
                <img
                  className="relative flex-[0_0_auto]"
                  alt={item.alt}
                  src={item.src}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

