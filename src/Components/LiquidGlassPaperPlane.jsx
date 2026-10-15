import { useEffect, useRef, useState, memo } from "react";
import { Loader2 } from "lucide-react";

// ============================================================================
// 1. GLSL SHADERS FOR REAL-TIME 3D LIQUID GLASS MATERIAL
// ============================================================================

const VERTEX_SHADER_SRC = `
  attribute vec3 aPos;
  attribute vec3 aNormal;
  attribute float aEdgeFactor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  uniform mat3 uNormalMatrix;

  varying vec3 vViewPos;
  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying float vEdgeFactor;

  void main() {
    vLocalPos = aPos;
    vEdgeFactor = aEdgeFactor;
    vec4 viewPos = uModelViewMatrix * vec4(aPos, 1.0);
    vViewPos = viewPos.xyz;
    vNormal = normalize(uNormalMatrix * aNormal);
    gl_Position = uProjectionMatrix * viewPos;
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;

  varying vec3 vViewPos;
  varying vec3 vNormal;
  varying vec3 vLocalPos;
  varying float vEdgeFactor;

  uniform float uTime;
  uniform float uActive;

  void main() {
    vec3 V = normalize(-vViewPos);
    vec3 N = normalize(vNormal);

    // Double-sided glass normal alignment
    if (dot(N, V) < 0.0) {
      N = -N;
    }

    // Subtle liquid-glass surface curvature & organic caustic wave
    vec3 liquidWave = vec3(
      sin(vLocalPos.x * 5.5 - uTime * 2.4) * 0.055,
      cos(vLocalPos.z * 6.0 + uTime * 2.0) * 0.055,
      sin((vLocalPos.x + vLocalPos.z) * 4.5 - uTime * 1.8) * 0.04
    );
    N = normalize(N + liquidWave);

    // Schlick Fresnel Equation (IOR = 1.52 for optical crown glass)
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - NdotV, 3.2);

    // Studio 3-Point HDR Lighting in Camera Space
    vec3 keyLight = normalize(vec3(-0.35, 0.85, 0.55));
    vec3 rimLight = normalize(vec3(0.75, 0.35, -0.55));
    vec3 bottomCausticLight = normalize(vec3(0.0, -0.9, 0.35));

    // Blinn-Phong Dual Specular (Sharp Glass Glint + Wide Liquid Sheen)
    vec3 H1 = normalize(keyLight + V);
    float specSharp = pow(max(dot(N, H1), 0.0), 72.0);
    float specWide  = pow(max(dot(N, H1), 0.0), 14.0);

    vec3 H2 = normalize(rimLight + V);
    float specRim = pow(max(dot(N, H2), 0.0), 28.0);

    // Procedural Studio Environment Reflection (Curved light strips on glass)
    vec3 R = reflect(-V, N);
    float studioBand1 = smoothstep(0.55, 0.92, R.y + 0.25 * sin(R.x * 2.5));
    float studioBand2 = smoothstep(0.68, 0.96, -R.x * 0.6 + R.y * 0.7);
    float envReflection = studioBand1 * 0.55 + studioBand2 * 0.45;

    // Chromatic Dispersion / Liquid Glass Color Palette
    vec3 clearIce   = vec3(0.92, 0.98, 1.00);
    vec3 aquaGlass  = vec3(0.32, 0.82, 0.98);
    vec3 deepAzure  = vec3(0.12, 0.52, 0.92);
    vec3 irisViolet = vec3(0.62, 0.55, 0.98);

    float causticShift = clamp(dot(N, bottomCausticLight) * 0.5 + 0.5, 0.0, 1.0);
    vec3 baseGlassTint = mix(aquaGlass, deepAzure, 1.0 - NdotV);
    baseGlassTint = mix(baseGlassTint, irisViolet, causticShift * 0.35);

    // Edge/Crease Optical Concentration (Thick polished glass folds & bevels)
    float edgeGlow = smoothstep(0.15, 0.95, vEdgeFactor);

    // Combine body refraction, studio reflection, edge thickness, and specular highlights
    vec3 color = mix(baseGlassTint, clearIce, envReflection * 0.65 + edgeGlow * 0.55);
    color += clearIce * (specSharp * 1.45 + specWide * 0.38);
    color += vec3(0.55, 0.90, 1.0) * (specRim * 0.75 + fresnel * 0.45);
    color += clearIce * pow(edgeGlow, 2.2) * 0.55;

    // Mute saturation slightly when disabled
    if (uActive < 0.5) {
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(luma), color, 0.35);
    }

    // Translucent Glass Alpha:
    // Interior of wings is sheer see-through (~0.16), edges/folds/highlights are dense (~0.92)
    float alpha = 0.14
                + fresnel * 0.42
                + edgeGlow * 0.44
                + specSharp * 0.85
                + specWide * 0.22
                + envReflection * 0.18;

    alpha = clamp(alpha, 0.12, 0.96) * mix(0.42, 1.0, uActive);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// 2. 3D MATRIX & GEOMETRY BUILDER (VOLUMETRIC BEVELED DART AIRPLANE)
// ============================================================================

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm3 = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

function createPerspectiveMatrix(fovRad, aspect, near, far) {
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function createModelViewMatrix(tx, ty, tz, rx, ry, rz, scaleX = 1) {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  // Combined rotation R = Ry * Rx * Rz with optional X mirror for RTL
  const r00 = (cy * cz + sy * sx * sz) * scaleX;
  const r01 = -cy * sz + sy * sx * cz;
  const r02 = sy * cx;

  const r10 = (cx * sz) * scaleX;
  const r11 = cx * cz;
  const r12 = -sx;

  const r20 = (-sy * cz + cy * sx * sz) * scaleX;
  const r21 = sy * sz + cy * sx * cz;
  const r22 = cy * cx;

  const mv = new Float32Array([
    r00, r10, r20, 0,
    r01, r11, r21, 0,
    r02, r12, r22, 0,
    tx,  ty,  tz,  1,
  ]);

  const nm = new Float32Array([
    r00, r10, r20,
    r01, r11, r21,
    r02, r12, r22,
  ]);

  return { mv, nm };
}

/**
 * Tessellates a triangle (A, B, C) into a subdivided grid so that
 * edge distances (for thick glass crease glow) and curved normals interpolate smoothly.
 */
function pushSubdividedTriangle(out, A, B, C, eA, eB, eC, subdivisions = 5, normalBias = [0, 0, 0]) {
  const baseN = norm3(cross3(sub3(B, A), sub3(C, A)));
  const n = norm3([
    baseN[0] + normalBias[0],
    baseN[1] + normalBias[1],
    baseN[2] + normalBias[2],
  ]);

  const interp = (u, v) => {
    const w = 1 - u - v;
    const pos = [
      w * A[0] + u * B[0] + v * C[0],
      w * A[1] + u * B[1] + v * C[1],
      w * A[2] + u * B[2] + v * C[2],
    ];
    // Mark outer borders & fold lines with high edgeFactor for refractive rim light
    const isBoundary = u < 0.08 || v < 0.08 || w < 0.08 ? 0.92 : 0.0;
    const edgeVal = Math.max(isBoundary, w * eA + u * eB + v * eC);
    return { pos, edgeVal };
  };

  const emitTri = (p1, p2, p3) => {
    for (const pt of [p1, p2, p3]) {
      out.push(
        pt.pos[0], pt.pos[1], pt.pos[2],
        n[0], n[1], n[2],
        pt.edgeVal
      );
    }
  };

  const N = subdivisions;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N - i; j++) {
      const u0 = i / N, v0 = j / N;
      const u1 = (i + 1) / N, v1 = j / N;
      const u2 = i / N, v2 = (j + 1) / N;

      emitTri(interp(u0, v0), interp(u1, v1), interp(u2, v2));

      if (i + j + 1 < N) {
        const u3 = (i + 1) / N, v3 = (j + 1) / N;
        emitTri(interp(u1, v1), interp(u3, v3), interp(u2, v2));
      }
    }
  }
}

/**
 * Pushes a 3D beveled glass edge quad connecting upper & lower surfaces
 */
function pushBevelQuad(out, A, B, C, D) {
  pushSubdividedTriangle(out, A, B, C, 1.0, 1.0, 1.0, 1);
  pushSubdividedTriangle(out, A, C, D, 1.0, 1.0, 1.0, 1);
}

/**
 * Builds the 5 depth-sorted 3D glass sub-meshes of the Paper Airplane
 * (Rendered Back-to-Front so background wings & keel refract through the front wing)
 */
function buildAirplaneGlassMeshes() {
  // Key 3D Sculpted Coordinates
  const NOSE_TOP   = [1.48, 0.10, 0.0];
  const NOSE_BOT   = [1.42, 0.02, 0.0];
  const KEEL_BOT   = [-0.88, -0.62, 0.0];
  const VALLEY_TAIL = [-0.98, 0.02, 0.0];

  // Near Wing (Right side, Z > 0)
  const NEAR_RIDGE_TOP = [-1.02, 0.22, 0.19];
  const NEAR_RIDGE_BOT = [-1.02, 0.14, 0.17];
  const NEAR_TIP_TOP   = [-1.14, 0.38, 1.02];
  const NEAR_TIP_BOT   = [-1.14, 0.29, 0.99];

  // Far Wing (Left side, Z < 0)
  const FAR_RIDGE_TOP  = [-1.02, 0.22, -0.19];
  const FAR_RIDGE_BOT  = [-1.02, 0.14, -0.17];
  const FAR_TIP_TOP    = [-1.14, 0.38, -1.02];
  const FAR_TIP_BOT    = [-1.14, 0.29, -0.99];

  // Layer 1 (Back-most): Far Wing (Top, Bottom & Glass Rim Bevels)
  const farWing = [];
  pushSubdividedTriangle(farWing, NOSE_BOT, FAR_TIP_BOT, FAR_RIDGE_BOT, 0.9, 0.85, 0.65, 6);
  pushSubdividedTriangle(farWing, NOSE_TOP, FAR_RIDGE_TOP, FAR_TIP_TOP, 0.95, 0.75, 0.9, 6, [0, 0.15, -0.1]);
  pushBevelQuad(farWing, NOSE_TOP, FAR_TIP_TOP, FAR_TIP_BOT, NOSE_BOT);
  pushBevelQuad(farWing, FAR_RIDGE_TOP, FAR_RIDGE_BOT, FAR_TIP_BOT, FAR_TIP_TOP);

  // Layer 2: Far Inner Fuselage Wall
  const farFuselage = [];
  pushSubdividedTriangle(farFuselage, NOSE_TOP, VALLEY_TAIL, FAR_RIDGE_TOP, 0.9, 0.6, 0.8, 5);
  pushSubdividedTriangle(farFuselage, NOSE_BOT, KEEL_BOT, FAR_RIDGE_BOT, 0.9, 0.85, 0.7, 5);

  // Layer 3: Central Deep Keel / Belly Rudder (Gives unmistakable 3D side-profile depth)
  const centerKeel = [];
  pushSubdividedTriangle(centerKeel, NOSE_TOP, NOSE_BOT, KEEL_BOT, 1.0, 0.9, 0.95, 5, [0, 0, 0.25]);
  pushSubdividedTriangle(centerKeel, NOSE_TOP, KEEL_BOT, VALLEY_TAIL, 0.95, 0.95, 0.7, 5, [0, 0, 0.25]);

  // Layer 4: Near Inner Fuselage Wall (Sloping up from keel to near fold ridge)
  const nearFuselage = [];
  pushSubdividedTriangle(nearFuselage, NOSE_BOT, NEAR_RIDGE_BOT, KEEL_BOT, 0.9, 0.75, 0.9, 6);
  pushSubdividedTriangle(nearFuselage, NOSE_TOP, NEAR_RIDGE_TOP, VALLEY_TAIL, 0.95, 0.85, 0.65, 6);
  pushBevelQuad(nearFuselage, NOSE_TOP, NEAR_RIDGE_TOP, NEAR_RIDGE_BOT, NOSE_BOT);

  // Layer 5 (Front-most): Near Main Swept Wing (Translucent glass pane + thick luminous bevels)
  const nearWing = [];
  pushSubdividedTriangle(nearWing, NOSE_BOT, NEAR_RIDGE_BOT, NEAR_TIP_BOT, 0.9, 0.7, 0.85, 7);
  pushSubdividedTriangle(nearWing, NOSE_TOP, NEAR_TIP_TOP, NEAR_RIDGE_TOP, 0.95, 0.9, 0.8, 7, [0, 0.18, 0.12]);
  pushBevelQuad(nearWing, NOSE_TOP, NOSE_BOT, NEAR_TIP_BOT, NEAR_TIP_TOP);
  pushBevelQuad(nearWing, NEAR_TIP_TOP, NEAR_TIP_BOT, NEAR_RIDGE_BOT, NEAR_RIDGE_TOP);

  return [
    new Float32Array(farWing),
    new Float32Array(farFuselage),
    new Float32Array(centerKeel),
    new Float32Array(nearFuselage),
    new Float32Array(nearWing),
  ];
}

// ============================================================================
// 3. REACT COMPONENT
// ============================================================================

/**
 * LiquidGlassPaperPlane
 *
 * Box-free, real-time WebGL 3D Liquid Glass Paper Airplane Button.
 *
 * @param {Object} props
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false]
 * @param {Function} [props.onClick]
 * @param {boolean} [props.isRTL=true]
 * @param {number} [props.size=52] Visual size in px
 * @param {string} [props.title=""]
 * @param {string} [props.className=""]
 */
export const LiquidGlassPaperPlane = memo(
  ({
    disabled = false,
    loading = false,
    onClick,
    isRTL = true,
    size = 52,
    title = "",
    className = "",
  }) => {
    const canvasRef = useRef(null);
    const pointerRef = useRef({ x: 0, y: 0, hovered: false });
    const launchImpulseRef = useRef(0);
    const [isLaunching, setIsLaunching] = useState(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const gl =
        canvas.getContext("webgl", {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        }) ||
        canvas.getContext("experimental-webgl", {
          alpha: true,
          antialias: true,
          premultipliedAlpha: false,
        });

      if (!gl) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const px = Math.round(size * dpr);
      canvas.width = px;
      canvas.height = px;
      gl.viewport(0, 0, px, px);

      // Compile Shaders
      const compileShader = (type, src) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
      const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Upload 5 Depth-Sorted 3D Glass Layers
      const meshArrays = buildAirplaneGlassMeshes();
      const meshBuffers = meshArrays.map((arr) => {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
        return { buf, count: arr.length / 7 };
      });

      const aPosLoc = gl.getAttribLocation(program, "aPos");
      const aNormalLoc = gl.getAttribLocation(program, "aNormal");
      const aEdgeLoc = gl.getAttribLocation(program, "aEdgeFactor");

      const uMVLoc = gl.getUniformLocation(program, "uModelViewMatrix");
      const uProjLoc = gl.getUniformLocation(program, "uProjectionMatrix");
      const uNormMatLoc = gl.getUniformLocation(program, "uNormalMatrix");
      const uTimeLoc = gl.getUniformLocation(program, "uTime");
      const uActiveLoc = gl.getUniformLocation(program, "uActive");

      const projMatrix = createPerspectiveMatrix(
        (36 * Math.PI) / 180,
        1.0,
        0.1,
        20.0
      );
      gl.uniformMatrix4fv(uProjLoc, false, projMatrix);

      // Enable true optical glass alpha blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.DEPTH_TEST); // Painters-ordered volumetric layers for see-through refraction

      let animId = null;
      const t0 = performance.now();

      const render = (now) => {
        const t = (now - t0) * 0.001;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        if (launchImpulseRef.current > 0.001) {
          launchImpulseRef.current *= 0.9;
        } else {
          launchImpulseRef.current = 0;
        }

        const active = !disabled && !loading;
        const speed = active ? 2.1 : 1.0;

        // Tilted Side-Profile 3D Camera Angles (Shows side keel + swept wings at an upward angle)
        const basePitch = 0.28;  // Nose pitched up
        const baseYaw   = -0.46; // Side-profile angle (~ -26 deg)
        const baseRoll  = -0.34; // Banked toward viewer so both wings & keel have 3D depth

        const floatPitch = Math.sin(t * speed) * (active ? 0.065 : 0.025);
        const floatRoll  = Math.cos(t * speed * 0.8) * (active ? 0.085 : 0.03);
        const floatYaw   = Math.sin(t * speed * 0.55) * 0.045;
        const bobY       = Math.sin(t * speed) * (active ? 0.07 : 0.025);

        const hoverPitch = pointerRef.current.hovered
          ? -pointerRef.current.y * 0.28
          : 0;
        const hoverYaw = pointerRef.current.hovered
          ? pointerRef.current.x * 0.32
          : 0;

        const boost = launchImpulseRef.current;

        const rx = basePitch + floatPitch + hoverPitch + boost * 0.32;
        const ry = baseYaw + floatYaw + hoverYaw;
        const rz = baseRoll + floatRoll - boost * 0.38;

        const dirSign = isRTL ? -1 : 1;
        const tx = boost * 0.42 * dirSign;
        const ty = bobY + boost * 0.24;
        const tz = -3.85;

        const { mv, nm } = createModelViewMatrix(
          tx,
          ty,
          tz,
          rx,
          ry,
          rz,
          dirSign
        );

        gl.uniformMatrix4fv(uMVLoc, false, mv);
        gl.uniformMatrix3fv(uNormMatLoc, false, nm);
        gl.uniform1f(uTimeLoc, t);
        gl.uniform1f(uActiveLoc, active ? 1.0 : 0.0);

        const stride = 7 * 4;
        for (const layer of meshBuffers) {
          gl.bindBuffer(gl.ARRAY_BUFFER, layer.buf);
          gl.enableVertexAttribArray(aPosLoc);
          gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, stride, 0);

          gl.enableVertexAttribArray(aNormalLoc);
          gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, stride, 3 * 4);

          gl.enableVertexAttribArray(aEdgeLoc);
          gl.vertexAttribPointer(aEdgeLoc, 1, gl.FLOAT, false, stride, 6 * 4);

          gl.drawArrays(gl.TRIANGLES, 0, layer.count);
        }

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);

      return () => {
        if (animId) cancelAnimationFrame(animId);
        meshBuffers.forEach((b) => gl.deleteBuffer(b.buf));
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      };
    }, [disabled, loading, isRTL, size]);

    const handlePointerMove = (e) => {
      if (disabled || loading) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      pointerRef.current = { x: nx, y: ny, hovered: true };
    };

    const handlePointerLeave = () => {
      pointerRef.current = { x: 0, y: 0, hovered: false };
    };

    const handleClick = (e) => {
      if (disabled || loading) return;
      launchImpulseRef.current = 1.0;
      setIsLaunching(true);
      setTimeout(() => setIsLaunching(false), 360);
      if (onClick) onClick(e);
    };

    const active = !disabled && !loading;

    return (
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        title={title}
        aria-label={title || "Send"}
        style={{
          width: size,
          height: size,
          background: "transparent",
          border: "none",
          boxShadow: "none",
        }}
        className={`relative inline-flex items-center justify-center p-0 m-0 outline-none select-none shrink-0 transition-transform duration-300 ${
          !active
            ? "cursor-not-allowed"
            : "cursor-pointer hover:scale-110 active:scale-90"
        } ${
          isLaunching
            ? isRTL
              ? "-translate-x-2.5 -translate-y-2 scale-95"
              : "translate-x-2.5 -translate-y-2 scale-95"
            : ""
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.85)]" />
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              width: size,
              height: size,
              filter: active
                ? "drop-shadow(0 6px 12px rgba(14, 165, 233, 0.35))"
                : "none",
            }}
            className="block pointer-events-none overflow-visible"
          />
        )}
      </button>
    );
  }
);

LiquidGlassPaperPlane.displayName = "LiquidGlassPaperPlane";

export default LiquidGlassPaperPlane;
