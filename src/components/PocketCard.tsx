'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { MASCOT_IMAGES } from '@/constants';
import type { PocketGoal } from '@/types/omamori';

interface PocketCardProps {
  goal: PocketGoal;
  onDeposit: (goalId: string, amount: number) => Promise<void>;
  isLoading?: boolean;
}

const PocketCard: React.FC<PocketCardProps> = ({ goal, onDeposit, isLoading = false }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isChewing, setIsChewing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('1000');

  const mascotImages = MASCOT_IMAGES[goal.mascotType];
  const currentImage = isChewing || isHovering ? mascotImages.open : mascotImages.closed;

  const handleDeposit = async () => {
    if (isLoading) return;

    setIsChewing(true);

    try {
      await onDeposit(goal.id, parseInt(depositAmount));

      // Simulate chewing animation
      setTimeout(() => {
        setIsChewing(false);
      }, 1500);
    } catch (error) {
      setIsChewing(false);
      console.error('Deposit failed:', error);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border-2 border-pink-200 hover:border-pink-300 transition-all shadow-lg"
    >
      <div className="space-y-4">
        {/* Mascot Display */}
        <div className="flex justify-center">
          <div className="relative w-20 h-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImage}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <Image
                  src={currentImage}
                  alt={`${goal.mascotType} mascot ${isChewing || isHovering ? 'eating' : 'idle'}`}
                  width={80}
                  height={80}
                  className="w-full h-full object-contain"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Chewing animation indicator */}
            {isChewing && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs"
              >
                ❤️
              </motion.div>
            )}
          </div>
        </div>

        {/* Goal Information */}
        <div className="text-center space-y-2">
          <h3 className="font-bold text-gray-800 text-lg">{goal.title}</h3>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-pink-600">
                {goal.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-r from-pink-400 to-pink-600 h-full rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>¥{goal.amount.toLocaleString()}</span>
              <span>¥{goal.targetAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Deposit Interface */}
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top Up Amount (¥)
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center"
              placeholder="1000"
              min="100"
              step="100"
            />
          </div>

          <motion.button
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={handleDeposit}
            disabled={isLoading || isChewing}
            whileTap={{ scale: 0.95 }}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isLoading || isChewing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isHovering
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                : 'bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700'
            }`}
          >
            {isChewing ? (
              <span className="flex items-center justify-center space-x-2">
                <span>Feeding...</span>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  🌸
                </motion.span>
              </span>
            ) : isLoading ? (
              'Processing...'
            ) : (
              `Feed Mascot ¥${parseInt(depositAmount || '0').toLocaleString()}`
            )}
          </motion.button>

          <div className="text-xs text-center text-gray-500 bg-gray-100 p-2 rounded-lg">
            💡 Cultural Note: Feeding your mascot represents nurturing your financial goals with care
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PocketCard;