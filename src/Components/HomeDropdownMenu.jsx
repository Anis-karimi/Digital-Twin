import Log_Out from "@/assets/icons/Log_Out_Black.svg?react";
import LineHomeDropDown from "@/assets/icons/LineHomeDropDown.svg";
import Light from "@/assets/icons/Light.svg?react";
import Night from "@/assets/icons/Night.svg?react";
import "@/styles/Allpages.css";
import { useTheme } from "@/Context/ThemeContext";
import "@/styles/fonts.css"

const menuItems = [
  {
    id: "theme",
    iconWrapperClassName: "relative w-[15px] h-[18px]",
    iconClassName: "flex-1 w-4",
    rowClassName: "ml-[8.5px] w-[73px] mt-[5px] flex gap-[13px]",
    labelClassName:
      "mt-px w-10 h-4 en-caption-2 text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap",
  },
  {
    id: "logout",
    label: "Log out",
    icon: Log_Out,
    iconAlt: "Log out icon",
    iconWrapperClassName: "relative w-[15px] h-[18px]",
    iconClassName: "flex-1 w-4",
    rowClassName: "ml-[8.5px] w-[73px] mt-[5px] flex gap-[13px]",
    labelClassName:
      "mt-px w-10 h-4 en-caption-2 text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap",
  },
];

export const HomeDropdownMenu = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav
      aria-label="User menu"
      className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100  w-full min-w-[115px] min-h-[60px] flex flex-col rounded-lg"
    >
      {/* THEME BUTTON */}
      <button
        type="button"
        aria-label={isDark ? "Day Mode" : "Night Mode"}
        onClick={toggleTheme}
        className="w-full text-left cursor-pointer"
      >
        <div className={menuItems[0].rowClassName}>
          <div className={menuItems[0].iconWrapperClassName}>
            <div className="w-full h-full flex">
              {(() => {
                const Icon = isDark ? Light : Night;

                return (
                  <Icon
                    className={`${menuItems[0].iconClassName} relative top-[1px] left-[1px]  text-neutral-scale1800 dark:text-neutral-scale70`}
                  />
                );
              })()}
            </div>
          </div>

          <div className={menuItems[0].labelClassName}>
            {isDark ? "Day Mode" : "Night Mode"}
          </div>
        </div>
      </button>

      <img
        className="w-[115px] h-1 mt-1"
        alt=""
        src={LineHomeDropDown}
        aria-hidden="true"
      />

      {/* LOGOUT */}
      <button
        type="button"
        aria-label={menuItems[1].label}
        className="w-full text-left cursor-pointer"
      >
        <div className={menuItems[1].rowClassName}>
          <div className={menuItems[1].iconWrapperClassName}>
            <Log_Out
              className={`${menuItems[1].iconClassName} text-neutral-scale1800 dark:text-neutral-scale70`}
            />
          </div>

          <div className={menuItems[1].labelClassName}>
            {menuItems[1].label}
          </div>
        </div>
      </button>
    </nav>
  );
};