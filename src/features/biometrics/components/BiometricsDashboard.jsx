/**
 * @file BiometricsDashboard.jsx
 * @description Biometric Affect, Face Auth & Telemetry Dashboard Component.
 * Integrates camera feed, real-time stress/attention telemetry, Russell circumplex,
 * and calibration actions into a modern liquid-glass interface.
 */

import React, { useState } from "react";
import {
  Camera,
  CameraOff,
  Eye,
  Activity,
  Smile,
  Target,
  ShieldCheck,
  Cpu,
} from "lucide-react";
import { useBiometricCamera } from "../hooks/useBiometricCamera";
import { useBiometricTelemetry } from "../hooks/useBiometricTelemetry";
import { useGazeCalibration } from "../hooks/useGazeCalibration";
import { useNeutralCalibration } from "../hooks/useNeutralCalibration";
import { CircumplexGrid } from "./CircumplexGrid";
import { ActionUnitMeters } from "./ActionUnitMeters";
import { DebugOverlayCanvas } from "./DebugOverlayCanvas";

export function BiometricsDashboard({
  userId = "default_user",
  className = "",
}) {
  const [showDebugOverlay, setShowDebugOverlay] = useState(true);

  // 1. Camera Hook
  const {
    videoRef,
    isActive: isCameraActive,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    error: cameraError,
    startCamera,
    stopCamera,
    captureFrameBlob,
  } = useBiometricCamera({ autoStart: false });

  // 2. Telemetry Hook (1 FPS / 1000ms default)
  const {
    isStreaming,
    telemetry,
    latencyMs,
    error: telemetryError,
    startTelemetry,
    stopTelemetry,
  } = useBiometricTelemetry({
    userId,
    intervalMs: 1000,
    captureFrameBlob,
  });

  // 3. Gaze & Head Movement Calibration
  const {
    isCalibrating: isGazeCalibrating,
    currentStep: gazeStep,
    totalSteps: gazeTotalSteps,
    currentTarget: gazeTarget,
    isCalibrated: isGazeCalibrated,
    startCalibration: startGazeCalibration,
  } = useGazeCalibration({
    userId,
    captureFrameBlob,
  });

  // 4. 3-Second Neutral Baseline Calibration
  const {
    isCalibrating: isNeutralCalibrating,
    countdownSec: neutralCountdown,
    isNeutralCalibrated,
    startNeutralCalibration,
  } = useNeutralCalibration({
    userId,
    captureFrameBlob,
  });

  const stressScore = telemetry?.stress_score ?? 22.0;
  const attentionScore = telemetry?.attention_score ?? 95.0;

  return (
    <div
      className={`flex flex-col gap-5 max-w-5xl mx-auto p-6 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl text-slate-100 ${className}`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Cpu className="w-6 h-6 text-indigo-400" />
            داشبورد بیومتریک و تله‌متری چهره
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            شناسه کاربر: <span className="text-sky-300 font-bold">{userId}</span>
          </p>
        </div>

        {/* Global Status Badges */}
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium border flex items-center gap-1.5 ${
              isGazeCalibrated
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            {isGazeCalibrated ? "کالیبراسیون نگاه فعال" : "نگاه هندسی اولیه"}
          </span>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium border flex items-center gap-1.5 ${
              isNeutralCalibrated
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            {isNeutralCalibrated ? "مبنای خنثی کالیبره‌شده" : "بدون مبنای خنثی"}
          </span>
        </div>
      </div>

      {/* Errors */}
      {(cameraError || telemetryError) && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          {cameraError || telemetryError}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Video Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Viewport */}
          <div className="relative w-full aspect-video bg-black/80 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* HUD Overlay */}
            <DebugOverlayCanvas
              telemetry={telemetry}
              showOverlay={showDebugOverlay}
              videoWidth={640}
              videoHeight={480}
            />

            {/* Offline state */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
                <CameraOff className="w-10 h-10 stroke-[1.5]" />
                <span className="text-sm">دوربین غیرفعال است</span>
              </div>
            )}
          </div>

          {/* Device and Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {devices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="flex-1 bg-slate-850 text-xs text-slate-300 border border-slate-700 rounded-xl p-2.5 focus:outline-none"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `دوربین ${d.deviceId.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            )}

            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Camera className="w-4 h-4" />
                روشن کردن دوربین
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all"
              >
                خاموش کردن دوربین
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDebugOverlay(!showDebugOverlay)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                showDebugOverlay
                  ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              {showDebugOverlay ? "لایه HUD روشن" : "لایه HUD خاموش"}
            </button>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={isStreaming ? stopTelemetry : startTelemetry}
              disabled={!isCameraActive}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                !isCameraActive
                  ? "opacity-50 cursor-not-allowed bg-slate-800 text-slate-500"
                  : isStreaming
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
              }`}
            >
              <Activity className="w-4 h-4" />
              {isStreaming ? "توقف ارسال تله‌متری" : "شروع تله‌متری برخط (1 FPS)"}
            </button>

            <button
              type="button"
              onClick={startNeutralCalibration}
              disabled={!isCameraActive || isNeutralCalibrating}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all"
            >
              {isNeutralCalibrating
                ? `در حال کالیبراسیون (${neutralCountdown}s)...`
                : " مبنای خنثی (۳ ثانیه)"}
            </button>

            <button
              type="button"
              onClick={startGazeCalibration}
              disabled={!isCameraActive || isGazeCalibrating}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all"
            >
               کالیبراسیون نگاه 
            </button>
          </div>
        </div>

        {/* Right / Telemetry Visualizations (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Circumplex */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
            <h4 className="text-xs font-bold text-slate-300 mb-3 w-full text-right flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              فضای عاطفی دوبعدی راسل (Valence / Arousal)
            </h4>
            <CircumplexGrid
              valence={telemetry?.continuous_valence}
              arousal={telemetry?.continuous_arousal}
              quadrant={telemetry?.affect_quadrant}
              quadrantTitle={telemetry?.affect_quadrant_title}
              calibratedMood={telemetry?.calibrated_mood || telemetry?.dominant_emotion}
            />
          </div>

          {/* Scores */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">میزان تمرکز و پایداری توجه:</span>
                <b className={attentionScore >= 60 ? "text-emerald-400" : "text-rose-400"}>
                  {attentionScore.toFixed(1)}%
                </b>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${attentionScore}%`,
                    backgroundColor: attentionScore >= 60 ? "#22c55e" : "#ef4444",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">شاخص استرس مرکب:</span>
                <b className={stressScore < 50 ? "text-emerald-400" : "text-rose-400"}>
                  {stressScore.toFixed(1)}%
                </b>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${stressScore}%`,
                    backgroundColor: stressScore < 50 ? "#22c55e" : "#ef4444",
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5 font-mono">
              <span>زاویه سر: P:{telemetry?.pitch?.toFixed(1) || 0}° Y:{telemetry?.yaw?.toFixed(1) || 0}°</span>
              <span>تاخیر شبکه: {latencyMs}ms</span>
            </div>
          </div>

          {/* FACS Action Units */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5">
            <ActionUnitMeters
              actionUnits={telemetry?.action_units}
              blinkBpm={telemetry?.blink_frequency_bpm}
            />
          </div>
        </div>
      </div>

      {/* Fullscreen Gaze Calibration Modal */}
      {isGazeCalibrating && gazeTarget && (
        <div className="fixed inset-0 bg-slate-950/95 z-[9999] flex flex-col items-center justify-center p-6 select-none">
          <div className="absolute top-10 text-center">
            <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              مرحله {gazeStep} از {gazeTotalSteps}
            </span>
            <h3 className="text-xl font-bold text-white mt-2">
              {gazeTarget.label}
            </h3>
            <p className="text-sm text-sky-400 mt-1">
              {gazeTarget.hint}
            </p>
          </div>

          {/* Moving target dot */}
          <div
            className="absolute w-8 h-8 rounded-full bg-rose-500 shadow-[0_0_35px_#f43f5e] transition-all duration-500 ease-out border-2 border-white pointer-events-none"
            style={{
              left: `${gazeTarget.x}%`,
              top: `${gazeTarget.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default BiometricsDashboard;
