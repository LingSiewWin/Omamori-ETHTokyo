import { motion } from 'framer-motion';

interface OmamoriSealProps {
  onOpen: () => void;
}

/**
 * Sealed Omamori Component
 * Displays a ceremonial sealed amulet that users click to begin a memory reveal ritual.
 * Designed with traditional Japanese aesthetics: red fabric, seal tag, subtle animation.
 */
const OmamoriSeal = ({ onOpen }: OmamoriSealProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-red-50 to-white">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        className="cursor-pointer select-none"
        onClick={onOpen}
      >
        {/* Sealed Amulet Container */}
        <div className="relative w-60 h-72 mx-auto">
          {/* Red fabric pouch with gradient and border */}
          <motion.div
            className="absolute inset-0 rounded-lg shadow-xl"
            style={{
              background: 'linear-gradient(145deg, #d81b60, #b71c1c)',
              border: '6px solid #8b0000',
            }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300 }}
          />

          {/* Traditional decorative pattern overlay */}
          <div
            className="absolute inset-0 rounded-lg opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Seal tag (fūin) with "Seal" written in kanji */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-14 h-14 bg-white rounded-md flex items-center justify-center text-sm font-bold text-gray-800 shadow-lg border-2 border-gray-200"
            style={{ transform: 'translate(-50%, -50%) rotate(-12deg)' }}
            animate={{
              rotate: [-12, 8, -12],
            }}
            transition={{
              repeat: Infinity,
              duration: 6,
              ease: 'easeInOut',
            }}
          >
            封
          </motion.div>

          {/* Subtle radial light glow effect over the pouch */}
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: 'easeInOut',
            }}
          />

          {/* Golden thread accent */}
          <div className="absolute top-4 left-1/2 w-0.5 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full transform -translate-x-1/2"></div>
        </div>

        {/* Instruction text */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-700 dark:text-gray-300 text-base font-japanese">
            クリックして記憶の儀式を始めてください
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Click to begin your memory ceremony
          </p>
        </div>

        {/* Subtle animated glow around the entire component */}
        <motion.div
          className="absolute -inset-4 rounded-xl opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(216, 27, 96, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            repeat: Infinity,
            duration: 8,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </div>
  );
};

export default OmamoriSeal;