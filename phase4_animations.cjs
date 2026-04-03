const fs = require('fs');
const path = require('path');

const files = {
  // PageWrapper (Framer Motion entry)
  'src/components/layout/PageWrapper/PageWrapper.jsx': `import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, y: 15 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut', staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } }
};

const PageWrapper = ({ children, className }) => {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};
export default PageWrapper;\n`,

  // ParticleBackground (Three.js Ambient)
  'src/components/three/ParticleBackground/ParticleBackground.jsx': `import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScoreStore } from '../../../store/scoreStore';
import { resolveRank } from '../../../utils/rankResolver';
import * as THREE from 'three';
import styles from './ParticleBackground.module.css';

const Particles = ({ color }) => {
  const count = 150;
  const mesh = useRef();

  const [positions, scales] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      scales[i] = Math.random();
    }
    return [positions, scales];
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y += 0.001;
      mesh.current.rotation.x += 0.0005;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-scale" count={count} array={scales} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.4} sizeAttenuation={true} blending={THREE.AdditiveBlending} />
    </points>
  );
};

const ParticleBackground = () => {
  const { todayScore } = useScoreStore();
  const rank = resolveRank(todayScore);
  
  return (
    <div className={styles.canvasContainer}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} dpr={[1, 2]}>
        <Particles color={rank.color} />
      </Canvas>
    </div>
  );
};
export default ParticleBackground;\n`,

  'src/components/three/ParticleBackground/ParticleBackground.module.css': `.canvasContainer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
  background-color: var(--bg-base);
}\n`,

  // GlobeStats (Leaderboard Ambient)
  'src/components/three/GlobeStats/GlobeStats.jsx': `import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const WireframeSphere = () => {
  const meshRef = useRef();
  
  useFrame(() => {
    if(meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#00BFFF" wireframe transparent opacity={0.15} />
    </mesh>
  );
};

const GlobeStats = () => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
      <Canvas camera={{ position: [0, 0, 4] }}>
        <WireframeSphere />
      </Canvas>
    </div>
  );
};
export default GlobeStats;\n`
};

Object.keys(files).forEach(file => {
  const fullPath = path.join(__dirname, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, files[file]);
  console.log('Built: ' + file);
});
