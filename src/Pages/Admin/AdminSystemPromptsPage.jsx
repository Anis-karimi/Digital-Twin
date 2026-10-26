import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  FileText,
  ChevronLeft,
  Save,
  X,
  Check,
  Clock3,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useContext } from "react";
import { AppContext } from "@/Context/AppContext";

const initialPrompts = [
  {
    id: "oral-exam",
    name: "Oral Exam",
    nameFa: "پرامپت آزمون شفاهی",
    category: "Oral Exam",
    description:
      "Instructions for conducting oral exams and evaluating student responses.",
    descriptionFa:
      "دستورالعمل‌های برگزاری آزمون شفاهی و ارزیابی پاسخ‌های دانشجو",
    content:
      "You are an AI oral examiner. Ask one question at a time, wait for the student's spoken response, evaluate the answer based on the lesson content, provide constructive feedback, and adapt follow-up questions to the student's understanding. Do not reveal the correct answer before the student responds.",
    updatedAt: "Initial version",
  },

  {
    id: "student-chat",
    name: "Student Chat Assistant",
    nameFa: "دستیار گفت‌وگوی دانشجو",
    category: "Chat",
    description:
      "Instructions for the LLM that answers student questions in the chat page.",
    descriptionFa:
      "دستورالعمل‌های مدل زبانی برای پاسخ‌گویی به سؤالات دانشجو در صفحه چت",
    content:
      "You are Dana, an AI educational assistant in a learning platform. Answer students' questions clearly, accurately, and in a helpful, supportive manner. Adapt your explanations to the student's level of understanding. When relevant, use the provided lesson materials and course context as the primary sources for your answers. Explain complex concepts step by step, provide examples when useful, and encourage critical thinking and independent learning. If a question is ambiguous, ask for clarification. If the answer is not available in the provided materials or you are uncertain, be transparent and do not invent information. Respond in the language used by the student unless they request another language. Keep answers relevant to the question and avoid unnecessary detail.",
    updatedAt: "Initial version",
  },

  {
    id: "quiz-generator",
    name: "Quiz Generator",
    nameFa: "تولیدکننده‌ی کوییز",
    category: "Quiz",
    description: "Rules for generating educational quizzes",
    descriptionFa: "قوانین تولید آزمون و سؤال آموزشی",
    content:
      "Generate educational questions based on the provided lesson content, requested difficulty, and question count. Ensure that each question has one clearly correct answer and provide an explanation when requested.",
    updatedAt: "Initial version",
  },
];

