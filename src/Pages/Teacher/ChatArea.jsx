import { useId, useState, useRef, useContext, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import "@/styles/Allpages.css";
import "@/styles/fonts.css"
import { ChatDropdownMenu } from "@/Components/ChatDropdownMenu";
import { courses } from "@/data/courses";
import { students } from "@/data/students";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";

import AI from "@/assets/images/AI.png";
import AIdisable from "@/assets/icons/AIdisable.svg?react";
import AIenable from "@/assets/icons/AIenable.svg?react";
import Microphon from "@/assets/icons/Microphon.svg?react";
import Menu from "@/assets/icons/menu.svg?react";
import Background from "@/assets/images/Background1.png";
import DarkBackground from "@/assets/images/DarkBackground2.jpg";
import Quiz from "@/assets/icons/quiz-icon1.svg?react";
import Send from "@/assets/icons/Send.svg?react";

import { ChatMessages } from "@/Components/ChatMessages";
import { BACKEND_URL, DGTW_URL } from "@/Services/BackendConfige";


const avatarColors = [
    "bg-red-400",
    "bg-orange-400",
    "bg-amber-400",
    "bg-yellow-400",
    "bg-lime-400",
    "bg-green-400",
    "bg-emerald-400",
    "bg-teal-400",
    "bg-cyan-400",
    "bg-sky-400",
    "bg-blue-400",
    "bg-indigo-400",
    "bg-violet-400",
    "bg-purple-400",
    "bg-fuchsia-400",
    "bg-pink-400",
    "bg-rose-400",
    "bg-red-500",
    "bg-blue-500",
    "bg-purple-500",
];

const getAvatarColor = (id) => {
    let hash = 0;

    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getInitials = (title) => {
    const words = title.trim().split(/\s+/);

    if (words.length >= 2) {
        return `${words[0][0]}\u200C${words[1][0]}`;
    }

    return words[0]?.[0] || "";
};

export const ChatArea = () => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [recording, setRecording] = useState(false);
    // const [transcript, setTranscript] = useState("");

    const composerInputId = useId();
    const navigate = useNavigate();
    const [aiEnabled, setAiEnabled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { id } = useParams();
    const location = useLocation();
    const isStudentChat = location.pathname.startsWith("/ChatArea/student/");
    
    const handleBack = () => {
      // اگر مسیر برگشت مشخص شده، همان را استفاده کن
      if (location.state?.backTo) {
        navigate(location.state.backTo, { replace: true });
        return;
      }

      // اگر چت مربوط به یک دانشجوست،
      // lessonId همان دانشجو را پیدا کن
      if (isStudentChat && currentStudent?.lessonId) {
        navigate(`/TeacherLessonsPage/${currentStudent.lessonId}`, {
          replace: true,
        });
        return;
      }

      // اگر چت Course بود و backTo نداشت
      navigate("/", { replace: true });
    };

    const textareaRef = useRef(null);

    const ws = useRef(null);
    const processor = useRef(null);
    const audioCtx = useRef(null);
    const streamRef = useRef(null);
    const recordingRef = useRef(false);
    const audioCtxRef = useRef(null);
    const nextStartRef = useRef(0);
    const leftoverRef = useRef(new Uint8Array(0));
    const sampleRateRef = useRef(22050);

    const [settings, setSettings] = useState(null);

    const { language } = useContext(AppContext);
    const [llmModel] = useState("gemma4");
    const [teacherName] = useState("Teacher");

    useEffect(() => {

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


        loadSettings();

    }, []);

    useEffect(() => {
        if (!textareaRef.current) return;

        const el = textareaRef.current;

        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";

        el.parentElement.style.height =
            el.scrollHeight + "px";

    }, [message]);


    // ⚡ Downsample function to 16kHz
    function downsample(buffer, inputRate, outputRate) {
        if (outputRate === inputRate) return buffer;
        const ratio = inputRate / outputRate;
        const newLen = Math.round(buffer.length / ratio);
        const result = new Float32Array(newLen);
        let offset = 0;
        for (let i = 0; i < newLen; i++) {
            const next = Math.round((i + 1) * ratio);
            let sum = 0,
                count = 0;
            for (let j = offset; j < next && j < buffer.length; j++) {
                sum += buffer[j];
                count++;
            }
            result[i] = sum / count;
            offset = next;
        }
        return result;
    }

    const classNames = {
      messagesContainer:
        "absolute left-0 right-0 top-[60px] bottom-0 overflow-y-auto px-3 py-2 flex flex-col gap-1 pb-[95px]",

      myMessageRow: "flex justify-end w-full",
      otherMessageRow: "flex justify-start w-full",

      myBubble:
        "bg-primery-100 dark:bg-primery-900 text-neutral-scale70 rounded-[18px] rounded-br-[6px] px-3 py-1.5 max-w-[75%] shadow-effects-drop-shadow-bottom",

      otherBubble:
        "bg-neutral-scale80 dark:bg-neutral-scale1400 text-neutral-scale1400 rounded-[18px] rounded-bl-[6px] px-3 py-1.5 max-w-[75%] shadow-effects-drop-shadow-bottom",

      messageText:
        "text-neutral-scale1800 dark:text-neutral-scale100 fa-body text-[14px] leading-[22px] whitespace-pre-wrap break-words",

      messageTime:
        "en-caption-4 text-primery-1000 dark:text-neutral-scale200 text-[10px] leading-[14px]",

      dateContainer: "en-caption-4 flex justify-center my-2",

      dateBadge:
        "en-caption-3 bg-primery-1000 text-neutral-scale100 px-3 py-1 text-[10px] rounded-full",
    };

    const currentCourse = courses.find(
        (item) => String(item.id) === String(id)
    );

    const currentStudent = students.find(
        (item) => String(item.id) === String(id)
    );

    const currentChat = isStudentChat
        ? currentStudent
        : currentCourse;

    const chatTitle = currentChat?.title || "Chat";

    const toggleAI = () => {
        setAiEnabled(prev => !prev);
    };

    // ClearHistory
    const handleClearHistory = () => {
        const confirmed = window.confirm(
            "Are you sure you want to clear the chat history?"
        );

        if (!confirmed) {
            return;
        }

        setMessages([]);
        setIsMenuOpen(false);
    };

    // DownloadPDF
    const handleDownloadPDF = async () => {
        if (messages.length === 0) {
            alert("No messages!");
            return;
        }

        const pdfMessages = messages.map((message) => ({
            role: message.sender === "me" ? "user" : "assistant",
            content: message.text,
        }));

        try {
            const res = await fetch(`${BACKEND_URL}/api/generate-pdf/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: pdfMessages,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }

            const blob = await res.blob();

            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "chat_history.pdf";

            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url);

            setIsMenuOpen(false);
        } catch (err) {
            console.error("Download PDF Error:", err);
            alert("Failed to download PDF");
        }
    };

    const startRecording = async () => {
        if (recordingRef.current) return;

        console.log("🎙 Starting recording...");

        setRecording(true);
        recordingRef.current = true;


        setMessage("");
        setIsTyping(false);

        ws.current = new WebSocket("wss://172.20.13.39:8881/ws");

        ws.current.onopen = () => {
            console.log("[WS] Connected");
        };

        ws.current.onmessage = (e) => {
          const data = JSON.parse(e.data);

          const msg = data.text || data.result || data.transcript || "";

          if (msg) {
            setMessage(msg.trim());
          }

          console.log("[WS]", msg);
        };

        ws.current.onerror = (e) => {

            console.error("[WS]", e);

        };

        ws.current.onclose = () => {

            console.log("[WS] Closed");

        };

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        streamRef.current = stream;

        audioCtx.current = new AudioContext();

        const source =
            audioCtx.current.createMediaStreamSource(stream);

        const proc =
            audioCtx.current.createScriptProcessor(4096, 1, 1);

        processor.current = proc;

        source.connect(proc);

        const silent =
            audioCtx.current.createGain();

        silent.gain.value = 0;

        proc.connect(silent);
        silent.connect(audioCtx.current.destination);

        proc.onaudioprocess = (e) => {

            console.log("🎤 Audio chunk");

            if (!recordingRef.current) return;
            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;


            if (!recordingRef.current) return;

            if (
                !ws.current ||
                ws.current.readyState !== WebSocket.OPEN
            )
                return;

            let input =
                e.inputBuffer.getChannelData(0);

            input = downsample(
                input,
                audioCtx.current.sampleRate,
                16000
            );

            const buf = new Int16Array(input.length);

            for (let i = 0; i < input.length; i++) {
                buf[i] =
                    Math.max(-1, Math.min(1, input[i])) *
                    32767;
            }

            ws.current.send(buf.buffer);
        };
    };

    const stopRecording = () => {
        if (!recordingRef.current) return;

        console.log("🛑 Stopping recording...");

        recordingRef.current = false;
        setRecording(false);

        setIsTyping(message.trim().length > 0);

        processor.current?.disconnect();
        audioCtx.current?.close();
        audioCtx.current = null;
        processor.current = null;
        ws.current = null;

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: "stop" }));
            ws.current.close();
        }
    };

    const handleFeedback = (messageId, feedback) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;

          return {
            ...msg,
            feedback: msg.feedback === feedback ? null : feedback,
          };
        }),
      );
    };

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const newMessage = {
            id: Date.now(),
            text: message,
            sender: "me",
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),
            date: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long"
            })
        };

        setMessages((prev) => [...prev, newMessage]);

        const userMessage = message;

        setMessage("");
        setIsTyping(false);
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = "37px";
            textareaRef.current.parentElement.style.height = "39px";
        }
        try {
            const chatHistory = [...messages, newMessage].map(msg => ({
                role: msg.sender === "me" ? "user" : "assistant",
                content: msg.text
            }));

            const formData = new FormData();

            formData.append("query", userMessage);

            formData.append(
                "contexts",
                ""
            );

            formData.append("language", language);

            formData.append(
                "llm_model",
                llmModel
            );

            formData.append(
                "courseName",
                chatTitle
            );

            formData.append(
                "teacherName",
                teacherName
            );

            const response = await axios.post(
                `${BACKEND_URL}/api/ask`,
                formData
            );

            console.log("API RESPONSE =>", response.data);

            const answer =
                response.data?.answer ||
                response.data?.response ||
                response.data?.message ||
                response.data?.data ||
                response.data;

            const aiMessage = {
              id: Date.now() + 1,
              text: String(answer || "پاسخی از سرور دریافت نشد."),
              sender: "other",
              feedback: null,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              date: new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
              }),
            };

            setMessages(prev => [...prev, aiMessage]);
            if (aiEnabled) {
                playTTSBytes(String(answer || ""));
            }

        } catch (error) {
            console.error("API Error:", error);

            console.log(
                "Error Response:",
                error.response?.data
            );

            console.log(
                "Status:",
                error.response?.status
            );

            const errorMessage = {
                id: Date.now() + 1,
                text:
                    error.response?.data?.detail
                        ? JSON.stringify(error.response.data.detail)
                        : "مشکلی در ارتباط با سرور به وجود آمد.",
                sender: "other",
                time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }),
                date: new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long"
                })
            };

            setMessages(prev => [
                ...prev,
                errorMessage
            ]);
        }
        finally {
            setIsLoading(false);
        }
    };

    const concatUint8 = (a, b) => {
        const out = new Uint8Array(a.byteLength + b.byteLength);
        out.set(a, 0);
        out.set(b, a.byteLength);
        return out;
    };

    const playTTSBytes = async (text) => {
        if (!aiEnabled || !text) {
            console.log("AI voice disabled or text empty.");
            return;
        }

        try {
            // ⚡️ ایجاد AudioContext در صورت نیاز
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext created:", audioCtxRef.current);
                // برخی مرورگرها نیاز دارند کاربر interaction انجام داده باشد
                if (audioCtxRef.current.state === "suspended") {
                    console.log("Resuming AudioContext...");
                    await audioCtxRef.current.resume();
                }
                nextStartRef.current = audioCtxRef.current.currentTime + 0.1;
            }

            const fd = new FormData();
            fd.append("text", text);

            const res = await fetch(`${DGTW_URL}/tts_stream`, {
                method: "POST",
                body: fd
            });
            if (!res.body) throw new Error("Streaming not supported");

            const reader = res.body.getReader();
            let leftover = leftoverRef.current;
            let seq = 0;

            const processLoop = async () => {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    seq += 1;

                    let chunkBytes = value ? new Uint8Array(value) : new Uint8Array(0);
                    if (leftover.byteLength > 0) {
                        chunkBytes = concatUint8(leftover, chunkBytes);
                        leftover = new Uint8Array(0);
                    }

                    // پردازش header X-PCM
                    if (seq === 1) {
                        const txt = new TextDecoder("ascii").decode(chunkBytes.subarray(0, Math.min(128, chunkBytes.length)));
                        if (txt.startsWith("X-PCM:")) {
                            const nl = txt.indexOf("\n");
                            if (nl >= 0) {
                                const headerLine = txt.slice(0, nl).trim();
                                headerLine.replace("X-PCM:", "").split(";").forEach(pair => {
                                    const [k, v] = pair.split("=").map(s => s.trim());
                                    if (k === "sample_rate") sampleRateRef.current = parseInt(v);
                                });
                                chunkBytes = chunkBytes.subarray(nl + 1);
                            } else {
                                leftover = chunkBytes;
                                continue;
                            }
                        }
                    }

                    // بررسی leftover برای 4-byte alignment
                    const rem = chunkBytes.byteLength % 4;
                    if (rem !== 0) {
                        leftover = chunkBytes.subarray(chunkBytes.byteLength - rem);
                        chunkBytes = chunkBytes.subarray(0, chunkBytes.byteLength - rem);
                    }
                    if (chunkBytes.byteLength === 0) continue;

                    const floatBuf = new Float32Array(chunkBytes.buffer, chunkBytes.byteOffset, chunkBytes.byteLength / 4);

                    const buffer = audioCtxRef.current.createBuffer(1, floatBuf.length, sampleRateRef.current);
                    buffer.getChannelData(0).set(floatBuf);

                    const source = audioCtxRef.current.createBufferSource();
                    source.buffer = buffer;
                    source.connect(audioCtxRef.current.destination);

                    const scheduledTime = Math.max(nextStartRef.current, audioCtxRef.current.currentTime + 0.05);
                    source.start(scheduledTime);

                    nextStartRef.current = scheduledTime + buffer.duration;
                }
            };

            await processLoop();
            console.log("TTS streaming finished.");
        } catch (err) {
            console.error("playTTSBytes error:", err);
        }
    };

    const isPersianTitle = /[\u0600-\u06FF]/.test(chatTitle || "");


    return (
      <main className="w-full md:w-[360px] h-dvh relative mx-auto overflow-hidden">
        {/* Background */}
        <section className="absolute top-0 left-0 w-full h-full">
          <img
            className="top-0 left-0 w-full h-full absolute object-cover block dark:hidden"
            src={Background}
            alt=""
          />

          <img
            className="top-0 left-0 w-full h-full absolute object-cover hidden dark:block"
            src={DarkBackground}
            alt=""
          />
        </section>

        {/* Header */}
        <header className="absolute top-0 left-0 w-full h-[65px] flex z-50">
          <div className="w-full h-[65px] bg-neutral-scale70 dark:bg-neutral-scale1400 border-b dark:border-neutral-scale1000  relative">
            {/* Back */}
            <button
              onClick={handleBack}
              className="absolute top-1/2 -translate-y-1/2 left-2.5 w-6 h-6 flex items-center justify-center"
            >
              <ArrowLeft className="!w-6 !h-6 dark:text-neutral-scale70" />
            </button>

            {/* Avatar */}
            {isStudentChat ? (
              currentStudent.photo_url ? (
                <img
                  className="absolute top-1/2 -translate-y-1/2 left-[61px] w-[38px] h-[38px] rounded-full object-cover"
                  src={currentStudent.photo_url}
                  alt={currentStudent.title}
                />
              ) : (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 left-[61px] w-[38px] h-[38px] rounded-full flex items-center justify-center ${getAvatarColor(currentStudent.id)} text-white fa-caption-3`}
                >
                  {getInitials(currentStudent.title)}
                </div>
              )
            ) : (
              <img
                className="absolute top-1/2 -translate-y-1/2 left-[61px] w-[38px] h-[38px] rounded-full object-cover"
                src={AI}
                alt="AI"
              />
            )}

            {/* Title */}
            <h1
              dir={isPersianTitle ? "rtl" : "ltr"}
              className="absolute top-1/2 -translate-y-1/2 left-[108px] w-[150px] truncate fa-title-3 dark:text-neutral-scale70 text-left cursor-pointer"
            >
              {chatTitle}
            </h1>

            {/* Menu */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="absolute top-1/2 -translate-y-1/2 right-3 w-7 h-7"
            >
              <Menu className="!w-7 !h-7 dark:text-neutral-scale70" />
            </button>

            {isMenuOpen && (
              <div className="absolute top-[20px] right-3 z-50">
                <ChatDropdownMenu
                  onClearHistory={handleClearHistory}
                  onDownloadPdf={handleDownloadPDF}
                />
              </div>
            )}

            {/* AI Toggle */}
            <button
              type="button"
              onClick={toggleAI}
              className={`absolute top-1/2 -translate-y-1/2 right-14 w-6 h-6 transition-all duration-300
        ${aiEnabled ? "scale-125 animate-pulse" : "scale-100"}
      `}
            >
              {aiEnabled ? (
                <AIenable className="!w-6 !h-6" />
              ) : (
                <AIdisable className="!w-6 !h-6 [--icon-bg:black] [--icon-fg:white] dark:[--icon-bg:white] dark:[--icon-fg:black]" />
              )}
            </button>
          </div>
        </header>

        {/* Menu Back Drop */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
        {recording && (
          <div className="absolute bottom-[95px] left-1/2 -translate-x-1/2 z-50">
            <div className="bg-neutral-scale600 text-white px-3 py-1 rounded-full text-xs animate-pulse">
              🎙 Recording...
            </div>
          </div>
        )}

        {/* Messages */}
        <ChatMessages
          messages={messages}
          classNames={classNames}
          isLoading={isLoading}
          onFeedback={handleFeedback}
        />

        {/* Input */}
        <form
          className="absolute left-1/2 -translate-x-1/2 bottom-[15px] w-[calc(100%-24px)] max-w-[390px] min-h-[39px] z-50 bg-white dark:bg-neutral-scale1400 rounded-[20px] border border-neutral-scale100 dark:border-neutral-scale1100"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <label htmlFor={composerInputId} className="sr-only">
            Message
          </label>

          <textarea
            id={composerInputId}
            ref={textareaRef}
            dir="ltr"
            value={message}
            placeholder={"Message"}
            rows={1}
            className="absolute bottom-0 left-0 w-full pr-[78px] pl-[19.6px] pt-[7px] pb-[7px] resize-none overflow-y-hidden whitespace-pre-wrap break-words fa-body-large text-black dark:text-neutral-scale100 dark:placeholder:text-neutral-scale600 leading-[24px]"
            style={{
              minHeight: "37px",
              textAlign: "left",
              resize: "none",
            }}
            onChange={(event) => {
              const value = event.target.value;

              setMessage(value);
              setIsTyping(value.length > 0);

              if (!value && textareaRef.current) {
                textareaRef.current.style.height = "37px";
                textareaRef.current.parentElement.style.height = "39px";
              }
            }}
            onInput={(e) => {
              const el = e.target;

              el.style.height = "auto";
              el.style.height = el.scrollHeight + "px";

              el.parentElement.style.height = el.scrollHeight + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading || recording}
          />

          <button
            type="button"
            className={`absolute bottom-[1px] right-[1px] w-[35px] h-[35px] transition-all duration-300 ${
              recording ? "animate-pulse" : ""
            }`}
            onClick={() => {
              if (recording) {
                stopRecording();
                return;
              }

              if (isTyping) {
                sendMessage();
                return;
              }

              startRecording();
            }}
          >
            {recording ? (
              <Microphon className="text-red-500 !w-[35px] !h-[35px] animate-pulse scale-110" />
            ) : isTyping ? (
              <Send className="!w-[35px] !h-[35px]" />
            ) : (
              <Microphon className="!w-[35px] !h-[35px] text-primery-500 transition-all duration-300" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem(
                "quizReturnToChat",
                JSON.stringify({
                  chatPath: location.pathname + location.search,
                  chatBackTo:
                    location.state?.backTo ||
                    (isStudentChat && currentStudent?.lessonId
                      ? `/TeacherLessonsPage/${currentStudent.lessonId}`
                      : "/"),
                }),
              );

              navigate("/QuizFirstPage");
            }}
            className="absolute bottom-[6.5px] right-12 w-7 h-7"
          >
            <Quiz className="!w-8 !h-8 text-warning-900 dark:text-neutral-scale70" />
          </button>
        </form>

        {/* Footer blur */}
        <footer className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[55px] flex bg-transparent backdrop-blur-[1px]" />
      </main>
    );
};



