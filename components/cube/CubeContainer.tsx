'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TimeCube from './TimeCube';
import FrontFace from './faces/FrontFace';
import TopFace from './faces/TopFace';
import BottomFace from './faces/BottomFace';
import TimelineFace from './faces/TimelineFace';
import type { CubeFace } from '@/types';

interface CubeContainerProps {
  locale: 'he-IL' | 'en-US';
}

export default function CubeContainer({ locale }: CubeContainerProps) {
  const [currentFace, setCurrentFace] = useState<CubeFace>('front');

  const renderCurrentFace = () => {
    const faceVariants = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    };

    const transition = { duration: 0.4, ease: 'easeInOut' };

    switch (currentFace) {
      case 'front':
        return (
          <motion.div
            key="front"
            variants={faceVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <FrontFace locale={locale} />
          </motion.div>
        );
      case 'top':
        return (
          <motion.div
            key="top"
            variants={faceVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <TopFace locale={locale} />
          </motion.div>
        );
      case 'bottom':
        return (
          <motion.div
            key="bottom"
            variants={faceVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <BottomFace locale={locale} />
          </motion.div>
        );
      case 'timeline':
        return (
          <motion.div
            key="timeline"
            variants={faceVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <TimelineFace locale={locale} />
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* 3D Cube */}
      <div className="flex-shrink-0">
        <TimeCube
          currentFace={currentFace}
          onFaceChange={setCurrentFace}
          locale={locale}
        />
      </div>

      {/* Current Face Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {renderCurrentFace()}
        </AnimatePresence>
      </div>
    </div>
  );
}
