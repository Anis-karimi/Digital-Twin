/**
 * @file DebugOverlayCanvas.jsx
 * @description HUD Canvas Overlay for Biometric Visualizations.
 * Overlays face bounding box, eyes, 3D head pose rays, and calibrated gaze crosshair/trails
 * directly on top of the live video stream.
 */

import React, { useRef, useEffect } from "react";

export function DebugOverlayCanvas({
  telemetry = null,
  videoWidth = 640,
  videoHeight = 480,
  showOverlay = true,
}) {
  const canvasRef = useRef(null);
  const gazeTrailRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showOverlay || !telemetry) return;

    const data = telemetry;
    if (!data.face_detected) {
      gazeTrailRef.current = [];
      return;
    }

    const scaleX = canvas.width / 640;
    const scaleY = canvas.height / 480;

    // 1. Draw Face Bounding Box
    if (data.landmarks?.face_box?.length === 4) {
      const [fx, fy, fw, fh] = data.landmarks.face_box;
      const x = fx * scaleX;
      const y = fy * scaleY;
      const w = fw * scaleX;
      const h = fh * scaleY;

      ctx.strokeStyle = data.is_calibrated ? "#22c55e" : "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Corner Accents
      const cLen = 14;
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Top-Left
      ctx.moveTo(x, y + cLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cLen, y);
      // Top-Right
      ctx.moveTo(x + w - cLen, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cLen);
      // Bottom-Left
      ctx.moveTo(x, y + h - cLen);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + cLen, y + h);
      // Bottom-Right
      ctx.moveTo(x + w - cLen, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - cLen);
      ctx.stroke();
    }

    // 2. Draw Eye Landmarks & Pupils
    if (data.landmarks?.eyes) {
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1.5;
      data.landmarks.eyes.forEach((e) => {
        if (e.length === 4) {
          ctx.strokeRect(e[0] * scaleX, e[1] * scaleY, e[2] * scaleX, e[3] * scaleY);
        }
      });
    }

    // 3. Draw 3D Head Pose Ray
    if (data.pose_vector?.start && data.pose_vector?.end) {
      const [sx, sy] = data.pose_vector.start;
      const [ex, ey] = data.pose_vector.end;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx * scaleX, sy * scaleY);
      ctx.lineTo(ex * scaleX, ey * scaleY);
      ctx.stroke();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(ex * scaleX, ey * scaleY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Gaze Crosshair & Motion Trail
    if (data.gaze_point?.norm_x !== undefined) {
      const gx = data.gaze_point.norm_x * canvas.width;
      const gy = data.gaze_point.norm_y * canvas.height;

      gazeTrailRef.current.push([gx, gy]);
      if (gazeTrailRef.current.length > 8) {
        gazeTrailRef.current.shift();
      }

      // Trail
      gazeTrailRef.current.forEach(([tx, ty], idx) => {
        const alpha = (idx + 1) / gazeTrailRef.current.length;
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.4})`;
        ctx.beginPath();
        ctx.arc(tx, ty, 5 * alpha, 0, Math.PI * 2);
        ctx.fill();
      });

      // Crosshair
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(gx, gy, 12, 0, Math.PI * 2);
      ctx.moveTo(gx - 18, gy);
      ctx.lineTo(gx - 6, gy);
      ctx.moveTo(gx + 6, gy);
      ctx.lineTo(gx + 18, gy);
      ctx.moveTo(gx, gy - 18);
      ctx.lineTo(gx, gy - 6);
      ctx.moveTo(gx, gy + 6);
      ctx.lineTo(gx, gy + 18);
      ctx.stroke();
    }
  }, [telemetry, showOverlay, videoWidth, videoHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={videoWidth}
      height={videoHeight}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}

export default DebugOverlayCanvas;
