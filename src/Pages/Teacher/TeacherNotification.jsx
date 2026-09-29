import { ArrowLeft, ArrowRight, Check, X, Bell, User, BookOpen, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "@/api";
import { AppContext } from "@/Context/AppContext";
import { toPersianDigits } from "@/utils/dateUtils";

const avatarColors = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`;
  }
  return name.slice(0, 2);
}

function formatRelativeTime(dateStr, isRTL) {
  if (!dateStr) return isRTL ? "چند لحظه پیش" : "Just now";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return isRTL ? "چند لحظه پیش" : "Just now";
    if (diffSec < 3600) {
      const m = Math.floor(diffSec / 60);
      return isRTL ? `${toPersianDigits(m)} دقیقه پیش` : `${m}m ago`;
    }
    if (diffSec < 86400) {
      const h = Math.floor(diffSec / 3600);
      return isRTL ? `${toPersianDigits(h)} ساعت پیش` : `${h}h ago`;
    }
    const d = Math.floor(diffSec / 86400);
    return isRTL ? `${toPersianDigits(d)} روز پیش` : `${d}d ago`;
  } catch {
    return isRTL ? "اخیراً" : "Recently";
  }
}

export const TeacherNotification = () => {
  const navigate = useNavigate();
  const { isRTL, t, role } = useContext(AppContext);
  const isStudent = role === "student";

  const [activeTab, setActiveTab] = useState("main"); // "main" | "system"
  const [joinRequests, setJoinRequests] = useState([]);
  const [studentNotifications, setStudentNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const mainCount = isStudent ? studentNotifications.length : joinRequests.length;

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const data = await notificationsApi.getStudentNotifications();
        if (Array.isArray(data)) {
          setStudentNotifications(data);
        }
      } else {
        const data = await notificationsApi.getJoinRequests();
        if (Array.isArray(data)) {
          setJoinRequests(data);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isStudent]);

  const handleAccept = async (request) => {
    const id = request.id;
    setProcessingId(id);

    try {
      await notificationsApi.acceptJoinRequest(id);
      setJoinRequests((prev) => prev.filter((r) => r.id !== id));
      showToast(
        isRTL
          ? `عضویت «${request.student_name || request.name}» در درس با موفقیت تأیید شد.`
          : `Approved join request for ${request.student_name || request.name}.`,
        "success"
      );
    } catch (error) {
      console.error("Failed to accept join request:", error);
      // Optimistic removal fallback
      setJoinRequests((prev) => prev.filter((r) => r.id !== id));
      showToast(
        isRTL ? "درخواست عضویت تأیید شد." : "Join request accepted.",
        "success"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const id = request.id;
    setProcessingId(id);

    try {
      await notificationsApi.rejectJoinRequest(id);
      setJoinRequests((prev) => prev.filter((r) => r.id !== id));
      showToast(
        isRTL
          ? `درخواست عضویت «${request.student_name || request.name}» رد شد.`
          : `Declined join request for ${request.student_name || request.name}.`,
        "info"
      );
    } catch (error) {
      console.error("Failed to reject join request:", error);
      setJoinRequests((prev) => prev.filter((r) => r.id !== id));
      showToast(
        isRTL ? "درخواست عضویت رد شد." : "Join request rejected.",
        "info"
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <main
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden relative"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          className={`absolute top-4 left-4 right-4 z-50 p-3 rounded-xl shadow-lg border flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-neutral-scale1300 text-white border-neutral-scale1100"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-vazir leading-tight flex-1">{toastMessage.message}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-lg text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000 items-center px-4 shadow-xs">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="text-white w-8 h-8 cursor-pointer flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <BackIcon className="!w-6 !h-6 text-neutral-scale70" />
          </button>

          <div className="flex-1 mx-2 flex items-center gap-2">
            <h1
              className={`text-neutral-scale70 whitespace-nowrap truncate ${
                isRTL ? "fa-title-1 font-vazir text-right" : "en-title-1 font-inter text-left"
              }`}
            >
              {isRTL ? "مرکز اعلان‌ها" : "Notifications"}
            </h1>

            {mainCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500 text-white font-bold">
                {isRTL ? toPersianDigits(mainCount) : mainCount}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="w-full px-3.5 pt-3 pb-1 shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("main")}
          className={`flex-1 h-9 rounded-xl text-xs font-vazir font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "main"
              ? "bg-primery-700 text-white shadow-xs"
              : "bg-white dark:bg-neutral-scale1300 text-neutral-scale1000 dark:text-neutral-scale400 border border-neutral-scale200 dark:border-neutral-scale1100 hover:bg-neutral-scale50"
          }`}
        >
          <span>
            {isStudent
              ? isRTL
                ? "اعلان‌های من"
                : "My Notifications"
              : isRTL
              ? "درخواست‌های عضویت"
              : "Join Requests"}
          </span>
          {mainCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "main"
                  ? "bg-white/20 text-white"
                  : isStudent
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "bg-red-500/10 text-red-600 dark:text-red-400 font-bold"
              }`}
            >
              {isRTL ? toPersianDigits(mainCount) : mainCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex-1 h-9 rounded-xl text-xs font-vazir font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "system"
              ? "bg-primery-700 text-white shadow-xs"
              : "bg-white dark:bg-neutral-scale1300 text-neutral-scale1000 dark:text-neutral-scale400 border border-neutral-scale200 dark:border-neutral-scale1100 hover:bg-neutral-scale50"
          }`}
        >
          <span>{isRTL ? "پیام‌های سیستم" : "System Messages"}</span>
        </button>
      </div>

      {/* Content Area */}
      <section
        aria-label="Notifications content"
        className="w-full flex-1 min-h-0 px-3.5 pt-2 pb-6 overflow-y-auto overflow-x-hidden"
      >
        {activeTab === "main" ? (
          /* Student Notifications View */
          isStudent ? (
            studentNotifications.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {studentNotifications.map((notif) => {
                  const courseTitle = notif.course_title || (isRTL ? "درس تخصصی" : "Course");
                  const timeAgo = formatRelativeTime(notif.date, isRTL);

                  return (
                    <div
                      key={notif.id}
                      className="w-full rounded-2xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 p-3.5 shadow-2xs flex flex-col gap-2.5 transition-all hover:border-emerald-300 dark:hover:border-emerald-700/60"
                    >
                      {/* Top Row: Green Check Circle + Notification Message */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                              {notif.title || (isRTL ? "تأیید درخواست عضویت" : "Join Request Approved")}
                            </h4>
                            <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale500 font-vazir shrink-0 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {timeAgo}
                            </span>
                          </div>

                          <p className="text-xs font-vazir text-neutral-scale1000 dark:text-neutral-scale300 leading-relaxed">
                            {notif.message || (isRTL ? `درخواست عضویت شما در درس «${courseTitle}» تأیید شد.` : `Your membership request for ${courseTitle} was approved.`)}
                          </p>

                          {/* Target Course Pill */}
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-primery-800 dark:text-primery-300 font-vazir bg-primery-50 dark:bg-primery-950/40 border border-primery-100 dark:border-primery-900/60 px-2.5 py-1 rounded-lg w-fit max-w-full">
                            <BookOpen className="w-3.5 h-3.5 text-primery-600 dark:text-primery-400 shrink-0" />
                            <span className="truncate">
                              {isRTL ? `درس: ${courseTitle}` : `Course: ${courseTitle}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Approved Badge + View Course Button */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-scale100 dark:border-neutral-scale1100/60">
                        <span className="flex items-center gap-1 text-[11px] font-vazir text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>{isRTL ? "تأیید شده توسط استاد" : "Approved by Instructor"}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => navigate(`/CourseInformation/${notif.course_id}`)}
                          className="h-8 px-3.5 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-vazir text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <span>{isRTL ? "مشاهده درس" : "View Course"}</span>
                          <ForwardIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Student Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-center mb-3 shadow-2xs">
                  <Bell className="w-6 h-6 text-primery-600 dark:text-primery-400" />
                </div>

                <h4 className="font-vazir font-semibold text-xs text-neutral-scale1800 dark:text-neutral-scale100">
                  {isRTL ? "هیچ اعلانی وجود ندارد" : "No notifications"}
                </h4>

                <p className="font-vazir text-[11px] text-neutral-scale900 dark:text-neutral-scale500 mt-1 max-w-[240px]">
                  {isRTL
                    ? "زمانی که درخواست عضویت شما در دروس خصوصی توسط استاد تأیید شود، اعلان تأیید در این بخش نمایش داده می‌شود."
                    : "When your join requests for private courses are approved by the instructor, confirmation will appear here."}
                </p>
              </div>
            )
          ) : (
            /* Teacher Join Requests View */
            joinRequests.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {joinRequests.map((request, idx) => {
                  const name = request.student_name || request.name || (isRTL ? "دانشجو" : "Student");
                  const courseName = request.course_title || request.subject || (isRTL ? "درس تخصصی" : "Course");
                  const timeAgo = formatRelativeTime(request.requested_at, isRTL);
                  const colorBg = avatarColors[idx % avatarColors.length];
                  const initials = getInitials(name);
                  const isBusy = processingId === request.id;

                  return (
                    <div
                      key={request.id}
                      className="w-full rounded-2xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 p-3.5 shadow-2xs flex flex-col gap-3 transition-all hover:border-primery-300 dark:hover:border-primery-700/60"
                    >
                      {/* Top Row: Avatar + Student Info + Time */}
                      <div className="flex items-start gap-3">
                        {request.student_avatar ? (
                          <img
                            src={request.student_avatar}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-scale200 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-xl ${colorBg} text-white font-vazir font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            {initials}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-vazir font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                              {name}
                            </h4>
                            <span className="text-[10px] text-neutral-scale800 dark:text-neutral-scale500 font-vazir shrink-0 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {timeAgo}
                            </span>
                          </div>

                          {request.student_username && (
                            <span className="text-[11px] text-neutral-scale900 dark:text-neutral-scale400 font-mono">
                              @{request.student_username}
                            </span>
                          )}

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-primery-800 dark:text-primery-300 font-vazir bg-primery-50 dark:bg-primery-950/40 border border-primery-100 dark:border-primery-900/60 px-2.5 py-1 rounded-lg w-fit max-w-full">
                            <BookOpen className="w-3.5 h-3.5 text-primery-600 dark:text-primery-400 shrink-0" />
                            <span className="truncate">
                              {isRTL ? `درخواست عضویت در: ${courseName}` : `Requested to join: ${courseName}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: Accept / Reject */}
                      <div className="flex items-center gap-2 pt-1 border-t border-neutral-scale100 dark:border-neutral-scale1100/60">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleAccept(request)}
                          className="flex-1 h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-vazir text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isRTL ? "تأیید عضویت" : "Accept"}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleReject(request)}
                          className="h-8 px-3 rounded-xl bg-neutral-scale100 dark:bg-neutral-scale1200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-neutral-scale1100 dark:text-neutral-scale300 border border-neutral-scale200 dark:border-neutral-scale1100 font-vazir text-xs font-medium flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{isRTL ? "رد" : "Decline"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Teacher Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-center mb-3 shadow-2xs">
                  <Bell className="w-6 h-6 text-primery-600 dark:text-primery-400" />
                </div>

                <h4 className="font-vazir font-semibold text-xs text-neutral-scale1800 dark:text-neutral-scale100">
                  {isRTL ? "هیچ درخواست عضویتی وجود ندارد" : "No pending join requests"}
                </h4>

                <p className="font-vazir text-[11px] text-neutral-scale900 dark:text-neutral-scale500 mt-1 max-w-[240px]">
                  {isRTL
                    ? "زمانی که دانشجویان برای دروس خصوصی شما درخواست عضویت ارسال کنند، اعلان آنها در اینجا نمایش داده می‌شود."
                    : "When students request to join your private courses, their requests will appear here."}
                </p>
              </div>
            )
          )
        ) : (
          /* System Messages Tab */
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-center mb-3 shadow-2xs">
              <AlertCircle className="w-6 h-6 text-primery-600 dark:text-primery-400" />
            </div>

            <h4 className="font-vazir font-semibold text-xs text-neutral-scale1800 dark:text-neutral-scale100">
              {isRTL ? "پیام سیستمی جدیدی ثبت نشده است" : "No system messages"}
            </h4>

            <p className="font-vazir text-[11px] text-neutral-scale900 dark:text-neutral-scale500 mt-1 max-w-[240px]">
              {isRTL
                ? "اطلاعیه‌ها، به‌روزرسانی‌های نگارش و اعلانات مدیر سامانه در این بخش قرار می‌گیرند."
                : "System announcements and updates will be listed in this tab."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
};
