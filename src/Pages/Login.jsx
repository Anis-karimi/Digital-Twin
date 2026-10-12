import { useState, useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { authApi } from "@/api";
import {
  GraduationCap,
  User,
  Users,
  Shield,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Loader2,
  BookOpen,
  Search,
  ChevronDown,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";

export const Login = () => {
  const navigate = useNavigate();
  const { isRTL, setRole, loginUser, currentUser, role, t } = useContext(AppContext);

  const [directory, setDirectory] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [activeTab, setActiveTab] = useState("teacher"); // 'teacher' | 'students'
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUser, setLoadingUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load dynamic courses directory from backend
  useEffect(() => {
    let isMounted = true;
    setLoadingDirectory(true);
    authApi
      .getLoginDirectory()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) && data.length > 0 ? data : [];
        setDirectory(list);
        if (list.length > 0) {
          setSelectedCourseId(String(list[0].id));
        }
      })
      .catch((err) => {
        console.warn("Failed to load login directory:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingDirectory(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Currently selected course
  const currentCourse = useMemo(() => {
    if (!directory || directory.length === 0) return null;
    return (
      directory.find((c) => String(c.id) === String(selectedCourseId)) || directory[0]
    );
  }, [directory, selectedCourseId]);

  // Filter students of selected course by search query
  const filteredStudents = useMemo(() => {
    if (!currentCourse || !Array.isArray(currentCourse.students)) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentCourse.students;
    return currentCourse.students.filter(
      (s) =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q))
    );
  }, [currentCourse, searchQuery]);

  // Execute authenticated login with session persistence
  const handleLogin = async (userProfile) => {
    if (loadingUser) return;
    const identifier = userProfile.username || userProfile.id;
    setLoadingUser(identifier);
    setErrorMessage("");

    try {
      const payload = {
        role: userProfile.role || "STUDENT",
        token: userProfile.defaultToken || `sso_token_${userProfile.username}`,
        username: userProfile.username || userProfile.id,
      };

      const res = await authApi.externalLogin(payload);
      const userRole = (
        res.role ||
        res.user?.user_type ||
        userProfile.role ||
        "student"
      ).toLowerCase();

      if (loginUser) {
        loginUser(res.user, res.access_token || res.token);
      }
      setRole(userRole);

      if (userRole === "student") {
        navigate("/Student", { replace: true });
      } else if (userRole === "admin") {
        navigate("/Admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage(
        t("loginErrorMessage", "خطا در ورود به سامانه. لطفاً دوباره تلاش کنید.")
      );
    } finally {
      setLoadingUser(null);
    }
  };

  const handleAdminLogin = () => {
    handleLogin({
      id: "admin",
      role: "ADMIN",
      username: "admin",
      defaultToken: "sso_token_admin_001",
    });
  };

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1400 w-full min-h-dvh flex items-center justify-center p-4 relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-[480px] bg-white dark:bg-neutral-scale1300 rounded-3xl shadow-xl border border-neutral-scale200 dark:border-neutral-scale1100 p-6 flex flex-col gap-4 relative z-10 transition-colors duration-200">
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-scale100 dark:border-neutral-scale1100">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(role === "student" ? "/Student" : role === "admin" ? "/Admin" : "/");
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-scale1000 dark:text-neutral-scale300 hover:text-black dark:hover:text-white cursor-pointer font-vazir"
          >
            {isRTL ? (
              <ArrowRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowLeft className="w-3.5 h-3.5" />
            )}
            <span>{t("backToApp", "بازگشت")}</span>
          </button>

          {currentUser && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-vazir">
              {`${t("activeUser", "کاربر فعال:")} ${
                currentUser.first_name || currentUser.username || (isRTL ? "استاد" : "Teacher")
              }`}
            </span>
          )}
        </div>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-1">
          <div className="w-13 h-13 rounded-2xl bg-primery-700 dark:bg-primery-900 text-white flex items-center justify-center shadow-lg shadow-primery-700/25">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold dark:text-neutral-scale100 text-neutral-scale1800 font-vazir mt-1">
            {t("loginToDigitalTwin", "ورود به سامانه دوقلوی دیجیتال")}
          </h1>
          <p className="text-xs text-neutral-scale900 dark:text-neutral-scale400 font-vazir">
            {isRTL
              ? "انتخاب درس و ورود با نقش استاد یا دانشجویان دوره"
              : "Select course and login as instructor or enrolled student"}
          </p>
        </div>

        {/* Error message display */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-vazir text-center">
            {errorMessage}
          </div>
        )}

        {/* Course Selector Dropdown at Top */}
        <div className="flex flex-col gap-1.5 bg-neutral-scale50 dark:bg-neutral-scale1400 p-3 rounded-2xl border border-neutral-scale200 dark:border-neutral-scale1100">
          <label className="text-[11px] font-semibold text-neutral-scale900 dark:text-neutral-scale300 font-vazir flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primery-600 dark:text-primery-400" />
              <span>{isRTL ? "نام درس:" : "Select Course:"}</span>
            </span>
            {currentCourse?.department && (
              <span className="text-[10px] text-neutral-scale700 dark:text-neutral-scale500 font-vazir">
                {currentCourse.department}
              </span>
            )}
          </label>

          {loadingDirectory ? (
            <div className="h-10 rounded-xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 flex items-center justify-center gap-2 text-xs text-neutral-scale800 dark:text-neutral-scale400 font-vazir">
              <Loader2 className="w-4 h-4 animate-spin text-primery-600" />
              <span>{isRTL ? "در حال دریافت فهرست دروس..." : "Loading courses..."}</span>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSearchQuery("");
                }}
                className="w-full h-10 px-3 pr-8 rounded-xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1100 text-xs text-neutral-scale1800 dark:text-neutral-scale100 font-vazir font-semibold appearance-none cursor-pointer focus:outline-hidden focus:border-primery-500 shadow-xs"
              >
                {directory.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.units ? `(${c.units} واحد)` : ""}
                  </option>
                ))}
              </select>
              <div
                className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-neutral-scale600 dark:text-neutral-scale400 ${
                  isRTL ? "left-3" : "right-3"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection: Teacher vs Students */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-neutral-scale100 dark:bg-neutral-scale1400 border border-neutral-scale200 dark:border-neutral-scale1100">
          <button
            type="button"
            onClick={() => setActiveTab("teacher")}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-vazir flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "teacher"
                ? "bg-white dark:bg-neutral-scale1200 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-neutral-scale800 dark:text-neutral-scale400 hover:text-black dark:hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isRTL ? "ورود با نقش استاد" : "Teacher Login"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("students")}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-vazir flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "students"
                ? "bg-white dark:bg-neutral-scale1200 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-neutral-scale800 dark:text-neutral-scale400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isRTL ? "ورود با نقش دانشجویان" : "Students Login"}</span>
            {currentCourse?.students?.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-normal">
                {currentCourse.students.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Teacher Login View */}
        {activeTab === "teacher" && (
          <div className="flex flex-col gap-3">
            {(() => {
              const teacherProfile = currentCourse?.teacher || {
                id: "10000000-0000-4000-8000-000000000001",
                name: "دکتر محمد اله بخش",
                username: "teacher",
                role: "TEACHER",
                defaultToken: "sso_token_dr_allahbakhsh",
                avatar: null,
              };
              const isCurrentLoading =
                loadingUser === (teacherProfile.username || teacherProfile.id) ||
                loadingUser === "teacher";

              return (
                <button
                  type="button"
                  disabled={Boolean(loadingUser)}
                  onClick={() => handleLogin(teacherProfile)}
                  className="w-full p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 hover:border-blue-400 flex items-center gap-3.5 transition-all duration-200 cursor-pointer text-start shadow-xs hover:shadow-md disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
                    {isCurrentLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale100 font-vazir truncate">
                        {teacherProfile.name || "دکتر محمد اله بخش"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md border font-vazir shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                        {isRTL ? "استاد و هیئت علمی" : "Instructor"}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-scale900 dark:text-neutral-scale400 font-vazir mt-0.5">
                      {isRTL
                        ? `ورود به پنل استاد و مدیریت دروس (${currentCourse?.title || "سیستم عامل و بلاکچین"})`
                        : `Instructor portal: manage courses (${currentCourse?.title || "All assigned courses"})`}
                    </p>
                  </div>

                  <div className="shrink-0 text-blue-600 dark:text-blue-400">
                    {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </div>
                </button>
              );
            })()}
          </div>
        )}

        {/* Tab 2: Students Roster Login View */}
        {activeTab === "students" && (
          <div className="flex flex-col gap-2.5">
            {/* Student Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isRTL
                    ? "جستجوی دانشجو بر اساس نام یا نام کاربری..."
                    : "Search student by name or username..."
                }
                className="w-full h-9.5 px-3 pl-8 rounded-xl bg-neutral-scale50 dark:bg-neutral-scale1400 border border-neutral-scale200 dark:border-neutral-scale1100 text-xs font-vazir placeholder:text-neutral-scale600 dark:placeholder:text-neutral-scale500 text-neutral-scale1800 dark:text-neutral-scale100 focus:outline-hidden focus:border-emerald-500 shadow-xs"
              />
              <div
                className={`absolute top-1/2 -translate-y-1/2 text-neutral-scale600 dark:text-neutral-scale500 pointer-events-none ${
                  isRTL ? "left-3" : "right-3"
                }`}
              >
                <Search className="w-4 h-4" />
              </div>
            </div>

            {/* Students List */}
            <div className="max-h-[290px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isThisLoading =
                    loadingUser === (student.username || student.id);
                  const isAnyLoading = Boolean(loadingUser);

                  return (
                    <button
                      key={student.id || student.username}
                      type="button"
                      disabled={isAnyLoading}
                      onClick={() => handleLogin(student)}
                      className="w-full p-2.5 rounded-xl border border-neutral-scale200 dark:border-neutral-scale1100 bg-white dark:bg-neutral-scale1400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-700 flex items-center gap-3 transition-all duration-150 cursor-pointer text-start shadow-xs hover:shadow-sm disabled:opacity-50"
                    >
                      {/* Avatar Circle with initials */}
                      <div className="w-8.5 h-8.5 rounded-lg bg-emerald-600/10 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-700/40 flex items-center justify-center shrink-0 font-bold text-xs font-vazir">
                        {isThisLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          student.name?.slice(0, 1) || <User className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-neutral-scale1800 dark:text-neutral-scale100 font-vazir truncate">
                            {student.name}
                          </span>
                          {student.username && (
                            <span className="text-[10px] text-neutral-scale700 dark:text-neutral-scale500 font-mono truncate">
                              @{student.username}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-neutral-scale600 dark:text-neutral-scale500 hover:text-emerald-600">
                        {isRTL ? (
                          <ArrowLeft className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-neutral-scale800 dark:text-neutral-scale400 font-vazir">
                  {searchQuery
                    ? (isRTL ? "دانشجویی با این مشخصات یافت نشد." : "No student found matching query.")
                    : (isRTL ? "هیچ دانشجویی برای این درس ثبت نشده است." : "No students enrolled in this course.")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer: Admin Login Shortcut */}
        <div className="pt-2 border-t border-neutral-scale100 dark:border-neutral-scale1100 flex items-center justify-between">
          <button
            type="button"
            disabled={Boolean(loadingUser)}
            onClick={handleAdminLogin}
            className="inline-flex items-center gap-1.5 text-[11px] text-neutral-scale800 dark:text-neutral-scale400 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer font-vazir transition-colors disabled:opacity-50"
          >
            {loadingUser === "admin" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>{isRTL ? "ورود با نقش مدیر سیستم (Admin)" : "System Admin Login"}</span>
          </button>

          <span className="text-[10px] text-neutral-scale700 dark:text-neutral-scale500 font-vazir">
            نسخه ۲.۴
          </span>
        </div>
      </div>
    </main>
  );
};

export default Login;
