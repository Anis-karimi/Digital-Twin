import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { authApi } from "@/api";
import { GraduationCap, User, Shield, KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";

export const Login = () => {
  const navigate = useNavigate();
  const { isRTL, setRole, language, loginUser, currentUser, role } = useContext(AppContext);

  const [activeRole, setActiveRole] = useState("teacher");
  const [tokenInput, setTokenInput] = useState("sso_token_dr_elahbakhsh");
  const [usernameInput, setUsernameInput] = useState("dr_elahbakhsh");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const roles = [
    {
      id: "teacher",
      titleFa: "استاد درس",
      titleEn: "Teacher",
      icon: GraduationCap,
      descriptionFa: "ورود با هویت دکتر مصطفی اله بخش (استاد درس سیستم عامل) - مدیریت درس و چت‌ها",
      descriptionEn: "Sign in as Dr. Mostafa Elahbakhsh (OS Course Professor) - Course management & chats",
      defaultUsername: "dr_elahbakhsh",
      defaultToken: "sso_token_dr_elahbakhsh",
    },
    {
      id: "student",
      titleFa: "دانشجو",
      titleEn: "Student",
      icon: User,
      descriptionFa: "ورود با هویت علیرضا رضایی (دانشجوی درس سیستم عامل) - دسترسی به آزمون‌ها و دستیار هوشمند",
      descriptionEn: "Sign in as Alireza Rezaei (Enrolled Student) - Access quizzes and AI assistant",
      defaultUsername: "alireza_rezaei",
      defaultToken: "sso_token_student_rezaei",
    },
    {
      id: "admin",
      titleFa: "مدیر سامانه",
      titleEn: "Admin",
      icon: Shield,
      descriptionFa: "نظارت کلی بر سیستم، تنظیمات پایه و مدیریت دسترسی‌ها",
      descriptionEn: "System monitoring, configurations and permissions",
      defaultUsername: "admin",
      defaultToken: "sso_token_admin_001",
    },
  ];

  const currentRoleConfig = roles.find((r) => r.id === activeRole) || roles[0];

  const handleRoleSelect = (roleId) => {
    setActiveRole(roleId);
    setErrorMessage("");
    const roleCfg = roles.find((r) => r.id === roleId);
    if (roleCfg) {
      setUsernameInput(roleCfg.defaultUsername);
      setTokenInput(roleCfg.defaultToken);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        role: activeRole.toUpperCase(),
        token: tokenInput || currentRoleConfig.defaultToken,
        username: usernameInput || currentRoleConfig.defaultUsername,
      };

      const res = await authApi.externalLogin(payload);
      const userRole = (res.role || activeRole).toLowerCase();
      if (loginUser) {
        loginUser(res.user, res.access_token || res.token);
      }
      setRole(userRole);


      if (userRole === "student") {
        navigate("/Student", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage(
        isRTL
          ? "خطا در برقراری ارتباط با سرور. لطفاً دوباره تلاش کنید."
          : "Authentication failed. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1400 w-full min-h-dvh flex items-center justify-center p-4 relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-[420px] bg-white dark:bg-neutral-scale1300 rounded-3xl shadow-xl border border-neutral-scale200 dark:border-neutral-scale1100 p-6 flex flex-col gap-5 relative z-10 transition-colors duration-200">
        {/* Top Action Bar */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-scale100 dark:border-neutral-scale1100">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(role === "student" ? "/Student" : "/");
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-scale1000 dark:text-neutral-scale300 hover:text-black dark:hover:text-white cursor-pointer font-vazir"
          >
            {isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isRTL ? "بازگشت به برنامه" : "Back to App"}</span>
          </button>

          {currentUser && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-vazir">
              {isRTL ? `کاربر فعلی: ${currentUser.username || "استاد"}` : `Active: ${currentUser.username || "teacher"}`}
            </span>
          )}
        </div>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-primery-700 dark:bg-primery-900 text-white flex items-center justify-center shadow-lg shadow-primery-700/25">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="fa-title-1 dark:text-neutral-scale100 text-neutral-scale1800 font-vazir mt-2">
            {isRTL ? "ورود به دوقلوی دیجیتال" : "Digital Twin Login"}
          </h1>
          <p className="fa-caption-1 text-neutral-scale900 dark:text-neutral-scale400 font-vazir">
            {isRTL
              ? "احراز هویت از طریق سامانه یکپارچه و مدیریت سشن"
              : "Unified external authentication & session management"}
          </p>
        </div>

        {/* 3 Distinct Role Selectors */}
        <div className="flex flex-col gap-2">
          <label className="fa-caption-2 text-neutral-scale800 dark:text-neutral-scale300 font-vazir">
            {isRTL ? "انتخاب نقش کاربری:" : "Select your role:"}
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-scale100 dark:bg-neutral-scale1400 rounded-2xl">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSelect(r.id)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-white dark:bg-primery-800 text-primery-700 dark:text-white shadow-sm font-semibold"
                      : "text-neutral-scale900 dark:text-neutral-scale400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="fa-caption-2 font-vazir">
                    {isRTL ? r.titleFa : r.titleEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Info Card */}
        <div className="p-3 bg-primery-50 dark:bg-neutral-scale1200/50 rounded-2xl border border-primery-100 dark:border-neutral-scale1100 flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primery-700 dark:bg-primery-400 mt-2 shrink-0" />
          <p className="fa-caption-2 text-neutral-scale1000 dark:text-neutral-scale300 font-vazir leading-relaxed">
            {isRTL ? currentRoleConfig.descriptionFa : currentRoleConfig.descriptionEn}
          </p>
        </div>

        {/* Quick Demo Profiles */}
        <div className="flex flex-col gap-1.5">
          <span className="fa-caption-2 text-neutral-scale700 dark:text-neutral-scale400 font-vazir">
            {isRTL ? "انتخاب سریع پروفایل‌های تستی:" : "Quick Demo Profiles:"}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                handleRoleSelect("teacher");
                setUsernameInput("dr_elahbakhsh");
                setTokenInput("sso_token_dr_elahbakhsh");
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-vazir cursor-pointer transition-all border ${
                usernameInput === "dr_elahbakhsh"
                  ? "bg-primery-100 dark:bg-primery-900/60 border-primery-400 text-primery-800 dark:text-primery-200 font-semibold shadow-xs"
                  : "bg-neutral-scale80 dark:bg-neutral-scale1400 border-neutral-scale200 dark:border-neutral-scale1000 text-neutral-scale1000 dark:text-neutral-scale300 hover:border-primery-300"
              }`}
            >
              👨‍🏫 {isRTL ? "دکتر اله بخش (استاد درس)" : "Dr. Elahbakhsh (Teacher)"}
            </button>

            <button
              type="button"
              onClick={() => {
                handleRoleSelect("student");
                setUsernameInput("alireza_rezaei");
                setTokenInput("sso_token_student_rezaei");
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-vazir cursor-pointer transition-all border ${
                usernameInput === "alireza_rezaei"
                  ? "bg-primery-100 dark:bg-primery-900/60 border-primery-400 text-primery-800 dark:text-primery-200 font-semibold shadow-xs"
                  : "bg-neutral-scale80 dark:bg-neutral-scale1400 border-neutral-scale200 dark:border-neutral-scale1000 text-neutral-scale1000 dark:text-neutral-scale300 hover:border-primery-300"
              }`}
            >
              🎓 {isRTL ? "علیرضا رضایی (دانشجو)" : "Alireza Rezaei (Student)"}
            </button>
          </div>
        </div>

        {/* Login Form with External Token Inputs */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 fa-caption-2 font-vazir text-center">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="fa-caption-2 text-neutral-scale1000 dark:text-neutral-scale300 font-vazir">
              {isRTL ? "شناسه کاربری / نام کاربری:" : "Username / Identifier:"}
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder={currentRoleConfig.defaultUsername}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 bg-white dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale100 fa-body-medium font-vazir focus:outline-none focus:ring-2 focus:ring-primery-600 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="fa-caption-2 text-neutral-scale1000 dark:text-neutral-scale300 font-vazir">
              {isRTL ? "توکن احراز هویت خارجی (SSO Token):" : "External Auth Token (SSO):"}
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={currentRoleConfig.defaultToken}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-scale300 dark:border-neutral-scale1000 bg-white dark:bg-neutral-scale1400 text-neutral-scale1800 dark:text-neutral-scale100 fa-body-medium font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primery-600 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-primery-700 hover:bg-primery-800 dark:bg-primery-800 dark:hover:bg-primery-700 text-white font-vazir fa-body-medium flex items-center justify-center gap-2 shadow-lg shadow-primery-700/20 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>{isRTL ? "در حال ایجاد سشن..." : "Creating session..."}</span>
            ) : (
              <>
                <span>
                  {isRTL
                    ? `ورود به عنوان ${currentRoleConfig.titleFa}`
                    : `Sign in as ${currentRoleConfig.titleEn}`}
                </span>
                {isRTL ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
