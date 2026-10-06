import { useEffect, useRef, useState, useContext } from "react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { toPersianDigits } from "@/utils/dateUtils";

export const ExamsNavBar = ({
  activeTab = "active",
  onTabChange,
  counts = { active: 0, past: 0, all: 0 },
}) => {
  const { isRTL } = useContext(AppContext);
  const containerRef = useRef(null);
  const tablistRef = useRef(null);
  const tabsRef = useRef({});

  const items = [
    {
      id: "active",
      labelFa: "آزمون‌های فعال",
      labelEn: "Active Exams",
      count: counts?.active ?? 0,
    },
    {
      id: "past",
      labelFa: "آزمون‌های گذشته",
      labelEn: "Past Exams",
      count: counts?.past ?? 0,
    },
    {
      id: "all",
      labelFa: "همه آزمون‌ها",
      labelEn: "All Exams",
      count: counts?.all ?? 0,
    },
  ];

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    offset: 0,
  });
  const [isReady, setIsReady] = useState(false);

  const getTabMetrics = (tabId) => {
    const el = tabsRef.current[tabId];
    const tablist = tablistRef.current;
    if (!el || !tablist) return null;

    const width = el.offsetWidth;
    const offset = isRTL
      ? tablist.offsetWidth - (el.offsetLeft + el.offsetWidth)
      : el.offsetLeft;

    return { width, offset };
  };

  const scrollTabIntoView = (tabId) => {
    const el = tabsRef.current[tabId];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  useEffect(() => {
    const updateIndicator = () => {
      const metrics = getTabMetrics(activeTab);
      if (!metrics) return;

      setIndicatorStyle({
        width: metrics.width,
        offset: metrics.offset,
      });
      setIsReady(true);
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    const rafId = requestAnimationFrame(updateIndicator);

    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab, isRTL, counts]);

  // Automatically scroll active tab into view when active tab changes or on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollTabIntoView(activeTab);
    }, 60);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleTabClick = (tabId) => {
    onTabChange?.(tabId);
    scrollTabIntoView(tabId);
  };

  return (
    <nav
      aria-label={isRTL ? "دسته‌بندی آزمون‌ها" : "Exams Navigation"}
      dir={isRTL ? "rtl" : "ltr"}
      className="flex w-full items-center px-3.5 pt-2 pb-1.5 z-20 shrink-0"
    >
      <div
        ref={containerRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="relative flex-1 grow h-[38px] bg-[#f8fcfd] dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[20px] overflow-x-auto overflow-y-hidden scroll-smooth shadow-[0px_-1px_3px_0.1px_#2828281a,0px_1px_3px_0.1px_#2828281a,1px_0px_3px_0.1px_#2828281a,-1px_0px_3px_0.1px_#2828281a] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          ref={tablistRef}
          className="flex min-w-full w-max h-full items-center justify-around gap-1.5 sm:gap-2.5 px-2 relative whitespace-nowrap"
          role="tablist"
        >
          {/* Active tab indicator inside tablist coordinate space */}
          <div
            className={`absolute top-[3px] ${
              isRTL ? "right-0" : "left-0"
            } h-[30px] bg-primery-90 dark:bg-primery-900/40 rounded-[21px] pointer-events-none ${
              isReady ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: indicatorStyle.width ? `${indicatorStyle.width}px` : "0px",
              transform: isRTL
                ? `translateX(-${indicatorStyle.offset}px)`
                : `translateX(${indicatorStyle.offset}px)`,
              transition:
                "transform 280ms cubic-bezier(0.25, 1, 0.5, 1), width 280ms cubic-bezier(0.25, 1, 0.5, 1)",
              willChange: "transform, width",
            }}
          />

          {items.map((item) => {
            const isActive = activeTab === item.id;
            const displayLabel = isRTL ? item.labelFa : item.labelEn;
            const countDisplay = isRTL
              ? toPersianDigits(item.count > 99 ? "+99" : item.count)
              : item.count > 99
                ? "+99"
                : item.count;

            return (
              <button
                key={item.id}
                ref={(el) => (tabsRef.current[item.id] = el)}
                onClick={() => handleTabClick(item.id)}
                type="button"
                role="tab"
                aria-selected={isActive}
                className="relative h-[30px] shrink-0 flex items-center justify-center gap-1.5 px-2.5 sm:px-3 rounded-[21px] cursor-pointer select-none transition-colors z-10"
              >
                {/* Count Badge */}
                {typeof item.count === "number" && (
                  <div className="relative h-[18px] min-w-[18px] w-fit px-[5px] flex items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-full transition-colors ${
                        isActive ? "bg-primery-1000" : "bg-neutral-scale600"
                      }`}
                    />
                    <div
                      className={`relative top-[0.5px] ${
                        isRTL ? "fa-caption-2 font-vazir" : "en-caption-2 font-inter"
                      } text-white leading-none text-center`}
                    >
                      {countDisplay}
                    </div>
                  </div>
                )}

                {/* Tab Label */}
                <div
                  className={
                    isActive
                      ? `text-primery-1000 ${
                          isRTL
                            ? "fa-caption-3 font-vazir font-bold"
                            : "en-caption-3 font-inter font-bold"
                        } text-center whitespace-nowrap`
                      : `text-neutral-scale1200 dark:text-primery-90 ${
                          isRTL
                            ? "fa-caption-1 font-vazir"
                            : "en-caption-1 font-inter"
                        } text-center whitespace-nowrap`
                  }
                >
                  {displayLabel}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default ExamsNavBar;
