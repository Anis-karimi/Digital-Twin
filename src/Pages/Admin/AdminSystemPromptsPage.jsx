import { useMemo, useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  FileText,
  ChevronLeft,
  Save,
  X,
  Check,
  RotateCcw,
  BookOpen,
  Globe,
  Sparkles,
  Layers,
  AlertCircle,
  Loader2,
  ChevronDown,
  Info,
  History,
  Clock,
  User,
  Copy,
  CheckCheck,
  FileCode,
  Code,
  Tag,
  Undo2,
  Eye,
  Edit3,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { adminApi } from "@/api";
import { toPersianDigits, isoToJalaliDate } from "@/utils/dateUtils";

export default function AdminSystemPromptsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isRTL, currentUser } = useContext(AppContext);

  // URL Query Param for Course
  const courseIdParam = searchParams.get("courseId");

  // Courses & Scope
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdParam || null);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);

  // Prompts state
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  // Filter & Detail state
  const [search, setSearch] = useState("");
  const [selectedPromptType, setSelectedPromptType] = useState(null);
  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "history"

  // Editor Draft state
  const [draft, setDraft] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [statusMessage, setStatusMessage] = useState(null);
  const [showDefaultRef, setShowDefaultRef] = useState(false);
  const [copiedActive, setCopiedActive] = useState(false);

  // History state
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Keep state synced with URL param if it changes externally
  useEffect(() => {
    if (courseIdParam !== selectedCourseId) {
      setSelectedCourseId(courseIdParam || null);
    }
  }, [courseIdParam]);

  // Load courses on mount
  useEffect(() => {
    let isMounted = true;
    adminApi
      .getCourses()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data)) {
          setCourses(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch prompts whenever selectedCourseId changes
  const fetchPrompts = async (courseId) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await adminApi.getPrompts(courseId);
      if (res && Array.isArray(res.prompts)) {
        setPrompts(res.prompts);
      }
    } catch (err) {
      console.error("Failed to fetch prompts:", err);
      setStatusMessage({
        type: "error",
        text: isRTL
          ? "خطا در دریافت پرامپت‌ها از سرور"
          : "Failed to load prompts from server",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts(selectedCourseId);
  }, [selectedCourseId]);

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setIsCourseDropdownOpen(false);
    if (courseId) {
      setSearchParams({ courseId });
    } else {
      setSearchParams({});
    }
  };

  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find(
      (c) => (c.course_id || c.id) === selectedCourseId
    );
  }, [courses, selectedCourseId]);

  const selectedPrompt = useMemo(() => {
    return prompts.find((p) => p.prompt_type === selectedPromptType);
  }, [prompts, selectedPromptType]);

  const filteredPrompts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return prompts;

    return prompts.filter((p) =>
      [
        p.name,
        p.name_fa,
        p.category,
        p.description,
        p.description_fa,
        p.source_file,
      ].some((val) => val && val.toLowerCase().includes(query))
    );
  }, [prompts, search]);

  // Fetch History for selected prompt
  const fetchHistory = async (promptType, courseId) => {
    setLoadingHistory(true);
    try {
      const data = await adminApi.getPromptHistory(promptType, courseId);
      if (Array.isArray(data)) {
        setHistoryItems(data);
      } else {
        setHistoryItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch prompt history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openPrompt = (prompt) => {
    setSelectedPromptType(prompt.prompt_type);
    setDraft(prompt.content);
    setChangeSummary("");
    setStatusMessage(null);
    setShowDefaultRef(false);
    setActiveTab("editor");
    setExpandedHistoryId(null);
    fetchHistory(prompt.prompt_type, selectedCourseId);
  };

  const closeEditor = () => {
    setSelectedPromptType(null);
    setDraft("");
    setChangeSummary("");
    setStatusMessage(null);
    setShowDefaultRef(false);
    setActiveTab("editor");
  };

  const handleCopyActive = () => {
    if (!selectedPrompt) return;
    navigator.clipboard.writeText(selectedPrompt.content);
    setCopiedActive(true);
    setTimeout(() => setCopiedActive(false), 2000);
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;
    setSaving(true);
    setStatusMessage(null);

    const userName = currentUser?.username || "admin";

    try {
      const res = await adminApi.updatePrompt(
        selectedPrompt.prompt_type,
        {
          content: draft,
          change_summary:
            changeSummary.trim() ||
            (isRTL
              ? "ویرایش و ذخیره دستورالعمل"
              : "Updated prompt instructions"),
          changed_by: userName,
        },
        selectedCourseId
      );

      // Update in local prompts list
      setPrompts((prev) =>
        prev.map((p) =>
          p.prompt_type === selectedPrompt.prompt_type
            ? {
                ...p,
                content: res.content || draft,
                is_overridden: true,
                version: res.version || (p.version ? p.version + 1 : 2),
                updated_at: res.updated_at || new Date().toISOString(),
              }
            : p
        )
      );

      setChangeSummary("");
      setStatusMessage({
        type: "success",
        text: isRTL
          ? `نسخه جدید (v${res.version || ""}) با موفقیت در سوابق ذخیره شد.`
          : "New prompt revision saved successfully.",
      });

      // Refresh history list
      fetchHistory(selectedPrompt.prompt_type, selectedCourseId);
    } catch (err) {
      console.error("Save prompt error:", err);
      setStatusMessage({
        type: "error",
        text:
          err.message ||
          (isRTL ? "خطا در ذخیره پرامپت" : "Failed to save prompt"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selectedPrompt) return;
    if (
      !window.confirm(
        isRTL
          ? "آیا از بازنشانی این پرامپت به پیش‌فرض سراسری اطمینان دارید؟"
          : "Are you sure you want to reset this prompt to system default?"
      )
    ) {
      return;
    }

    setResetting(true);
    setStatusMessage(null);

    try {
      const res = await adminApi.resetPrompt(
        selectedPrompt.prompt_type,
        selectedCourseId
      );

      const defaultContent = res.content || selectedPrompt.default_content;
      setDraft(defaultContent);

      setPrompts((prev) =>
        prev.map((p) =>
          p.prompt_type === selectedPrompt.prompt_type
            ? {
                ...p,
                content: defaultContent,
                is_overridden: res.is_overridden || false,
                updated_at: null,
              }
            : p
        )
      );

      setStatusMessage({
        type: "success",
        text: isRTL
          ? "پرامپت با موفقیت به پیش‌فرض سراسری بازنشانی شد."
          : "Prompt successfully reset to system default.",
      });

      fetchHistory(selectedPrompt.prompt_type, selectedCourseId);
    } catch (err) {
      console.error("Reset prompt error:", err);
      setStatusMessage({
        type: "error",
        text:
          err.message ||
          (isRTL ? "خطا در بازنشانی پرامپت" : "Failed to reset prompt"),
      });
    } finally {
      setResetting(false);
    }
  };

  const handleRollback = async (historyId, targetVersion) => {
    if (!selectedPrompt) return;
    if (
      !window.confirm(
        isRTL
          ? `آیا از بازگردانی پرامپت به نسخه ${toPersianDigits(targetVersion)} اطمینان دارید؟`
          : `Are you sure you want to rollback to revision v${targetVersion}?`
      )
    ) {
      return;
    }

    setRollingBack(true);
    setStatusMessage(null);

    try {
      const res = await adminApi.rollbackPrompt(
        selectedPrompt.prompt_type,
        historyId,
        selectedCourseId
      );

      setDraft(res.content);

      setPrompts((prev) =>
        prev.map((p) =>
          p.prompt_type === selectedPrompt.prompt_type
            ? {
                ...p,
                content: res.content,
                is_overridden: true,
                version: res.version,
                updated_at: res.updated_at,
              }
            : p
        )
      );

      setActiveTab("editor");
      setStatusMessage({
        type: "success",
        text: isRTL
          ? `پرامپت با موفقیت به نسخه ${toPersianDigits(targetVersion)} بازگردانده شد.`
          : `Prompt successfully restored to version v${targetVersion}.`,
      });

      fetchHistory(selectedPrompt.prompt_type, selectedCourseId);
    } catch (err) {
      console.error("Rollback error:", err);
      setStatusMessage({
        type: "error",
        text:
          err.message ||
          (isRTL ? "خطا در بازگردانی نسخه" : "Failed to rollback revision"),
      });
    } finally {
      setRollingBack(false);
    }
  };

  const insertVariable = (varName) => {
    setDraft((prev) => prev + ` {${varName}}`);
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      const datePart = isoToJalaliDate(isoStr);
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${toPersianDigits(datePart)} - ${toPersianDigits(hours)}:${toPersianDigits(minutes)}`;
    } catch {
      return isoStr;
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const handleBack = () => {
    if (selectedPrompt) {
      closeEditor();
    } else {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/admin");
      }
    }
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-full mx-auto flex flex-col overflow-hidden relative transition-colors duration-200"
    >
      {/* Header */}
      <header className="w-full min-h-[65px] flex items-center gap-3 px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <button
          type="button"
          onClick={handleBack}
          aria-label={isRTL ? "بازگشت" : "Go back"}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors cursor-pointer"
        >
          <BackIcon className="w-4 h-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h1
            className={`text-white text-start text-sm font-bold leading-tight truncate ${
              isRTL ? "font-vazir" : "font-inter"
            }`}
          >
            {selectedPrompt
              ? isRTL
                ? selectedPrompt.name_fa
                : selectedPrompt.name
              : isRTL
              ? "مدیریت پرامپت‌ها"
              : "Prompt Management"}
          </h1>

          <p className="text-white/80 text-start text-[10px] leading-tight mt-1 truncate">
            {selectedCourse
              ? isRTL
                ? `درس: ${selectedCourse.title}`
                : `Course: ${selectedCourse.title}`
              : isRTL
              ? "تنظیمات پیش‌فرض سراسری سامانه"
              : "Global System Defaults"}
          </p>
        </div>
      </header>

      {/* Main Body */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-6">
        {!selectedPrompt ? (
          <>
            {/* Scope Switcher / Course Selector */}
            <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-scale900 dark:text-neutral-scale200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                  {isRTL ? "حوزه پیکربندی پرامپت:" : "Configuration Scope:"}
                </span>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    selectedCourseId
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                  }`}
                >
                  {selectedCourseId
                    ? isRTL
                      ? "اختصاصی درس"
                      : "Course Level"
                    : isRTL
                    ? "سراسری سیستم"
                    : "Global System"}
                </span>
              </div>

              {/* Course Selector Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCourseDropdownOpen((prev) => !prev)}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 flex items-center justify-between text-xs font-semibold text-neutral-scale1800 dark:text-neutral-scale70 hover:border-primery-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    {selectedCourseId ? (
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                    )}
                    <span className="truncate">
                      {selectedCourse
                        ? selectedCourse.title
                        : isRTL
                        ? "🌐 پیش‌فرض سراسری سامانه (Global)"
                        : "🌐 System Global Defaults"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-scale500 transition-transform ${
                      isCourseDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isCourseDropdownOpen && (
                  <div className="absolute top-11.5 left-0 right-0 z-40 bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 max-h-52 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => handleSelectCourse(null)}
                      className={`w-full text-start px-2.5 py-2 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                        selectedCourseId === null
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold"
                          : "text-neutral-scale800 dark:text-neutral-scale200 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1100"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-purple-600" />
                      <span>
                        {isRTL
                          ? "پیش‌فرض سراسری سامانه (Global)"
                          : "System Global Defaults"}
                      </span>
                    </button>

                    <div className="h-px bg-neutral-scale100 dark:bg-neutral-scale1000 my-1" />

                    <div className="px-2 py-0.5 text-[9px] font-bold text-neutral-scale500">
                      {isRTL ? "انتخاب بر اساس درس:" : "Choose by Course:"}
                    </div>

                    {courses.map((c) => {
                      const cId = c.course_id || c.id;
                      const isSelected = selectedCourseId === cId;
                      return (
                        <button
                          key={cId}
                          type="button"
                          onClick={() => handleSelectCourse(cId)}
                          className={`w-full text-start px-2.5 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                              : "text-neutral-scale800 dark:text-neutral-scale200 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1100"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{c.title}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Search Input */}
            <div className="relative bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-scale500 ${
                  isRTL ? "right-3" : "left-3"
                }`}
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  isRTL
                    ? "جست‌وجوی عنوان یا کاربرد پرامپت..."
                    : "Search prompts..."
                }
                className={`w-full h-10 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder:text-neutral-scale500 focus:outline-none focus:border-primery-500 transition-colors ${
                  isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
                }`}
              />
            </div>

            {/* Prompts List Header */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200">
                {selectedCourse
                  ? isRTL
                    ? `پرامپت‌های درس: ${selectedCourse.title}`
                    : `Prompts for ${selectedCourse.title}`
                  : isRTL
                  ? "پرامپت‌های فعال سامانه"
                  : "Active System Prompts"}
              </h2>

              <span className="text-[10px] text-neutral-scale500 font-medium">
                {toPersianDigits(filteredPrompts.length)} {isRTL ? "پرامپت" : "prompts"}
              </span>
            </div>

            {/* Prompts Cards */}
            {loading ? (
              <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-8 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-primery-600 animate-spin" />
                <p className="text-xs text-neutral-scale600 dark:text-neutral-scale400">
                  {isRTL
                    ? "در حال بارگذاری پرامپت‌های سامانه..."
                    : "Loading prompts..."}
                </p>
              </div>
            ) : (
              <section className="flex flex-col gap-2.5">
                {filteredPrompts.map((prompt) => (
                  <button
                    key={prompt.prompt_type}
                    type="button"
                    onClick={() => openPrompt(prompt)}
                    className="w-full text-start bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 hover:border-primery-400 dark:hover:border-neutral-scale900 rounded-[14px] p-3 flex items-center gap-3 transition-all cursor-pointer group shadow-xs"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                        prompt.is_overridden
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-white dark:bg-neutral-scale1200 border-neutral-scale100 dark:border-neutral-scale1100 text-primery-700 dark:text-neutral-scale200"
                      }`}
                    >
                      <FileCode className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                          {isRTL ? prompt.name_fa : prompt.name}
                        </p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-scale100 dark:bg-neutral-scale1100 text-neutral-scale600 dark:text-neutral-scale400 font-mono">
                          v{toPersianDigits(prompt.version || 1)}
                        </span>
                      </div>

                      <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-1 line-clamp-2 leading-relaxed">
                        {isRTL ? prompt.description_fa : prompt.description}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-scale100 dark:bg-neutral-scale1100 text-[9px] text-neutral-scale700 dark:text-neutral-scale300 font-medium">
                          {prompt.category}
                        </span>

                        {prompt.parameters && prompt.parameters.length > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[9px] font-mono">
                            {toPersianDigits(prompt.parameters.length)} {isRTL ? "پارامتر" : "params"}
                          </span>
                        )}

                        {selectedCourseId ? (
                          prompt.is_overridden ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-[9px] font-bold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {isRTL ? "سفارشی درس" : "Course Custom"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-neutral-scale100 dark:bg-neutral-scale1100 text-neutral-scale600 dark:text-neutral-scale400 text-[9px]">
                              {isRTL
                                ? "پیش‌فرض سراسری"
                                : "Global Default"}
                            </span>
                          )
                        ) : prompt.is_overridden ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[9px] font-bold">
                            {isRTL ? "سفارشی سامانه" : "Global Custom"}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <ChevronLeft
                      className={`w-4 h-4 text-neutral-scale500 group-hover:text-primery-700 dark:group-hover:text-white shrink-0 ${
                        isRTL ? "" : "rotate-180"
                      }`}
                    />
                  </button>
                ))}

                {filteredPrompts.length === 0 && (
                  <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-6 text-center">
                    <Search className="w-6 h-6 text-neutral-scale400 mx-auto mb-2" />
                    <p className="text-xs text-neutral-scale600 dark:text-neutral-scale400">
                      {isRTL ? "پرامپتی با این مشخصات یافت نشد." : "No prompts found."}
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          <>
            {/* Top Info Card */}
            <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 shadow-xs flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedCourseId
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                      : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                  }`}
                >
                  <FileCode className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                      {isRTL ? selectedPrompt.name_fa : selectedPrompt.name}
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primery-100 dark:bg-primery-950/60 text-primery-700 dark:text-primery-300 font-bold">
                      v{toPersianDigits(selectedPrompt.version || 1)}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-0.5 truncate">
                    {selectedCourse
                      ? isRTL
                        ? `پیکربندی اختصاصی درس: ${selectedCourse.title}`
                        : `Course: ${selectedCourse.title}`
                      : isRTL
                      ? "پیکربندی پیش‌فرض سراسری سامانه"
                      : "Global System Configuration"}
                  </p>
                </div>

                <span
                  className={`text-[9px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                    selectedPrompt.is_overridden
                      ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                      : "bg-neutral-scale100 dark:bg-neutral-scale1100 text-neutral-scale600 dark:text-neutral-scale400"
                  }`}
                >
                  {selectedPrompt.is_overridden
                    ? isRTL
                      ? "سفارشی"
                      : "Custom"
                    : isRTL
                    ? "پیش‌فرض"
                    : "Default"}
                </span>
              </div>

              {/* Source Code File Path */}
              {selectedPrompt.source_file && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-scale100 dark:bg-neutral-scale1200 text-[10px] text-neutral-scale600 dark:text-neutral-scale400 font-mono overflow-x-auto">
                  <Code className="w-3 h-3 text-neutral-scale500 shrink-0" />
                  <span className="text-neutral-scale500 text-[9px] font-sans">
                    {isRTL ? "منبع در پروژه:" : "Source file:"}
                  </span>
                  <span className="text-neutral-scale800 dark:text-neutral-scale200 font-bold truncate">
                    {selectedPrompt.source_file}
                  </span>
                </div>
              )}
            </section>

            {/* Navigation Tabs: View/Edit vs. History */}
            <div className="grid grid-cols-2 gap-2 bg-neutral-scale100 dark:bg-neutral-scale1200 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "editor"
                    ? "bg-white dark:bg-neutral-scale1300 text-primery-700 dark:text-white shadow-xs"
                    : "text-neutral-scale600 dark:text-neutral-scale400 hover:text-neutral-scale900"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isRTL ? "نمایش و ویرایش" : "View & Edit"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-white dark:bg-neutral-scale1300 text-primery-700 dark:text-white shadow-xs"
                    : "text-neutral-scale600 dark:text-neutral-scale400 hover:text-neutral-scale900"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{isRTL ? "تاریخچه و لاگ نسخه‌ها" : "Version History"}</span>
                {historyItems.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-primery-100 dark:bg-primery-900/60 text-primery-800 dark:text-primery-200">
                    {toPersianDigits(historyItems.length)}
                  </span>
                )}
              </button>
            </div>

            {/* Status Alert Banner */}
            {statusMessage && (
              <div
                className={`flex items-center gap-2 rounded-xl p-3 text-xs border ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200"
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-200"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* TAB 1: DISPLAY & EDIT MODE */}
            {activeTab === "editor" && (
              <>
                {/* 1. TOP SECTION: READ-ONLY DISPLAY MODE (نمایش پرامپت و پارامترها) */}
                <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex flex-col gap-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-neutral-scale100 dark:border-neutral-scale1100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-primery-700 dark:text-primery-400" />
                      <h2 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200">
                        {isRTL ? "دستورالعمل و پارامترهای فعال" : "Active Prompt & Parameters"}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyActive}
                      className="px-2 py-1 rounded-md bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1100 text-[10px] text-neutral-scale700 dark:text-neutral-scale300 hover:text-primery-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedActive ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">
                            {isRTL ? "کپی شد" : "Copied"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{isRTL ? "کپی دستورالعمل" : "Copy"}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Real Active System Parameters */}
                  {selectedPrompt.parameters && selectedPrompt.parameters.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-neutral-scale800 dark:text-neutral-scale200 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-500" />
                          <span>{isRTL ? "پارامترهای ورودی این مرحله:" : "Input Parameters:"}</span>
                        </span>
                        <span className="text-[9px] text-neutral-scale500">
                          {isRTL ? "(کلیک برای درج در ویرایشگر)" : "(Click to insert)"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedPrompt.parameters.map((param) => (
                          <button
                            key={param.name}
                            type="button"
                            onClick={() => insertVariable(param.name)}
                            title={isRTL ? "افزودن این متغیر به متن" : "Insert variable"}
                            className="w-full text-start p-2 rounded-lg bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 hover:border-primery-400 dark:hover:border-neutral-scale900 flex items-start gap-2 transition-colors cursor-pointer group"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-primery-50 dark:bg-neutral-scale1100 text-primery-700 dark:text-primery-300 font-mono text-[9px] font-bold shrink-0 group-hover:bg-primery-600 group-hover:text-white transition-colors">
                              {`{${param.name}}`}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-neutral-scale800 dark:text-neutral-scale200 truncate">
                                {param.label}
                              </p>
                              {param.description && (
                                <p className="text-[9px] text-neutral-scale500 dark:text-neutral-scale400 leading-tight mt-0.5 truncate">
                                  {param.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Read-Only Active Prompt Text Display */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-neutral-scale800 dark:text-neutral-scale200">
                      {isRTL ? "متن پرامپت فعال کنونی:" : "Current Active Prompt Text:"}
                    </span>
                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 text-xs leading-relaxed text-neutral-scale1800 dark:text-neutral-scale70 max-h-56 overflow-y-auto whitespace-pre-wrap font-sans">
                      {selectedPrompt.content}
                    </div>
                  </div>

                  {/* Show Base Default Toggle if Overridden */}
                  {selectedPrompt.is_overridden && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowDefaultRef((prev) => !prev)}
                        className="text-[10px] text-primery-700 dark:text-primery-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Info className="w-3 h-3" />
                        <span>
                          {showDefaultRef
                            ? isRTL
                              ? "بستن متن پیش‌فرض پایه سامانه"
                              : "Hide default prompt"
                            : isRTL
                            ? "مشاهده متن پیش‌فرض پایه سامانه"
                            : "Compare with default prompt"}
                        </span>
                      </button>

                      {showDefaultRef && (
                        <div className="mt-2 p-2.5 rounded-xl bg-neutral-scale100 dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 text-[10px] leading-relaxed text-neutral-scale600 dark:text-neutral-scale400">
                          <div className="font-bold text-neutral-scale800 dark:text-neutral-scale200 mb-1">
                            {isRTL ? "متن پیش‌فرض پایه در کدهای سامانه:" : "System Default Content:"}
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-[10px]">
                            {selectedPrompt.default_content}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* 2. BOTTOM SECTION: EDIT MODE (بخش ویرایش در زیر) */}
                <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex flex-col gap-3 shadow-xs">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                      <span>{isRTL ? "ویرایش و ذخیره نسخه جدید" : "Edit & Save New Version"}</span>
                    </h3>
                    <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-0.5">
                      {isRTL
                        ? "متن زیر را تغییر دهید؛ تغییرات در سابقه با شماره نسخه جدید ثبت خواهد شد:"
                        : "Modify instructions below. Changes will be audited in version history:"}
                    </p>
                  </div>

                  {/* Variable insertion buttons bar */}
                  {selectedPrompt.parameters && selectedPrompt.parameters.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-neutral-scale500 font-medium">
                        {isRTL ? "افزودن سریع متغیر به ویرایشگر:" : "Quick Insert Variables:"}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedPrompt.parameters.map((param) => (
                          <button
                            key={param.name}
                            type="button"
                            onClick={() => insertVariable(param.name)}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 text-[9px] font-mono text-primery-700 dark:text-primery-300 hover:bg-primery-50 dark:hover:bg-primery-950/40 transition-colors cursor-pointer"
                          >
                            +{`{${param.name}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Textarea */}
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    spellCheck={false}
                    dir="auto"
                    rows={10}
                    className="w-full min-h-[220px] resize-y rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 p-3 text-xs leading-relaxed text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:border-primery-500 transition-colors"
                    placeholder={
                      isRTL ? "متن پرامپت را وارد کنید..." : "Enter prompt instructions..."
                    }
                  />

                  {/* Change Summary & Audit Log Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-scale800 dark:text-neutral-scale200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primery-600" />
                      <span>{isRTL ? "شرح تغییرات (جهت پیگیری در سوابق):" : "Change Summary (for Audit Log):"}</span>
                    </label>
                    <input
                      type="text"
                      value={changeSummary}
                      onChange={(e) => setChangeSummary(e.target.value)}
                      placeholder={
                        isRTL
                          ? "مثلاً: تغییر لحن به رسمی‌تر، افزایش سخت‌گیری در مصاحبه..."
                          : "e.g., Adjusted tone, increased Bloom rigor..."
                      }
                      className="w-full h-9 px-3 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder:text-neutral-scale500 focus:outline-none focus:border-primery-500 transition-colors"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      disabled={saving || resetting || rollingBack}
                      onClick={handleSave}
                      className="w-full min-h-10 rounded-xl bg-primery-700 hover:bg-primery-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>
                        {isRTL
                          ? `ذخیره و ثبت نسخه جدید (v${(selectedPrompt.version || 1) + 1})`
                          : "Save & Commit New Version"}
                      </span>
                    </button>

                    <div className="flex gap-2">
                      {selectedCourseId && selectedPrompt.is_overridden && (
                        <button
                          type="button"
                          disabled={saving || resetting || rollingBack}
                          onClick={handleReset}
                          className="flex-1 min-h-9 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {resetting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          {isRTL ? "بازنشانی به پیش‌فرض" : "Reset to Default"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={closeEditor}
                        className="flex-1 min-h-9 px-3 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale700 dark:text-neutral-scale200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        {isRTL ? "بستن ویرایشگر" : "Close"}
                      </button>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* TAB 2: AUDIT LOG & REVISION HISTORY */}
            {activeTab === "history" && (
              <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-neutral-scale100 dark:border-neutral-scale1100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                      <span>{isRTL ? "سوابق تغییرات و نسخه‌ها" : "Version Audit Log"}</span>
                    </h3>
                    <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-0.5">
                      {isRTL
                        ? "تمام تغییرات به همراه زمان، کاربر و شرح ذخیره می‌شوند و قابلیت بازگردانی دارند:"
                        : "Full history of changes with rollback capabilities:"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      fetchHistory(selectedPrompt.prompt_type, selectedCourseId)
                    }
                    className="p-1.5 rounded-lg bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1100 text-neutral-scale600 dark:text-neutral-400 hover:text-primery-700 cursor-pointer"
                    title={isRTL ? "به‌روزرسانی تاریخچه" : "Refresh"}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-primery-600 animate-spin" />
                    <p className="text-xs text-neutral-scale600 dark:text-neutral-scale400">
                      {isRTL ? "در حال دریافت سوابق..." : "Loading audit log..."}
                    </p>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
                    <Clock className="w-7 h-7 text-neutral-scale400" />
                    <p className="text-xs font-bold text-neutral-scale800 dark:text-neutral-scale200">
                      {isRTL ? "هنوز سابقه‌ای ثبت نشده است" : "No revision history yet"}
                    </p>
                    <p className="text-[10px] text-neutral-scale500">
                      {isRTL
                        ? "به محض اولین ذخیره در ویرایشگر، نسخه اول در این بخش ثبت خواهد شد."
                        : "Revisions will appear here once saved."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {historyItems.map((item, idx) => {
                      const isExpanded = expandedHistoryId === item.id;
                      const isCurrentVersion =
                        item.version === (selectedPrompt.version || 1);

                      return (
                        <div
                          key={item.id || idx}
                          className={`rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                            isCurrentVersion
                              ? "bg-primery-50/50 dark:bg-neutral-scale1200 border-primery-300 dark:border-primery-800"
                              : "bg-white dark:bg-neutral-scale1200 border-neutral-scale100 dark:border-neutral-scale1100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-primery-100 dark:bg-primery-950/60 text-primery-700 dark:text-primery-300 text-[10px] font-bold font-mono">
                                v{toPersianDigits(item.version)}
                              </span>
                              {isCurrentVersion && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                  {isRTL ? "نسخه فعال فعلی" : "Current Active"}
                                </span>
                              )}
                            </div>

                            <span className="text-[9px] text-neutral-scale500 font-mono">
                              {formatDateTime(item.created_at)}
                            </span>
                          </div>

                          <div className="text-[10px] text-neutral-scale700 dark:text-neutral-scale300">
                            <span className="font-bold text-neutral-scale900 dark:text-neutral-scale100">
                              {isRTL ? "شرح تغییر:" : "Summary:"}{" "}
                            </span>
                            <span>{item.change_summary || (isRTL ? "بدون توضیح" : "No summary")}</span>
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-neutral-scale500 pt-1 border-t border-neutral-scale100 dark:border-neutral-scale1100">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{item.changed_by || "admin"}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedHistoryId((prev) =>
                                    prev === item.id ? null : item.id
                                  )
                                }
                                className="text-primery-700 dark:text-primery-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                              >
                                <Eye className="w-3 h-3" />
                                <span>
                                  {isExpanded
                                    ? isRTL
                                      ? "بستن متن"
                                      : "Hide"
                                    : isRTL
                                    ? "مشاهده متن"
                                    : "View Text"}
                                </span>
                              </button>

                              {!isCurrentVersion && (
                                <button
                                  type="button"
                                  disabled={rollingBack}
                                  onClick={() =>
                                    handleRollback(item.id, item.version)
                                  }
                                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 flex items-center gap-1 cursor-pointer font-bold transition-colors"
                                >
                                  <Undo2 className="w-3 h-3" />
                                  <span>{isRTL ? "بازگردانی" : "Rollback"}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded History Content */}
                          {isExpanded && (
                            <div className="mt-1 p-2.5 rounded-lg bg-neutral-scale50 dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1000 text-[10px] leading-relaxed text-neutral-scale800 dark:text-neutral-scale200 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                              {item.system_prompt}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
