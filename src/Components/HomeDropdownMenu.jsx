import Log_Out from "@/assets/icons/Log_Out_Black.svg?react";
import LineHomeDropDown from "@/assets/icons/LineHomeDropDown.svg";
import Light from "@/assets/icons/Light.svg?react";
import Night from "@/assets/icons/Night.svg?react";
import "@/styles/Allpages.css";
import { useTheme } from "@/Context/ThemeContext";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import "@/styles/fonts.css";

const menuItems = [
  {
    id: "theme",
    iconWrapperClassName: "relative w-[15px] h-[18px]",
    iconClassName: "flex-1 w-4",
    rowClassName: "ml-[8.5px] w-[85px] mt-[5px] flex items-center gap-[10px]",
  },
  {
    id: "logout",
    labelEn: "Log out",
    labelFa: "خروج",
    icon: Log_Out,
    iconAlt: "Log out icon",
    iconWrapperClassName: "relative w-[15px] h-[18px]",
    iconClassName: "flex-1 w-4",
    rowClassName: "ml-[8.5px] w-[85px] mt-[5px] flex items-center gap-[10px]",
  },
];

export const HomeDropdownMenu = () => {
  const { isDark, toggleTheme } = useTheme();
  const { isRTL } = useContext(AppContext);

  const captionClass = isRTL ? "fa-caption-2" : "en-caption-2";

  const themeLabel = isRTL
    ? isDark
      ? "حالت روز"
      : "حالت شب"
    : isDark
    ? "Day Mode"
    : "Night Mode";

  const logoutLabel = isRTL ? menuItems[1].labelFa : menuItems[1].labelEn;

  return (
    <nav
      aria-label={isRTL ? "منوی کاربر" : "User menu"}
      className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 w-full min-w-[125px] min-h-[60px] flex flex-col rounded-lg p-1"
    >
      {/* THEME BUTTON */}
      <button
        type="button"
        aria-label={themeLabel}
        onClick={toggleTheme}
        className="w-full text-left cursor-pointer hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 rounded px-1 py-0.5 transition-colors"
      >
        <div className={menuItems[0].rowClassName}>
          <div className={menuItems[0].iconWrapperClassName}>
            <div className="w-full h-full flex items-center justify-center">
              {(() => {
                const Icon = isDark ? Light : Night;

                return (
                  <Icon
                    className={`${menuItems[0].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
                  />
                );
              })()}
            </div>
          </div>

          <div
            className={`whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 ${captionClass}`}
          >
            {themeLabel}
          </div>
        </div>
      </button>

      <img
        className="w-full h-1 my-1"
        alt=""
        src={LineHomeDropDown}
        aria-hidden="true"
      />

      {/* LOGOUT */}
      <button
        type="button"
        aria-label={logoutLabel}
        className="w-full text-left cursor-pointer hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 rounded px-1 py-0.5 transition-colors"
      >
        <div className={menuItems[1].rowClassName}>
          <div className={menuItems[1].iconWrapperClassName}>
            <div className="w-full h-full flex items-center justify-center">
              <Log_Out
                className={`${menuItems[1].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
              />
            </div>
          </div>

          <div
            className={`whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 ${captionClass}`}
          >
            {logoutLabel}
          </div>
        </div>
      </button>
    </nav>
  );
};