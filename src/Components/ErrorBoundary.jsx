import React from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
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
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-rose-500/30 p-6 flex flex-col items-center text-center gap-4 shadow-2xl backdrop-blur-xl">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold font-vazir text-white">
                خطایی در اجرای صفحه رخ داد
              </h2>
              <p className="text-xs text-slate-300 font-vazir leading-relaxed">
                متأسفانه مشکلی در بارگذاری اجزای این بخش پیش آمده است.
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
                className="flex-1 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-vazir text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                تلاش مجدد
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-vazir text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer border border-white/10"
              >
                <Home className="w-4 h-4" />
                بازگشت
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
