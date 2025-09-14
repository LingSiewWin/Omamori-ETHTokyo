'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Mock Web3 Hooks
const useAccount = () => ({
  address: '0x742d...92c4' as string | null,
  isConnected: false
});
const useConnect = () => ({
  connect: () => console.log('Mock connecting to MetaMask...')
});

type Screen = 'discovery' | 'nurture' | 'gallery' | 'sanctuary';

interface OmamoriState {
  petals: number;
  charmLevel: number;
  zkProofEnabled: boolean;
  elderMode: boolean;
  lastWisdom: string;
  connectedWallet: boolean;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('discovery');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [nurtureAmount, setNurtureAmount] = useState('1000');
  const [selectedAsset, setSelectedAsset] = useState<'JPYC' | 'USDC'>('JPYC');

  const [omamoriState, setOmamoriState] = useState<OmamoriState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omamori-state');
      return saved ? JSON.parse(saved) : {
        petals: 0,
        charmLevel: 1,
        zkProofEnabled: false,
        elderMode: false,
        lastWisdom: 'もったいない精神で今日も頑張りましょう！',
        connectedWallet: false
      };
    }
    return {
      petals: 0,
      charmLevel: 1,
      zkProofEnabled: false,
      elderMode: false,
      lastWisdom: 'もったいない精神で今日も頑張りましょう！',
      connectedWallet: false
    };
  });

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  useEffect(() => {
    setMounted(true);

    // Mock ElizaOS AI Integration
    const now = new Date();
    const hour = now.getHours();

    if (hour === 9 && !omamoriState.lastWisdom.includes('おはよう')) {
      setOmamoriState(prev => ({
        ...prev,
        lastWisdom: 'おはようございます！今日も少しずつお守りを育てましょう 🌸'
      }));
    }

    if (hour === 20) {
      const wisdoms = [
        'もったいない精神で今日を振り返りましょう',
        '小さな一歩が大きな変化を生みます',
        '感謝の心を忘れずに 🙏'
      ];
      const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
      setOmamoriState(prev => ({ ...prev, lastWisdom: randomWisdom }));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('omamori-state', JSON.stringify(omamoriState));
    }
  }, [omamoriState]);

  // Demo Mode Auto-cycle
  useEffect(() => {
    if (!demoMode) return;
    const screens: Screen[] = ['discovery', 'nurture', 'gallery', 'sanctuary'];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % screens.length;
      setCurrentScreen(screens[index]);
    }, 4000);
    return () => clearInterval(interval);
  }, [demoMode]);

  const handleConnectWallet = () => {
    setShowConnectModal(true);
    setTimeout(() => {
      setShowConnectModal(false);
      setOmamoriState(prev => ({ ...prev, connectedWallet: true }));
    }, 2000);
  };

  const handleAddPetal = async () => {
    if (!omamoriState.connectedWallet) {
      handleConnectWallet();
      return;
    }

    setShowSignModal(true);
    setTimeout(() => {
      setShowSignModal(false);
      setOmamoriState(prev => ({
        ...prev,
        petals: prev.petals + Math.floor(parseInt(nurtureAmount) / 100),
        charmLevel: Math.floor((prev.petals + Math.floor(parseInt(nurtureAmount) / 100)) / 10) + 1
      }));
      setShowShareModal(true);
    }, 2500);
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-100 to-pink-200 ${omamoriState.elderMode ? 'text-lg' : 'text-base'}`}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-pink-600">🌸 OMAMORI</h1>

            {/* Kimono Character Animation */}
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center"
            >
              <span className="text-2xl">👘</span>
            </motion.div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Demo Toggle */}
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                demoMode ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {demoMode ? '🎬 DEMO' : '🎬 /demo'}
            </button>

            {/* Elder Mode Toggle */}
            <button
              onClick={() => setOmamoriState(prev => ({ ...prev, elderMode: !prev.elderMode }))}
              className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
              title="Elder Mode - Larger text and voice prompts"
            >
              👴
            </button>

            {/* MetaMask Connect */}
            <motion.button
              animate={!omamoriState.connectedWallet ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={handleConnectWallet}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                omamoriState.connectedWallet
                  ? 'bg-green-500 text-white'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              }`}
            >
              {omamoriState.connectedWallet ? '🦊 0x742d...92c4' : 'Link Wallet 🌸'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 border-b border-pink-200 sticky top-[73px] z-30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-1">
            {[
              { key: 'discovery', label: 'Discovery', icon: '🏠' },
              { key: 'nurture', label: 'Nurture', icon: '🌱' },
              { key: 'gallery', label: 'Gallery', icon: '🎨' },
              { key: 'sanctuary', label: 'Sanctuary', icon: '🏛️' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setCurrentScreen(key as Screen)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
                  currentScreen === key
                    ? 'bg-white text-pink-600 border-b-2 border-pink-500 transform scale-105'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-white/50'
                }`}
              >
                <span className="mr-2">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 min-h-[70vh]">
        <AnimatePresence mode="wait">
          {/* Discovery Screen */}
          {currentScreen === 'discovery' && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.h2
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-4xl md:text-5xl font-bold text-gray-800"
                >
                  Welcome to OMAMORI
                </motion.h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  ElizaOS Certified Cultural Preservation AI Agent<br/>
                  Nurture your protective charm through mindful savings and Japanese wisdom
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-pink-200"
                >
                  <div className="text-6xl text-center">📱</div>
                  <h3 className="text-xl font-semibold text-center">LINE Integration</h3>
                  <p className="text-gray-600 text-center">97M Japanese users • Daily wisdom • Emergency alerts</p>
                  <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
                    🤖 ElizaOS Features:<br/>
                    • Morning reminders (9 AM JST)<br/>
                    • Cultural wisdom (8 PM JST)<br/>
                    • Disaster monitoring (JMA integration)
                  </div>
                  <button className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium">
                    Connect via LINE
                  </button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-pink-200"
                >
                  <div className="text-6xl text-center">🌐</div>
                  <h3 className="text-xl font-semibold text-center">Web3 Access</h3>
                  <p className="text-gray-600 text-center">Multi-chain • ZK privacy • Self-custody</p>
                  <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
                    🔗 Supported Networks:<br/>
                    • Polygon zkEVM Cardona<br/>
                    • Japan Smart Chain (JSC)<br/>
                    • Ethereum Mainnet (ENS)
                  </div>
                  <button
                    onClick={() => setCurrentScreen('nurture')}
                    className="w-full py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
                  >
                    Enter Nurture Garden 🌸
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Nurture Screen */}
          {currentScreen === 'nurture' && (
            <motion.div
              key="nurture"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-800">Nurture Your Charm</h2>
                <p className="text-gray-600">Add petals to grow your protective Omamori through mindful savings</p>
              </div>

              <div className="max-w-md mx-auto bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-pink-200 space-y-6">
                {/* Animated Charm Pouch */}
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1],
                    y: [0, -5, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-center"
                >
                  <div className="text-8xl mb-2">🧧</div>
                  <div className="text-2xl font-bold text-pink-600">{omamoriState.petals} Petals</div>
                  <div className="text-sm text-gray-600">Level {omamoriState.charmLevel} Charm</div>
                </motion.div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nurture Amount (¥)
                    </label>
                    <input
                      type="number"
                      value={nurtureAmount}
                      onChange={(e) => setNurtureAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asset Choice</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedAsset('JPYC')}
                        className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                          selectedAsset === 'JPYC'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        JPYC 🇯🇵
                      </button>
                      <button
                        onClick={() => setSelectedAsset('USDC')}
                        className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                          selectedAsset === 'USDC'
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        USDC 🌍
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddPetal}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg"
                  >
                    {omamoriState.connectedWallet ? 'Add Petal 🌸' : 'Connect Wallet First'}
                  </motion.button>

                  <div className="text-xs text-gray-500 text-center bg-gray-100 p-3 rounded-lg">
                    💡 Cultural Note: Using "Add Petal" instead of "Deposit" follows FSA cultural guidelines
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Gallery Screen */}
          {currentScreen === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-3xl font-bold text-gray-800">Omamori Gallery</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setOmamoriState(prev => ({ ...prev, zkProofEnabled: !prev.zkProofEnabled }))}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      omamoriState.zkProofEnabled
                        ? 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🔒 ZK Privacy {omamoriState.zkProofEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.div
                    key={level}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: level * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`bg-white/60 backdrop-blur-sm rounded-2xl p-6 text-center border-2 transition-all ${
                      level <= omamoriState.charmLevel
                        ? 'border-pink-300 bg-white/80'
                        : 'border-gray-200 bg-gray-50/60'
                    }`}
                  >
                    <div className="text-6xl mb-4">
                      {level <= omamoriState.charmLevel ? '🌸' : '⭕'}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Level {level} Charm</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {level === 1 && "Budding Protection - Basic savings charm"}
                      {level === 2 && "Blossoming Wisdom - Enhanced cultural guidance"}
                      {level === 3 && "Full Bloom Guardian - Complete disaster protection"}
                      {level === 4 && "Ancestral Blessing - Multi-generational sharing"}
                      {level === 5 && "Divine Harmony - Master level enlightenment"}
                    </p>
                    {level <= omamoriState.charmLevel ? (
                      <div className="space-y-2">
                        <div className="text-xs text-green-600 font-medium bg-green-50 p-2 rounded-lg">
                          ✓ Unlocked • NFT Minted
                        </div>
                        <div className="text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded-lg">
                          IPFS: Qm{Math.random().toString(36).substring(7)}...
                        </div>
                        {omamoriState.zkProofEnabled && (
                          <div className="text-xs text-purple-600 font-medium bg-purple-50 p-2 rounded-lg">
                            🔒 ZK-SNARK Protected
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 p-2 rounded-lg bg-gray-100">
                        Requires {level * 10} petals to unlock
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sanctuary Screen */}
          {currentScreen === 'sanctuary' && (
            <motion.div
              key="sanctuary"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gray-800">Reflection Sanctuary</h2>
                <p className="text-gray-600">Daily wisdom, cultural guidance, and autonomous AI insights</p>
              </div>

              <div className="max-w-4xl mx-auto space-y-6">
                {/* Today's Wisdom */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 border border-purple-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">🏛️</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                        Today's ElizaOS Wisdom
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          AI Generated
                        </span>
                      </h3>
                      <p className="text-gray-700 text-lg">{omamoriState.lastWisdom}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Generated at {new Date().toLocaleTimeString('ja-JP')} JST • Next wisdom at 20:00
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Cultural Values Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'もったいない',
                      subtitle: 'Mottainai',
                      icon: '🌿',
                      progress: 85,
                      description: 'Waste prevention mindset'
                    },
                    {
                      title: 'おもてなし',
                      subtitle: 'Omotenashi',
                      icon: '🤝',
                      progress: 72,
                      description: 'Respectful hospitality'
                    },
                    {
                      title: '協働',
                      subtitle: 'Kyōdō',
                      icon: '👥',
                      progress: 68,
                      description: 'Community cooperation'
                    },
                    {
                      title: '伝統',
                      subtitle: 'Dentō',
                      icon: '📜',
                      progress: 91,
                      description: 'Traditional preservation'
                    }
                  ].map((value, index) => (
                    <motion.div
                      key={value.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-pink-200"
                    >
                      <div className="text-center space-y-3">
                        <div className="text-3xl">{value.icon}</div>
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{value.title}</h3>
                          <p className="text-sm text-gray-600">{value.subtitle}</p>
                          <p className="text-xs text-gray-500 mt-1">{value.description}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="text-pink-600 font-medium">{value.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value.progress}%` }}
                              transition={{ duration: 1, delay: index * 0.2 }}
                              className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* System Status */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-pink-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      🚨 Disaster Monitoring
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        JMA Connected
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600">All systems operational</span>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
                        Last check: {new Date().toLocaleTimeString('ja-JP')}<br/>
                        Next check: Every 5 minutes<br/>
                        Cultural backup: IPFS distributed storage
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-pink-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                      🤖 Autonomous Behaviors
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        ElizaOS v2.1.0
                      </span>
                    </h3>
                    <div className="space-y-3">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Morning reminders (9:00 JST)</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Evening wisdom (20:00 JST)</span>
                          <span className="text-green-600">✓</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Disaster monitoring (continuous)</span>
                          <span className="text-green-600">✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-pink-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Sky Girl Animation */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-t from-blue-200 to-blue-300 flex items-center justify-center"
              >
                <span className="text-2xl">🌤️</span>
              </motion.div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Powered by ElizaOS v2.1.0 Certified Agent</div>
                <div>Cultural preservation through AI autonomy • ETHTokyo 2025</div>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              <div className="font-medium">🌸 文化的価値観 🌸</div>
              <div className="space-x-2">
                <span>もったいない</span> •
                <span>おもてなし</span> •
                <span>協働</span> •
                <span>伝統</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {/* Wallet Connect Modal */}
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConnectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-pink-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                <div className="text-6xl">🦊</div>
                <h3 className="text-xl font-semibold">Connecting to MetaMask</h3>
                <p className="text-gray-600">
                  Switching to Polygon zkEVM Cardona (Chain ID: 2442)
                  <br />
                  <span className="text-sm">Gasless transactions via EIP-712</span>
                </p>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-200 border-t-pink-500"></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* EIP-712 Signature Modal */}
        {showSignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-pink-200"
            >
              <div className="text-center space-y-6">
                <div className="text-6xl">✍️</div>
                <h3 className="text-xl font-semibold">Sign Gasless Transaction</h3>
                <p className="text-gray-600">
                  EIP-712 signature for charm nurturing
                  <br />
                  <span className="text-sm">No gas fees required</span>
                </p>
                <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg font-mono text-left overflow-x-auto">
                  <div className="font-semibold mb-2">Signing data:</div>
                  {JSON.stringify({
                    types: {
                      Nurture: [
                        { name: 'amount', type: 'uint256' },
                        { name: 'asset', type: 'address' },
                        { name: 'user', type: 'address' }
                      ]
                    },
                    primaryType: 'Nurture',
                    domain: {
                      name: 'OMAMORI',
                      version: '1',
                      chainId: 2442
                    },
                    message: {
                      amount: nurtureAmount,
                      asset: selectedAsset === 'JPYC' ? '0x431D5dfF03120AFA4bDf332c61A6e1766eF37BDB' : '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                      user: '0x742d35Cc6334C0532925a3b8D039C0dCCbF1342c'
                    }
                  }, null, 2)}
                </div>
                <div className="flex justify-center">
                  <div className="animate-pulse text-pink-500">
                    Waiting for signature...
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Share Success Modal */}
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-pink-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                  className="text-6xl"
                >
                  🎉
                </motion.div>
                <h3 className="text-xl font-semibold text-green-600">Petal Added Successfully!</h3>
                <p className="text-gray-600">
                  Your Omamori grows stronger with each nurturing act.
                  <br />
                  <span className="text-sm font-medium text-pink-600">
                    +{Math.floor(parseInt(nurtureAmount) / 100)} petals added
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 px-4 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium">
                    📱 Share on LINE
                  </button>
                  <button className="py-3 px-4 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                    🌐 Share via ENS
                  </button>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  Transaction Hash: 0x{Math.random().toString(16).substring(2, 10)}...
                  <br />
                  Block: #{Math.floor(Math.random() * 1000000)}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}