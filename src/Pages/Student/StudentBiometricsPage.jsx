/**
 * @file StudentBiometricsPage.jsx
 * @description Student Face Authentication, Gaze Calibration ('نه نه'),
 * and 3-Second Neutral Baseline Emotion Calibration Wizard.
 * Saves biometric profile data directly to the main DT backend.
 */

import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanFace,
  CheckCircle2,
  Target,
  Smile,
  Camera,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  ShieldCheck,
  Activity,
  UserCheck,
  Eye,
} from "lucide-react";
import { AppContext } from "@/Context/AppContext";
import { biometricsApi } from "@/api/new/biometrics.api";
import { useBiometricCamera } from "@/features/biometrics/hooks/useBiometricCamera";
import { useGazeCalibration } from "@/features/biometrics/hooks/useGazeCalibration";
import { useNeutralCalibration } from "@/features/biometrics/hooks/useNeutralCalibration";
import { DebugOverlayCanvas } from "@/features/biometrics/components/DebugOverlayCanvas";
import { CircumplexGrid } from "@/features/biometrics/components/CircumplexGrid";
import { ActionUnitMeters } from "@/features/biometrics/components/ActionUnitMeters";

const WIZARD_STEPS = [
  { id: 1, title: "ثبت چهره و اصالت‌سنجی", icon: ScanFace },
  { id: 2, title: "کالیبراسیون نگاه (نه نه)", icon: Target },
  { id: 3, title: "مبنای خنثی احساسات (۳ ثانیه)", icon: Smile },
  { id: 4, title: "تایید و پایش زنده", icon: CheckCircle2 },
];

