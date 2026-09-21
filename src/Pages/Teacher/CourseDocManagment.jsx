import { useId, useRef, useState, useEffect, useContext } from "react";
import {
  ArrowLeft,
  Pencil,
  Save,
  Calendar,
  Trash2,
  FileUp,
  FileText,
  Lock,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useNavigate, useParams } from "react-router-dom";
import { contextsApi, coursesApi } from "@/api";
import { AppContext } from "@/Context/AppContext";
import { DatePickerModal } from "@/Components/Common/DatePickerModal";
import { formatDisplayDate } from "@/utils/dateUtils";
import AI from "@/assets/images/AI.png";
import courseImage from "@/assets/images/course.jpg";

const DEFAULT_COURSE = {
  name: "سیستم عامل",
  startDate: "2026-03-01",
  endDate: "2026-07-01",
  description:
    "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی",
  accessLevel: "private",
};

export const TeacherCourseDoc = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const { isRTL } = useContext(AppContext);

  // Typography font helper classes based on active language/direction
  const titleClass = isRTL ? "fa-title-1 font-vazir" : "en-title-1 font-inter";
  const bodyClass = isRTL ? "fa-body-medium font-vazir" : "en-body-medium font-inter";
  const captionClass = isRTL ? "fa-caption-1 font-vazir" : "en-caption-1 font-inter";
  const textAlign = isRTL ? "text-right" : "text-left";

  // Files state (backed by old server contextsApi)
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Course Details state (backed by new server coursesApi with authentic mock default)
  const [courseDetails, setCourseDetails] = useState({ ...DEFAULT_COURSE });
  const [courseTitle, setCourseTitle] = useState(DEFAULT_COURSE.name);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...DEFAULT_COURSE });
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // DatePicker modal state
  const [datePickerConfig, setDatePickerConfig] = useState({
    isOpen: false,
    field: null,
    title: "",
    currentValue: "",
  });

  const accessRadioGroupId = useId();

  // Load documents from the old backend
  const loadDocuments = async () => {
    try {
      const data = await contextsApi.getDocuments();
      const apiFiles = (Array.isArray(data) ? data : []).map((item, index) => ({
        id: Date.now() + index,
        name: item,
      }));
      setFiles(apiFiles);
    } catch (error) {
      console.error("Loading documents failed:", error);
    }
  };

  // Load course details from the new backend
  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      coursesApi
        .getCourseDetails(id)
        .then((data) => {
          if (isMounted && data) {
            const loaded = {
              name: data.name || data.nameFa || data.nameEn || DEFAULT_COURSE.name,
              startDate: data.startDate || DEFAULT_COURSE.startDate,
              endDate: data.endDate || DEFAULT_COURSE.endDate,
              description: data.description ?? DEFAULT_COURSE.description,
              accessLevel: (data.accessLevel || DEFAULT_COURSE.accessLevel).toLowerCase(),
            };
            setCourseDetails(loaded);
            setEditForm(loaded);
            setCourseTitle(loaded.name);
          }
        })
        .catch((err) => {
          console.warn("Failed to load course details from new server:", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  // File upload and deletion handlers (old server)
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    setUploadingFile(true);
    try {
      for (const file of selectedFiles) {
        await contextsApi.uploadDocument(file);
      }
      const nextFiles = selectedFiles.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
      }));
      setFiles((prev) => [...prev, ...nextFiles]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingFile(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (file) => {
    try {
      await contextsApi.deleteDocuments([file.name]);
      setFiles((prev) => prev.filter((item) => item.id !== file.id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  // Editing handlers
  const handleStartEdit = () => {
    setEditForm({ ...courseDetails });
    setIsEditing(true);
    setFeedback({ type: "", message: "" });
  };

  const handleCancelEdit = () => {
    setEditForm({ ...courseDetails });
    setIsEditing(false);
    setFeedback({ type: "", message: "" });
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setFeedback({ type: "", message: "" });

    try {
      // Course name is strictly preserved (non-editable)
      await coursesApi.updateCourseDetails(id, {
        name: courseDetails.name,
        description: editForm.description,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        accessLevel: editForm.accessLevel,
      });

      const updated = {
        ...editForm,
        name: courseDetails.name,
      };
      setCourseDetails(updated);
      setIsEditing(false);
      setFeedback({
        type: "success",
        message: isRTL
          ? "اطلاعات درس با موفقیت ذخیره شد"
          : "Course details saved successfully",
      });

      setTimeout(() => {
        setFeedback({ type: "", message: "" });
      }, 4000);
    } catch (error) {
      console.error("Error saving course details:", error);
      setFeedback({
        type: "error",
        message: isRTL
          ? "خطا در ذخیره‌سازی اطلاعات در سرور جدید"
          : "Failed to save details on the new server",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // DatePicker trigger handlers
  const openDatePicker = (field) => {
    const isStart = field === "startDate";
    setDatePickerConfig({
      isOpen: true,
      field,
      title: isStart
        ? isRTL
          ? "انتخاب تاریخ شروع درس"
          : "Select Start Date"
        : isRTL
        ? "انتخاب تاریخ پایان درس"
        : "Select End Date",
      currentValue: editForm[field] || courseDetails[field],
    });
  };

  const handleDateSelected = (isoDate) => {
    if (datePickerConfig.field) {
      setEditForm((prev) => ({
        ...prev,
        [datePickerConfig.field]: isoDate,
      }));
      if (!isEditing) {
        setIsEditing(true);
      }
    }
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col"
    >
      {/* Header */}
      <header className="w-full h-[65px] -mt-px flex shrink-0">
        <div className="w-full h-[65px] relative flex items-center justify-between px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label={isRTL ? "بازگشت" : "Go back"}
            className="text-white w-8 h-8 flex items-center justify-center cursor-pointer shrink-0"
          >
            <ArrowLeft
              className={`!w-6 !h-6 text-neutral-scale70 ${
                isRTL ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Course Title Header - Always authentic Persian formatting */}
          <h1
            dir="rtl"
            className="flex-1 mx-2 text-white fa-title-1 font-vazir truncate text-right [direction:rtl]"
          >
            {courseTitle || courseDetails.name || "سیستم عامل"}
          </h1>

          {/* Course Status Toggle - Modern Switch */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label={isRTL ? "تغییر وضعیت دوره" : "Toggle course status"}
              onClick={() => setNotificationsEnabled((prev) => !prev)}
              className={`relative inline-flex h-[22px] w-[40px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                notificationsEnabled
                  ? "bg-emerald-400"
                  : "bg-neutral-scale500 dark:bg-neutral-scale1000"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  notificationsEnabled
                    ? isRTL
                      ? "-translate-x-[18px]"
                      : "translate-x-[18px]"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <section
        className="w-full flex-1 min-h-0 px-3.5 pt-2.5 pb-20 overflow-y-auto overflow-x-hidden"
        aria-label={isRTL ? "محتوای درس" : "Course content"}
      >
        <div className="w-full flex flex-col gap-3">
          {/* Feedback Banner */}
          {feedback.message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className={captionClass}>{feedback.message}</span>
            </div>
          )}

          {/* Section: Course Documents / Upload (Old Server) */}
          <section
            className="w-full shrink-0"
            aria-label={isRTL ? "اسناد درس" : "Course documents"}
          >
            <div className="relative w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-4 px-4">
              {/* Upload Button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={uploadingFile}
                  className="inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  aria-label={isRTL ? "بارگذاری فایل جدید" : "Upload New File"}
                >
                  <FileUp className="w-5 h-5 text-primery-700 dark:text-neutral-scale70" />
                  <span
                    className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 whitespace-nowrap`}
                  >
                    {uploadingFile
                      ? isRTL
                        ? "در حال بارگذاری..."
                        : "Uploading..."
                      : isRTL
                      ? "بارگذاری فایل جدید"
                      : "Upload New File"}
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label={isRTL ? "انتخاب فایل‌ها برای بارگذاری" : "Choose files to upload"}
                />
              </div>

              {/* Files List */}
              <div className="mt-4 w-full">
                {files.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-dashed border-neutral-scale300 dark:border-neutral-scale1000 bg-neutral-scale80/60 dark:bg-neutral-scale1400/40 text-center transition-all">
                    <div className="w-10 h-10 rounded-full bg-primery-50 dark:bg-neutral-scale1200 flex items-center justify-center mb-2 text-primery-700 dark:text-neutral-scale300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className={`text-xs font-medium text-neutral-scale1000 dark:text-neutral-scale300 ${captionClass}`}>
                      {isRTL
                        ? "می‌توانید جزوات، اسلایدها و فایل‌های آموزشی خود را در این بخش قرار دهید."
                        : "You can place your course pamphlets, slides, and educational files here."}
                    </p>
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      disabled={uploadingFile}
                      className={`mt-2.5 text-xs font-semibold text-primery-700 dark:text-neutral-scale70 hover:underline inline-flex items-center gap-1.5 cursor-pointer ${captionClass}`}
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      <span>{isRTL ? "انتخاب و بارگذاری جزوه جدید" : "Upload new document"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[10px] border border-neutral-scale100 dark:border-neutral-scale1100 bg-neutral-scale80 dark:bg-neutral-scale1400 transition-colors duration-200 hover:bg-neutral-scale50 dark:hover:bg-neutral-scale1200"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-primery-700 dark:text-neutral-scale300 shrink-0" />
                          <a
                            href={contextsApi.getDownloadUrl(file.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`min-w-0 flex-1 truncate cursor-pointer text-xs font-medium text-neutral-scale1800 dark:text-neutral-scale70 hover:underline ${textAlign} ${captionClass}`}
                            title={file.name}
                          >
                            {file.name}
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(file)}
                          aria-label={`${isRTL ? "حذف" : "Delete"} ${file.name}`}
                          className="shrink-0 w-7 h-7 rounded-[7px] flex items-center justify-center bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale800 dark:text-neutral-scale200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section: Course Information Header & Edit Actions */}
          <div className="flex items-center justify-between px-1 mt-1">
            <h2 className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 font-semibold`}>
              {isRTL ? "مشخصات درس" : "Course Details"}
            </h2>

            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-primery-50 dark:bg-neutral-scale1200 text-primery-700 dark:text-neutral-scale70 border border-primery-200 dark:border-neutral-scale1000 hover:bg-primery-100 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className={captionClass}>{isRTL ? "ویرایش" : "Edit"}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-scale1000 dark:text-neutral-scale300 hover:bg-neutral-scale200 dark:hover:bg-neutral-scale1200 transition-colors cursor-pointer"
                >
                  <span className={captionClass}>{isRTL ? "انصراف" : "Cancel"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-primery-700 hover:bg-primery-800 text-white shadow-sm transition-colors cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span className={captionClass}>
                    {isSaving
                      ? isRTL
                        ? "در حال ذخیره..."
                        : "Saving..."
                      : isRTL
                      ? "ذخیره"
                      : "Save"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Card 0: Course Display Photo (Used in Chat & Lists) */}
          <section
            aria-labelledby="course-photo-label"
            className="w-full relative flex items-center gap-3.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-neutral-scale200 dark:border-neutral-scale1000 shadow-sm bg-neutral-scale100 dark:bg-neutral-scale1200">
              <img
                src={courseDetails.photo_url || AI}
                alt={courseDetails.name || "Course"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = courseImage;
                }}
              />
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <ImageIcon className="w-4 h-4 text-white drop-shadow" />
              </div>
            </div>

            <div className={`flex flex-col min-w-0 flex-1 ${textAlign}`}>
              <div className="flex items-center gap-1.5">
                <h3
                  id="course-photo-label"
                  className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
                >
                  {isRTL ? "تصویر نمایشی درس" : "Course Display Image"}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primery-50 dark:bg-neutral-scale1200 text-primery-700 dark:text-neutral-scale300">
                  {isRTL ? "در گفت‌وگو" : "In Chat"}
                </span>
              </div>
              <p
                className={`text-[11px] text-neutral-scale800 dark:text-neutral-scale400 mt-0.5 leading-tight ${captionClass}`}
              >
                {isRTL
                  ? "تصویر آواتار درس که در صفحه گفتگو و فهرست دروس نمایش داده می‌شود"
                  : "The avatar picture shown in student chats and course lists"}
              </p>
            </div>
          </section>

          {/* Card 1: Course Name (Non-Editable, Always Persian text & formatting) */}
          <section
            aria-labelledby="course-name-label"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="course-name-label"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "نام درس" : "Course Name"}
            </h3>

            <p
              dir="rtl"
              className="w-full text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium font-vazir fa-body-medium text-right [direction:rtl]"
            >
              {courseDetails.name || "سیستم عامل"}
            </p>
          </section>

          {/* Card 2: Course Start Date */}
          <section
            aria-labelledby="course-start-date-label"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <div className="flex items-center justify-between w-full">
              <h3
                id="course-start-date-label"
                className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
              >
                {isRTL ? "تاریخ شروع درس" : "Course Start Date"}
              </h3>
              <button
                type="button"
                onClick={() => openDatePicker("startDate")}
                aria-label={isRTL ? "انتخاب تاریخ شروع" : "Select start date"}
                className="text-primery-700 dark:text-neutral-scale70 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => openDatePicker("startDate")}
              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                isEditing
                  ? "border border-primery-300 dark:border-neutral-scale900 bg-neutral-scale80 dark:bg-neutral-scale1400 hover:bg-neutral-scale100"
                  : "bg-transparent hover:bg-neutral-scale80 dark:hover:bg-neutral-scale1200"
              }`}
            >
              <span
                className={`text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium ${captionClass}`}
              >
                {formatDisplayDate(
                  isEditing ? editForm.startDate : courseDetails.startDate,
                  isRTL
                )}
              </span>

              <span className="text-[11px] text-neutral-scale700 dark:text-neutral-scale400 font-mono">
                {isEditing ? editForm.startDate : courseDetails.startDate}
              </span>
            </button>
          </section>

          {/* Card 3: Course End Date */}
          <section
            aria-labelledby="course-end-date-label"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <div className="flex items-center justify-between w-full">
              <h3
                id="course-end-date-label"
                className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
              >
                {isRTL ? "تاریخ پایان درس" : "Course End Date"}
              </h3>
              <button
                type="button"
                onClick={() => openDatePicker("endDate")}
                aria-label={isRTL ? "انتخاب تاریخ پایان" : "Select end date"}
                className="text-primery-700 dark:text-neutral-scale70 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => openDatePicker("endDate")}
              className={`w-full flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                isEditing
                  ? "border border-primery-300 dark:border-neutral-scale900 bg-neutral-scale80 dark:bg-neutral-scale1400 hover:bg-neutral-scale100"
                  : "bg-transparent hover:bg-neutral-scale80 dark:hover:bg-neutral-scale1200"
              }`}
            >
              <span
                className={`text-xs text-neutral-scale1800 dark:text-neutral-scale70 font-medium ${captionClass}`}
              >
                {formatDisplayDate(
                  isEditing ? editForm.endDate : courseDetails.endDate,
                  isRTL
                )}
              </span>

              <span className="text-[11px] text-neutral-scale700 dark:text-neutral-scale400 font-mono">
                {isEditing ? editForm.endDate : courseDetails.endDate}
              </span>
            </button>
          </section>

          {/* Card 4: Access Level */}
          <section
            aria-labelledby="course-access-level-label"
            className="w-full relative flex flex-col items-start gap-2 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <h3
              id="course-access-level-label"
              className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
            >
              {isRTL ? "سطح دسترسی درس" : "Course Access Level"}
            </h3>

            <fieldset className="flex items-center gap-6 border-0 p-0 m-0">
              <legend className="sr-only">
                {isRTL ? "انتخاب سطح دسترسی" : "Select course access level"}
              </legend>

              {/* Private Option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="relative w-4 h-4 rounded-full border border-neutral-scale1800 dark:border-neutral-scale70 flex items-center justify-center">
                  <input
                    type="radio"
                    name={accessRadioGroupId}
                    value="private"
                    checked={
                      (isEditing ? editForm.accessLevel : courseDetails.accessLevel) ===
                      "private"
                    }
                    onChange={() => {
                      if (!isEditing) setIsEditing(true);
                      setEditForm((prev) => ({ ...prev, accessLevel: "private" }));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {(isEditing ? editForm.accessLevel : courseDetails.accessLevel) ===
                    "private" && (
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full bg-neutral-scale1800 dark:bg-neutral-scale70"
                    />
                  )}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs text-neutral-scale1800 dark:text-neutral-scale70 ${captionClass}`}
                >
                  <Lock className="w-3 h-3 text-neutral-scale700 dark:text-neutral-scale400" />
                  <span>{isRTL ? "خصوصی" : "Private"}</span>
                </span>
              </label>

              {/* Public Option */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="relative w-4 h-4 rounded-full border border-neutral-scale1800 dark:border-neutral-scale70 flex items-center justify-center">
                  <input
                    type="radio"
                    name={accessRadioGroupId}
                    value="public"
                    checked={
                      (isEditing ? editForm.accessLevel : courseDetails.accessLevel) ===
                      "public"
                    }
                    onChange={() => {
                      if (!isEditing) setIsEditing(true);
                      setEditForm((prev) => ({ ...prev, accessLevel: "public" }));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {(isEditing ? editForm.accessLevel : courseDetails.accessLevel) ===
                    "public" && (
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full bg-neutral-scale1800 dark:bg-neutral-scale70"
                    />
                  )}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs text-neutral-scale1800 dark:text-neutral-scale70 ${captionClass}`}
                >
                  <Globe className="w-3 h-3 text-neutral-scale700 dark:text-neutral-scale400" />
                  <span>{isRTL ? "عمومی" : "Public"}</span>
                </span>
              </label>
            </fieldset>
          </section>

          {/* Card 5: Description */}
          <section
            aria-labelledby="course-description-label"
            className="w-full relative flex flex-col items-start gap-1.5 px-4 py-3 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] shrink-0"
          >
            <div className="flex items-center justify-between w-full">
              <h3
                id="course-description-label"
                className={`${bodyClass} text-primery-800 dark:text-neutral-scale70 text-xs font-semibold`}
              >
                {isRTL ? "توضیحات درس" : "Description"}
              </h3>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  aria-label={isRTL ? "ویرایش توضیحات" : "Edit description"}
                  className="text-neutral-scale700 dark:text-neutral-scale400 hover:text-primery-700 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={isRTL ? "توضیحات درس را وارد نمایید..." : "Enter course description..."}
                className={`w-full py-1.5 px-2 rounded-lg border border-primery-400 dark:border-neutral-scale900 bg-neutral-scale80 dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale70 text-xs outline-none focus:ring-1 focus:ring-primery-600 resize-none ${textAlign} ${bodyClass}`}
              />
            ) : (
              <p
                className={`w-full text-xs text-neutral-scale1000 dark:text-neutral-scale200 leading-relaxed ${textAlign} ${captionClass}`}
              >
                {courseDetails.description ||
                  (isRTL
                    ? "مطالعه مفاهیم و الگوریتم‌های مدیریت منابع سخت‌افزاری و نرم‌افزاری (هسته، حافظه، پردازش، ورودی/خروجی، فایل‌سیستم و زمان‌بندی"
                    : "No description provided yet.")}
              </p>
            )}
          </section>

          {/* Bottom Save Changes Bar (when editing) */}
          {isEditing && (
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primery-700 hover:bg-primery-800 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className={bodyClass}>
                  {isSaving
                    ? isRTL
                      ? "در حال ثبت تغییرات..."
                      : "Saving Changes..."
                    : isRTL
                    ? "ذخیره تغییرات"
                    : "Save Changes"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 text-neutral-scale900 dark:text-neutral-scale300 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 text-xs font-medium transition-colors cursor-pointer"
              >
                <span className={bodyClass}>{isRTL ? "انصراف" : "Cancel"}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Modern Date Picker Modal */}
      <DatePickerModal
        isOpen={datePickerConfig.isOpen}
        onClose={() => setDatePickerConfig((prev) => ({ ...prev, isOpen: false }))}
        selectedDate={datePickerConfig.currentValue}
        onSelectDate={handleDateSelected}
        title={datePickerConfig.title}
      />
    </main>
  );
};

export default TeacherCourseDoc;
