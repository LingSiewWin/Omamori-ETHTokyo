import { motion } from 'framer-motion';
import { useState } from 'react';

interface OmamoriAchievementProps {
  nftImage: string;
  title: string;
  description: string;
  aiMessage: string;
  milestone?: number;
  goal?: string;
  onClose: () => void;
  onShare?: () => void;
}

/**
 * OmamoriAchievement Component
 * Shows the result of a completed memory ceremony:
 * - NFT preview (e.g., evolving omamori)
 * - Achievement title and description
 * - AI-generated personal message
 * - Action buttons (share, close)
 *
 * Designed with minimalism, respect, and legacy in mind.
 */
const OmamoriAchievement = ({
  nftImage,
  title,
  description,
  aiMessage,
  milestone = 0,
  goal,
  onClose,
  onShare
}: OmamoriAchievementProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    try {
      if (onShare) {
        onShare();
      } else {
        // Default share behavior
        const shareText = `🌸 OMAMORI Achievement: ${title}\n${description}\n\nJoin me on my savings journey: ${window.location.origin}`;

        if (navigator.share) {
          await navigator.share({
            title: `OMAMORI - ${title}`,
            text: shareText,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(shareText);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
        }
      }
    } catch (error) {
      console.error('Share failed:', error);
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`🌸 ${title} - ${window.location.origin}`);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (clipError) {
        console.error('Clipboard failed:', clipError);
      }
    }
  };

  const getMilestoneEmoji = (milestone: number): string => {
    switch (milestone) {
      case 0: return '🌱';
      case 1: return '🌿';
      case 2: return '🌸';
      case 3: return '🌺';
      default: return '🌸';
    }
  };

  const getMilestoneName = (milestone: number): string => {
    switch (milestone) {
      case 0: return 'Seed';
      case 1: return 'Sprout';
      case 2: return 'Flower';
      case 3: return 'Full Bloom';
      default: return 'Unknown';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
      >
        {/* Decorative Top Band with gradient */}
        <motion.div
          className="h-3 bg-gradient-to-r from-omamori-red via-omamori-pink to-omamori-gold"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />

        {/* NFT Preview Section */}
        <div className="flex justify-center mt-8 mb-4">
          <motion.div
            className="relative w-48 h-48 rounded-lg overflow-hidden shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
          >
            <img
              src={nftImage}
              alt="Omamori NFT"
              className={`w-full h-full object-contain transition-opacity duration-500 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                // Fallback to emoji if image fails
                (e.target as HTMLImageElement).style.display = 'none';
                setImageLoaded(true);
              }}
            />

            {/* Fallback emoji display */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900 dark:to-pink-900">
                <div className="text-6xl animate-pulse">
                  {getMilestoneEmoji(milestone)}
                </div>
              </div>
            )}

            {/* Milestone badge */}
            <motion.div
              className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.0, type: 'spring', stiffness: 300 }}
            >
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {getMilestoneName(milestone)}
              </span>
            </motion.div>

            {/* Glow effect for achievement */}
            <motion.div
              className="absolute -inset-2 rounded-xl opacity-20 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(216, 27, 96, 0.6) 0%, transparent 70%)',
              }}
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.05, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="px-6 pb-6 text-center">
          {/* Title */}
          <motion.h2
            className="text-2xl font-bold text-gray-800 dark:text-white mb-3 font-japanese"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {title}
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {description}
          </motion.p>

          {/* Goal information */}
          {goal && (
            <motion.div
              className="text-xs text-gray-500 dark:text-gray-400 mb-4 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Goal: {goal}
            </motion.div>
          )}

          {/* AI Message Box */}
          <motion.div
            className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-4 mb-6 text-left"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <div className="flex items-start space-x-2">
              <div className="text-red-500 font-semibold text-sm flex-shrink-0">
                🤖 AI Guardian:
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-200 italic leading-relaxed">
                {aiMessage}
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <button
              onClick={handleShare}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center gap-2 group"
            >
              {shareSuccess ? (
                <>
                  <span className="text-green-600">✓</span>
                  Copied!
                </>
              ) : (
                <>
                  <span className="group-hover:scale-110 transition-transform">📤</span>
                  Share Achievement
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-omamori-red to-omamori-pink hover:from-red-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 text-sm font-medium transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Continue Journey
            </button>
          </motion.div>
        </div>

        {/* Subtle Bottom Accent */}
        <motion.div
          className="h-1 w-full bg-gradient-to-r from-transparent via-omamori-pink dark:via-omamori-red to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.7, duration: 0.8 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default OmamoriAchievement;