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
  UserPlus,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
} from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { AppContext } from "@/Context/AppContext";
import { useTheme } from "@/Context/ThemeContext";
import { adminApi } from "@/api";
import { toPersianDigits } from "@/utils/dateUtils";

export const AdminUsersPage = () => {
  const { isRTL } = useContext(AppContext);
  const { isDark, toggleTheme } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // User Creation Modal & Action State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    user_type: "STUDENT",
    bio: "",
    is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [togglingUserId, setTogglingUserId] = useState(null);

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
          colorClass:
            "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
        };
      case "TEACHER":
        return {
          label: isRTL ? "استاد" : "Instructor",
          icon: School,
          colorClass:
            "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
        };
      case "STUDENT":
      default:
        return {
          label: isRTL ? "دانشجو" : "Student",
          icon: GraduationCap,
          colorClass:
            "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
        };
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername) {
      setFormError(isRTL ? "لطفاً نام کاربری را وارد کنید." : "Please enter a username.");
      return;
    }
    if (trimmedUsername.includes(" ")) {
      setFormError(isRTL ? "نام کاربری نمی‌تواند شامل فاصله باشد." : "Username cannot contain spaces.");
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setFormError(isRTL ? "رمز عبور باید حداقل ۴ کاراکتر باشد." : "Password must be at least 4 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const newUser = await adminApi.createUser({
        username: trimmedUsername,
        password: formData.password,
        first_name: formData.first_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        user_type: formData.user_type,
        bio: formData.bio.trim() || null,
        is_active: formData.is_active,
      });

      // Prepend new user to state
      setUsers((prev) => [newUser, ...prev.filter((u) => u.user_id !== newUser.user_id)]);
      setShowCreateModal(false);
      setFormData({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        user_type: "STUDENT",
        bio: "",
        is_active: true,
      });
      setActionMessage({
        type: "success",
        text: isRTL
          ? `کاربر «${newUser.full_name || newUser.username}» با موفقیت افزوده شد.`
          : `User "${newUser.full_name || newUser.username}" created successfully.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      console.error("Create user failed:", err);
      setFormError(
        err?.message || (isRTL ? "خطا در ایجاد کاربر. لطفاً مجدداً تلاش کنید." : "Failed to create user.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (togglingUserId) return;
    setTogglingUserId(user.user_id);
    try {
      const updated = await adminApi.toggleUserStatus(user.user_id);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, is_active: updated.is_active } : u))
      );
      setActionMessage({
        type: "success",
        text: isRTL
          ? `وضعیت کاربر «${user.full_name || user.username}» به ${
              updated.is_active ? "فعال" : "غیرفعال"
            } تغییر کرد.`
          : `User "${user.full_name || user.username}" is now ${
              updated.is_active ? "Active" : "Inactive"
            }.`,
      });
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error("Toggle status error:", err);
      setActionMessage({
        type: "error",
        text: isRTL ? "خطا در تغییر وضعیت کاربر." : "Failed to change user status.",
      });
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setTogglingUserId(null);
    }
  };

  return (
    <main
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-full mx-auto flex flex-col overflow-hidden relative transition-colors duration-200"
    >
      {/* Top Header */}
      <header className="w-full h-[65px] flex items-center justify-between px-3.5 bg-primery-700 dark:bg-neutral-scale1300 border-b border-primery-800 dark:border-neutral-scale1000 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-neutral-scale1200 flex items-center justify-center text-white shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-white text-xs font-bold leading-tight truncate ${
                isRTL ? "font-vazir" : "font-inter"
              }`}
            >
              {isRTL ? "مدیریت کاربران" : "Users Management"}
            </h1>
            <p className="text-white/70 text-[10px] leading-tight truncate">
              {isRTL ? `${toPersianDigits(totalCount)} کاربر ثبت شده` : `${totalCount} registered users`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* New User Button */}
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowCreateModal(true);
            }}
            className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 flex items-center gap-1 text-white text-[10px] font-bold shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isRTL ? "کاربر جدید" : "New User"}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3 flex flex-col gap-3 pb-[85px]">
        {/* Action feedback toast */}
        {actionMessage && (
          <div
            className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-md transition-all animate-in fade-in slide-in-from-top duration-200 shrink-0 ${
              actionMessage.type === "success"
                ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                : "bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800"
            }`}
          >
            <span className="truncate flex-1">{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-current opacity-70 hover:opacity-100 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Role Metric Summary Pills */}
        <section className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRole("ALL")}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "ALL"
                ? "bg-primery-700 text-white border-primery-800 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale1800 dark:text-neutral-scale70"
            }`}
          >
            <span className="text-sm font-bold">{isRTL ? toPersianDigits(totalCount) : totalCount}</span>
            <span className="text-[9px] mt-0.5 opacity-80">{isRTL ? "همه" : "All"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("STUDENT")}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "STUDENT"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-emerald-700 dark:text-emerald-400"
            }`}
          >
            <span className="text-sm font-bold">{isRTL ? toPersianDigits(studentsCount) : studentsCount}</span>
            <span className="text-[9px] mt-0.5 opacity-80">{isRTL ? "دانشجو" : "Student"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("TEACHER")}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "TEACHER"
                ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-blue-700 dark:text-blue-400"
            }`}
          >
            <span className="text-sm font-bold">{isRTL ? toPersianDigits(teachersCount) : teachersCount}</span>
            <span className="text-[9px] mt-0.5 opacity-80">{isRTL ? "استاد" : "Teacher"}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole("ADMIN")}
            className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              selectedRole === "ADMIN"
                ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                : "bg-neutral-scale70 dark:bg-neutral-scale1300 border-neutral-scale100 dark:border-neutral-scale1100 text-purple-700 dark:text-purple-400"
            }`}
          >
            <span className="text-sm font-bold">{isRTL ? toPersianDigits(adminsCount) : adminsCount}</span>
            <span className="text-[9px] mt-0.5 opacity-80">{isRTL ? "مدیر" : "Admin"}</span>
          </button>
        </section>

        {/* Search Bar */}
        <section className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-1 shadow-xs">
          <div className="relative w-full">
            <Search
              className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 text-neutral-scale600 dark:text-neutral-scale500 ${
                isRTL ? "right-2.5" : "left-2.5"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? "جستجوی کاربر یا نام کاربری..." : "Search users..."}
              className={`w-full bg-white dark:bg-neutral-scale1200 rounded-lg py-1.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale500 focus:outline-none focus:border-primery-600 transition-colors ${
                isRTL ? "pr-8 pl-2.5 text-right" : "pl-8 pr-2.5 text-left"
              }`}
            />
          </div>
        </section>

        {/* Users List */}
        <section className="flex flex-col gap-2">
          {loading ? (
            <div className="w-full py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-primery-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-neutral-scale700 dark:text-neutral-scale400">
                {isRTL ? "در حال دریافت کاربران..." : "Loading users..."}
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-6 text-center flex flex-col items-center justify-center gap-2.5">
              <Users className="w-8 h-8 text-neutral-scale400" />
              <p className="text-xs font-bold text-neutral-scale700 dark:text-neutral-scale300">
                {isRTL ? "کاربری با این مشخصات یافت نشد." : "No users found."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setShowCreateModal(true);
                }}
                className="mt-1 px-3 py-1.5 rounded-lg bg-primery-700 hover:bg-primery-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isRTL ? "افزودن کاربر جدید" : "Create New User"}</span>
              </button>
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

              const isUpdatingStatus = togglingUserId === user.user_id;

              return (
                <div
                  key={user.user_id}
                  className="bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] p-2.5 flex items-center justify-between gap-2.5 shadow-xs hover:border-primery-300 dark:hover:border-neutral-scale900 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* User Avatar Initials */}
                    <div className="w-9 h-9 rounded-full bg-primery-100 dark:bg-neutral-scale1200 text-primery-800 dark:text-primery-300 font-bold flex items-center justify-center text-xs shrink-0 select-none">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-neutral-scale1800 dark:text-neutral-scale70 truncate">
                          {user.full_name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${roleInfo.colorClass}`}
                        >
                          <RoleIcon className="w-2.5 h-2.5" />
                          <span>{roleInfo.label}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-scale700 dark:text-neutral-scale400 font-mono mt-0.5 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Clickable Status badge */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleToggleStatus(user)}
                      title={
                        isRTL
                          ? user.is_active
                            ? "کلیک برای غیرفعال‌سازی حساب"
                            : "کلیک برای فعال‌سازی حساب"
                          : "Click to toggle account status"
                      }
                      className="transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      {isUpdatingStatus ? (
                        <div className="w-4 h-4 border-2 border-primery-600 border-t-transparent rounded-full animate-spin" />
                      ) : user.is_active ? (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/40">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{isRTL ? "فعال" : "Active"}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-neutral-scale100 hover:bg-neutral-scale200 dark:bg-neutral-scale1200 dark:hover:bg-neutral-scale1100 text-neutral-scale600 dark:text-neutral-scale400 flex items-center gap-1 border border-neutral-scale200 dark:border-neutral-scale1000">
                          <XCircle className="w-2.5 h-2.5" />
                          <span>{isRTL ? "غیرفعال" : "Inactive"}</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* User Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            dir={isRTL ? "rtl" : "ltr"}
            className="w-full max-w-[340px] bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-primery-700 dark:bg-neutral-scale1200 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <UserPlus className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold leading-tight truncate">
                    {isRTL ? "افزودن کاربر جدید" : "Create New User"}
                  </h3>
                  <p className="text-[9px] text-white/70 leading-tight truncate">
                    {isRTL ? "تعریف دسترسی و حساب کاربری" : "Define credentials and role"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-6 h-6 rounded-md hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateUser} className="p-3.5 flex flex-col gap-3 overflow-y-auto">
              {formError && (
                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-red-700 dark:text-red-300 text-[11px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1 leading-snug">{formError}</span>
                </div>
              )}

              {/* Role Selector Chips */}
              <div>
                <label className="text-[10px] font-bold text-neutral-scale900 dark:text-neutral-scale200 block mb-1">
                  {isRTL ? "نقش کاربری *" : "User Role *"}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, user_type: "STUDENT" }))}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                      formData.user_type === "STUDENT"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        : "bg-white dark:bg-neutral-scale1200 border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale800 dark:text-neutral-scale200 hover:border-emerald-300"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{isRTL ? "دانشجو" : "Student"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, user_type: "TEACHER" }))}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                      formData.user_type === "TEACHER"
                        ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                        : "bg-white dark:bg-neutral-scale1200 border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale800 dark:text-neutral-scale200 hover:border-blue-300"
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{isRTL ? "استاد" : "Teacher"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, user_type: "ADMIN" }))}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                      formData.user_type === "ADMIN"
                        ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                        : "bg-white dark:bg-neutral-scale1200 border-neutral-scale100 dark:border-neutral-scale1100 text-neutral-scale800 dark:text-neutral-scale200 hover:border-purple-300"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">{isRTL ? "مدیر" : "Admin"}</span>
                  </button>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-[10px] font-bold text-neutral-scale900 dark:text-neutral-scale200 block mb-1">
                  {isRTL ? "نام کاربری (یکتا) *" : "Username (Unique) *"}
                </label>
                <div className="relative">
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 text-neutral-scale500 text-xs font-mono select-none ${
                      isRTL ? "right-2.5" : "left-2.5"
                    }`}
                  >
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="e.g. s_ahmadi"
                    dir="ltr"
                    className={`w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-lg py-1.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 focus:outline-none focus:border-primery-600 transition-colors font-mono ${
                      isRTL ? "pr-7 pl-2.5" : "pl-7 pr-2.5"
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-neutral-scale900 dark:text-neutral-scale200 block mb-1">
                  {isRTL ? "رمز عبور *" : "Password *"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-lg py-1.5 px-2.5 pl-8 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 focus:outline-none focus:border-primery-600 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-scale500 hover:text-neutral-scale800 dark:hover:text-neutral-scale200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-neutral-scale900 dark:text-neutral-scale200 block mb-1">
                    {isRTL ? "نام" : "First Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                    placeholder={isRTL ? "مثال: علی" : "First name"}
                    className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-lg py-1.5 px-2.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 focus:outline-none focus:border-primery-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-scale900 dark:text-neutral-scale200 block mb-1">
                    {isRTL ? "نام خانوادگی" : "Last Name"}
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                    placeholder={isRTL ? "مثال: احمدی" : "Last name"}
                    className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-lg py-1.5 px-2.5 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 focus:outline-none focus:border-primery-600 transition-colors"
                  />
                </div>
              </div>

              {/* Bio / Description */}
              <div>
                <label className="text-[10px] font-bold text-neutral-scale900 dark:text-neutral-scale200 block mb-1">
                  {isRTL ? "بیوگرافی / یادداشت (اختیاری)" : "Bio / Note (Optional)"}
                </label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder={isRTL ? "توضیحات کوتاه درباره کاربر..." : "Short bio or notes..."}
                  className="w-full bg-white dark:bg-neutral-scale1200 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-lg p-2 text-xs text-neutral-scale1800 dark:text-neutral-scale70 placeholder-neutral-scale400 focus:outline-none focus:border-primery-600 transition-colors resize-none"
                />
              </div>

              {/* Active Status Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none py-0.5">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-primery-600 rounded cursor-pointer"
                />
                <span className="text-[11px] font-bold text-neutral-scale900 dark:text-neutral-scale200">
                  {isRTL ? "حساب کاربری از ابتدا فعال باشد" : "Account is active"}
                </span>
              </label>

              {/* Modal Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-scale100 dark:border-neutral-scale1100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                  className="flex-1 py-1.5 rounded-lg border border-neutral-scale200 dark:border-neutral-scale1000 text-neutral-scale700 dark:text-neutral-scale300 hover:bg-neutral-scale100 dark:hover:bg-neutral-scale1200 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isRTL ? "انصراف" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isRTL ? "ثبت کاربر" : "Create User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminUsersPage;
