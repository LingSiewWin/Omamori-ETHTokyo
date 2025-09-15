'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import LoadingOverlay from '@/components/LoadingOverlay';
import PocketCard from '@/components/PocketCard';
import { useAccount, useConnect } from '@/hooks/useWeb3';
import { useTypewriter } from '@/hooks/useTypewriter';
import { CULTURAL_VALUES } from '@/constants';
import { blockchainService } from '@/lib/contracts';
import type { PocketGoal, OmamoriState } from '@/types/omamori';

type Screen = 'discovery' | 'nurture' | 'gallery';

interface OmamoriData {
  id: number;
  name: string;
  obtainDate: string;
  duration: string;
  price: number;
  currency: string;
}

interface OmamoriCardProps {
  omamori: OmamoriData;
  isUnlocked: boolean;
}

const OmamoriCard: React.FC<OmamoriCardProps> = ({ omamori, isUnlocked }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!isUnlocked) return;
    setIsAnimating(true);
    setIsFlipped(!isFlipped);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const calculateDaysCollected = (obtainDate: string, duration: string) => {
    const obtained = new Date(obtainDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - obtained.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(diffDays, parseInt(duration.split(' ')[0]));
  };

  const daysCollected = calculateDaysCollected(omamori.obtainDate, omamori.duration);
  const totalDays = parseInt(omamori.duration.split(' ')[0]);

  return (
    <motion.div
      whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
      className={`flex flex-col items-center cursor-pointer ${isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      onClick={handleClick}
    >
      <div className="relative perspective-1000">
        <motion.div
          className={`relative w-24 h-24 mb-3 rounded-lg overflow-hidden border-3 transition-all duration-600 preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          } ${
            isUnlocked ? 'border-yellow-400 shadow-lg' : 'border-gray-400'
          }`}
          animate={{
            rotateY: isFlipped ? 180 : 0,
            scale: isAnimating ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front Face - Omamori Image */}
          <motion.div
            className={`absolute inset-0 backface-hidden ${isFlipped ? 'opacity-0' : 'opacity-100'}`}
            transition={{ duration: 0.3 }}
          >
            <Image
              src={`/omamori/omamori${omamori.id}.png`}
              alt={omamori.name}
              fill
              className={`pixel-art object-cover ${
                !isUnlocked ? 'grayscale opacity-50' : ''
              }`}
            />
          </motion.div>

          {/* Back Face - Detailed Info */}
          {isUnlocked && (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br from-yellow-200 to-yellow-400 p-2 text-xs text-black flex flex-col justify-center items-center backface-hidden rotate-y-180 ${
                isFlipped ? 'opacity-100' : 'opacity-0'
              }`}
              transition={{ duration: 0.3, delay: isFlipped ? 0.3 : 0 }}
            >
              <div className="text-center space-y-1">
                <h4 className="font-bold text-[8px] pixel-art">{omamori.name}</h4>
                <p className="text-[6px] pixel-art">📅 {omamori.obtainDate}</p>
                <p className="text-[6px] pixel-art">⏰ {daysCollected}/{totalDays} days</p>
                <p className="text-[6px] pixel-art font-bold">💰 ¥{omamori.price.toLocaleString()}</p>
                <div className="w-full bg-yellow-600 rounded-full h-1 mt-1">
                  <div
                    className="bg-black h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${(daysCollected / totalDays) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Card Name and Status */}
      <div className="text-center space-y-1 min-h-[4rem]">
        <h3 className="text-sm font-bold text-yellow-300 pixel-art">
          {isUnlocked ? omamori.name : '???'}
        </h3>

        {isUnlocked ? (
          <div className="space-y-1">
            <p className="text-xs text-white pixel-art">
              Click to flip! 🔄
            </p>
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: isAnimating ? 360 : 0 }}
                transition={{ duration: 0.6 }}
                className="text-lg"
              >
                ⛩️
              </motion.div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 pixel-art">Locked</p>
        )}
      </div>
    </motion.div>
  );
};

