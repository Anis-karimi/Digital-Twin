/**
 * @file admin.api.js
 * @description API service for system administration, courses management, and users directory.
 */

import { requestWithFallback } from "../client";
import { getAdminSettings } from "../existing/admin.api";

export { getAdminSettings };

/**
 * Fetches high-level administrative dashboard metrics.
 */
export async function getAdminOverview() {
  return await requestWithFallback(
    "/admin/overview",
    { method: "GET" },
    () => ({
      total_courses: 1,
      active_courses: 1,
      total_users: 22,
      total_students: 17,
      total_teachers: 3,
      total_admins: 1,
      total_enrollments: 17,
    })
  );
}

/**
 * Fetches all courses with teacher details and student counts.
 */
export async function getAdminCourses() {
  return await requestWithFallback(
    "/admin/courses",
    { method: "GET" },
    () => [
      {
        course_id: "c0000000-0000-4000-8000-000000000001",
        title: "سیستم عامل",
        description: "مفاهیم پایه‌ای سیستم‌های عامل، فرآیندها، نخ‌ها، زمان‌بندی پردازنده و مدیریت حافظه",
        subject: "مهندسی کامپیوتر",
        units: 3,
        teacher_name: "دکتر محمد اله بخش",
        teacher_username: "mohammad_allahbakhsh",
        is_active: true,
        is_public: true,
        students_count: 17,
      },
    ]
  );
}

/**
 * Registers a new course in the system.
 */
