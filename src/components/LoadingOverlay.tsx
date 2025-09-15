'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { LOADING_ICONS } from '@/constants';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Processing transaction...'
}) => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentIconIndex((prev) => Math.floor(Math.random() * LOADING_ICONS.length));
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-label="Loading transaction"
        aria-live="polite"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 text-center space-y-6 max-w-sm mx-4 border border-pink-200"
        >
          <div className="relative w-24 h-24 mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full"
            >
              <Image
                src={LOADING_ICONS[currentIconIndex]}
                alt="Loading spinner"
                width={96}
                height={96}
                className="w-full h-full object-contain pixel-art"
                style={{ imageRendering: 'pixelated' }}
                priority
              />
            </motion.div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">
              🌸 Loading...
            </h3>
            <p className="text-gray-600 text-sm">
              {message}
            </p>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              Cultural wisdom: Patience brings good fortune (忍耐は幸運をもたらす)
            </div>
          </div>

          <div className="flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 bg-pink-400 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingOverlay;