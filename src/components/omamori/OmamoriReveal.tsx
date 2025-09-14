import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface OmamoriRevealProps {
  isActive: boolean;
  onComplete: () => void;
}

/**
 * OmamoriReveal Component
 * Animates the opening of the sealed amulet with layered visual effects:
 * - Seal tag shatters
 * - Light pulses outward
 * - Subtle sound-triggering class (for future integration)
 *
 * Designed for emotional impact, not sensory overload.
 */
const OmamoriReveal = ({ isActive, onComplete }: OmamoriRevealProps) => {
  useEffect(() => {
    if (isActive) {
      // Add a delay before completing the animation
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isActive && (
        <motion.div
          key="omamori-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm"
        >
          {/* Container */}
          <div className="relative w-72 h-80">
            {/* Multiple Seal Tags Shattering Effect */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-16 h-16 pointer-events-none"
                style={{
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10 - i
                }}
                initial={{
                  scale: 1,
                  rotate: -15 + (i * 10),
                  opacity: 1
                }}
                animate={{
                  scale: [1, 1.2, 1.6, 0.8],
                  rotate: [-15 + (i * 10), 0 + (i * 15), 25 + (i * 20), -30 + (i * 30)],
                  opacity: [1, 0.8, 0.3, 0],
                  x: [0, (i - 1) * 30, (i - 1) * 60],
                  y: [0, -i * 20, i * 40],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
              >
                <div
                  className="w-full h-full bg-white rounded-md flex items-center justify-center text-lg font-bold text-gray-800 shadow-lg border-2 border-gray-300"
                  style={{
                    transform: `rotate(${i * 5}deg)`,
                  }}
                >
                  封
                </div>
              </motion.div>
            ))}

            {/* Primary Light Pulse Animation */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.8, 1.6, 2.4],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 1.5,
                times: [0, 0.4, 1],
                ease: 'easeOut',
              }}
              onAnimationComplete={() => {
                // Trigger secondary animations or sounds
                document.body.classList.add('light-pulse');
                setTimeout(() => document.body.classList.remove('light-pulse'), 500);
              }}
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.6) 30%, transparent 70%)',
                filter: 'brightness(1.4) drop-shadow(0 0 30px rgba(255,255,255,0.8))',
              }}
            />

            {/* Secondary Light Pulse (Golden) */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{
                scale: [0.5, 1.2, 2.0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                delay: 0.3,
                duration: 1.8,
                ease: 'easeOut',
              }}
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.7) 0%, rgba(216,27,96,0.4) 40%, transparent 70%)',
              }}
            />

            {/* Faint Afterglow Ring */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{
                scale: [0.8, 1.1, 1.3],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                delay: 0.6,
                duration: 2.0,
                ease: 'easeInOut',
              }}
              style={{
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 0 40px rgba(255, 255, 255, 0.2), inset 0 0 20px rgba(216, 27, 96, 0.1)',
              }}
            />

            {/* Sparkle effects */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-2 h-2 bg-white rounded-full pointer-events-none"
                style={{
                  left: `${30 + (i * 10)}%`,
                  top: `${25 + ((i % 3) * 25)}%`,
                }}
                initial={{
                  scale: 0,
                  opacity: 0,
                  rotate: 0
                }}
                animate={{
                  scale: [0, 1, 0.5, 0],
                  opacity: [0, 1, 0.7, 0],
                  rotate: [0, 180, 360],
                  x: [(i % 2) * 20 - 10, (i % 2) * -20 + 10],
                  y: [0, -30 + (i % 3) * 10],
                }}
                transition={{
                  delay: 0.5 + (i * 0.1),
                  duration: 1.5,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Completion message */}
            <motion.div
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.8 }}
            >
              <p className="text-white font-japanese text-lg mb-1">
                封印が解かれました
              </p>
              <p className="text-white/80 text-sm">
                The seal has been broken
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OmamoriReveal;