const OMAMORI_DATA: OmamoriData[] = [
  { id: 1, name: "Health Guardian", obtainDate: "2024-01-15", duration: "30 days", price: 15000, currency: "JPYC" },
  { id: 2, name: "Wealth Protector", obtainDate: "2024-02-01", duration: "45 days", price: 25000, currency: "USDC" },
  { id: 3, name: "Love Charm", obtainDate: "2024-02-10", duration: "60 days", price: 18000, currency: "JPYC" },
  { id: 4, name: "Study Success", obtainDate: "2024-02-20", duration: "90 days", price: 30000, currency: "USDC" },
  { id: 5, name: "Travel Safety", obtainDate: "2024-03-01", duration: "120 days", price: 20000, currency: "JPYC" },
  { id: 6, name: "Family Harmony", obtainDate: "2024-03-15", duration: "150 days", price: 35000, currency: "USDC" },
  { id: 7, name: "Career Fortune", obtainDate: "2024-04-01", duration: "180 days", price: 40000, currency: "JPYC" },
  { id: 8, name: "Wisdom Keeper", obtainDate: "2024-04-15", duration: "200 days", price: 45000, currency: "USDC" },
  { id: 9, name: "Spirit Guardian", obtainDate: "2024-05-01", duration: "365 days", price: 50000, currency: "JPYC" }
];

