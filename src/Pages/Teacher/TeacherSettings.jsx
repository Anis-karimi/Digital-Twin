import { Link, useNavigate } from "react-router-dom";
import "@/styles/fonts.css";
import Camera from "@/assets/icons/Camera.svg";
import ResourseManagment from "@/assets/icons/ResourseManagment.svg";
import LogOut from "@/assets/icons/Log_Out.svg";
import Language from "@/assets/icons/Language.svg";
import PaintBrush from "@/assets/icons/paint-brush.svg";
import TrashFull from "@/assets/icons/Trash_Full.svg?react";
import { Mic, Play, Pause } from "lucide-react";
import { useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "@/Context/AppContext";
import { adminApi, userApi, voiceApi } from "@/api";

const settingsItems = [
  {
    id: "Courses Information",
    titleKey: "coursesInformation",
    subtitleKey: "uploadResources",
    path: "/TeacherResource",
    icon: (
      <img
        src={ResourseManagment}
        alt="Resource Management"
        className="w-[23px] h-[23px] object-contain"
      />
    ),
  },
  {
    id: "theme",
    titleKey: "theme",
    subtitleKey: "darkLight",
    path: "/Theme",
    icon: (
      <img className="w-[23px] h-[23px] object-contain" alt="" src={PaintBrush} />
    ),
  },
  {
    id: "language",
    titleKey: "language",
    subtitleKey: "englishPersian",
    path: "/Language",
    icon: <img className="w-[23px] h-[23px] object-contain" alt="Language" src={Language} />,
  },
];

export const TeacherSettings = () => {
  const { isRTL, logoutUser, t } = useContext(AppContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [voiceState, setVoiceState] = useState("idle");
  const [recordTime, setRecordTime] = useState(0);
  const [waveform, setWaveform] = useState([]);
  const [audioStatus, setAudioStatus] = useState("");
  const [hasAudio, setHasAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const [settings, setSettings] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState("");

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadSettings = async () => {
    try {
      const data = await adminApi.getSettings();
      console.log("settings:", data);
      setSettings(data);
    } catch (err) {
      console.error("Failed to load admin settings:", err);
    }
  };

  const getUserFiles = async () => {
    try {
      const data = await userApi.getUserFiles();
      console.log("user files:", data);

      if (data?.photo_url) {
        setPhotoPreview(data.photo_url);
      }

      if (data?.audio_url) {
        setRecordedUrl(data.audio_url);
        setVoiceState("uploaded");
        setHasAudio(true);
      } else {
        setRecordedUrl("");
        setVoiceState("idle");
        setHasAudio(false);
      }
    } catch (error) {
      console.error("Failed to get user files:", error);
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      await loadSettings();
      await getUserFiles();
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

  const handleVoiceButton = () => {
    switch (voiceState) {
      case "idle":
        startRecording();
        break;

      case "recording":
        stopRecording();
        break;

      case "recorded":
        playRecordedAudio();
        break;

      case "uploading":
        break;

      case "uploaded":
        playRecordedAudio();
        break;

      default:
        break;
    }
  };

  const uploadAudioFile = async (wavBlob) => {
    setAudioStatus("Uploading...");

    try {
      await voiceApi.uploadAudio(wavBlob);
      setAudioStatus("Uploaded");
      await getUserFiles();
    } catch (err) {
      console.error("Upload audio error:", err);
      setAudioStatus("Upload failed");
    }
  };

  const deleteAudio = async () => {
    try {
      await voiceApi.deleteAudio();

      // Refresh user files status from backend
      await getUserFiles();

      // Clear previous audio player
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setRecordedBlob(null);
      setIsPlaying(false);
      setWaveform([]);
      setRecordTime(0);
      setAudioStatus("");
    } catch (error) {
      console.error("Delete audio error:", error);
    }
  };

  const sendRecordedAudio = async () => {
    if (!recordedBlob) return;

    try {
      setVoiceState("uploading");

      await uploadAudioFile(recordedBlob);

      setVoiceState("uploaded");
    } catch (error) {
      console.error(error);

      // Reset state to recorded so user can retry
      setVoiceState("recorded");
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    streamRef.current = stream;

    audioChunksRef.current = [];

    const recorder = new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size) {
        audioChunksRef.current.push(e.data);
      }
    };

    // -------- TIMER --------
    setRecordTime(0);

    timerRef.current = setInterval(() => {
      setRecordTime((prev) => prev + 1);
    }, 1000);

    // -------- WAVEFORM --------
    const audioContext = new AudioContext();

    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();

    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);

    source.connect(analyser);

    analyser.fftSize = 32;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateWaveform = () => {
      if (!analyserRef.current) return;

      analyser.getByteFrequencyData(dataArray);

      const volume = Math.max(...dataArray);
      console.log(volume);

      setWaveform((prev) => [...prev.slice(-35), Math.max(volume / 3, 3)]);

      requestAnimationFrame(updateWaveform);
    };

    updateWaveform();

    // -------- START RECORD --------
    recorder.start();

    setRecording(true);
    setVoiceState("recording");
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    // -------- STOP TIMER --------
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // -------- STOP WAVEFORM --------
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    mediaRecorderRef.current.onstop = async () => {
      setAudioStatus("Ready");

      const blob = new Blob(audioChunksRef.current);

      const wavBlob = await convertToWavTarget(blob, 24000);

      setRecordedBlob(wavBlob);

      setRecordedUrl(URL.createObjectURL(wavBlob));

      setHasAudio(true);

      cleanupMic();
    };

    mediaRecorderRef.current.stop();
  };

  const cleanupMic = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;

    audioChunksRef.current = [];

    setRecording(false);
    setVoiceState("recorded");
  };

  async function convertToWavTarget(input, targetSampleRate) {
    const arrayBuffer = input.arrayBuffer ? await input.arrayBuffer() : input;
    const ctx = new AudioContext();
    const decoded = await ctx.decodeAudioData(arrayBuffer);

    const offline = new OfflineAudioContext(
      1,
      decoded.duration * targetSampleRate,
      targetSampleRate,
    );

    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);

    const rendered = await offline.startRendering();
    return encodeWAV(rendered, targetSampleRate);
  }

  function encodeWAV(buffer, sampleRate) {
    const samples = buffer.getChannelData(0);
    const pcm16 = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      pcm16[i] = Math.max(-1, Math.min(1, samples[i])) * 0x7fff;
    }

    const wav = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(wav);

    const write = (o, s) =>
      [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));

    write(0, "RIFF");
    view.setUint32(4, 36 + pcm16.length * 2, true);
    write(8, "WAVE");
    write(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    write(36, "data");
    view.setUint32(40, pcm16.length * 2, true);

    pcm16.forEach((v, i) => view.setInt16(44 + i * 2, v, true));
    return new Blob([view], { type: "audio/wav" });
  }

  const renderVoiceIcon = () => {
    switch (voiceState) {
      case "recording":
        return (
          <div className="w-[32px] h-[32px] rounded-full border-[1.5px] border-error-600 flex items-center justify-center text-error-600 animate-pulse">
            <Mic className="w-[18px] h-[18px]" />
          </div>
        );

      case "recorded":
        if (isPlaying) {
          return (
            <div className="w-[32px] h-[32px] rounded-full border-[1.5px] border-error-600 flex items-center justify-center text-error-600 transition-colors">
              <Pause className="w-[15px] h-[15px] fill-current" />
            </div>
          );
        }

        return (
          <div className="w-[32px] h-[32px] rounded-full border-[1.5px] border-primery-500 dark:border-primery-90 flex items-center justify-center text-primery-500 dark:text-primery-90 transition-colors">
            <Play className="w-[15px] h-[15px] " />
          </div>
        );

      case "uploaded":
        if (isPlaying) {
          return (
            <div className="w-[32px] h-[32px] rounded-full border-[1.5px] border-error-600 flex items-center justify-center text-error-600 transition-colors">
              <Pause className="w-[15px] h-[15px] fill-current" />
            </div>
          );
        }

        return (
          <div className="w-[32px] h-[32px] rounded-full border-[1.5px] border-primery-500 dark:border-primery-90 flex items-center justify-center text-primery-500 dark:text-primery-90 transition-colors">
            <Play className="w-[15px] h-[15px]" />
          </div>
        );

      default:
        return (
          <div className="w-[32px] h-[32px] rounded-full border-[1.5px] border-primery-500 dark:border-primery-90 flex items-center justify-center text-primery-500 dark:text-primery-90 transition-colors">
            <Mic className="w-[18px] h-[18px]" />
          </div>
        );
    }
  };

  const playRecordedAudio = () => {
    if (!recordedUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(recordedUrl);

      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const getSendButtonStyle = () => {
    switch (voiceState) {
      case "idle":
      case "recording":
        return {
          text: t("send"),
          className:
            "bg-neutral-scale300 text-neutral-scale700 cursor-not-allowed",
          disabled: true,
        };

      case "recorded":
        return {
          text: t("send"),
          className: "bg-primery-600 text-white active:scale-95",
          disabled: false,
        };

      case "uploading":
        return {
          text: t("uploadingEllipsis"),
          className: "bg-warning-500 text-white animate-pulse",
          disabled: true,
        };

      case "uploaded":
        return {
          text: t("uploadedExclamation"),
          className: "bg-success-600 text-white",
          disabled: true,
        };

      default:
        return {
          text: t("send"),
          className: "bg-neutral-scale300 text-neutral-scale700",
          disabled: true,
        };
    }
  };
  const sendButton = getSendButtonStyle();

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <main
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] mx-auto flex flex-col h-dvh overflow-hidden"
      aria-label={t("teacherSettingsPage")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <header className="sticky top-0 left-0 w-full h-8 flex justify-end bg-transparent" />
      <section
        className="flex-1 overflow-y-auto overflow-x-hidden pt-[10px] pb-[105px]"
        aria-label={t("profileAndSettings")}
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
            aria-label={t("changeProfilePhoto")}
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
            محمد اله‌بخش
          </h1>
        </div>

        <div className="w-full flex flex-col gap-2">
          {/* // ---------------------- Name Section ---------------------- */}
          <section
            className="mx-3.5 w-auto h-[104px] relative bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden px-4 py-2.5 flex flex-col justify-between"
            aria-labelledby="name-section-title"
          >
            <div
              id="name-section-title"
              className={`text-primery-800 dark:text-neutral-scale70 whitespace-nowrap ${
                isRTL ? "fa-caption-3 text-right" : "en-caption-3 text-left"
              }`}
            >
              {t("yourName")}
            </div>
            <div
              className={`fa-caption-1 whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              محمد
            </div>
            <div className="w-full border-t border-neutral-scale300 dark:border-neutral-scale1000 my-0.5" />
            <div
              className={`fa-caption-1 whitespace-nowrap text-neutral-scale1800 dark:text-neutral-scale70 ${
                isRTL ? "text-right" : "text-left"
              }`}
            >
              اله‌بخش
            </div>
          </section>

          {/* // ----------------------- Email Section ------------------------ */}
          <section
            className="flex mx-3.5 w-auto h-[68px] relative flex-col justify-between px-4 py-2.5 bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden"
            aria-labelledby="email-section-title"
          >
            <div
              id="email-section-title"
              className={`text-primery-800 dark:text-neutral-scale70 ${
                isRTL ? "fa-caption-3 text-right" : "en-caption-3 text-left"
              }`}
            >
              {t("yourEmail")}
            </div>
            <div
              className={`fa-caption-1 text-neutral-scale1800 dark:text-neutral-scale70 ${
                isRTL ? "text-right" : "text-left"
              }`}
              dir="ltr"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              dr.allahbakhsh@gmail.com
            </div>
          </section>

          {/* // ----------------- Voice Section --------------------- */}
          <section
            className="flex mx-3.5 w-auto relative flex-col gap-1.5"
            aria-labelledby="voice-sample-title"
          >
            <div className="w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden p-3 flex flex-col gap-2.5">
              <div
                id="voice-sample-title"
                className={`text-primery-800 dark:text-neutral-scale70 whitespace-nowrap ${
                  isRTL ? "fa-caption-3 text-right" : "en-caption-3 text-left"
                }`}
              >
                {t("uploadVoiceSample")}
              </div>

              <div className="w-full flex items-center gap-2" dir="ltr">
                <div className="flex flex-1 min-w-[120px] h-[32px] items-center gap-2 pl-0 pr-3 bg-neutral-scale70 dark:bg-neutral-scale1300 rounded-full border border-solid border-neutral-scale100 dark:border-neutral-scale1100 relative">
                  <button
                    type="button"
                    onClick={handleVoiceButton}
                    aria-label={t("recordVoiceSample")}
                    className="w-[32px] h-[32px] shrink-0 flex items-center justify-center cursor-pointer hover:opacity-80 active:scale-95 transition-all -ml-[1px]"
                  >
                    {renderVoiceIcon()}
                  </button>

                  <div className="flex items-center gap-[2px] h-[26px] flex-1 min-w-0 overflow-hidden">
                    {waveform.map((item, index) => (
                      <div
                        key={index}
                        style={{ height: `${item}px` }}
                        className="w-[2px] bg-primery-800 dark:bg-primery-90 rounded"
                      />
                    ))}
                  </div>

                  <div className="text-primery-1000 dark:text-primery-90 en-caption-4 shrink-0">
                    {formatTime(recordTime)}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={sendRecordedAudio}
                    disabled={sendButton.disabled}
                    className={`h-[26px] px-3 ${
                      isRTL ? "fa-caption-4" : "en-caption-4"
                    } rounded-full flex items-center justify-center transition-all duration-300 ease-in-out cursor-pointer ${
                      sendButton.className
                    }`}
                  >
                    {sendButton.text}
                  </button>
                  <button
                    type="button"
                    onClick={deleteAudio}
                    aria-label={t("deletePreviousAudio")}
                    className="w-[22px] h-[22px] flex items-center justify-center cursor-pointer text-neutral-scale600 hover:text-red-500 transition-colors"
                  >
                    <TrashFull className="w-full h-full object-contain" />
                  </button>
                </div>
              </div>
            </div>

            <p
              className={`px-1 ${
                isRTL ? "fa-caption-4 text-right" : "en-caption-4 text-left"
              } text-neutral-scale1800 dark:text-neutral-scale300 leading-relaxed`}
            >
              {t("voiceRecordingHelp")}
            </p>
          </section>

          {/* // ---------------- Preferences Section --------------------------- */}
          <section
            className="mx-3.5 w-auto relative mt-2 bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden p-3.5"
            aria-label={t("preferences")}
          >
            <div className="flex flex-col w-full gap-3.5">
              {settingsItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3.5 w-full ${
                    isRTL ? "flex-row text-right" : "flex-row text-left"
                  }`}
                  aria-label={`${t(item.titleKey)}, ${t(item.subtitleKey)}`}
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
                      {t(item.titleKey)}
                    </div>
                    <div
                      className={`w-full truncate text-neutral-scale1100 dark:text-neutral-scale300 ${
                        isRTL ? "fa-caption-2" : "en-caption-2"
                      }`}
                    >
                      {t(item.subtitleKey)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* // ---------------- Log out Button --------------------------- */}
          <button
            type="button"
            onClick={() => {
              if (logoutUser) logoutUser();
              navigate("/login");
            }}
            className="mx-3.5 w-auto h-[38px] relative mt-1.5 bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[8px] overflow-hidden cursor-pointer hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 transition-colors"
            aria-label={t("logout")}
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
                {t("logout")}
              </span>
            </div>
          </button>
        </div>
      </section>
    </main>
  );
};
