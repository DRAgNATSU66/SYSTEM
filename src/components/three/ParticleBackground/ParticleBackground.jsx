import React, { useRef, useEffect, useCallback } from 'react';
import styles from './ParticleBackground.module.css';

// ─── Grid & visual tunables ──────────────────────────────────────────────────
const GRID_SPACING = 30;
const DOT_RADIUS = 1.8;
const BASE_OPACITY = 0.22;
const HOVER_RADIUS = 160;
const EASE_SPEED = 0.32;       // snappy — reaches 97% in ~10 frames
const LIFT_HEIGHT = 60;
const FOV = 800;
const CAMERA_DIST = 1400;
const GRID_RADIUS = 3800;     // circular extent — no square edges
const FADE_START = 0.55;      // opacity fade begins at 55% of radius

// ─── Rotation ────────────────────────────────────────────────────────────────
//  Floor lies on the UV (≈ XY) plane.  Z is up.
//  Step 1  — Yaw 30° around Z   → grid runs diagonally
//  Step 2  — Pitch 50° around X → tilts the floor toward the viewer
const PITCH = 50 * Math.PI / 180;
const YAW   = 30 * Math.PI / 180;

// Vanishing point: 42 % from top — slightly above center for natural floor feel
const VP_Y = 0.42;

// Precompute trig
const CP = Math.cos(PITCH), SP = Math.sin(PITCH);
const CY = Math.cos(YAW),   SY = Math.sin(YAW);

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const dotsRef   = useRef([]);
  const animRef   = useRef(null);
  const timeRef   = useRef(0);

  /* ── Build circular dot grid with smooth edge fade ──────────────────────── */
  const initDots = useCallback(() => {
    const dots = [];

    for (let u = -GRID_RADIUS; u <= GRID_RADIUS; u += GRID_SPACING) {
      for (let v = -GRID_RADIUS; v <= GRID_RADIUS; v += GRID_SPACING) {
        const d = Math.sqrt(u * u + v * v);
        if (d > GRID_RADIUS) continue;               // circular clip

        // Smooth opacity ramp-down toward the rim
        const edge = d < GRID_RADIUS * FADE_START
          ? 1
          : 1 - (d - GRID_RADIUS * FADE_START) / (GRID_RADIUS * (1 - FADE_START));
        const baseOp = BASE_OPACITY * Math.max(0, edge);

        dots.push({
          u, v,
          lift: 0, targetLift: 0,
          opacity: baseOp, targetOpacity: baseOp,
          baseOpacity: baseOp,
          phase: Math.random() * Math.PI * 2,
          sx: 0, sy: 0, sd: 0,
        });
      }
    }
    return dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotsRef.current = initDots();
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove  = (e) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleTouchMove  = (e) => { if (e.touches[0]) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    const handleMouseLeave = ()  => { mouseRef.current = { x: -9999, y: -9999 }; };

    window.addEventListener('mousemove',  handleMouseMove);
    window.addEventListener('touchmove',  handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      timeRef.current += 0.012;
      const t  = timeRef.current;
      const w  = window.innerWidth;
      const h  = window.innerHeight;
      const cx = w * 0.5;
      const cy = h * VP_Y;
      ctx.clearRect(0, 0, w, h);

      const mx   = mouseRef.current.x;
      const my   = mouseRef.current.y;
      const dots = dotsRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // ── 1. World-space: flat UV plane + Z wave ──────────────────────────
        const wave = Math.sin(t * 0.8 + dot.u * 0.008 + dot.v * 0.006) * 8
                   + Math.cos(t * 0.5 + dot.v * 0.01) * 5;
        const wx = dot.u;
        const wy = dot.v;
        const wz = wave - dot.lift * LIFT_HEIGHT;

        // ── 2. Yaw around Z axis ────────────────────────────────────────────
        const yx = wx * CY - wy * SY;
        const yy = wx * SY + wy * CY;

        // ── 3. Pitch around X axis ──────────────────────────────────────────
        const rx = yx;                        // depth
        const ry = yy * CP - wz * SP;         // screen-x
        const rz = yy * SP + wz * CP;         // screen-y

        // ── 4. Camera offset ────────────────────────────────────────────────
        const depth = rx + CAMERA_DIST;
        if (depth < 1) continue;

        // ── 5. Perspective project ──────────────────────────────────────────
        const scale   = FOV / depth;
        const screenX = cx + ry * scale;
        const screenY = cy + rz * scale;

        dot.sx = screenX;
        dot.sy = screenY;
        dot.sd = depth;

        if (screenX < -30 || screenX > w + 30 || screenY < -30 || screenY > h + 30) continue;

        // ── 6. Mouse interaction against un-lifted position ─────────────────
        const uRy = yy * CP - wave * SP;
        const uRz = yy * SP + wave * CP;
        const uScale   = depth > 1 ? FOV / depth : scale;   // same depth (rx unchanged)
        const uScreenX = cx + uRy * uScale;
        const uScreenY = cy + uRz * uScale;

        const dx = uScreenX - mx;
        const dy = uScreenY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HOVER_RADIUS) {
          const factor = 1 - dist / HOVER_RADIUS;
          const ease   = factor * factor;
          dot.targetLift    = ease;
          dot.targetOpacity = dot.baseOpacity + ease * 0.72;
        } else {
          dot.targetLift    = 0;
          dot.targetOpacity = dot.baseOpacity;
        }

        // Lerp — fast response
        dot.lift    += (dot.targetLift    - dot.lift)    * EASE_SPEED;
        dot.opacity += (dot.targetOpacity - dot.opacity) * EASE_SPEED;

        // ── 7. Draw ─────────────────────────────────────────────────────────
        const r = DOT_RADIUS * scale * (1 + dot.lift * 1.0);
        if (r < 0.25) continue;

        // Depth atmosphere: far dots slightly dimmer
        const depthFade = Math.min(1, 800 / depth);
        const finalOp = dot.opacity * depthFade;

        const lf = dot.lift;
        const cr = Math.floor(lf * 100);
        const cg = Math.floor(130 + lf * 125);
        const cb = Math.floor(195 + lf * 60);

        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${finalOp})`;
        ctx.fill();

        // Glow halo on lifted dots
        if (lf > 0.12) {
          ctx.beginPath();
          ctx.arc(screenX, screenY, r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 191, 255, ${lf * 0.07})`;
          ctx.fill();
        }

        // Stem line connecting lifted dot to its resting position
        if (lf > 0.08) {
          ctx.beginPath();
          ctx.moveTo(screenX, screenY + r);
          ctx.lineTo(uScreenX, uScreenY);
          ctx.strokeStyle = `rgba(0, 191, 255, ${lf * 0.12})`;
          ctx.lineWidth = 0.5 * scale;
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove',  handleMouseMove);
      window.removeEventListener('touchmove',  handleTouchMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [initDots]);

  return (
    <div className={styles.canvasContainer}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ParticleBackground;
