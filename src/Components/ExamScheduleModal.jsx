import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Clock3,
  Calendar,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import { examsApi } from "@/api/new/exams.api";
import { toPersianDigits } from "@/utils/dateUtils";

export const ExamScheduleModal = ({
  isOpen,
  onClose,
  exam,
  onSlotChanged,
}) => {
  const { isRTL } = useContext(AppContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [slotsData, setSlotsData] = useState(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);

  const assignmentId = exam?.assignment_id || exam?.id;

  // Fetch slots on open
  useEffect(() => {
    if (!isOpen || !assignmentId) return;

    let isMounted = true;
    setLoading(true);
    setError("");

    examsApi
      .getExamSlots(assignmentId)
      .then((data) => {
        if (!isMounted) return;
        setSlotsData(data);
        if (data?.my_slot) {
          setSelectedSlotIndex(data.my_slot.slot_index);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to fetch exam slots:", err);
        setError(
          isRTL
            ? "خطا در دریافت لیست نوبت‌های آزمون."
            : "Failed to load exam time slots."
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, assignmentId, isRTL]);

  if (!isOpen) return null;

  const currentBookedIndex = slotsData?.my_slot?.slot_index;
  const isChanged =
    selectedSlotIndex !== null && selectedSlotIndex !== currentBookedIndex;

  const handleSelectSlot = (slot) => {
    if (slot.is_booked && !slot.booked_by_me) {
      return; // Cannot select other student's slot
    }
    setSelectedSlotIndex(slot.slot_index);
    setError("");
  };

  const handleConfirmReschedule = async () => {
    if (!isChanged || selectedSlotIndex === null) return;

    const chosenSlot = slotsData?.slots?.find(
      (s) => s.slot_index === selectedSlotIndex
    );
    if (!chosenSlot) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await examsApi.rescheduleStudentSlot(assignmentId, {
        slot_index: chosenSlot.slot_index,
        start_time: chosenSlot.start_time,
        end_time: chosenSlot.end_time,
      });

      onSlotChanged?.({
        assignment_id: assignmentId,
        slot_index: chosenSlot.slot_index,
        start_time: chosenSlot.start_time,
        end_time: chosenSlot.end_time,
      });

      onClose();
    } catch (err) {
      console.error("Failed to reschedule slot:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        (isRTL
          ? "این نوبت قبلاً رزرو شده یا خطایی رخ داد."
          : "Failed to reschedule slot. Please select another slot.");
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-[#121c27] rounded-2xl shadow-2xl border border-neutral-scale200 dark:border-neutral-scale1000 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-neutral-50 dark:bg-[#162330] border-b border-neutral-scale200 dark:border-neutral-scale1000">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] flex items-center justify-center shrink-0">
              <Clock3 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-vazir">
                {isRTL ? "زمان‌بندی و تغییر نوبت حضور" : "Exam Time Scheduling"}
              </h2>
              <span className="text-[10.5px] text-neutral-400 font-vazir">
                {exam?.title || "آزمون شفاهی"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scroll font-vazir">
          {/* Exam Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#f8fafc] dark:bg-[#182533]/60 border border-neutral-scale200 dark:border-neutral-scale1000 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                <CalendarDays className="w-3.5 h-3.5 text-[#2481cc]" />
                <span className="font-semibold">{isRTL ? "تاریخ برگزاری:" : "Date:"}</span>
                <span>{exam?.date || "1405/07/20"}</span>
              </div>
              <span className="text-[11px] font-medium text-neutral-500">
                {exam?.duration ? `${toPersianDigits(exam.duration)} دقیقه` : "۲۰ دقیقه"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                <Clock3 className="w-3.5 h-3.5 text-[#2481cc]" />
                <span className="font-semibold">{isRTL ? "بازه کلی باز بودن آزمون:" : "Overall Window:"}</span>
                <span className="font-bold text-[#2481cc] dark:text-[#52a2f6]">
                  {toPersianDigits(slotsData?.window_start || exam?.windowStart || "10:00")} تا{" "}
                  {toPersianDigits(slotsData?.window_end || exam?.windowEnd || "14:00")}
                </span>
              </div>
            </div>

            <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed pt-1">
              {isRTL
                ? "دانشجویان ملزم هستند صرفاً در بازه نوبت اختصاصی خود در جلسه آزمون حضور یابند. می‌توانید نوبت خود را به یکی از زمان‌های خالی جابه‌جا کنید."
                : "Students are scheduled for individual interview slots. You may change your attendance slot to any available free time."}
            </p>
          </div>

          {/* Current Booked Slot Highlight */}
          {slotsData?.my_slot && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium">
                  {isRTL ? "نوبت رزرو شده فعلی شما:" : "Your current slot:"}
                </span>
              </div>
              <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                {toPersianDigits(slotsData.my_slot.start_time)} تا{" "}
                {toPersianDigits(slotsData.my_slot.end_time)}
              </span>
            </div>
          )}

          {/* Slots Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2481cc]" />
                <span>{isRTL ? "انتخاب نوبت زمانی حضور:" : "Select Attendance Slot:"}</span>
              </span>

              {/* Status Legend */}
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {isRTL ? "نوبت شما" : "Your slot"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2481cc]" />
                  {isRTL ? "خالی" : "Available"}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  {isRTL ? "رزرو" : "Booked"}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#2481cc]" />
                <span className="text-xs text-neutral-400">
                  {isRTL ? "در حال دریافت نوبت‌ها..." : "Loading slots..."}
                </span>
              </div>
            ) : slotsData?.slots?.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                {isRTL ? "نوبتی در این بازه تعریف نشده است." : "No slots available."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slotsData?.slots?.map((slot) => {
                  const isMyCurrent = slot.booked_by_me;
                  const isOtherBooked = slot.is_booked && !slot.booked_by_me;
                  const isSelected = selectedSlotIndex === slot.slot_index;

                  return (
                    <button
                      key={slot.slot_index}
                      type="button"
                      disabled={isOtherBooked}
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 transition-all cursor-pointer relative select-none ${
                        isMyCurrent
                          ? isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                            : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40"
                          : isOtherBooked
                          ? "bg-neutral-100 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 opacity-40 cursor-not-allowed"
                          : isSelected
                          ? "bg-[#edf5fd] dark:bg-[#182533] border-[#2481cc] dark:border-[#52a2f6] shadow-sm ring-2 ring-[#2481cc]/30"
                          : "bg-white dark:bg-[#121c27] border-neutral-200 dark:border-neutral-800 hover:border-[#2481cc]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-medium text-neutral-400">
                          {isRTL ? `نوبت ${toPersianDigits(slot.slot_index + 1)}` : `Slot ${slot.slot_index + 1}`}
                        </span>

                        {isMyCurrent ? (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                            {isRTL ? "نوبت شما" : "Yours"}
                          </span>
                        ) : isOtherBooked ? (
                          <Lock className="w-3 h-3 text-neutral-400" />
                        ) : (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#edf5fd] dark:bg-[#182533] text-[#2481cc] dark:text-[#52a2f6] font-semibold">
                            {isRTL ? "آزاد" : "Free"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-center gap-1 font-bold text-xs mt-1 text-neutral-800 dark:text-neutral-100">
                        <span>{toPersianDigits(slot.start_time)}</span>
                        <span className="text-[10px] text-neutral-400 font-normal">تا</span>
                        <span>{toPersianDigits(slot.end_time)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-neutral-50 dark:bg-[#162330] border-t border-neutral-scale200 dark:border-neutral-scale1000 font-vazir">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {isRTL ? "انصراف" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleConfirmReschedule}
            disabled={!isChanged || submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[#2481cc] hover:bg-[#1b70b5] text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isRTL ? "در حال تغییر نوبت..." : "Rescheduling..."}</span>
              </>
            ) : (
              <>
                <Clock3 className="w-3.5 h-3.5" />
                <span>{isRTL ? "تأیید و جابه‌جایی نوبت" : "Confirm Slot"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default ExamScheduleModal;
