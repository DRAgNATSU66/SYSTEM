import React, { useRef } from 'react';
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
export default GlobeStats;