export async function createAdminCourse(payload) {
  return await requestWithFallback("/admin/courses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a course from the system.
 */
export async function deleteAdminCourse(courseId) {
  return await requestWithFallback(`/admin/courses/${courseId}`, {
    method: "DELETE",
  });
}

/**
 * Fetches users directory with role and query filters.
 */
export async function getAdminUsers({ role = "ALL", q = "", limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (role && role !== "ALL") params.append("role", role);
  if (q) params.append("q", q);
  if (limit) params.append("limit", String(limit));

  return await requestWithFallback(
    `/admin/users?${params.toString()}`,
    { method: "GET" },
    () => []
  );
}

/**
 * Creates a new user (Student, Teacher, Admin) in the system.
 */
export async function createAdminUser(payload) {
  return await requestWithFallback("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Toggles user active/inactive status.
 */
export async function toggleAdminUserStatus(userId) {
  return await requestWithFallback(`/admin/users/${userId}/status`, {
    method: "PATCH",
  });
}

/**
 * Fetches list of active teachers for dropdown selection.
 */
export async function getAdminTeachers() {
  return await requestWithFallback(
    "/admin/teachers",
    { method: "GET" },
    () => [
      {
        teacher_id: "t0000000-0000-4000-8000-000000000001",
        username: "mohammad_allahbakhsh",
        name: "دکتر محمد اله بخش",
        email: "mohammad_allahbakhsh@iau.ac.ir",
      },
      {
        teacher_id: "t0000000-0000-4000-8000-000000000002",
        username: "ali_ahmadi",
        name: "دکتر علی احمدی",
        email: "ali_ahmadi@iau.ac.ir",
      },
    ]
  );
}

/**
 * Fetches all members of a specific course.
 */
export async function getCourseMembers(courseId) {
  return await requestWithFallback(
    `/admin/courses/${courseId}/members`,
    { method: "GET" },
    () => []
  );
}

/**
 * Fetches students not enrolled in the course yet.
 */
export async function getAvailableStudents(courseId) {
  return await requestWithFallback(
    `/admin/courses/${courseId}/available-students`,
    { method: "GET" },
    () => []
  );
}

/**
 * Reassigns the teacher/instructor for a course.
 */
export async function assignCourseTeacher(courseId, teacherId) {
  return await requestWithFallback(`/admin/courses/${courseId}/teacher`, {
    method: "POST",
    body: JSON.stringify({ teacher_id: teacherId }),
  });
}

/**
 * Adds a student or user to a course.
 */
export async function addCourseMember(courseId, userId, role = "STUDENT") {
  return await requestWithFallback(`/admin/courses/${courseId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role }),
  });
}

/**
 * Removes a student or member from a course.
 */
export async function removeCourseMember(courseId, userId) {
  return await requestWithFallback(`/admin/courses/${courseId}/members/${userId}`, {
    method: "DELETE",
  });
}

/**
 * Fetches real exam schedules and server load telemetry for administration.
 */
export async function getAdminExamsSchedule() {
  return await requestWithFallback(
    "/admin/exams/schedule",
    { method: "GET" },
    () => null
  );
}

/**
 * Fetches prompts configuration.
 * @param {string|null} [lessonId=null] Optional course ID to fetch course-specific overrides
 */
export async function getAdminPrompts(lessonId = null) {
  const query = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : "";
  return await requestWithFallback(
    `/admin/prompts${query}`,
    { method: "GET" },
    () => ({
      scope: lessonId ? "lesson" : "global",
      lesson_id: lessonId,
      lesson_title: lessonId ? "درس آزمایشی" : "تنظیمات سراسری سامانه",
      prompts: [
        {
          id: null,
          prompt_type: "oral-exam-question",
          name: "Oral Exam Question Designer",
          name_fa: "طراح پرسش‌های تطبیقی آزمون شفاهی",
          category: "Oral Exam",
          source_file: "exam_pipeline/language/persian/question_prompt.py",
          description: "Generates adaptive oral exam questions based on Bloom level and performance context.",
          description_fa: "تولید پرسش‌های ارزیابی شفاهی هوشمند و تطبیقی بر اساس سطح بلوم و اهداف یادگیری.",
          parameters: [
            { name: "goal_title", label: "عنوان هدف آموزشی", description: "عنوان هدف یادگیری انتخاب شده" },
            { name: "goal_description", label: "شرح هدف آموزشی", description: "جزئیات سرفصل و مهارت مورد سنجش" },
            { name: "indicator_name", label: "عنوان شاخص عملکردی", description: "شاخص رفتاری یا شایستگی مدنظر" },
            { name: "target_bloom_level", label: "سطح هدف بلوم", description: "سطح شناختی بلوم (یادآوری، درک، کاربرد، ...)" },
            { name: "difficulty", label: "سطح دشواری", description: "سختی سؤال (ساده، متوسط، سخت)" },
            { name: "context", label: "زمینه سؤال", description: "سناریو یا متن زمینه برای طرح مسئله" },
            { name: "probe_policy", label: "سیاست کاوش", description: "راهبرد هدایت یا چالش در صورت پاسخ ناقص" },
            { name: "history", label: "تاریخچه گفت‌وگو", description: "پرسش و پاسخ‌های تبادل شده در آزمون" },
          ],
          content: "شما یک آزمون‌گیرنده دانشگاهی بسیار باتجربه، دقیق و حرفه‌ای هستید...",
          default_content: "شما یک آزمون‌گیرنده دانشگاهی بسیار باتجربه، دقیق و حرفه‌ای هستید...",
          is_overridden: false,
          version: 1,
          is_active: true,
          lesson_id: lessonId,
        },
        {
          id: null,
          prompt_type: "oral-exam-evaluator",
          name: "Oral Exam Answer Evaluator",
          name_fa: "مصحح و ارزیاب پاسخ شفاهی دانشجو",
          category: "Oral Exam",
          source_file: "exam_pipeline/language/persian/evaluation.py",
          description: "Evaluates student spoken answers against ABET/Bloom rubrics and outputs JSON scores.",
          description_fa: "سنجش پاسخ شفاهی دانشجو و ارزیابی شواهد یادگیری با خروجی ساخت‌یافته JSON.",
          parameters: [
            { name: "goal_name", label: "عنوان هدف آموزشی", description: "نام هدف یادگیری مورد سنجش" },
            { name: "bloom_level", label: "سطح بلوم", description: "سطح شناختی مورد انتظار" },
            { name: "question", label: "متن سؤال طرح‌شده", description: "صورت سؤالی که دانشجو به آن پاسخ داده است" },
            { name: "answer", label: "پاسخ دانشجو", description: "متن پیاده‌سازی شده صدای دانشجو (STT)" },
            { name: "indicator_description", label: "معیار ارزیابی شاخص", description: "شواهد یادگیری مورد نیاز برای قبولی" },
          ],
          content: "شما یک ارزیاب خبره آموزشی هستید که پاسخ‌های دانشجویان را بر اساس اهداف ABET و سطوح بلوم تحلیل می‌کنید...",
          default_content: "شما یک ارزیاب خبره آموزشی هستید که پاسخ‌های دانشجویان را بر اساس اهداف ABET و سطوح بلوم تحلیل می‌کنید...",
          is_overridden: false,
          version: 1,
          is_active: true,
          lesson_id: lessonId,
        },
        {
          id: null,
          prompt_type: "syllabus-goal-extractor",
          name: "Syllabus Goal Extractor",
          name_fa: "استخراج‌کننده هوشمند اهداف آموزشی از سرفصل",
          category: "Syllabus",
          source_file: "exam_pipeline/api/routers/exam_requests.py",
          description: "Extracts structured pedagogical learning goals from course syllabus documents.",
          description_fa: "استخراج و تفکیک اهداف کلان و خرد آموزشی از اسناد و فایل‌های سرفصل درسی.",
          parameters: [
            { name: "course_title", label: "نام درس", description: "عنوان درس مربوطه" },
            { name: "exam_title", label: "عنوان آزمون", description: "عنوان آزمون هدف" },
            { name: "target_max_goals", label: "حداکثر تعداد اهداف", description: "سقف تعداد اهداف قابل استخراج" },
            { name: "target_language", label: "زبان استخراج اهداف", description: "زبان تولید اهداف (PERSIAN یا ENGLISH) که بر اساس محتوای سند یا پارامتر language تعیین می‌شود" },
            { name: "file_filename", label: "نام فایل سند", description: "نام فایل سیلابس یا جزوه آپلود شده" },
            { name: "optimized_text", label: "متن پردازش‌شده سرفصل", description: "متن استخراج‌شده از PDF یا سند سرفصل" },
          ],
          content: "شما یک طراح ارشد برنامه‌ریزی درسی و متخصص ارزشیابی آموزشی دانشگاهی هستید...",
          default_content: "شما یک طراح ارشد برنامه‌ریزی درسی و متخصص ارزشیابی آموزشی دانشگاهی هستید...",
          is_overridden: false,
          version: 1,
          is_active: true,
          lesson_id: lessonId,
        },
        {
          id: null,
          prompt_type: "quiz-answer-explainer",
          name: "Quiz Answer Explainer",
          name_fa: "تحلیل و استدلال علمی پاسخ سؤالات کوییز",
          category: "Quiz",
          source_file: "Backend/app/features/lessons/router.py",
          description: "Provides pedagogical explanation and reasoning for why options are right or wrong.",
          description_fa: "تولید تحلیل گام‌به‌گام و بازخورد علمی پیرامون چرایی صحت یا نادرستی گزینه‌های کوییز.",
          parameters: [
            { name: "question", label: "صورت سؤال کوییز", description: "متن کامل سؤال تستی" },
            { name: "options_text", label: "گزینه‌های سؤال", description: "لیست گزینه‌های تستی ۱ تا ۴" },
            { name: "answer", label: "گزینه صحیح", description: "پاسخ کلیدی درست" },
            { name: "selected_answer", label: "گزینه انتخابی دانشجو", description: "پاسخی که دانشجو انتخاب کرده است" },
          ],
          content: "شما یک استاد دانشگاهی مسلط، دلسوز و تحلیل‌گر آزمون هستید...",
          default_content: "شما یک استاد دانشگاهی مسلط، دلسوز و تحلیل‌گر آزمون هستید...",
          is_overridden: false,
          version: 1,
          is_active: true,
          lesson_id: lessonId,
        },
      ],
    })
  );
}

/**
 * Updates a prompt configuration for a course or globally.
 */
export async function updateAdminPrompt(promptType, payload, lessonId = null) {
  const query = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : "";
  return await requestWithFallback(`/admin/prompts/${promptType}${query}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * Resets a course prompt back to system default.
 */
export async function resetAdminPrompt(promptType, lessonId = null) {
  const query = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : "";
  return await requestWithFallback(`/admin/prompts/${promptType}/reset${query}`, {
    method: "DELETE",
  });
}

/**
 * Fetches revision history for a specific prompt.
 */
export async function getAdminPromptHistory(promptType, lessonId = null) {
  const query = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : "";
  return await requestWithFallback(
    `/admin/prompts/${promptType}/history${query}`,
    { method: "GET" },
    () => []
  );
}

/**
 * Rolls back a prompt to a specific revision from history.
 */
export async function rollbackAdminPrompt(promptType, historyId, lessonId = null) {
  const query = lessonId ? `?lesson_id=${encodeURIComponent(lessonId)}` : "";
  return await requestWithFallback(
    `/admin/prompts/${promptType}/rollback/${historyId}${query}`,
    { method: "POST" }
  );
}

export const adminApi = {
  getSettings: getAdminSettings,
  getOverview: getAdminOverview,
  getCourses: getAdminCourses,
  createCourse: createAdminCourse,
  deleteCourse: deleteAdminCourse,
  getUsers: getAdminUsers,
  createUser: createAdminUser,
  toggleUserStatus: toggleAdminUserStatus,
  getTeachers: getAdminTeachers,
  getCourseMembers,
  getAvailableStudents,
  assignCourseTeacher,
  addCourseMember,
  removeCourseMember,
  getExamsSchedule: getAdminExamsSchedule,
  getPrompts: getAdminPrompts,
  updatePrompt: updateAdminPrompt,
  resetPrompt: resetAdminPrompt,
  getPromptHistory: getAdminPromptHistory,
  rollbackPrompt: rollbackAdminPrompt,
};

export default adminApi;

