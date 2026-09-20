import { Link } from "react-router-dom";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import Camera from "@/assets/icons/Camera.svg";
import LogOut from "@/assets/icons/Log_Out.svg";
import Language from "@/assets/icons/Language.svg";
import PaintBrush from "@/assets/icons/paint-brush.svg";
import { FooterGlass } from "@/Components/FooterGlass";
import { useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { adminApi, userApi } from "@/api";

const settingsItems = [
  {
    id: "theme",
    title: "Theme",
    titleFa: "پوسته",
    subtitle: "Dark, Light",
    subtitleFa: "تاریک، روشن",
    path: "/Theme",
    icon: (
      <img className="w-[23px] h-[23px] object-contain" alt="" src={PaintBrush} />
    ),
  },
  {
    id: "language",
    title: "Language",
    titleFa: "زبان",
    subtitle: "English, فارسی",
    subtitleFa: "فارسی، انگلیسی",
    path: "/Language",
    icon: <img className="w-[23px] h-[23px] object-contain" alt="Language" src={Language} />,
  },
];

export const StudentSettings = () => {
  const { isRTL } = useContext(AppContext);
  const fileInputRef = useRef(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [settings, setSettings] = useState(null);

  const loadSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      console.log("settings:", data);
      setSettings(data);
    } catch (err) {
      console.error("Failed to load admin settings:", err);
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      await loadSettings();
    };

    loadPageData();
  }, []);

  const uploadPhoto = async (file) => {
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));

    try {
      await userApi.uploadPhoto(file);
    } catch (error) {
      console.error("Upload photo error:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadPhoto(file);
  };

  return (
    <main
      className="bg-[#f1f0f0] dark:bg-neutral-scale1500 w-full md:w-[360px] mx-auto flex flex-col h-dvh overflow-hidden"
      aria-label={isRTL ? "صفحه تنظیمات دانشجو" : "Student settings page"}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <header className="sticky top-0 left-0 w-full h-8 flex justify-end bg-transparent" />
      <section
        className="flex-1 overflow-y-auto overflow-x-hidden pt-[10px] pb-[105px]"
        aria-label={isRTL ? "پروفایل و تنظیمات" : "Profile and settings"}
      >
        {/* // ---------------------- Profile photo ---------------------------- */}
        <div className="flex w-[104px] h-[143px] relative mt-1.5 mx-auto flex-col items-center gap-[15px]">
          {photoPreview ? (
            <img
              className="relative self-stretch w-full rounded-full aspect-[1] object-cover border-[3px] border-neutral-scale100"
              alt="Profile photo"
              src={photoPreview}
            />
          ) : (
            <div className="relative self-stretch w-full rounded-full aspect-[1] bg-primery-90 border-[1px] border-primery-100" />
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            aria-label={isRTL ? "تغییر تصویر پروفایل" : "Change profile photo"}
            className="absolute top-20 left-[72px] w-6 h-6 cursor-pointer"
          >
            <img src={Camera} alt="Camera" className="w-6 h-6" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
          <h1 className="relative self-stretch fa-title-2 text-center text-neutral-scale1800 dark:text-neutral-scale70">
            محیا محمدی
          </h1>
        </div>

        <div className="w-full flex flex-col gap-2">
          {/* // ---------------------- Name Section ---------------------- */}
          <section
            className="mx-3.5 w-auto h-[104px] relative bg-neutral-scale70 dark:bg-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden px-4 py-2.5 flex flex-col justify-between"
            aria-labelledby="name-section-title"
          >
            <div
              id="name-section-title"
              className={`text-primery-800 dark:text-neutral-scale70 whitespace-nowrap ${
                isRTL ? "fa-caption-3 text-right" : "en-caption-3 text-left"
              }`}
            >
              {isRTL ? "نام و نام خانوادگی" : "Your name"}
            </div>
            <div
              className={`fa-caption-1 whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              محیا
            </div>
            <div className="w-full border-t border-neutral-scale300 dark:border-neutral-scale1000 my-0.5" />
            <div
              className={`fa-caption-1 whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              محمدی
            </div>
          </section>

          {/* // ----------------------- Email Section ------------------------ */}
          <section
            className="flex mx-3.5 w-auto h-[68px] relative flex-col justify-between px-4 py-2.5 bg-neutral-scale70 dark:bg-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden"
            aria-labelledby="email-section-title"
          >
            <div
              id="email-section-title"
              className={`text-primery-800 dark:text-neutral-scale70 ${
                isRTL ? "fa-caption-3 text-right" : "en-caption-3 text-left"
              }`}
            >
              {isRTL ? "ایمیل شما" : "Your email"}
            </div>
            <div
              className={`fa-caption-1 text-neutral-scale1800 dark:text-neutral-scale70 ${
                isRTL ? "text-right" : "text-left"
              }`}
              dir="ltr"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              mahyamohamdy@gmail.com
            </div>
          </section>

          {/* // ---------------- Preferences Section --------------------------- */}
          <section
            className="mx-3.5 w-auto relative mt-2 bg-neutral-scale70 dark:bg-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden p-3.5"
            aria-label={isRTL ? "تنظیمات و گزینه‌ها" : "Preferences"}
          >
            <div className="flex flex-col w-full gap-3.5">
              {settingsItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3.5 w-full ${
                    isRTL ? "flex-row text-right" : "flex-row text-left"
                  }`}
                  aria-label={`${isRTL ? item.titleFa : item.title}, ${
                    isRTL ? item.subtitleFa : item.subtitle
                  }`}
                >
                  <div className="w-[24px] h-[24px] shrink-0 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div
                    className={`flex flex-col flex-1 min-w-0 ${
                      isRTL ? "items-start text-right" : "items-start text-left"
                    }`}
                  >
                    <div
                      className={`w-full truncate text-neutral-scale1800 dark:text-neutral-scale70 ${
                        isRTL ? "fa-body" : "en-body"
                      }`}
                    >
                      {isRTL ? item.titleFa : item.title}
                    </div>
                    <div
                      className={`w-full truncate text-neutral-scale1100 dark:text-neutral-scale300 ${
                        isRTL ? "fa-caption-2" : "en-caption-2"
                      }`}
                    >
                      {isRTL ? item.subtitleFa : item.subtitle}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* // ---------------- Log out Button --------------------------- */}
          <button
            type="button"
            className="mx-3.5 w-auto h-[38px] relative mt-1.5 bg-neutral-scale70 dark:bg-neutral-scale1400 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[8px] overflow-hidden cursor-pointer hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 transition-colors"
            aria-label={isRTL ? "خروج" : "Log out"}
          >
            <div
              className={`h-full flex items-center gap-3 px-4 ${
                isRTL ? "flex-row text-right" : "flex-row text-left"
              }`}
            >
              <img
                src={LogOut}
                alt="Log out"
                className={`w-[22px] h-[22px] shrink-0 ${
                  isRTL ? "rotate-180" : ""
                }`}
              />
              <span
                className={`${
                  isRTL ? "fa-body" : "en-body"
                } text-neutral-scale1800 dark:text-neutral-scale70`}
              >
                {isRTL ? "خروج" : "Log out"}
              </span>
            </div>
          </button>
        </div>
      </section>

      <FooterGlass>
        <StudentNavigationBar />
      </FooterGlass>
    </main>
  );
};
