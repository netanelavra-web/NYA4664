'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import type { CubeFace } from '@/types';

interface TimeCubeProps {
  currentFace: CubeFace;
  onFaceChange: (face: CubeFace) => void;
  locale: 'he-IL' | 'en-US';
}

// Cube geometry component
function Cube({ rotation }: { rotation: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        rotation[0],
        0.1
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        rotation[1],
        0.1
      );
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        rotation[2],
        0.1
      );
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color="#FAF7F0"
        transparent
        opacity={0.9}
        roughness={0.3}
        metalness={0.2}
      />
      {/* Edges */}
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(2, 2, 2)]} />
        <lineBasicMaterial attach="material" color="#D3D3D8" linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

// Floating dust particles
function DustParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 50;

  const particles = useRef(
    new Float32Array(
      Array.from({ length: particleCount * 3 }, () => (Math.random() - 0.5) * 10)
    )
  ).current;

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3 + 1] += Math.sin(clock.elapsedTime + i) * 0.001; // Slow float
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#F4E4C1"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

// Main TimeCube component
export default function TimeCube({ currentFace, onFaceChange, locale }: TimeCubeProps) {
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [startY, setStartY] = useState<number>(0);
  const [startX, setStartX] = useState<number>(0);
  const isRTL = locale === 'he-IL';

  // Calculate rotation based on current face
  useEffect(() => {
    const rotations: Record<CubeFace, [number, number, number]> = {
      front: [0, 0, 0], // Front face (Now)
      top: [-Math.PI / 2, 0, 0], // Top face (Create)
      bottom: [Math.PI / 2, 0, 0], // Bottom face (Events)
      timeline: [0, Math.PI / 2, 0], // Side face (Timeline)
    };

    setRotation(rotations[currentFace]);
  }, [currentFace]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;
    const deltaY = startY - endY;
    const deltaX = startX - endX;

    const threshold = 50;

    // Vertical swipes
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > threshold) {
        // Swipe up -> Create face
        onFaceChange('top');
      } else if (deltaY < -threshold) {
        // Swipe down -> Events face
        onFaceChange('bottom');
      }
    }
    // Horizontal swipes
    else if (Math.abs(deltaX) > threshold) {
      if ((deltaX > 0 && !isRTL) || (deltaX < 0 && isRTL)) {
        // Swipe left (LTR) or right (RTL) -> Timeline
        onFaceChange('timeline');
      } else {
        // Swipe right (LTR) or left (RTL) -> Front
        onFaceChange('front');
      }
    }
  };

  // Mouse wheel handler for desktop
  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 20) {
      onFaceChange('bottom');
    } else if (e.deltaY < -20) {
      onFaceChange('top');
    }
  };

  return (
    <motion.div
      className="relative w-full h-64 md:h-96"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#F4E4C1" />

        <Cube rotation={rotation} />
        <DustParticles />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false} // Disable manual rotation
        />
      </Canvas>

      {/* Face indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {(['front', 'top', 'bottom', 'timeline'] as CubeFace[]).map((face) => (
          <button
            key={face}
            onClick={() => onFaceChange(face)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentFace === face
                ? 'bg-soft-gold w-6'
                : 'bg-silver-gray hover:bg-warm-gray'
            }`}
            aria-label={`Switch to ${face} view`}
          />
        ))}
      </div>
    </motion.div>
  );
}
