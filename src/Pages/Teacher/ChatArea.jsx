import { useId, useState, useRef, useContext, useEffect } from "react";
import { ArrowLeft, Camera, ChevronUp, X, MessageSquareQuote } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { ChatDropdownMenu } from "@/Components/ChatDropdownMenu";
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
import { TelegramQuizBottomSheet } from "@/Components/TelegramQuizBottomSheet";
import { adminApi, chatApi, voiceApi, coursesApi, studentsApi, chatHistoryApi } from "@/api";
import { resolveMediaUrl } from "@/utils/mediaUrl";
import { isPersianText } from "@/utils/textUtils";


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
    const str = String(id || "");
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return avatarColors[Math.abs(hash) % avatarColors.length];
};

const getInitials = (title) => {
    if (!title) return "";
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
    const { language, isRTL, role, currentUser, t } = useContext(AppContext);

    const isStudentRole = Boolean(
      (role && role.toLowerCase() === "student") ||
      (currentUser?.role && currentUser.role.toLowerCase() === "student") ||
      (currentUser?.user_type && currentUser.user_type.toUpperCase() === "STUDENT") ||
      localStorage.getItem("user_role") === "student"
    );

    const isTeacherViewingStudentChat = isStudentChat && !isStudentRole;

    const activeChatType = isStudentChat || isStudentRole ? "student" : "course";
    const activeTargetId = isStudentChat
      ? id
      : isStudentRole
      ? currentUser?.user_id || "ef6125a3-d179-442c-a9be-b4cd82e8ada6"
      : id || "c0000000-0000-4000-8000-000000000001";
    const activeCourseId = !isStudentChat
      ? id || "c0000000-0000-4000-8000-000000000001"
      : null;

    const chatPhotoInputRef = useRef(null);
    const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

    const handleChatPhotoUploadClick = () => {
      if (chatPhotoInputRef.current) {
        chatPhotoInputRef.current.click();
      }
    };

    const handleChatPhotoFileChange = async (event) => {
      const file = event.target.files?.[0];
      if (!file || !activeCourseId) return;

      setIsUpdatingPhoto(true);
      try {
        const res = await coursesApi.uploadCoursePhoto(activeCourseId, file);
        if (res && res.photo_url) {
          setChatEntity((prev) => ({ ...(prev || {}), photo_url: res.photo_url }));
        }
      } catch (error) {
        console.error("Course photo upload failed:", error);
      } finally {
        setIsUpdatingPhoto(false);
        event.target.value = "";
      }
    };

    const handleChatPhotoDelete = async () => {
      if (!activeCourseId) return;
      setIsUpdatingPhoto(true);
      try {
        await coursesApi.deleteCoursePhoto(activeCourseId);
        setChatEntity((prev) => ({ ...(prev || {}), photo_url: null }));
      } catch (error) {
        console.error("Course photo delete failed:", error);
      } finally {
        setIsUpdatingPhoto(false);
        setIsMenuOpen(false);
      }
    };

    const handleBack = () => {
      // If a specific return route was provided in state, navigate there
      if (location.state?.backTo) {
        navigate(location.state.backTo, { replace: true });
        return;
      }

      // If chatting with a student, return to that student's course page
      if (isStudentChat) {
        const targetLesson = location.state?.lessonId || currentStudent?.lessonId || "os";
        navigate(`/TeacherLessonsPage/${targetLesson}`, {
          replace: true,
        });
        return;
      }

      if (isStudentRole) {
        navigate("/Student", { replace: true });
        return;
      }

      // Default fallback for course chats
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
    // Real teacher name resolution directly from stored database user / course (NO mock data)
    const [teacherName, setTeacherName] = useState(() => {
      const full = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(" ").trim();
      return full || currentUser?.full_name || currentUser?.name || currentUser?.username || "";
    });

    useEffect(() => {
      let isMounted = true;
      const full = [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(" ").trim();
      const currentResolved = full || currentUser?.full_name || currentUser?.name || currentUser?.username || "";
      if (currentResolved) {
        setTeacherName(currentResolved);
        return;
      }

      // If not yet available from currentUser, fetch course teacher from backend
      const courseIdToFetch = activeCourseId || "c0000000-0000-4000-8000-000000000001";
      coursesApi.getCourseById(courseIdToFetch).then((course) => {
        if (isMounted) {
          const resolved = course?.teacher_name || course?.instructor_name || "";
          if (resolved) {
            setTeacherName(resolved);
          }
        }
      }).catch(() => {});

      return () => {
        isMounted = false;
      };
    }, [currentUser, activeCourseId]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await adminApi.getSettings();
                console.log("settings:", data);
                setSettings(data);
            } catch (err) {
                console.error("Failed to load admin settings:", err);
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
      messagesContainer: `absolute left-0 right-0 top-[60px] bottom-0 overflow-y-auto px-3 py-2 flex flex-col gap-1 ${
        isTeacherViewingStudentChat ? "pb-[68px]" : "pb-[95px]"
      }`,

      myMessageRow: "flex justify-end w-full",
      otherMessageRow: "flex justify-start w-full",

      myBubble:
        "bg-primery-100 dark:bg-primery-900 text-neutral-scale70 rounded-[18px] rounded-br-[6px] px-3 py-1.5 min-w-[75px] max-w-[75%] shadow-effects-drop-shadow-bottom",

      otherBubble:
        "bg-neutral-scale80 dark:bg-neutral-scale1400 text-neutral-scale1400 rounded-[18px] rounded-bl-[6px] px-3 py-1.5 min-w-[75px] max-w-[75%] shadow-effects-drop-shadow-bottom",

      messageText:
        "text-neutral-scale1800 dark:text-neutral-scale100 text-[14px] leading-[22px] whitespace-pre-wrap break-words",

      messageTime:
        `${isRTL ? "fa-caption-4 font-vazir" : "en-caption-4 font-inter"} text-primery-1000 dark:text-neutral-scale200 text-[10px] leading-[14px]`,

      dateContainer: `${isRTL ? "fa-caption-4 font-vazir" : "en-caption-4 font-inter"} flex justify-center my-2`,

      dateBadge:
        `${isRTL ? "fa-caption-3 font-vazir" : "en-caption-3 font-inter"} bg-primery-1000 text-neutral-scale100 px-3 py-1 text-[10px] rounded-full`,
    };

    const [chatEntity, setChatEntity] = useState(null);

    // Fetch course or student dynamically from new backend
    useEffect(() => {
        let isMounted = true;
        if (id) {
            if (isStudentChat) {
                studentsApi.getStudentById(id)
                    .then((student) => {
                        if (isMounted && student) setChatEntity(student);
                    })
                    .catch((err) => console.warn("Failed to load student:", err));
            } else {
                coursesApi.getCourseById(id)
                    .then((course) => {
                        if (isMounted && course) setChatEntity(course);
                    })
                    .catch((err) => console.warn("Failed to load course:", err));
            }
        }
        return () => {
            isMounted = false;
        };
    }, [id, isStudentChat]);

    // Load persistent chat history from backend database
    useEffect(() => {
        let isMounted = true;
        if (activeTargetId) {
            chatHistoryApi.getChatHistory(activeChatType, activeTargetId)
                .then((history) => {
                    if (isMounted) {
                        setMessages(Array.isArray(history) ? history : []);
                    }
                })
                .catch((err) => {
                    console.warn("Failed to load chat history:", err);
                    if (isMounted) setMessages([]);
                });
        }
        return () => {
            isMounted = false;
        };
    }, [activeChatType, activeTargetId]);

    const currentStudent = isStudentChat ? chatEntity : null;
    const currentCourse = !isStudentChat ? chatEntity : null;
    const currentChat = chatEntity;
    const chatTitle = currentChat?.title || currentChat?.name || (isStudentChat ? "گفت‌وگو با دانشجو" : "گفت‌وگو با درس");

    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [isQuizMinimized, setIsQuizMinimized] = useState(false);

    const courseDisplayName = (currentCourse?.title || currentChat?.title || chatTitle || "")
      .replace(/گفت‌وگو\s*(با)?\s*/g, "")
      .trim();
    const quizBarTitle = courseDisplayName ? `کوییز ${courseDisplayName}` : (t("osQuiz") || "کوییز سیستم عامل");

    const handleOpenQuiz = () => {
      setIsQuizOpen(true);
      setIsQuizMinimized(false);
    };

    const handleCloseQuiz = () => {
      setIsQuizOpen(false);
      setIsQuizMinimized(false);
    };

    const toggleAI = () => {
        setAiEnabled(prev => !prev);
    };

    // ClearHistory with server persistence
    const handleClearHistory = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to clear the chat history?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await chatHistoryApi.clearChatHistory(activeChatType, activeTargetId);
        } catch (err) {
            console.warn("Failed to clear chat history on server:", err);
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
            const blob = await chatApi.generatePdf(pdfMessages);

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

        ws.current = voiceApi.createSTTWebSocket({
            onOpen: () => console.log("[WS] Connected"),
            onTranscript: (msg) => {
                if (msg) setMessage(msg);
                console.log("[WS]", msg);
            },
            onError: (e) => console.error("[WS] Error:", e),
            onClose: () => console.log("[WS] Closed"),
        });

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

    const handleFeedback = async (messageId, feedback) => {
      if (isTeacherViewingStudentChat) return;

      const targetMsg = messages.find((m) => m.id === messageId);
      const newFeedback = targetMsg?.feedback === feedback ? null : feedback;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;

          return {
            ...msg,
            feedback: newFeedback,
          };
        }),
      );

      try {
        await chatHistoryApi.submitMessageFeedback(messageId, newFeedback);
      } catch (err) {
        console.warn("Feedback submission error:", err);
      }
    };

    const handleAddComment = async (messageId, commentText) => {
      try {
        const res = await chatHistoryApi.addMessageComment(messageId, teacherName, commentText);
        const newComment = res?.comment || {
          id: String(Date.now()),
          teacher_name: teacherName,
          comment: commentText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long" }),
        };

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              const prevComments = Array.isArray(msg.comments) ? msg.comments : [];
              return {
                ...msg,
                comments: [...prevComments, newComment],
              };
            }
            return msg;
          })
        );
      } catch (err) {
        console.warn("Error adding comment:", err);
      }
    };

    const handleDeleteComment = async (messageId, commentId) => {
      // Optimistically remove comment from messages state right when motion completes
      setMessages((prev) =>
        prev.map((msg) => {
          if (String(msg.id) === String(messageId)) {
            const prevComments = Array.isArray(msg.comments) ? msg.comments : [];
            return {
              ...msg,
              comments: prevComments.filter((c) => String(c.id) !== String(commentId)),
            };
          }
          return msg;
        })
      );

      try {
        await chatHistoryApi.deleteMessageComment(messageId, commentId);
      } catch (err) {
        console.warn("Error deleting comment:", err);
      }
    };

    const sendMessage = async () => {
        if (!message.trim() || isLoading) return;

        const userMessageText = message;
        const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
        const optimisticMessage = {
            id: tempId,
            text: userMessageText,
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

        setMessages((prev) => [...prev, optimisticMessage]);

        setMessage("");
        setIsTyping(false);
        setIsLoading(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = "37px";
            textareaRef.current.parentElement.style.height = "39px";
        }

        let aiText = "";
        let isError = false;

        try {
            // Query legacy AI backend server directly as before
            const answer = await chatApi.askAI({
                query: userMessageText,
                contexts: "",
                language,
                llmModel,
                courseName: chatTitle,
                teacherName,
            });

            aiText = String(answer || t("noServerResponse"));
        } catch (error) {
            console.error("Chat Error:", error);
            isError = true;

            const errorDetail =
                error?.response?.data?.detail ??
                error?.data?.detail ??
                error?.originalError?.response?.data?.detail;

            aiText = errorDetail
                ? (typeof errorDetail === "string" ? errorDetail : JSON.stringify(errorDetail))
                : "مشکلی در ارتباط با سرور به وجود آمد.";
        }

        const aiMsgId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1);
        const aiMessage = {
            id: aiMsgId,
            text: aiText,
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

        setMessages((prev) => [...prev, aiMessage]);

        if (!isError && aiEnabled && aiText) {
            playTTSBytes(aiText);
        }

        // Persist both user prompt and response (or error message) to new backend history database
        try {
            const saveRes = await chatHistoryApi.saveConversationTurn(activeChatType, activeTargetId, {
                text: userMessageText,
                answer: aiText,
                courseName: chatTitle,
                language,
            });

            if (saveRes?.userMessage?.id && saveRes?.aiMessage?.id) {
                setMessages((prev) =>
                    prev.map((msg) => {
                        if (msg.id === tempId) return { ...msg, id: saveRes.userMessage.id };
                        if (msg.id === aiMsgId) return { ...msg, id: saveRes.aiMessage.id };
                        return msg;
                    })
                );
            }
        } catch (saveErr) {
            console.warn("Failed to persist conversation turn to new backend history:", saveErr);
        } finally {
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
            // Instantiate AudioContext on demand
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext created:", audioCtxRef.current);
                // Resume AudioContext if suspended by browser autoplay policy
                if (audioCtxRef.current.state === "suspended") {
                    console.log("Resuming AudioContext...");
                    await audioCtxRef.current.resume();
                }
                nextStartRef.current = audioCtxRef.current.currentTime + 0.1;
            }

            const res = await voiceApi.streamTTS(text);
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

                    // Process X-PCM header on initial chunk
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

                    // Ensure 4-byte alignment for 32-bit float audio buffer
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
        <header
          className="absolute top-0 left-0 w-full h-[65px] flex z-50"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="w-full h-[65px] bg-neutral-scale70 dark:bg-neutral-scale1400 border-b dark:border-neutral-scale1000 relative flex items-center px-2.5">
            {/* Back Button */}
            <button
              onClick={handleBack}
              aria-label={t("back")}
              className="w-8 h-8 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <ArrowLeft
                className={`!w-6 !h-6 dark:text-neutral-scale70 ${
                  isRTL ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Hidden file input for course photo upload */}
            <input
              ref={chatPhotoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleChatPhotoFileChange}
            />

            {/* Avatar */}
            <div
              className={`mx-2 shrink-0 flex items-center justify-center ${
                !isStudentChat && !isStudentRole ? "cursor-pointer group relative" : ""
              }`}
              onClick={() => {
                if (!isStudentChat && !isStudentRole) {
                  navigate(`/TeacherCourseDoc/${activeCourseId}`);
                }
              }}
              title={
                !isStudentChat && !isStudentRole
                  ? isRTL
                    ? "تنظیمات و تغییر عکس درس"
                    : "Course settings & photo"
                  : undefined
              }
            >
              {isStudentChat ? (
                currentStudent?.photo_url ? (
                  <img
                    className="w-[38px] h-[38px] rounded-full object-cover"
                    src={resolveMediaUrl(currentStudent.photo_url)}
                    alt={currentStudent?.title || "Student"}
                  />
                ) : (
                  <div
                    className={`w-[38px] h-[38px] rounded-full flex items-center justify-center ${getAvatarColor(
                      currentStudent?.id || id,
                    )} text-white fa-caption-3`}
                  >
                    {getInitials(currentStudent?.title || currentStudent?.name || "")}
                  </div>
                )
              ) : (
                <div className="relative w-[38px] h-[38px] rounded-full overflow-hidden border border-neutral-scale200 dark:border-neutral-scale1000 shadow-sm">
                  <img
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    src={resolveMediaUrl(currentCourse?.photo_url) || AI}
                    alt={chatTitle || "Course"}
                    onError={(e) => {
                      e.currentTarget.src = AI;
                    }}
                  />
                  {!isStudentRole && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-3.5 h-3.5 text-white drop-shadow" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <h1
              dir={isPersianText(chatTitle) ? "rtl" : (isRTL ? "rtl" : "ltr")}
              className={`flex-1 min-w-0 truncate ${
                isPersianText(chatTitle)
                  ? "fa-title-3 font-vazir"
                  : (isRTL ? "fa-title-3 font-vazir" : "en-title-3 font-inter")
              } ${isRTL ? "text-right" : "text-left"} dark:text-neutral-scale70 ${
                !isStudentChat && !isStudentRole ? "cursor-pointer" : ""
              }`}
              onClick={() => {
                if (!isStudentChat && !isStudentRole) {
                  navigate(`/TeacherCourseDoc/${activeCourseId}`);
                }
              }}
            >
              {chatTitle}
            </h1>

            {/* Actions: AI Toggle & Menu */}
            <div className="flex items-center gap-2 shrink-0">
              {/* AI Toggle */}
              <button
                type="button"
                onClick={toggleAI}
                aria-label={t("toggleAi")}
                className={`w-7 h-7 flex items-center justify-center transition-all duration-300 ${
                  aiEnabled ? "scale-125 animate-pulse" : "scale-100"
                }`}
              >
                {aiEnabled ? (
                  <AIenable className="!w-6 !h-6" />
                ) : (
                  <AIdisable className="!w-6 !h-6 [--icon-bg:black] [--icon-fg:white] dark:[--icon-bg:white] dark:[--icon-fg:black]" />
                )}
              </button>

              {/* Menu Button */}
              <button
                onClick={() => setIsMenuOpen(true)}
                aria-label={t("menu")}
                className="w-7 h-7 flex items-center justify-center cursor-pointer"
              >
                <Menu className="!w-7 !h-7 dark:text-neutral-scale70" />
              </button>
            </div>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div
                className={`absolute top-[18px] ${
                  isRTL ? "left-2" : "right-2"
                } z-50`}
              >
                <ChatDropdownMenu
                  onClearHistory={handleClearHistory}
                  onDownloadPdf={handleDownloadPDF}
                  onCourseSettings={
                    !isStudentChat && !isStudentRole
                      ? () => {
                          setIsMenuOpen(false);
                          navigate(`/TeacherCourseDoc/${activeCourseId}`);
                        }
                      : undefined
                  }
                  onChangePhoto={
                    !isStudentChat && !isStudentRole
                      ? () => {
                          setIsMenuOpen(false);
                          handleChatPhotoUploadClick();
                        }
                      : undefined
                  }
                  onDeletePhoto={
                    !isStudentChat && !isStudentRole
                      ? handleChatPhotoDelete
                      : undefined
                  }
                  hasPhoto={Boolean(currentCourse?.photo_url)}
                  isCourseChat={!isStudentChat && !isStudentRole}
                />
              </div>
            )}
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
            <div
              className={`bg-neutral-scale600 text-white px-3 py-1 rounded-full ${
                isRTL ? "fa-caption-2" : "text-xs"
              } animate-pulse`}
            >
              🎙 {t("recording")}
            </div>
          </div>
        )}

        {/* Messages */}
        <ChatMessages
          messages={messages}
          classNames={classNames}
          isLoading={isLoading}
          onFeedback={handleFeedback}
          canComment={isTeacherViewingStudentChat}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          teacherName={teacherName}
          readOnlyFeedback={isTeacherViewingStudentChat}
        />

        {/* Input / Review Mode Bar */}
        {isTeacherViewingStudentChat ? (
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-[15px] w-[calc(100%-24px)] max-w-[390px] h-[44px] z-50 bg-white/95 dark:bg-neutral-scale1400/95 backdrop-blur-md rounded-[20px] border border-primery-300/60 dark:border-sky-500/40 shadow-sm flex items-center justify-center px-4 gap-2 text-primery-700 dark:text-sky-300 select-none animate-in fade-in duration-300"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <MessageSquareQuote className="w-4 h-4 shrink-0 text-primery-600 dark:text-sky-400" />
            <span className="text-xs font-semibold font-vazir truncate">
              {t("studentChatReviewMode")}
            </span>
          </div>
        ) : (
          <>
            {/* Input */}
            <form
              className={`absolute left-1/2 -translate-x-1/2 ${
                isQuizOpen && isQuizMinimized ? "bottom-[54px]" : "bottom-[15px]"
              } w-[calc(100%-24px)] max-w-[390px] min-h-[39px] z-50 bg-white dark:bg-neutral-scale1400 rounded-[20px] border border-neutral-scale100 dark:border-neutral-scale1100 transition-all duration-300`}
              dir={isRTL ? "rtl" : "ltr"}
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <label htmlFor={composerInputId} className="sr-only">
                {t("message")}
              </label>

              {/* Dynamic typing font & direction detection */}
              {(() => {
                const isTypedPersian = /[\u0600-\u06FF]/.test(message);
                const textareaFontClass = message
                  ? (isTypedPersian ? "fa-body font-vazir" : "en-body font-inter")
                  : (isRTL ? "fa-body font-vazir" : "en-body font-inter");
                const textareaDir = message
                  ? (isTypedPersian ? "rtl" : "ltr")
                  : (isRTL ? "rtl" : "ltr");
                const textareaAlign = message
                  ? (isTypedPersian ? "text-right" : "text-left")
                  : (isRTL ? "text-right" : "text-left");

                return (
                  <textarea
                    id={composerInputId}
                    ref={textareaRef}
                    dir={textareaDir}
                    value={message}
                    placeholder={t("writeMessage")}
                    rows={1}
                    className={`absolute bottom-0 w-full ${
                      isRTL
                        ? "right-0 pr-[18px] pl-[84px]"
                        : "left-0 pl-[18px] pr-[84px]"
                    } pt-[7px] pb-[7px] resize-none overflow-y-hidden whitespace-pre-wrap break-words ${textareaFontClass} ${textareaAlign} text-black dark:text-neutral-scale100 dark:placeholder:text-neutral-scale600 leading-[24px]`}
                    style={{
                      minHeight: "37px",
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
                );
              })()}

              {/* Send / Mic button */}
              <button
                type="button"
                className={`absolute bottom-[1px] ${
                  isRTL ? "left-[1px]" : "right-[1px]"
                } w-[35px] h-[35px] transition-all duration-300 flex items-center justify-center cursor-pointer ${
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
                  <Send
                    className={`!w-[35px] !h-[35px] ${isRTL ? "scale-x-[-1]" : ""}`}
                  />
                ) : (
                  <Microphon className="!w-[35px] !h-[35px] text-primery-500 transition-all duration-300" />
                )}
              </button>

              {/* Quiz button */}
              <button
                type="button"
                onClick={handleOpenQuiz}
                aria-label={quizBarTitle}
                title={quizBarTitle}
                className={`absolute bottom-[6.5px] ${
                  isRTL ? "left-12" : "right-12"
                } w-7 h-7 flex items-center justify-center cursor-pointer`}
              >
                <Quiz className="!w-8 !h-8 text-warning-900 dark:text-neutral-scale70" />
              </button>
            </form>

            {/* Telegram Mini App Minimized Docked Bar (Below typing section) */}
            {isQuizOpen && isQuizMinimized && (
              <div
                onClick={() => setIsQuizMinimized(false)}
                dir={isRTL ? "rtl" : "ltr"}
                className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[calc(100%-24px)] max-w-[390px] h-[38px] z-50 bg-white/95 dark:bg-neutral-scale1300/95 backdrop-blur-md rounded-2xl border border-primery-500/30 dark:border-sky-500/30 shadow-md shadow-primery-900/10 flex items-center justify-between px-3 cursor-pointer select-none transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] animate-in slide-in-from-bottom-2 fade-in"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-6 h-6 rounded-lg bg-gradient-to-tr from-primery-600 to-sky-400 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Quiz className="w-3.5 h-3.5" />
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-scale1300 animate-pulse" />
                  </div>

                  {/* Title: کوییز سیستم عامل */}
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 truncate font-vazir">
                    {quizBarTitle}
                  </span>

                  {/* Status Tag */}
                  <span className="text-[10px] font-medium text-primery-700 dark:text-sky-400 bg-primery-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-full border border-primery-200/50 dark:border-sky-800/40 truncate">
                    {t("inProgressQuiz") || "در حال اجرا"}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsQuizMinimized(false);
                    }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-primery-600 dark:hover:text-sky-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title={t("expandQuiz") || "بزرگ کردن"}
                    aria-label={t("expandQuiz") || "بزرگ کردن"}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseQuiz();
                    }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title={t("closeQuiz") || "بستن"}
                    aria-label={t("closeQuiz") || "بستن"}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Telegram Mini App Bottom Sheet Modal */}
            <TelegramQuizBottomSheet
              isOpen={isQuizOpen}
              isMinimized={isQuizMinimized}
              onMinimize={() => setIsQuizMinimized(true)}
              onExpand={() => setIsQuizMinimized(false)}
              onClose={handleCloseQuiz}
              courseTitle={courseDisplayName}
            />
          </>
        )}

        {/* Footer blur */}
        <footer className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[55px] flex bg-transparent backdrop-blur-[1px] pointer-events-none" />
      </main>
    );
};



