import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import OmamoriSeal from './OmamoriSeal';
import OmamoriReveal from './OmamoriReveal';
import OmamoriAchievement from './OmamoriAchievement';
import type { CeremonyStage, CeremonyData } from '../../types/omamori';

interface OmamoriCeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ceremonyData: CeremonyData;
  onShare?: () => void;
}

/**
 * OmamoriCeremonyModal Component
 * Full ceremonial flow for revealing a digital heirloom:
 *
 * 1. Sealed State: User sees a closed omamori
 * 2. Reveal Animation: Seal breaks, light pulses (symbolic opening)
 * 3. Achievement Screen: NFT + AI message displayed
 *
 * Designed as a standalone, reusable ceremony controller.
 * Can be triggered by savings milestones, inheritance events, or anniversaries.
 */
const OmamoriCeremonyModal = ({
  isOpen,
  onClose,
  ceremonyData,
  onShare
}: OmamoriCeremonyModalProps) => {
  // State: seal -> reveal -> achievement
  const [stage, setStage] = useState<CeremonyStage>('seal');
  const [isVisible, setIsVisible] = useState(false);

  // Reset stage when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('seal');
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Step 1: Begin ceremony when user clicks the sealed omamori
  const handleOpen = () => {
    setStage('reveal');
  };

  // Step 2: After animation completes, move to achievement
  const handleRevealComplete = () => {
    setStage('achievement');
  };

  // Step 3: Close the entire modal
  const handleClose = () => {
    setStage('seal'); // Reset for next use
    setIsVisible(false);
    // Add a small delay to allow exit animation
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && stage === 'achievement') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, stage]);

  if (!isOpen) return null;

  return (
    <div className="omamori-ceremony-container fixed inset-0 z-50">
      <AnimatePresence mode="wait">
        {stage === 'seal' && isVisible && (
          <div
            key="seal-stage"
            className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-white"
          >
            <OmamoriSeal onOpen={handleOpen} />

            {/* Close button for seal stage */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 transition-colors z-10"
              aria-label="Close ceremony"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {stage === 'reveal' && (
          <OmamoriReveal
            key="reveal-stage"
            isActive={true}
            onComplete={handleRevealComplete}
          />
        )}

        {stage === 'achievement' && (
          <OmamoriAchievement
            key="achievement-stage"
            nftImage={ceremonyData.nftImage}
            title={ceremonyData.title}
            description={ceremonyData.description}
            aiMessage={ceremonyData.aiMessage}
            milestone={ceremonyData.milestone}
            goal={ceremonyData.goal}
            onClose={handleClose}
            onShare={onShare}
          />
        )}
      </AnimatePresence>

      {/* Background overlay for all stages except seal (which has its own background) */}
      {stage !== 'seal' && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 -z-10"
          onClick={stage === 'achievement' ? handleClose : undefined}
        />
      )}
    </div>
  );
};

export default OmamoriCeremonyModal;