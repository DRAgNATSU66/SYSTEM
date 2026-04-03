import React, { useRef, useEffect, useCallback } from 'react';
import styles from './ParticleBackground.module.css';

const DOT_SPACING = 20;
const DOT_RADIUS = 2;
const BASE_OPACITY = 0.25;
const HOVER_RADIUS = 120;
const EASE_SPEED = 0.08;

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const dotsRef = useRef([]);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  const initDots = useCallback((width, height) => {
    const dots = [];
    const cols = Math.ceil(width / DOT_SPACING) + 2;
    const rows = Math.ceil(height / DOT_SPACING) + 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          baseX: c * DOT_SPACING,
          baseY: r * DOT_SPACING,
          x: c * DOT_SPACING,
          y: r * DOT_SPACING,
          scale: 1,
          opacity: BASE_OPACITY,
          targetScale: 1,
          targetOpacity: BASE_OPACITY,
          phase: Math.random() * Math.PI * 2,
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
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dotsRef.current = initDots(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    // Attach to window for continuous tracking
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      timeRef.current += 0.02;
      const t = timeRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const dots = dotsRef.current;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // Default wave animation
        const waveX = Math.sin(t + dot.phase) * 1.5;
        const waveY = Math.cos(t * 0.7 + dot.phase * 1.3) * 1.5;

        // Mouse interaction
        const dx = dot.baseX - mx;
        const dy = dot.baseY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < HOVER_RADIUS) {
          const factor = 1 - dist / HOVER_RADIUS;
          const lift = factor * factor; // quadratic easing
          dot.targetScale = 1 + lift * 2.5;
          dot.targetOpacity = BASE_OPACITY + lift * 0.75;
        } else {
          dot.targetScale = 1;
          dot.targetOpacity = BASE_OPACITY;
        }

        // Lerp towards target (smooth ease with 300ms-like feel)
        dot.scale += (dot.targetScale - dot.scale) * EASE_SPEED;
        dot.opacity += (dot.targetOpacity - dot.opacity) * EASE_SPEED;

        dot.x = dot.baseX + waveX;
        dot.y = dot.baseY + waveY;

        const r = DOT_RADIUS * dot.scale;

        // Color: base cyan, shift to brighter on hover
        const brightness = Math.min(1, 0.4 + (dot.scale - 1) * 0.3);
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, ${Math.floor(140 + brightness * 115)}, ${Math.floor(200 + brightness * 55)}, ${dot.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
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
