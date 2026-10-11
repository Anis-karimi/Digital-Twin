/**
 * @file clientFaceDetector.js
 * @description Pure client-side, zero-network contrast-aware face & head detector.
 * Scans video stream for facial chromaticity and gradient contours, returning normalized
 * bounding box coordinates without requiring heavy neural network downloads.
 */

export function detectClientFace(video, canvas) {
  if (!video || video.readyState < 2) return null;
  const sw = 96;
  const sh = 72;
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, sw, sh);
  const imgData = ctx.getImageData(0, 0, sw, sh);
  const data = imgData.data;

  // Scan central head-framing corridor (where student's face is naturally positioned)
  const minX = Math.floor(sw * 0.12);
  const maxX = Math.floor(sw * 0.88);
  const minY = Math.floor(sh * 0.10);
  const maxY = Math.floor(sh * 0.82);

  const skinPixels = [];
  let totalEdgeEnergy = 0;
  let edgeSampleCount = 0;

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const idx = (y * sw + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // YCbCr skin chrominance representation
      const Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      // Realistic skin chromaticity: strict separation from flat beige / yellow wall paint
      const isSkinHue =
        Y > 40 &&
        Y < 235 &&
        Cb >= 85 &&
        Cb <= 130 &&
        Cr >= 135 &&
        Cr <= 175 &&
        r > g &&
        g > b &&
        r - g >= 10 &&
        r - b >= 18;

      if (isSkinHue) {
        // Measure horizontal luminance difference to test for facial features (eyes, eyebrows, nose, mouth)
        if (x < maxX - 1) {
          const nextIdx = (y * sw + (x + 1)) * 4;
          const nextY = 0.299 * data[nextIdx] + 0.587 * data[nextIdx + 1] + 0.114 * data[nextIdx + 2];
          totalEdgeEnergy += Math.abs(Y - nextY);
          edgeSampleCount++;
        }
        skinPixels.push({ x, y });
      }
    }
  }

  const totalScanned = (maxX - minX) * (maxY - minY);
  const skinRatio = skinPixels.length / totalScanned;

  // Rejection 1: Absence of skin (< 4% of region)
  if (skinRatio < 0.04) {
    return null;
  }

  // Rejection 2: Homogeneous background / beige wall filling frame (> 52% of entire corridor)
  if (skinRatio > 0.52) {
    return null;
  }

  // Rejection 3: Flat texture / Wall check (faces have facial contours with avg gradient > 3.5)
  const avgEdge = edgeSampleCount > 0 ? totalEdgeEnergy / edgeSampleCount : 0;
  if (avgEdge < 3.0) {
    return null;
  }

  // Centroid and trimmed cluster bounding box (15th-85th percentile to discard stray clothing/shoulders)
  skinPixels.sort((a, b) => a.x - b.x);
  const p15X = skinPixels[Math.floor(skinPixels.length * 0.15)].x;
  const p85X = skinPixels[Math.floor(skinPixels.length * 0.85)].x;

  skinPixels.sort((a, b) => a.y - b.y);
  const p15Y = skinPixels[Math.floor(skinPixels.length * 0.15)].y;
  const p85Y = skinPixels[Math.floor(skinPixels.length * 0.85)].y;

  const clusterW = Math.max(sw * 0.22, p85X - p15X);
  const cx = (p15X + p85X) / 2;
  const cy = (p15Y + p85Y) / 2;

  // Stably bounded anthropometric face box (tightly hugs the face)
  const faceW = Math.max(sw * 0.28, Math.min(sw * 0.48, clusterW * 1.15));
  const faceH = faceW * 1.30;
  const faceX = cx - faceW / 2;
  const faceY = cy - faceH * 0.42;

  return {
    normX: Math.max(0, Math.min(1.0 - faceW / sw, faceX / sw)),
    normY: Math.max(0, Math.min(1.0 - faceH / sh, faceY / sh)),
    normW: faceW / sw,
    normH: faceH / sh,
    sharpness: avgEdge,
  };
}
