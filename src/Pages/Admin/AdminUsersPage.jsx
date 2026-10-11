import { useContext, useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  GraduationCap,
  School,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  Clock,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";

export const AdminUsersPage = () => {
  const { isRTL } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = (role, query) => {
    setLoading(true);
    adminApi
      .getUsers({ role, q: query })
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers(selectedRole, searchQuery);
    }, 250);

    return () => clearTimeout(handler);
  }, [selectedRole, searchQuery]);

  // Derived counts from current dataset or estimates
  const totalCount = users.length;
  const studentsCount = users.filter((u) => u.user_type === "STUDENT").length;
  const teachersCount = users.filter((u) => u.user_type === "TEACHER").length;
  const adminsCount = users.filter((u) => u.user_type === "ADMIN").length;

  const getRoleBadge = (userType) => {
    switch (userType?.toUpperCase()) {
      case "ADMIN":
        return {
          label: isRTL ? "مدیر سامانه" : "Administrator",
          icon: Shield,
          colorClass: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
        };
      case "TEACHER":
        return {
          label: isRTL ? "استاد" : "Instructor",
          icon: School,
          colorClass: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
        };
      case "STUDENT":
      default:
        return {
          label: isRTL ? "دانشجو" : "Student",
          icon: GraduationCap,
          colorClass: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
        };
    }
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full min-h-dvh flex flex-col overflow-x-hidden transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="w-full h-[65px] flex items-center justify-between px-4 md:px-6 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 dark:bg-neutral-scale1200 flex items-center justify-center text-white">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1
              className={`text-white text-base md:text-lg font-bold leading-tight ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "مدیریت کاربران سامانه" : "Users Management"}
            </h1>
            <p className="text-white/70 text-[11px] leading-tight">
              {isRTL ? `${totalCount} کاربر ثبت شده` : `${totalCount} registered users`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-white" />}
        </button>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto flex-1 px-4 py-5 flex flex-col gap-4 pb-24">
        {/* Role Metric Summary Pills */}
        <section className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setSelectedRole("ALL")}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "ALL"
                ? "bg-primery-700 text-white border-primery-800 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale1800 dark:text-neutral-scale70"
            }`}
          >
            <span className="text-base md:text-lg font-bold">{totalCount}</span>
            <span className="text-[10px] mt-0.5 opacity-80">{isRTL ? "همه" : "All"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("STUDENT")}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "STUDENT"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            <span className="text-base md:text-lg font-bold">{studentsCount}</span>
            <span className="text-[10px] mt-0.5 opacity-80">{isRTL ? "دانشجویان" : "Students"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("TEACHER")}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "TEACHER"
                ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-blue-700 dark:text-blue-400"
            }`}
          >
            <span className="text-base md:text-lg font-bold">{teachersCount}</span>
            <span className="text-[10px] mt-0.5 opacity-80">{isRTL ? "اساتید" : "Teachers"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("ADMIN")}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "ADMIN"
                ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-purple-700 dark:text-purple-400"
            }`}
          >
            <span className="text-base md:text-lg font-bold">{adminsCount}</span>
            <span className="text-[10px] mt-0.5 opacity-80">{isRTL ? "مدیران" : "Admins"}</span>
          </button>
        </section>

        {/* Search Bar */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-3 shadow-xs">
          <div className="relative w-full">
            <Search
              className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-neutral-scale600 dark:text-neutral-scale500 ${
                isRTL ? "right-3" : "left-3"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? "جستجوی کاربر بر اساس نام یا نام کاربری..." : "Search users by name or username..."}
              className={`w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale200 dark:border-neutral-scale1000 rounded-xl py-2 text-xs md:text-sm text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale500 focus:outline-none focus:border-primery-600 transition-colors ${
                isRTL ? "pr-9 pl-3 text-right" : "pl-9 pr-3 text-left"
              }`}
            />
          </div>
        </section>

        {/* Users List */}
        <section className="flex flex-col gap-2.5">
          {loading ? (
            <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-primery-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-neutral-scale700 dark:text-neutral-scale400">
                {isRTL ? "در حال دریافت کاربران..." : "Loading users..."}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-neutral-scale500" />
              <p className="text-xs font-semibold text-neutral-scale700 dark:text-neutral-scale400">
                {isRTL ? "کاربری با این مشخصات یافت نشد." : "No users found."}
              </p>
            </div>
          ) : (
            users.map((user) => {
              const roleInfo = getRoleBadge(user.user_type);
              const RoleIcon = roleInfo.icon;
              const initials = (user.full_name || user.username || "U")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join("");

              return (
                <div
                  key={user.user_id}
                  className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-3 shadow-xs hover:border-primery-300 dark:hover:border-neutral-scale900 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* User Avatar Initials */}
                    <div className="w-10 h-10 rounded-full bg-primery-100 dark:bg-neutral-scale1200 text-primery-800 dark:text-primery-300 font-bold flex items-center justify-center text-xs shrink-0 select-none">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                          {user.full_name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${roleInfo.colorClass}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleInfo.label}</span>
                        </span>
                      </div>
                      <p className="text-xs text-neutral-scale700 dark:text-neutral-scale400 font-mono mt-0.5 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Status badge & last seen */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {user.is_active ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isRTL ? "فعال" : "Active"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-scale100 dark:bg-neutral-scale1200 text-neutral-scale600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>{isRTL ? "غیرفعال" : "Inactive"}</span>
                      </span>
                    )}

                    {user.created_at && (
                      <span className="text-[10px] text-neutral-scale500 dark:text-neutral-scale500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{user.created_at.slice(0, 10)}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminUsersPage;
