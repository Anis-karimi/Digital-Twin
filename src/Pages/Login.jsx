import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "@/Context/AppContext";
import { authApi } from "@/api";
import { GraduationCap, User, Shield, KeyRound, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";

export const Login = () => {
  const navigate = useNavigate();
  const { isRTL, setRole, loginUser, currentUser, role, t } = useContext(AppContext);

  const [loadingRole, setLoadingRole] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const sampleProfiles = [
    {
      id: "teacher",
      role: "TEACHER",
      titleKey: "drAllahbakhsh",
      roleKey: "teacherRole",
      descKey: "teacherDesc",
      icon: GraduationCap,
      defaultUsername: "mohammad_allahbakhsh",
      defaultToken: "sso_token_dr_allahbakhsh",
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      accentBorder: "hover:border-blue-500 dark:hover:border-blue-500",
    },
    {
      id: "student",
      role: "STUDENT",
      titleKey: "alirezaRezaei",
      roleKey: "studentRole",
      descKey: "studentDesc",
      icon: User,
      defaultUsername: "alireza_rezaei",
      defaultToken: "sso_token_student_rezaei",
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      accentBorder: "hover:border-emerald-500 dark:hover:border-emerald-500",
    },
    {
      id: "admin",
      role: "ADMIN",
      titleKey: "systemAdmin",
      roleKey: "adminRole",
      descKey: "adminDesc",
      icon: Shield,
      defaultUsername: "admin",
      defaultToken: "sso_token_admin_001",
      badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      accentBorder: "hover:border-purple-500 dark:hover:border-purple-500",
    },
  ];

  const handleQuickLogin = async (profile) => {
    if (loadingRole) return;
    setLoadingRole(profile.id);
    setErrorMessage("");

    try {
      const payload = {
        role: profile.role,
        token: profile.defaultToken,
        username: profile.defaultUsername,
      };

      const res = await authApi.externalLogin(payload);
      const userRole = (res.role || res.user?.user_type || profile.id).toLowerCase();

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
      setErrorMessage(t("loginErrorMessage"));
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <main
      className="bg-[#f9f9f9] dark:bg-neutral-scale1400 w-full min-h-dvh flex items-center justify-center p-4 relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-[440px] bg-white dark:bg-neutral-scale1300 rounded-3xl shadow-xl border border-neutral-scale200 dark:border-neutral-scale1100 p-6 flex flex-col gap-5 relative z-10 transition-colors duration-200">
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
            <span>{t("backToApp")}</span>
          </button>

          {currentUser && (
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-vazir">
              {`${t("activeUser")} ${currentUser.first_name || currentUser.username || (isRTL ? "استاد" : "Teacher")}`}
            </span>
          )}
        </div>

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center gap-1.5 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-primery-700 dark:bg-primery-900 text-white flex items-center justify-center shadow-lg shadow-primery-700/25">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="fa-title-1 dark:text-neutral-scale100 text-neutral-scale1800 font-vazir mt-2">
            {t("loginToDigitalTwin")}
          </h1>
          <p className="fa-caption-1 text-neutral-scale900 dark:text-neutral-scale400 font-vazir">
            {t("quickLoginSubtitle")}
          </p>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 fa-caption-2 font-vazir text-center">
            {errorMessage}
          </div>
        )}

        {/* One-Click Sample Profile Buttons */}
        <div className="flex flex-col gap-3">
          {sampleProfiles.map((profile) => {
            const Icon = profile.icon;
            const isLoadingThis = loadingRole === profile.id;
            const isAnyLoading = Boolean(loadingRole);

            return (
              <button
                key={profile.id}
                type="button"
                disabled={isAnyLoading}
                onClick={() => handleQuickLogin(profile)}
                className={`w-full p-4 rounded-2xl border border-neutral-scale200 dark:border-neutral-scale1100 bg-neutral-scale50/50 dark:bg-neutral-scale1400 flex items-center gap-3.5 transition-all duration-200 cursor-pointer text-start ${profile.accentBorder} hover:shadow-md hover:bg-white dark:hover:bg-neutral-scale1200 disabled:opacity-50`}
              >
                {/* Icon box */}
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-neutral-scale1300 border border-neutral-scale200 dark:border-neutral-scale1000 flex items-center justify-center shrink-0 shadow-xs">
                  {isLoadingThis ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primery-700 dark:text-primery-400" />
                  ) : (
                    <Icon className="w-5 h-5 text-primery-700 dark:text-primery-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-scale1800 dark:text-neutral-scale100 font-vazir truncate">
                      {t(profile.titleKey)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md border font-vazir shrink-0 ${profile.badgeColor}`}
                    >
                      {t(profile.roleKey)}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-scale900 dark:text-neutral-scale400 font-vazir mt-0.5 line-clamp-1">
                    {t(profile.descKey)}
                  </p>
                </div>

                {/* Forward Arrow */}
                <div className="shrink-0 text-neutral-scale600 dark:text-neutral-scale400">
                  {isRTL ? (
                    <ArrowLeft className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default Login;
