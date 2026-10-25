import { useState, useEffect, useContext } from "react";
import {
  X,
  School,
  Users,
  UserPlus,
  Trash2,
  Check,
  AlertCircle,
  GraduationCap,
  ShieldAlert,
  Search,
  ChevronDown,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { adminApi } from "@/api";

const toPersianDigits = (num) =>
  String(num ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

export const AdminCourseManagementModal = ({
  course,
  isOpen,
  onClose,
  onCourseUpdated,
}) => {
  const { isRTL } = useContext(AppContext);

  const [members, setMembers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);

  const [savingTeacher, setSavingTeacher] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!isOpen || !course?.course_id) return;

    setLoading(true);
    setNotification(null);
    setSelectedTeacherId(course.teacher_id || "");

    Promise.all([
      adminApi.getCourseMembers(course.course_id),
      adminApi.getAvailableStudents(course.course_id),
      adminApi.getTeachers(),
    ])
      .then(([membersData, availableData, teachersData]) => {
        if (Array.isArray(membersData)) setMembers(membersData);
        if (Array.isArray(availableData)) {
          setAvailableStudents(availableData);
          if (availableData.length > 0) setSelectedStudentId(availableData[0].user_id);
        }
        if (Array.isArray(teachersData)) setTeachers(teachersData);
      })
      .catch((err) => {
        console.error("Failed to load course management data:", err);
        setNotification({
          type: "error",
          message: isRTL ? "خطا در دریافت اطلاعات اعضای درس." : "Failed to load course members.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, course?.course_id]);

  if (!isOpen || !course) return null;

  // Handle changing course instructor
  const handleAssignTeacher = async () => {
    if (!selectedTeacherId || selectedTeacherId === course.teacher_id) return;

    setSavingTeacher(true);
    setNotification(null);
    try {
      const updated = await adminApi.assignCourseTeacher(course.course_id, selectedTeacherId);
      setNotification({
        type: "success",
        message: isRTL
          ? `استاد درس به «${updated.teacher_name}» تغییر یافت.`
          : `Course instructor updated to ${updated.teacher_name}.`,
      });

      // Refresh members
      const refreshedMembers = await adminApi.getCourseMembers(course.course_id);
      setMembers(refreshedMembers);

      if (onCourseUpdated) onCourseUpdated(updated);
    } catch (err) {
      console.error("Failed to assign teacher:", err);
      setNotification({
        type: "error",
        message: err.message || (isRTL ? "خطا در انتساب استاد درس." : "Failed to assign teacher."),
      });
    } finally {
      setSavingTeacher(false);
    }
  };

  // Handle enrolling a student
  const handleAddStudent = async () => {
    if (!selectedStudentId) return;

    setAddingStudent(true);
    setNotification(null);
    try {
      const added = await adminApi.addCourseMember(course.course_id, selectedStudentId, "STUDENT");
      setNotification({
        type: "success",
        message: isRTL
          ? `دانشجو «${added.full_name}» با موفقیت به درس افزوده شد.`
          : `Student "${added.full_name}" enrolled successfully.`,
      });

      // Update state locally
      setMembers((prev) => [...prev, added]);
      setAvailableStudents((prev) => {
        const next = prev.filter((s) => s.user_id !== selectedStudentId);
        if (next.length > 0) setSelectedStudentId(next[0].user_id);
        else setSelectedStudentId("");
        return next;
      });

      if (onCourseUpdated) onCourseUpdated();
    } catch (err) {
      console.error("Failed to add student:", err);
      setNotification({
        type: "error",
        message: err.message || (isRTL ? "خطا در افزودن دانشجو به درس." : "Failed to enroll student."),
      });
    } finally {
      setAddingStudent(false);
    }
  };

  // Handle removing a student
  const handleRemoveStudent = async (user) => {
    if (user.role === "TEACHER" || user.user_id === course.teacher_id) {
      setNotification({
        type: "error",
        message: isRTL
          ? "امکان حذف مستقیم استاد درس وجود ندارد. ابتدا استاد دیگری تعیین نمایید."
          : "Cannot remove course instructor. Please assign a replacement instructor first.",
      });
      return;
    }

    setRemovingUserId(user.user_id);
    setNotification(null);
    try {
      await adminApi.removeCourseMember(course.course_id, user.user_id);
      setNotification({
        type: "success",
        message: isRTL
          ? `کاربر «${user.full_name}» از درس حذف گردید.`
          : `User "${user.full_name}" removed from course.`,
      });

      // Update local state
      setMembers((prev) => prev.filter((m) => m.user_id !== user.user_id));
      setAvailableStudents((prev) => [
        ...prev,
        { user_id: user.user_id, username: user.username, full_name: user.full_name },
      ]);

      if (onCourseUpdated) onCourseUpdated();
    } catch (err) {
      console.error("Failed to remove student:", err);
      setNotification({
        type: "error",
        message: err.message || (isRTL ? "خطا در حذف دانشجو از درس." : "Failed to remove user."),
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  const studentMembers = members.filter((m) => m.role === "STUDENT");
  const filteredStudents = studentMembers.filter((m) =>
    (m.full_name || "").toLowerCase().includes(studentSearch.toLowerCase()) ||
    (m.username || "").toLowerCase().includes(studentSearch.toLowerCase())
  );

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
    >
      <div className="bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 rounded-2xl w-full max-w-[348px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-all my-auto">
        {/* Modal Top Header */}
        <div className="w-full px-3.5 py-3 bg-primery-700 dark:bg-neutral-scale1200 flex items-center justify-between text-white shrink-0 border-b border-primery-800 dark:border-neutral-scale1000">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold leading-tight font-vazir truncate">
                {isRTL ? `مدیریت: ${course.title}` : `Manage: ${course.title}`}
              </h2>
              <span className="text-[10px] text-white/70 block leading-tight truncate">
                {isRTL ? "استاد و دانشجویان عضو" : "Instructor & Students"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 overflow-y-auto flex flex-col gap-3 flex-1">
          {/* Notification Alert */}
          {notification && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                notification.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300"
              }`}
            >
              {notification.type === "success" ? (
                <Check className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="text-[11px] leading-tight">{notification.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-3 border-primery-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-neutral-scale600 dark:text-neutral-scale400">
                {isRTL ? "در حال دریافت اعضای درس..." : "Loading course data..."}
              </span>
            </div>
          ) : (
            <>
              {/* ================= SECTION 1: INSTRUCTOR ================= */}
              <section className="bg-neutral-scale50 dark:bg-neutral-scale1200/50 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl p-2.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                      {isRTL ? "استاد درس" : "Course Instructor"}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {course.teacher_name || (isRTL ? "تعیین‌نشده" : "Not assigned")}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="relative w-full">
                    <select
                      value={selectedTeacherId}
                      onChange={(e) => setSelectedTeacherId(e.target.value)}
                      className="w-full !border !border-neutral-scale300 dark:!border-neutral-scale1000 !bg-white dark:!bg-neutral-scale1100 rounded-lg px-2.5 py-2 pe-8 text-xs text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:!border-primery-600 cursor-pointer appearance-none"
                    >
                      {teachers.map((t) => (
                        <option key={t.teacher_id} value={t.teacher_id} className="bg-white dark:bg-neutral-scale1100 text-neutral-scale1800 dark:text-neutral-scale70">
                          {t.name} ({t.username})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-scale500 pointer-events-none absolute top-1/2 -translate-y-1/2 end-2.5" />
                  </div>

                  <button
                    type="button"
                    onClick={handleAssignTeacher}
                    disabled={savingTeacher || selectedTeacherId === course.teacher_id}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {savingTeacher ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    <span>{isRTL ? "تغییر استاد درس" : "Assign Instructor"}</span>
                  </button>
                </div>
              </section>

              {/* ================= SECTION 2: ADD STUDENT ================= */}
              <section className="bg-neutral-scale50 dark:bg-neutral-scale1200/50 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-xl p-2.5 flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                    {isRTL ? "افزودن دانشجو به این درس" : "Enroll Student"}
                  </span>
                </div>

                {availableStudents.length === 0 ? (
                  <p className="text-[11px] text-neutral-scale600 dark:text-neutral-scale400 italic">
                    {isRTL
                      ? "تمامی دانشجویان سیستم در این درس ثبت‌نام شده‌اند."
                      : "All system students are already enrolled in this course."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="relative w-full">
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full !border !border-neutral-scale300 dark:!border-neutral-scale1000 !bg-white dark:!bg-neutral-scale1100 rounded-lg px-2.5 py-2 pe-8 text-xs text-neutral-scale1800 dark:text-neutral-scale70 focus:outline-none focus:!border-primery-600 cursor-pointer appearance-none"
                      >
                        {availableStudents.map((s) => (
                          <option key={s.user_id} value={s.user_id} className="bg-white dark:bg-neutral-scale1100 text-neutral-scale1800 dark:text-neutral-scale70">
                            {s.full_name} (@{s.username})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-scale500 pointer-events-none absolute top-1/2 -translate-y-1/2 end-2.5" />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddStudent}
                      disabled={addingStudent || !selectedStudentId}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {addingStudent ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-3 h-3" />
                      )}
                      <span>{isRTL ? "افزودن به درس" : "Enroll Student"}</span>
                    </button>
                  </div>
                )}
              </section>

              {/* ================= SECTION 3: ENROLLED STUDENTS ================= */}
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primery-700 dark:text-primery-400" />
                    <span className="text-xs font-bold text-neutral-scale1800 dark:text-neutral-scale70">
                      {isRTL ? "دانشجویان ثبت‌نام‌شده" : "Enrolled Students"} ({isRTL ? toPersianDigits(studentMembers.length) : studentMembers.length})
                    </span>
                  </div>
                </div>

                {/* Filter Search */}
                {studentMembers.length > 5 && (
                  <div className="relative w-full">
                    <Search
                      className={`w-3 h-3 absolute top-1/2 -translate-y-1/2 text-neutral-scale500 ${
                        isRTL ? "right-2.5" : "left-2.5"
                      }`}
                    />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder={isRTL ? "فیلتر در لیست دانشجویان..." : "Filter enrolled students..."}
                      className={`w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-lg py-1 text-xs text-neutral-scale1800 dark:text-neutral-scale70 ${
                        isRTL ? "pr-7 pl-2.5 text-right" : "pl-7 pr-2.5 text-left"
                      }`}
                    />
                  </div>
                )}

                {/* List Container */}
                <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1.5 pr-0.5">
                  {studentMembers.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl text-xs text-neutral-scale600 dark:text-neutral-scale400">
                      {isRTL ? "هیچ دانشجویی هنوز به این درس اضافه نشده است." : "No students enrolled yet."}
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-neutral-scale600">
                      {isRTL ? "موردی با این جستجو پیدا نشد." : "No matching students."}
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const isRemoving = removingUserId === student.user_id;

                      return (
                        <div
                          key={student.user_id}
                          className="bg-neutral-scale50 dark:bg-neutral-scale1200/50 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-lg p-2 flex items-center justify-between gap-2 hover:border-neutral-scale300 dark:hover:border-neutral-scale1000 transition-all"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                              {student.full_name?.slice(0, 2) || "ST"}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-[11px] text-neutral-scale1800 dark:text-neutral-scale70 block truncate">
                                {student.full_name}
                              </span>
                              <span className="text-[9px] text-neutral-scale600 dark:text-neutral-scale400 font-mono block truncate">
                                @{student.username}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(student)}
                            disabled={isRemoving}
                            className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-300 text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                            title={isRTL ? "حذف دانشجو از درس" : "Remove from course"}
                          >
                            {isRemoving ? (
                              <div className="w-2.5 h-2.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>{isRTL ? "حذف" : "Remove"}</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-3.5 py-2.5 bg-neutral-scale50 dark:bg-neutral-scale1200 border-t border-neutral-scale100 dark:border-neutral-scale1100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-neutral-scale200 dark:bg-neutral-scale1000 hover:bg-neutral-scale300 text-neutral-scale900 dark:text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            {isRTL ? "بستن" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCourseManagementModal;
