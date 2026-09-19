import { Link } from "react-router-dom";
import { StudentNavigationBar } from "@/Components/StudentNavigationBar";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import Camera from "@/assets/icons/Camera.svg";
import ResourseManagment from "@/assets/icons/ResourseManagment.svg";
import LogOut from "@/assets/icons/Log_Out.svg";
import PauseCircle from "@/assets/icons/PauseCircle.svg?react";
// import menu from "../assets/icons/menuBlack.svg";
import PlayCircle from "@/assets/icons/PlayCircle.svg?react";
import Microphon from "@/assets/icons/mic.svg?react";
import Language from "@/assets/icons/Language.svg";
import PaintBrush from "@/assets/icons/paint-brush.svg";
import TrashFull from "@/assets/icons/Trash_Full.svg?react";
import { FooterGlass } from "@/Components/FooterGlass";
import { useRef, useState, useEffect } from "react";
import { BACKEND_URL, DGTW_URL } from "@/Services/BackendConfige";

const settingsItems = [
  {
    id: "theme",
    title: "Theme",
    subtitle: "Dark, Light",
    path: "/Theme", // مسیر صفحه
    icon: (
      <img className="relative w-[23px] h-[23px]" alt="" src={PaintBrush} />
    ),
  },
  {
    id: "language",
    title: "Language",
    subtitle: "English, فارسی",
    path: "/Language", // مسیر صفحه
    icon: <img className="relative w-[23px] h-[23px]" src={Language} />,
  },
];

export const StudentSettings = () => {
  const fileInputRef = useRef(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [settings, setSettings] = useState(null);


  const loadSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings`);

      const data = await res.json();

      console.log("settings:", data);

      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  // const getUserFiles = async () => {
  //   try {
  //     const res = await fetch(`${BACKEND_URL}/api/get-user-files/`);

  //     const data = await res.json();

  //     console.log("user files:", data);

  //     if (data.photo_url) {
  //       const photoUrl = `${DGTW_URL}${data.photo_url}?t=${Date.now()}`;

  //       console.log(photoUrl);

  //       setPhotoPreview(photoUrl);
  //     }

  //     if (data.audio_url) {
  //       const audioUrl = `${DGTW_URL}${data.audio_url}?t=${Date.now()}`;
  //       console.log(audioUrl);

  //       setRecordedUrl(audioUrl);

  //       setVoiceState("uploaded");

  //       setHasAudio(true);
  //     } else {
  //       setRecordedUrl("");

  //       setVoiceState("idle");

  //       setHasAudio(false);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  useEffect(() => {
    const loadPageData = async () => {
      await loadSettings();
      // await getUserFiles();
    };

    loadPageData();
  }, []);

  const uploadPhoto = async (file) => {
    if (!file) return;

    setPhotoPreview(URL.createObjectURL(file));

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload-photo/`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      // await getUserFiles();
      // console.log("after upload");
    } catch (error) {
      console.error(error);
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
      aria-label="Teacher settings page"
    >
      <header className="sticky top-0 left-0 w-full h-11 flex justify-end bg-transparent">
        {/* <button
          type="button"
          aria-label="More options"
          className="mt-[49px] h-6 w-6"
        >
          <img
            src={menu}
            alt="More options"
            className="w-6 h-6"
          />
        </button> */}
      </header>
      <section
        className="flex-1 overflow-y-auto overflow-x-hidden pt-[10px] pb-[105px]"
        aria-label="Profile and settings"
      >
        {/* // ---------------------- Profile photo ---------------------------- */}
        <div className="flex w-[104px] h-[143px] relative mt-1.5 mx-auto flex-col items-center gap-[15px]">
          {photoPreview ? (
            <img
              className="relative self-stretch w-full rounded-full aspect-[1] object-cover"
              alt="Profile photo"
              src={photoPreview}
            />
          ) : (
            <div className="relative self-stretch w-full rounded-full aspect-[1] bg-primery-90 border-[1px] border-primery-100" />
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            aria-label="Change profile photo"
            className="absolute top-20 left-[72px] w-6 h-6"
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
          <h1 className="relative self-stretch fa-title-2 text-center text-neutral-scale1800 dark:text-neutral-scale70 [direction:rtl]">
            محیا محمدی
          </h1>
        </div>
        <div className="w-full h-[510px] flex flex-col">
          {/* // ---------------------- Name Section ---------------------- */}
          <section
            className="mx-3.5 w-auto h-[104px] relative mt-[5px] bg-neutral-scale70 dark:bg-neutral-scale1400 rounded-[13px] overflow-hidden"
            aria-labelledby="name-section-title"
          >
            <div
              id="name-section-title"
              className="absolute top-2.5 left-[15px] en-caption-3 text-primery-800 dark:text-neutral-scale70 whitespace-nowrap"
            >
              Your name
            </div>
            <div className="absolute top-10 left-[15px] fa-caption-1 text-left whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 [direction:rtl]">
              محیا
            </div>
            <div className="absolute top-[66px] left-[15px] right-[15px] border-t border-neutral-scale300 dark:border-neutral-scale1000" />
            <div className="absolute top-[74px] left-[15px] fa-caption-1 text-left whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 [direction:rtl]">
              محمدی
            </div>
          </section>

          {/* // ----------------------- Email Section ------------------------ */}
          <section
            className="text-left flex mx-3.5 w-auto h-[68px] relative mt-1.5 flex-col items-start gap-3 px-[15px] py-2.5 bg-neutral-scale70 dark:bg-neutral-scale1400 rounded-[13px] overflow-hidden"
            aria-labelledby="email-section-title"
          >
            <div
              id="email-section-title"
              className="relative self-stretch mt-[-1.00px] en-caption-3 text-primery-800 dark:text-neutral-scale70"
            >
              Your email
            </div>
            <div className="relative self-stretch fa-caption-1 text-neutral-scale1800 dark:text-neutral-scale70">
              mahyamohamdy@gmail.com
            </div>
          </section>

          {/* // ---------------- Preferences Section --------------------------- */}
          <section
            className="mx-3.5 w-auto h-[105px] relative mt-[5px] bg-neutral-scale70 dark:bg-neutral-scale1400 rounded-[13px] overflow-hidden"
            aria-label="Preferences"
          >
            <div className="flex flex-col w-[203px] items-start gap-3 pl-[5px] pr-0 py-0 relative top-[9px] left-3">
              {settingsItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className="flex items-center gap-3.5 relative self-stretch w-full flex-[0_0_auto] text-left"
                  aria-label={`${item.title}, ${item.subtitle}`}
                >
                  {item.icon}
                  <div className="flex flex-col w-36 items-start relative">
                    <div className="relative self-stretch mt-[-1.00px] en-body text-neutral-scale1800 dark:text-neutral-scale70">
                      {item.title}
                    </div>
                    <div
                      className={`relative self-stretch en-caption-2 text-neutral-scale1100 dark:text-neutral-scale300  ${
                        item.id === "language"
                          ? "text-left [direction:rtl]"
                          : ""
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <button
            type="button"
            className="mx-3.5 w-auto h-[31px] relative mt-1.5 bg-neutral-scale70 dark:bg-neutral-scale1400 rounded-[7px] overflow-hidden text-left"
            aria-label="Log out"
          >
            <div className="inline-flex items-center gap-[14px] relative top-[3px] left-[15px]">
              <img
                src={LogOut}
                alt="Log out"
                className="relative w-[25px] h-[25px]"
              />

              <div className="relative w-[85px] en-body text-neutral-scale1800 dark:text-neutral-scale70">
                Log out
              </div>
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