export function StudentBiometricsPage() {
  const navigate = useNavigate();
  const { currentUser, isRTL } = useContext(AppContext);

  const studentId = String(
    currentUser?.id ||
    currentUser?.student_id ||
    currentUser?.username ||
    "20000000-0000-4000-8000-000000000105"
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [profileStatus, setProfileStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState({ success: false, message: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [liveTelemetry, setLiveTelemetry] = useState(null);

  // 1. Camera Hook
  const {
    videoRef,
    isActive: isCameraActive,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrameBlob,
  } = useBiometricCamera({ autoStart: true });

  // 2. Gaze Calibration Hook
  const {
    isCalibrating: isGazeCalibrating,
    currentStep: gazeSubStep,
    totalSteps: gazeTotalSteps,
    currentTarget: gazeTarget,
    isCalibrated: isGazeCalibrated,
    statusMessage: gazeStatusMsg,
    startCalibration: startGazeCalibration,
  } = useGazeCalibration({
    userId: studentId,
    captureFrameBlob,
    onCalibrationComplete: () => {
      loadProfile();
    },
  });

  // 3. Neutral Calibration Hook
  const {
    isCalibrating: isNeutralCalibrating,
    countdownSec: neutralCountdown,
    isNeutralCalibrated,
    statusText: neutralStatusMsg,
    startNeutralCalibration,
  } = useNeutralCalibration({
    userId: studentId,
    captureFrameBlob,
    onCalibrationComplete: () => {
      loadProfile();
    },
  });

  // Load profile from backend
  const loadProfile = async () => {
    try {
      const data = await biometricsApi.getStudentBiometricProfile(studentId);
      if (data) {
        setProfileStatus(data);
        if (data.face_enrolled) {
          setEnrollStatus({ success: true, message: "چهره شما قبلاً با موفقیت ثبت شده است." });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch student biometric profile:", err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [studentId]);

  // Live telemetry pulse during step 4 preview
  useEffect(() => {
    let timer = null;
    if (currentStep === 4 && isCameraActive) {
      timer = setInterval(async () => {
        try {
          const blob = await captureFrameBlob(0.65, 320, 240);
          if (blob) {
            const telem = await biometricsApi.sendBiometricTelemetry(studentId, blob, "skip");
            setLiveTelemetry(telem);
          }
        } catch (e) {
          console.warn("Step 4 preview pulse error:", e);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, isCameraActive, studentId, captureFrameBlob]);

  // Handle Face Enrollment
  const handleEnrollFace = async () => {
    setErrorMsg("");
    setIsLoading(true);
    try {
      const blob = await captureFrameBlob(0.85, 640, 480);
      if (!blob) {
        throw new Error("خطا در دریافت تصویر از دوربین. لطفاً دسترسی دوربین را بررسی کنید.");
      }
      const res = await biometricsApi.enrollStudentFace(studentId, blob, "balanced");
      if (res?.status === "enrolled" || res?.user_id) {
        setEnrollStatus({
          success: true,
          message: "چهره با موفقیت ثبت شد و بردار ۵۱۲-بعدی ضدجعل ذخیره گردید.",
        });
        await loadProfile();
      } else {
        setErrorMsg(res?.detail || "خطا در ثبت چهره. لطفاً مستقیماً به دوربین نگاه کنید.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "خطای ارتباط با سرور در ثبت چهره.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center justify-start select-none"
      dir="rtl"
    >
      {/* Container */}
      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Top Navigation / Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/StudentSettings")}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به تنظیمات
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>دانشجو:</span>
            <span className="text-sky-300 font-bold bg-sky-950/60 px-2.5 py-1 rounded-lg border border-sky-500/20">
              {currentUser?.name || currentUser?.username || "دانشجو"}
            </span>
          </div>
        </div>

        {/* Wizard Header Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                  <ScanFace className="w-6 h-6" />
                </div>
                احراز هویت و کالیبراسیون بیومتریک چهره
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-2 leading-relaxed">
                برای شرکت در آزمون‌های برخط هوشمند، لطفاً چهره خود را ثبت نموده و فرآیند
                کالیبراسیون زاویه نگاه و حالت خنثی احساسات را تکمیل کنید.
              </p>
            </div>

            {/* Profile Ready Badge */}
            {profileStatus?.ready_for_exam && (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3.5 py-2 rounded-xl self-start md:self-auto font-medium shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                پروفایل آماده آزمون است
              </div>
            )}
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-white/10">
            {WIZARD_STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStep(s.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-right ${
                    isActive
                      ? "bg-indigo-600/30 border-indigo-500/60 text-white shadow-lg shadow-indigo-500/10"
                      : isPast
                      ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30"
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-indigo-500 text-white"
                        : isPast
                        ? "bg-emerald-500/30 text-emerald-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      مرحله {s.id}
                    </span>
                    <span className="text-xs font-bold truncate block">
                      {s.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Error Banner */}
        {(errorMsg || cameraError) && (
          <div className="flex items-center gap-3 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMsg || cameraError}</span>
          </div>
        )}

        {/* Wizard Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left / Video Card (7 cols) */}
          <div className="md:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2 font-semibold">
                <Camera className="w-4 h-4 text-sky-400" />
                تصویر زنده دوربین
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ۳۰ فریم بر ثانیه
              </span>
            </div>

            {/* Video Box */}
            <div className="relative aspect-video w-full bg-black/90 rounded-xl overflow-hidden border border-white/10 shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Guide Oval / Target Face Box in Step 1 */}
              {currentStep === 1 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-sky-400/60 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <span className="text-[11px] text-sky-300 bg-slate-950/70 px-2.5 py-1 rounded-full font-medium">
                      چهره درون بیضی قرار گیرد
                    </span>
                  </div>
                </div>
              )}

              {/* Debug HUD Overlay in Step 4 */}
              {currentStep === 4 && (
                <DebugOverlayCanvas
                  telemetry={liveTelemetry}
                  showOverlay={true}
                  videoWidth={640}
                  videoHeight={480}
                />
              )}
            </div>

            {/* Hardware Status Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {isCameraActive ? "راه‌اندازی مجدد دوربین" : "اتصال دوربین"}
              </button>

              <span className="text-[11px] text-slate-500 font-mono">
                وضوح: 640x480 (تله‌متری فشرده: 320x240)
              </span>
            </div>
          </div>

          {/* Right / Interaction Panel (5 cols) */}
          <div className="md:col-span-5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
            {/* Step 1: Face Enrollment */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <ScanFace className="w-5 h-5" />
                  مرحله اول: ثبت بردار چهره و ضدجعل
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  در این مرحله، مدل ضدجعل <b>MiniFASNet</b> زنده‌بودن چهره را ارزیابی کرده
                  و بردار ۵۱۲-بعدی <b>ArcFace</b> برای تطابق هویت در آزمون استخراج می‌شود.
                </p>

                {enrollStatus.success && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{enrollStatus.message}</span>
                  </div>
                )}

                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 text-[11px] text-slate-400 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span>وضعیت ثبت در سرور:</span>
                    <b className={profileStatus?.face_enrolled ? "text-emerald-400" : "text-amber-400"}>
                      {profileStatus?.face_enrolled ? "ثبت‌شده" : "ثبت‌نشده"}
                    </b>
                  </div>
                  <div className="flex justify-between">
                    <span>اندازه بردار ArcFace:</span>
                    <b className="text-sky-300 font-mono">512 بعد شناور</b>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleEnrollFace}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      در حال پردازش و استخراج بردار...
                    </>
                  ) : (
                    <>
                      <ScanFace className="w-4 h-4" />
                      ثبت چهره از روی دوربین
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: Gaze Calibration ('نه نه') */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Target className="w-5 h-5" />
                  مرحله دوم: کالیبراسیون نگاه و زاویه سر (نه نه)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  با کلیک روی شروع کالیبراسیون، نقاطی روی صفحه ظاهر می‌شوند. لطفاً با چرخش
                  آرام سر به سمت چپ و راست (حرکت نه نه) و تثبیت نگاه روی نقاط، مدل رگرسیون
                  زاویه نگاه را کالیبره کنید.
                </p>

                <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 text-[11px] text-slate-400 flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span>وضعیت کالیبراسیون:</span>
                    <b className={isGazeCalibrated ? "text-emerald-400" : "text-amber-400"}>
                      {isGazeCalibrated ? "کالیبره‌شده با رگرسیون ریج" : "تخمین هندسی اولیه"}
                    </b>
                  </div>
                  <div className="flex justify-between">
                    <span>پیام وضعیت:</span>
                    <span className="text-sky-300 font-medium truncate max-w-[200px]">
                      {gazeStatusMsg}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGazeCalibrating || !isCameraActive}
                  onClick={startGazeCalibration}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition-all mt-2"
                >
                  {isGazeCalibrating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      کالیبراسیون در حال اجرا...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      شروع کالیبراسیون نگاه و سر (نه نه)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Neutral Emotion Baseline */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                  <Smile className="w-5 h-5" />
                  مرحله سوم: تعیین مبنای چهره خنثی (۳ ثانیه)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  برخی افراد به طور طبیعی ابروهای به هم فشرده یا گوشه لب متمایل به پایین دارند.
                  با ۳ ثانیه آرامش و نگه داشتن چهره طبیعی روبه‌روی دوربین، این بایاس خنثی می‌شود.
                </p>

                <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-white/5 my-1">
                  <span className="text-4xl font-black font-mono text-sky-400">
                    {isNeutralCalibrating ? `${neutralCountdown}s` : "۳ ثانیه"}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    {neutralStatusMsg}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isNeutralCalibrating || !isCameraActive}
                  onClick={startNeutralCalibration}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition-all mt-2"
                >
                  {isNeutralCalibrating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      در حال ضبط مبنای خنثی...
                    </>
                  ) : (
                    <>
                      <Smile className="w-4 h-4" />
                      شروع ضبط مبنای چهره خنثی (۳ ثانیه)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 4: Summary & Live Telemetry Test */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  مرحله چهارم: بررسی نهایی و آزمون زنده
                </div>

                {/* Status checklist */}
                <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-xl border border-white/5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <ScanFace className="w-4 h-4 text-indigo-400" />
                      ثبت چهره و لایونس:
                    </span>
                    <span className={profileStatus?.face_enrolled ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {profileStatus?.face_enrolled ? "تایید شده ✓" : "ثبت‌نشده"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Target className="w-4 h-4 text-purple-400" />
                      کالیبراسیون نگاه (نه نه):
                    </span>
                    <span className={profileStatus?.gaze_calibrated || isGazeCalibrated ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {profileStatus?.gaze_calibrated || isGazeCalibrated ? "تایید شده ✓" : "پایه هندسی"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-300">
                      <Smile className="w-4 h-4 text-sky-400" />
                      مبنای خنثی احساسات:
                    </span>
                    <span className={profileStatus?.neutral_calibrated || isNeutralCalibrated ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {profileStatus?.neutral_calibrated || isNeutralCalibrated ? "تایید شده ✓" : "پیش‌فرض"}
                    </span>
                  </div>
                </div>

                {/* Live Scores Mini Card */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">تمرکز زنده:</span>
                    <b className={liveTelemetry?.is_focused ? "text-emerald-400" : "text-rose-400"}>
                      {liveTelemetry?.attention_score ? `${liveTelemetry.attention_score.toFixed(1)}%` : "۹۵.۰%"}
                    </b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">استرس سنجیده شده:</span>
                    <b className="text-sky-300 font-mono">
                      {liveTelemetry?.stress_score ? `${liveTelemetry.stress_score.toFixed(1)}%` : "۲۲.۰%"}
                    </b>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">جهت نگاه:</span>
                    <b className="text-purple-300 font-mono">
                      {liveTelemetry?.gaze_direction || "مرکز صفحه"}
                    </b>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/StudentExams")}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all mt-1"
                >
                  <ShieldCheck className="w-4 h-4" />
                  تایید و ورود به صفحه آزمون‌ها
                </button>
              </div>
            )}

            {/* Next / Previous Stepper Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                مرحله قبل
              </button>

              <button
                type="button"
                disabled={currentStep === 4}
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                مرحله بعد
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Gaze Calibration Modal Overlay */}
      {isGazeCalibrating && gazeTarget && (
        <div className="fixed inset-0 bg-slate-950/95 z-[9999] flex flex-col items-center justify-center p-6 select-none">
          <div className="absolute top-10 text-center">
            <span className="text-xs px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              مرحله {gazeSubStep} از {gazeTotalSteps}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-white mt-3">
              {gazeTarget.label}
            </h3>
            <p className="text-sm text-sky-400 mt-1.5">
              {gazeTarget.hint}
            </p>
          </div>

          {/* Moving target dot */}
          <div
            className="absolute w-10 h-10 rounded-full bg-rose-500 shadow-[0_0_45px_#f43f5e] transition-all duration-500 ease-out border-2 border-white pointer-events-none flex items-center justify-center"
            style={{
              left: `${gazeTarget.x}%`,
              top: `${gazeTarget.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentBiometricsPage;
