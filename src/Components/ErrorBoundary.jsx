import React from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import { getTranslation } from "@/translations";

export class ErrorBoundary extends React.Component {
  static contextType = AppContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/StudentExams";
  };

  render() {
    if (this.state.hasError) {
      const isRTL = this.context?.isRTL ?? (localStorage.getItem("app_language") !== "en");
      const lang = this.context?.language || localStorage.getItem("app_language") || "fa";
      const t = this.context?.t || ((k, fallback) => getTranslation(lang, k, fallback));

      return (
        <div
          dir={isRTL ? "rtl" : "ltr"}
          className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-rose-500/30 p-6 flex flex-col items-center text-center gap-4 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className={`text-base font-bold text-white ${isRTL ? "font-vazir" : "font-inter"}`}>
                {t("runtimeErrorOccurred")}
              </h2>
              <p className={`text-xs text-slate-300 leading-relaxed ${isRTL ? "font-vazir" : "font-inter"}`}>
                {t("runtimeErrorDesc")}
              </p>
              {this.state.error?.message && (
                <div className="mt-2 p-2 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono text-rose-300 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 w-full pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className={`flex-1 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md ${
                  isRTL ? "font-vazir" : "font-inter"
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                {t("retry")}
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className={`flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-white/10 ${
                  isRTL ? "font-vazir" : "font-inter"
                }`}
              >
                <Home className="w-4 h-4" />
                {t("backToApp")}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
