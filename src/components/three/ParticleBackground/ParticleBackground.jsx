import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import styles from './ParticleBackground.module.css';

const PARTICLE_COUNT = 4000;

const FloatingDots = ({ mouseNorm }) => {
  const mesh = useRef();
  const velocities = useRef(null);

  const [positions] = useState(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  });

  const [colors] = useState(() => {
    const col = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const t = Math.random();
      // Cyan (#00BFFF) to deep blue (#003366)
      col[i * 3]     = THREE.MathUtils.lerp(0.0, 0.2, t);
      col[i * 3 + 1] = THREE.MathUtils.lerp(0.75, 0.4, t);
      col[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.8, t);
    }
    return col;
  });

  useEffect(() => {
    const vels = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      vels[i * 3]     = (Math.random() - 0.5) * 0.004;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    velocities.current = vels;
  }, []);

  useFrame(() => {
    if (!mesh.current || !velocities.current) return;
    const pos = mesh.current.geometry.attributes.position.array;
    const vel = velocities.current;

    // Mouse repulsion in world-space approximation
    // mouseNorm is -1..1; map to world coords (camera z=12, fov=60)
    const mx = mouseNorm.x * 10;
    const my = mouseNorm.y * 7;
    const REPEL_RADIUS = 2.8;
    const REPEL_STRENGTH = 0.018;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      let x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2];

      // Mouse repulsion on x/y plane
      const dx = x - mx;
      const dy = y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0.001) {
        const force = (REPEL_RADIUS - dist) / REPEL_RADIUS * REPEL_STRENGTH;
        vel[i3]     += (dx / dist) * force;
        vel[i3 + 1] += (dy / dist) * force;
      }

      // Gentle float drift
      vel[i3]     += (Math.random() - 0.5) * 0.0002;
      vel[i3 + 1] += (Math.random() - 0.5) * 0.0002;

      // Damping
      vel[i3]     *= 0.97;
      vel[i3 + 1] *= 0.97;
      vel[i3 + 2] *= 0.96;

      // Update position
      x += vel[i3];
      y += vel[i3 + 1];
      z += vel[i3 + 2];

      // Wrap boundaries
      if (x >  10) x = -10; if (x < -10) x = 10;
      if (y >   7) y =  -7; if (y <  -7) y =  7;
      if (z >   3) z =  -3; if (z <  -3) z =  3;

      pos[i3]     = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

const ParticleBackground = () => {
  const mouseNorm = useRef({ x: 0, y: 0 });
  const containerRef = useRef();

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseNorm.current = {
      x: ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      y: -((e.clientY - rect.top)  / rect.height) * 2 + 1,
    };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!e.touches[0]) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseNorm.current = {
      x: ((e.touches[0].clientX - rect.left) / rect.width)  * 2 - 1,
      y: -((e.touches[0].clientY - rect.top)  / rect.height) * 2 + 1,
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.canvasContainer}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      <Canvas camera={{ position: [0, 0, 12], fov: 60 }} dpr={[1, 1.5]}>
        <FloatingDots mouseNorm={mouseNorm.current} />
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