export default function OmamoriHomepage() {
  const [mounted, setMounted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('discovery');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showCharacter, setShowCharacter] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState(0);
  const [currentPet, setCurrentPet] = useState(1);
  const [isPetFeeding, setIsPetFeeding] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);
  const [lineQRCode, setLineQRCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [lineConnected, setLineConnected] = useState(false);
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'verified'>('none');

  // Family functionality state
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [heirAddress, setHeirAddress] = useState('');
  const [familyGroupInfo, setFamilyGroupInfo] = useState<{
    hasGroup: boolean;
    goal: number;
    progress: number;
    members: number;
    heirSet?: boolean;
    heirAddress?: string;
  }>({ hasGroup: false, goal: 0, progress: 0, members: 0, heirSet: false, heirAddress: '' });

  const dialogStoryline = [
    "Welcome to Omamori Village! I'm Eliza, your digital guardian spirit 🌸",
    "In this sacred space, your savings become protective charms that grow stronger with time ⛩️",
    "Are you ready to begin your journey of mindful wealth cultivation? Let's nurture your dreams together! 🎋"
  ];

  const currentDialogText = dialogStoryline[dialogStep] || "";

  console.log('Current dialog state:', {
    dialogStep,
    currentDialogText,
    showDialog
  });

  const { displayedText, isComplete, skipToEnd } = useTypewriter({
    text: currentDialogText,
    speed: 80,
    delay: showDialog ? 300 : 0
  });

  const [omamoriState, setOmamoriState] = useState<OmamoriState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omamori-state');
      return saved ? JSON.parse(saved) : {
        petals: 0,
        charmLevel: 1,
        coins: 0,
        zkProofEnabled: false,
        elderMode: false,
        lastWisdom: 'Welcome to Omamori! Nurture your dreams, one petal at a time 🌸',
        connectedWallet: false,
        pocketGoals: [
          { id: '1', title: 'Emergency Fund', amount: 50000, targetAmount: 100000, currency: 'JPYC', mascotType: 'cat', progress: 50 },
          { id: '2', title: 'Travel Savings', amount: 25000, targetAmount: 200000, currency: 'USDC', mascotType: 'character1', progress: 12 },
          { id: '3', title: 'Family Protection', amount: 75000, targetAmount: 150000, currency: 'JPYC', mascotType: 'character2', progress: 50 }
        ]
      };
    }
    return {
      petals: 0, charmLevel: 1, coins: 0, zkProofEnabled: false, elderMode: false,
      lastWisdom: 'Welcome to Omamori! Nurture your dreams, one petal at a time 🌸',
      connectedWallet: false,
      pocketGoals: [
        { id: '1', title: 'Emergency Fund', amount: 50000, targetAmount: 100000, currency: 'JPYC', mascotType: 'cat', progress: 50 },
        { id: '2', title: 'Travel Savings', amount: 25000, targetAmount: 200000, currency: 'USDC', mascotType: 'character1', progress: 12 },
        { id: '3', title: 'Family Protection', amount: 75000, targetAmount: 150000, currency: 'JPYC', mascotType: 'character2', progress: 50 }
      ]
    };
  });

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  useEffect(() => {
    setMounted(true);

    // Show character and dialog together after a short delay
    const showElementsTimer = setTimeout(() => {
      setShowCharacter(true);
      setShowDialog(true);
    }, 1500);

    const coins = omamoriState?.coins ?? 0;
    const petLevel = Math.floor(coins / 3) + 1;
    setCurrentPet(Math.min(Math.max(petLevel, 1), 3));

    return () => {
      clearTimeout(showElementsTimer);
    };
  }, [omamoriState.coins]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('omamori-state', JSON.stringify(omamoriState));
    }
  }, [omamoriState]);


  const handleDialogClick = () => {
    console.log('Dialog clicked. isComplete:', isComplete, 'dialogStep:', dialogStep);

    if (!isComplete) {
      // Skip typewriter effect and show complete text immediately
      console.log('Skipping to end...');
      skipToEnd();
    } else {
      // Advance to next dialog or close
      if (dialogStep < dialogStoryline.length - 1) {
        console.log('Advancing to next dialog...');
        setDialogStep(prev => prev + 1);
      } else {
        console.log('Closing dialog...');
        setShowDialog(false);
      }
    }
  };

  const handleLineModalOpen = async () => {
    setShowLineModal(true);
    setIsGeneratingQR(true);

    try {
      const response = await fetch('/api/line/qr');
      const data = await response.json();

      if (data.success && data.qrCode) {
        setLineQRCode(data.qrCode);
      } else {
        alert('❌ LINE Bot API not configured. Please set LINE_BOT_CHANNEL_ID in environment variables.');
        setShowLineModal(false);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('❌ LINE Bot connection failed. Please check API configuration.');
      setShowLineModal(false);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Family functionality handlers
  const handleFamilyModalOpen = () => {
    setShowFamilyModal(true);
  };

  const handleSetHeir = async () => {
    // Enhanced address validation
    if (!heirAddress.trim()) {
      alert('❌ Please enter an heir address');
      return;
    }

    // Check if address format is valid (basic check)
    if (!heirAddress.startsWith('0x') || heirAddress.length !== 42) {
      alert('❌ Invalid address format!\\n\\nPlease enter a valid Ethereum address:\\n• Must start with 0x\\n• Must be 42 characters long\\n• Example: 0x742d35Cc8251D3B8aF8E42C3B4a42e4c3c2c5C4D');
      return;
    }

    // Check if address contains only valid hex characters
    const hexPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!hexPattern.test(heirAddress)) {
      alert('❌ Invalid address characters!\\n\\nAddress can only contain:\\n• Numbers: 0-9\\n• Letters: a-f, A-F');
      return;
    }

    // Check if it's not the zero address
    if (heirAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      alert('❌ Cannot use zero address (0x000...) as heir');
      return;
    }

    if (!isConnected) {
      alert('❌ Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage('Setting heir designation on blockchain...');

      // Real blockchain transaction to designate heir
      const txHash = await blockchainService.designateHeir(heirAddress);

      alert(`✅ Heir designated successfully!\\n\\nHeir: ${heirAddress.substring(0, 10)}...\\nTransaction: ${txHash.substring(0, 10)}...\\n\\n⚠️ Important: Please inform your family member about this designation.`);

      setHeirAddress('');
      setShowFamilyModal(false);

      // Update family group info
      setFamilyGroupInfo(prev => ({
        ...prev,
        heirSet: true,
        heirAddress: heirAddress
      }));

    } catch (error: any) {
      console.error('Error setting heir:', error);

      // Enhanced error handling
      let errorMessage = 'Failed to set heir. Please try again.';

      if (error?.message?.includes('user rejected')) {
        errorMessage = '❌ Transaction cancelled by user';
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = '❌ Insufficient JSC for transaction fee';
      } else if (error?.message?.includes('network')) {
        errorMessage = '❌ Network error. Please check your connection and try again.';
      } else if (error?.message?.includes('Not connected')) {
        errorMessage = '❌ Please connect your wallet first';
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCreateFamilyGroup = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Creating family group...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setFamilyGroupInfo({
        hasGroup: true,
        goal: 100000,
        progress: 0,
        members: 1
      });

      alert('🌸 Family group created! Share with family: https://line.me/R/ti/p/@omamori-family');
    } catch (error) {
      console.error('Error creating family group:', error);
      alert('Failed to create family group.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const notifyFamilyTransaction = async (amount: number, asset: string, txHash?: string) => {
    if (familyGroupInfo.hasGroup) {
      try {
        // Use real transaction hash from blockchain
        const transactionHash = txHash || '0x' + Math.random().toString(16).substring(2, 18);

        await fetch('/api/line/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: [{
              type: 'family_transaction',
              userId: address || 'unknown',
              amount,
              asset,
              transactionHash,
              familyGroupId: 'demo-family-group'
            }]
          })
        });

        setFamilyGroupInfo(prev => ({
          ...prev,
          progress: prev.progress + amount
        }));

        console.log('📱 Family notified of transaction:', transactionHash);
      } catch (error) {
        console.error('Failed to notify family:', error);
      }
    }
  };

  const handlePetDeposit = async (goalId: string, amount: number): Promise<void> => {
    if (!isConnected) {
      connect();
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`Processing deposit of ¥${amount.toLocaleString()}...`);

    try {
      // Find the goal to get its title
      const goal = omamoriState.pocketGoals.find(g => g.id === goalId);
      if (!goal) {
        throw new Error('Goal not found');
      }

      // Real blockchain transaction
      const txHash = await blockchainService.deposit(amount, 'JPYC', goal.title);

      console.log('✅ Blockchain deposit successful:', txHash);

      // Update local state after successful blockchain transaction
      setOmamoriState(prev => ({
        ...prev,
        coins: prev.coins + Math.floor(amount / 1000),
        petals: prev.petals + Math.floor(amount / 1000),
        pocketGoals: prev.pocketGoals.map(g => {
          if (g.id === goalId) {
            const newAmount = g.amount + amount;
            const newProgress = Math.min(Math.round((newAmount / g.targetAmount) * 100), 100);
            return { ...g, amount: newAmount, progress: newProgress };
          }
          return g;
        })
      }));

      // Notify family group of real transaction
      await notifyFamilyTransaction(amount, 'JPYC', txHash);

      alert(`✅ Deposit successful!\n\nTransaction: ${txHash.substring(0, 10)}...\nAmount: ¥${amount.toLocaleString()}\n\nYour OMAMORI grows stronger! 🌸`);

    } catch (error: any) {
      console.error('Deposit failed:', error);

      let errorMessage = 'Transaction failed. Please try again.';
      if (error?.message?.includes('user rejected')) {
        errorMessage = '❌ Transaction cancelled by user';
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = '❌ Insufficient JPYC balance';
      } else if (error?.message?.includes('Not connected')) {
        errorMessage = '❌ Please connect your wallet first';
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const unlockedOmamori = Math.min(Math.floor(omamoriState.coins / 3), 9);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen relative overflow-hidden ${omamoriState.elderMode ? 'text-lg' : 'text-base'}`}>
      <LoadingOverlay isVisible={isLoading} message={loadingMessage} />

      {/* Pixel Art Styles */}
      <style jsx global>{`
        .pixel-art { image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; }
        .pixel-grid { background-image: radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px); background-size: 4px 4px; }
        .dialog-box {
          background: white;
          border: 3px solid #8B4513;
          border-radius: 8px;
          box-shadow: 4px 4px 0 rgba(0,0,0,0.3);
          font-family: 'Courier New', monospace;
        }
      `}</style>

      {/* Static Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background/homepage-background.png"
          alt="Pixel Homepage Background"
          fill
          className="pixel-art object-cover"
          priority
        />
        <div className="absolute inset-0 pixel-grid opacity-20" />
      </div>

      {/* Header with MetaMask */}
      <header className="relative z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black pixel-art">🌸 OMAMORI</h1>
          <div className="flex items-center space-x-3">
            <motion.button
              animate={!isConnected ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={() => connect()}
              className={`px-4 py-2 rounded font-bold transition-colors border-2 ${
                isConnected
                  ? 'bg-white text-black border-gray-300'
                  : 'bg-white text-black border-gray-300 hover:bg-gray-100'
              }`}
            >
              {isConnected ? '🦊 Connected' : 'Connect MetaMask'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLineModalOpen}
              className={`px-4 py-2 rounded font-bold transition-colors border-2 ${
                lineConnected && kycStatus === 'verified'
                  ? 'bg-black text-white border-gray-800'
                  : 'bg-white text-black border-gray-300 hover:bg-gray-100'
              }`}
              title={lineConnected ? `LINE Connected - KYC: ${kycStatus}` : "Connect to LINE Bot"}
            >
              📱 {lineConnected ? (kycStatus === 'verified' ? 'LINE ✓' : 'LINE (KYC)') : 'LINE'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFamilyModalOpen}
              className="px-4 py-2 rounded font-bold transition-colors border-2 bg-white text-black border-gray-300 hover:bg-gray-100"
              title="Family & Inheritance Settings"
            >
              👨‍👩‍👧‍👦 Family
            </motion.button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-30 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { key: 'discovery', label: 'Homepage', icon: '🏠' },
              { key: 'nurture', label: 'Garden', icon: '🌱' },
              { key: 'gallery', label: 'Hall', icon: '🎨' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setCurrentScreen(key as Screen)}
                className={`px-4 py-3 font-medium transition-all pixel-art ${
                  currentScreen === key
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black hover:bg-gray-100'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-20 min-h-[70vh] px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Discovery Screen - Homepage */}
          {currentScreen === 'discovery' && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative min-h-screen flex items-center justify-between px-16"
            >

              {/* ElizaOS Character - LEFT side */}
              <AnimatePresence>
                {showCharacter && (
                  <motion.div
                    initial={{ x: -400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="flex-shrink-0 z-20"
                  >
                    <Image
                      src="/ElizaOS-character/ElizaOS-character.png"
                      alt="Eliza - Digital Guardian Spirit"
                      width={400}
                      height={600}
                      className="pixel-art"
                      style={{
                        imageRendering: 'pixelated',
                        height: '50vh',
                        width: 'auto'
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Static Missions Panel - RIGHT side */}
              <div className="flex-1 flex justify-center">
                <div className="text-center space-y-8 max-w-md">
                  <h2 className="text-4xl font-bold text-black pixel-art mb-12">
                    ⛩️ Daily Progress
                  </h2>

                  <div className="space-y-6">
                    {CULTURAL_VALUES.slice(0, 3).map((mission, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.3 }}
                        className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{mission.icon}</div>
                          <div className="flex-1 text-left">
                            <h3 className="text-black pixel-art font-bold text-sm">
                              {mission.title}
                            </h3>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-black h-2 rounded-full transition-all duration-1000"
                                style={{ width: `${mission.progress}%` }}
                              />
                            </div>
                            <p className="text-gray-600 pixel-art text-xs mt-1">
                              {mission.progress}%
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game-style Dialog Box with 3-part storyline */}
              <AnimatePresence>
                {showDialog && (
                  <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="fixed bottom-0 left-0 w-full h-36 z-40 flex items-center justify-center cursor-pointer"
                    role="dialog"
                    aria-label="Story dialog"
                    onClick={handleDialogClick}
                  >
                    <div className="bg-gradient-to-t from-black/40 to-transparent w-full h-full flex items-end pb-4">
                      <div className="bg-white border-4 border-[#654321] w-full mx-8 h-28 flex items-center justify-between shadow-2xl px-8 rounded-lg relative">

                        {/* Dialog content */}
                        <div className="flex-1 pr-6" key={`dialog-${dialogStep}`}>
                          <p className="text-black font-bold pixel-art text-xl leading-relaxed">
                            {displayedText}
                            {!isComplete && <span className="animate-pulse text-blue-600">|</span>}
                          </p>
                        </div>

                        {/* Interaction indicators */}
                        <div className="flex flex-col items-center space-y-1">
                          <div className="text-[#654321] font-bold pixel-art text-lg animate-bounce">
                            {!isComplete ? "CLICK" :
                             dialogStep < dialogStoryline.length - 1 ? "NEXT" : "START"}
                          </div>

                          {/* Progress dots */}
                          <div className="flex space-x-1">
                            {dialogStoryline.map((_, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                  index === dialogStep ? 'bg-blue-600' :
                                  index < dialogStep ? 'bg-gray-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA Button - Appears after all dialogs are completed */}
              <AnimatePresence>
                {!showDialog && showCharacter && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-35"
                  >
                    <button
                      onClick={() => setCurrentScreen('nurture')}
                      className="px-12 py-6 bg-black hover:bg-gray-900 text-white font-bold rounded-xl pixel-art text-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 border-2 border-gray-800"
                      aria-label="Enter Garden to start nurturing"
                    >
                      🌸 Begin Your Journey
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* Nurture Screen with Pet Feeding */}
          {currentScreen === 'nurture' && (
            <motion.div key="nurture" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-black pixel-art">🌱 Garden</h2>
                <p className="text-gray-600 pixel-art">Choose your savings approach</p>
              </div>

              {/* Individual vs Group Selection */}
              {!familyGroupInfo.hasGroup && (
                <div className="max-w-4xl mx-auto bg-black/40 backdrop-blur-sm rounded-xl p-8 border-2 border-yellow-600">
                  <h3 className="text-2xl font-bold text-yellow-300 text-center pixel-art mb-6">
                    Choose Your Savings Journey
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Individual Option */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer"
                      onClick={() => {
                        if (kycStatus !== 'verified') {
                          alert('❌ Please complete LINE connection and KYC verification first.');
                          return;
                        }
                        alert('✅ Individual mode activated! Start saving for your personal goals.');
                      }}
                    >
                      <div className="text-center space-y-4">
                        <div className="text-6xl">🧘‍♀️</div>
                        <h4 className="text-xl font-bold text-gray-900 pixel-art">Individual Savings</h4>
                        <p className="text-gray-600 pixel-art text-sm">
                          Personal financial goals with individual control and privacy
                        </p>
                        <ul className="text-gray-600 pixel-art text-xs space-y-1 text-left">
                          <li>• Personal savings targets</li>
                          <li>• Individual wallet control</li>
                          <li>• Private transaction history</li>
                          <li>• Personal achievement rewards</li>
                        </ul>
                        <button className="w-full px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-bold pixel-art transition-colors">
                          Start Individual Journey
                        </button>
                      </div>
                    </motion.div>

                    {/* Group Option */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white border border-gray-300 rounded-lg p-6 cursor-pointer"
                      onClick={() => {
                        if (kycStatus !== 'verified') {
                          alert('❌ Please complete LINE connection and KYC verification first.');
                          return;
                        }
                        handleCreateFamilyGroup();
                      }}
                    >
                      <div className="text-center space-y-4">
                        <div className="text-6xl">👨‍👩‍👧‍👦</div>
                        <h4 className="text-xl font-bold text-gray-900 pixel-art">Family Group</h4>
                        <p className="text-gray-700 pixel-art text-sm">
                          Collaborative savings with inheritance planning for Japanese families
                        </p>
                        <ul className="text-gray-700 pixel-art text-xs space-y-1 text-left">
                          <li>• Shared family savings goals</li>
                          <li>• Asset inheritance planning</li>
                          <li>• Family transaction history</li>
                          <li>• Group achievement rewards</li>
                        </ul>
                        <button className="w-full px-4 py-2 bg-black hover:bg-gray-900 text-white rounded-lg font-bold pixel-art transition-colors">
                          Create Family Group
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  {kycStatus !== 'verified' && (
                    <div className="mt-6 p-4 bg-red-900/50 border border-red-400 rounded-lg">
                      <p className="text-red-200 pixel-art text-center text-sm">
                        ⚠️ LINE connection and JSC KYC verification required to proceed
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Family Progress Display */}
              {familyGroupInfo.hasGroup && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-300 rounded-xl p-6 max-w-md mx-auto"
                >
                  <div className="text-center space-y-3">
                    <h3 className="text-xl font-bold text-gray-900 pixel-art">👨‍👩‍👧‍👦 Family Progress</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-700 pixel-art">
                        <span>Goal:</span>
                        <span>¥{familyGroupInfo.goal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700 pixel-art">
                        <span>Saved:</span>
                        <span>¥{familyGroupInfo.progress.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-black h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((familyGroupInfo.progress / familyGroupInfo.goal) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-900 pixel-art">
                        {Math.round((familyGroupInfo.progress / familyGroupInfo.goal) * 100)}% Complete • {familyGroupInfo.members} Members
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Family Quick Actions */}
              {!familyGroupInfo.hasGroup && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <button
                    onClick={handleCreateFamilyGroup}
                    className="px-6 py-3 bg-black hover:bg-gray-900 text-white font-bold rounded-xl pixel-art transition-all transform hover:scale-105"
                  >
                    👨‍👩‍👧‍👦 Create Family Group
                  </button>
                </motion.div>
              )}

              {/* Pet Display */}
              <div className="flex justify-center mb-8">
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={() => setIsPetFeeding(true)}
                  onMouseLeave={() => setIsPetFeeding(false)}
                >
                  <Image
                    src={`/pet/pet${currentPet}-${isPetFeeding ? 'open' : 'closed'}.png`}
                    alt={`Pet ${currentPet}`}
                    width={150}
                    height={150}
                    className="pixel-art"
                  />
                  <div className="text-center mt-2 text-yellow-300 pixel-art font-bold">
                    Pet Level {currentPet} • {omamoriState.coins} Coins
                  </div>
                </div>
              </div>

              {/* Pocket Goals Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {omamoriState.pocketGoals && omamoriState.pocketGoals.length > 0 ? (
                  omamoriState.pocketGoals.map((goal) => (
                    <PocketCard key={goal.id} goal={goal} onDeposit={handlePetDeposit} isLoading={isLoading} />
                  ))
                ) : (
                  // Loading state while pocketGoals is initializing
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))
                )}
              </div>

              {/* e-Omamori Unlock */}
              {omamoriState.coins >= 5 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-center"
                  >
                    <div className="text-8xl mb-4">🏆</div>
                    <h2 className="text-4xl font-bold text-yellow-300 pixel-art">e-OMAMORI UNLOCKED!</h2>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Gallery Screen */}
          {currentScreen === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="relative min-h-screen"
            >
              {/* Hall Background - Only for gallery screen */}
              <div className="fixed inset-0 z-0">
                <Image
                  src="/background/hall-background.png"
                  alt="Omamori Hall Background"
                  fill
                  className="pixel-art object-cover"
                  priority
                />
              </div>

              {/* Hall Title */}
              <div className="relative z-10 pt-8 pb-4">
                <h2 className="text-4xl font-bold text-black text-center pixel-art drop-shadow-lg">
                  🎨 Hall
                </h2>
              </div>

              {/* Omamori Display Container - Positioned to fit inside the building */}
              <div className="relative z-10 flex justify-center items-center min-h-[60vh] px-8">
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-8 border-4 border-yellow-600 shadow-2xl">
                  {/* 3x3 Omamori Grid */}
                  <div className="grid grid-cols-3 gap-6 max-w-3xl">
                    {OMAMORI_DATA.map((omamori) => (
                      <OmamoriCard
                        key={omamori.id}
                        omamori={omamori}
                        isUnlocked={omamori.id <= unlockedOmamori}
                      />
                    ))}
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-6 text-center">
                    <p className="text-black pixel-art font-bold">
                      Collected: {unlockedOmamori}/9 Omamori
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-black h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${(unlockedOmamori / 9) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* LINE Connection Modal */}
      <AnimatePresence>
        {showLineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLineModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 pixel-art">
                  📱 Connect to LINE Bot
                </h2>

                <p className="text-gray-600 pixel-art text-sm">
                  Scan the QR code with LINE to connect with your personalized AI agent
                </p>

                {/* QR Code Display */}
                <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                  {isGeneratingQR ? (
                    <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                      <div className="animate-spin text-4xl mb-2">⚙️</div>
                      <p className="text-gray-500 pixel-art text-xs text-center">
                        Generating QR Code...
                      </p>
                    </div>
                  ) : lineQRCode ? (
                    <div className="w-48 h-48 bg-white rounded-lg p-2">
                      <img
                        src={lineQRCode}
                        alt="LINE Bot QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
                      <div className="text-6xl mb-2">📱</div>
                      <p className="text-gray-500 pixel-art text-xs text-center">
                        Click "Generate QR" below
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-gray-500 pixel-art">
                    Features available after connection:
                  </p>
                  <ul className="text-xs text-gray-600 pixel-art space-y-1 text-left">
                    <li>• Personalized financial advice</li>
                    <li>• Cultural wisdom notifications</li>
                    <li>• Omamori progress updates</li>
                    <li>• Transaction reminders</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLineModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors pixel-art"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      setLineConnected(true);
                      setShowLineModal(false);

                      // Start KYC process after LINE connection
                      setKycStatus('pending');

                      try {
                        const kycResponse = await fetch('/api/jsc/kyc', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            lineUserId: 'demo-line-user-123',
                            userData: { name: 'Demo User' }
                          })
                        });

                        const kycData = await kycResponse.json();

                        if (kycData.success) {
                          setKycStatus('verified');
                          alert('✅ LINE connected and JSC KYC verified! You can now use the platform.');
                        } else {
                          alert('❌ KYC verification failed. Please try again.');
                        }
                      } catch (error) {
                        console.error('KYC error:', error);
                        alert('❌ KYC service unavailable. Please try again later.');
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-green-600 transition-colors pixel-art"
                  >
                    Connect LINE
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family & Inheritance Modal */}
      <AnimatePresence>
        {showFamilyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowFamilyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 pixel-art">
                  👨‍👩‍👧‍👦 Family & Inheritance
                </h2>

                <p className="text-gray-600 pixel-art text-sm">
                  Set up inheritance for your family in accordance with Japanese tradition
                </p>

                {/* Heir Address Input */}
                <div className="space-y-4">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 pixel-art mb-2">
                      Heir Wallet Address
                    </label>
                    <input
                      type="text"
                      value={heirAddress}
                      onChange={(e) => setHeirAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pixel-art text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1 pixel-art">
                      Enter your child's or heir's MetaMask wallet address
                    </p>
                  </div>

                  {/* Family Group Status */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800 pixel-art mb-2">Family Group Status</h3>
                    {familyGroupInfo.hasGroup ? (
                      <div className="text-sm text-purple-700 pixel-art">
                        ✅ Active family group<br/>
                        Members: {familyGroupInfo.members}<br/>
                        Progress: ¥{familyGroupInfo.progress.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-sm text-purple-700 pixel-art">
                        ❌ No family group created<br/>
                        Create one in the Garden screen
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowFamilyModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors pixel-art"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetHeir}
                    disabled={!heirAddress}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors pixel-art"
                  >
                    Set Heir
                  </button>
                </div>

                <div className="text-xs text-gray-500 pixel-art">
                  ⚠️ Important: This will designate inheritance in your smart contract. Legal in Japan for family asset transfer.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}