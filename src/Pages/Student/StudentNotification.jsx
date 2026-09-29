import { ArrowLeft, ArrowRight, BookOpen, Clock, CheckCircle2, AlertCircle, Bell, Check, X } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "@/api";
import { AppContext } from "@/Context/AppContext";
import { toPersianDigits } from "@/utils/dateUtils";

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

export const StudentNotification = () => {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState("my_notifications"); // "my_notifications" | "system"
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight;

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getStudentNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load student notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <main
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden relative"
      dir={isRTL ? "rtl" : "ltr"}
    >
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

            {notifications.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-vazir bg-emerald-500 text-white font-bold">
                {isRTL ? toPersianDigits(notifications.length) : notifications.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="w-full px-3.5 pt-3 pb-1 shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("my_notifications")}
          className={`flex-1 h-9 rounded-xl text-xs font-vazir font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "my_notifications"
              ? "bg-primery-700 text-white shadow-xs"
              : "bg-white dark:bg-neutral-scale1300 text-neutral-scale1000 dark:text-neutral-scale400 border border-neutral-scale200 dark:border-neutral-scale1100 hover:bg-neutral-scale50"
          }`}
        >
          <span>{isRTL ? "اعلان‌های من" : "My Notifications"}</span>
          {notifications.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-vazir font-bold ${
                activeTab === "my_notifications"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
              }`}
            >
              {isRTL ? toPersianDigits(notifications.length) : notifications.length}
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
        aria-label="Student Notifications content"
        className="w-full flex-1 min-h-0 px-3.5 pt-2 pb-6 overflow-y-auto overflow-x-hidden"
      >
        {activeTab === "my_notifications" ? (
          notifications.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {notifications.map((notif) => {
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
                  ? "زمانی که درخواست‌های عضویت شما در دروس خصوصی توسط استاد تأیید شوند، اعلان تأیید در این بخش نمایش داده می‌شود."
                  : "When your join requests for private courses are approved by the instructor, confirmation will appear here."}
              </p>
            </div>
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
                ? "اطلاعیه‌ها، به‌روزرسانی‌های سامانه و اعلانات مدیر در این بخش قرار می‌گیرند."
                : "System announcements and updates will be listed in this tab."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default StudentNotification;