export default function AdminSystemPromptsPage() {
  const navigate = useNavigate();
  const { isRTL } = useContext(AppContext);

  const [prompts, setPrompts] = useState(initialPrompts);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedId);

  const filteredPrompts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return prompts;

    return prompts.filter((prompt) =>
      [
        prompt.name,
        prompt.nameFa,
        prompt.category,
        prompt.description,
        prompt.descriptionFa,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [prompts, search]);

  const openPrompt = (prompt) => {
    setSelectedId(prompt.id);
    setDraft(prompt.content);
    setSaved(false);
  };

  const closeEditor = () => {
    setSelectedId(null);
    setDraft("");
    setSaved(false);
  };

  const handleSave = () => {
    setPrompts((current) =>
      current.map((prompt) =>
        prompt.id === selectedId ? { ...prompt, content: draft } : prompt,
      ),
    );

    setSaved(true);
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden relative transition-colors duration-200"
    >
      {/* Header */}
      <header className="w-full min-h-[65px] flex items-center gap-3 px-4 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <button
          type="button"
          onClick={() => (selectedPrompt ? closeEditor() : navigate(-1))}
          aria-label={isRTL ? "بازگشت" : "Go back"}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors cursor-pointer"
        >
          {isRTL ? (
            <ChevronLeft className="w-4 h-4 rotate-180" />
          ) : (
            <ArrowLeft className="w-4 h-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h1
            className={`text-white text-start text-sm font-bold leading-tight truncate ${
              isRTL ? "font-vazir" : "font-inter"
            }`}
          >
            {selectedPrompt
              ? isRTL
                ? selectedPrompt.nameFa
                : selectedPrompt.name
              : isRTL
                ? "پرامپت‌های سیستم"
                : "System Prompts"}
          </h1>

          <p className="text-white/70 text-start text-[10px] leading-tight mt-1">
            {selectedPrompt
              ? isRTL
                ? "مشاهده و ویرایش متن"
                : "View and edit prompt"
              : isRTL
                ? "مدیریت دستورالعمل‌های هوش مصنوعی"
                : "Manage AI instructions"}
          </p>
        </div>
      </header>

      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-6">
        {!selectedPrompt ? (
          <>
            {/* Summary */}
            <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-start font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                    {isRTL ? "کتابخانه‌ی پرامپت‌ها" : "Prompt Library"}
                  </p>
                  <p className="text-[10px] text-start text-neutral-scale600 dark:text-neutral-scale400 mt-1">
                    {isRTL
                      ? "پرامپت‌های تعریف‌شده‌ی سامانه"
                      : "Configured system prompts"}
                  </p>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-neutral-scale100 dark:border-neutral-scale1100">
                  {prompts.length}
                </span>
              </div>
            </section>

            {/* Search */}
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
                placeholder={isRTL ? "جست‌وجوی پرامپت..." : "Search prompts..."}
                className={`w-full h-10 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder:text-neutral-scale500 focus:outline-none focus:border-primery-500 transition-colors ${
                  isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
                }`}
              />
            </div>

            {/* Prompt list */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200">
                  {isRTL ? "همه‌ی پرامپت‌ها" : "All Prompts"}
                </h2>

                <span className="text-[10px] text-neutral-scale500">
                  {filteredPrompts.length} {isRTL ? "مورد" : "items"}
                </span>
              </div>

              {filteredPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => openPrompt(prompt)}
                  className="w-full text-start bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 hover:border-primery-300 dark:hover:border-neutral-scale900 rounded-[14px] p-3 flex items-center gap-3 transition-all cursor-pointer group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primery-700 dark:text-neutral-scale200" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                      {isRTL ? prompt.nameFa : prompt.name}
                    </p>

                    <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-1 leading-relaxed">
                      {isRTL ? prompt.descriptionFa : prompt.description}
                    </p>

                    <span className="inline-flex mt-2 px-2 py-0.5 rounded-md bg-neutral-scale100 dark:bg-neutral-scale1100 text-[9px] text-neutral-scale700 dark:text-neutral-scale300">
                      {prompt.category}
                    </span>
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
                    {isRTL ? "پرامپتی پیدا نشد." : "No prompts found."}
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* Editor information */}
            <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                    {selectedPrompt.name}
                  </p>
                  <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-1">
                    {selectedPrompt.category}
                  </p>
                </div>

                <span className="text-[9px] px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                  {isRTL ? "حالت ویرایش" : "Editing"}
                </span>
              </div>
            </section>

            {/* Prompt editor */}
            <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[14px] p-3 flex flex-col gap-3 shadow-xs">
              <div>
                <h2 className="text-xs font-bold text-neutral-scale900 dark:text-neutral-scale200">
                  {isRTL ? "متن پرامپت" : "Prompt Content"}
                </h2>
                <p className="text-[10px] text-neutral-scale600 dark:text-neutral-scale400 mt-1 leading-relaxed">
                  {isRTL
                    ? "تغییرات موردنظر را در متن زیر اعمال کن."
                    : "Edit the instructions below."}
                </p>
              </div>

              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                spellCheck={false}
                dir="auto"
                className="w-full min-h-[280px] resize-y rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 p-3 text-xs leading-6 text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:border-primery-500 font-mono transition-colors"
                placeholder={
                  isRTL ? "متن پرامپت را وارد کن..." : "Enter prompt content..."
                }
              />

              <div className="flex items-center gap-1.5 text-[10px] text-neutral-scale500">
                <Clock3 className="w-3.5 h-3.5" />
                <span>
                  {isRTL
                    ? "ذخیره‌سازی فعلاً فقط در وضعیت صفحه است."
                    : "Changes are currently stored in page state only."}
                </span>
              </div>

              {saved && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <Check className="w-4 h-4 shrink-0" />
                  {isRTL
                    ? "تغییرات در وضعیت فعلی صفحه ذخیره شد."
                    : "Changes saved to current page state."}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 min-h-10 rounded-xl bg-primery-700 hover:bg-primery-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isRTL ? "ذخیره تغییرات" : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={closeEditor}
                  className="min-h-10 px-3 rounded-xl bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale700 dark:text-neutral-scale200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  {isRTL ? "بازگشت" : "Cancel"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
