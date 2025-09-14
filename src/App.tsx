import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeb3 } from './hooks/useWeb3';
import OmamoriCeremonyModal from './components/omamori/OmamoriCeremonyModal';
import { ContractUtils, shouldShowCeremony, markCeremonyAsSeen } from './utils/contracts';
import type { DepositData, CeremonyData } from './types/omamori';

function App() {
  const {
    account,
    isConnected,
    isConnecting,
    error: web3Error,
    connect,
    disconnect,
    signer,
    chainId,
    isMetaMaskInstalled,
  } = useWeb3();

  // Form state
  const [goal, setGoal] = useState('Okinawa');
  const [amount, setAmount] = useState('1000');
  const [asset, setAsset] = useState<'USDC' | 'JPYC'>('USDC');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Ceremony state
  const [ceremonyOpen, setCeremonyOpen] = useState(false);
  const [ceremonyData, setCeremonyData] = useState<CeremonyData | null>(null);

  // User stats
  const [userStats, setUserStats] = useState<any>(null);
  const [userOmamori, setUserOmamori] = useState<any>(null);

  // Parse URL parameters from LINE bot
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('goal')) setGoal(urlParams.get('goal') || 'Okinawa');
    if (urlParams.get('amount')) setAmount(urlParams.get('amount') || '1000');
    if (urlParams.get('asset')) setAsset((urlParams.get('asset') as 'USDC' | 'JPYC') || 'USDC');
  }, []);

  // Load user data when connected
  useEffect(() => {
    if (isConnected && account && signer) {
      loadUserData();
      checkForCeremony();
    }
  }, [isConnected, account, signer]);

  const loadUserData = async () => {
    if (!account || !signer) return;

    try {
      const contractUtils = new ContractUtils(signer);
      const stats = await contractUtils.getUserStats(account);
      const omamori = await contractUtils.getUserOmamori(account);

      setUserStats(stats);
      setUserOmamori(omamori);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const checkForCeremony = async () => {
    if (!account || !signer) return;

    try {
      const shouldShow = await shouldShowCeremony(account, signer);
      if (shouldShow) {
        const contractUtils = new ContractUtils(signer);
        const data = await contractUtils.generateCeremonyData(account);
        if (data) {
          setCeremonyData(data);
          setCeremonyOpen(true);
        }
      }
    } catch (error) {
      console.error('Failed to check ceremony:', error);
    }
  };

  const handleDeposit = async () => {
    if (!signer || !account || !goal || !amount) {
      setDepositError('Please fill in all fields');
      return;
    }

    setIsDepositing(true);
    setDepositError(null);

    try {
      const contractUtils = new ContractUtils(signer);
      const depositData: DepositData = {
        goal,
        amount,
        asset,
      };

      // Show different status messages during the process
      if (asset === 'USDC') {
        setDepositError('Step 1/2: Approving USDC spending...');
      }

      const txHash = await contractUtils.processDeposit(depositData);
      console.log('Deposit successful:', txHash);

      setDepositError(null);
      setDepositSuccess(true);
      setTimeout(() => setDepositSuccess(false), 5000);

      // Reload user data
      await loadUserData();

      // Check if ceremony should be shown
      setTimeout(checkForCeremony, 2000);
    } catch (error: any) {
      console.error('Deposit failed:', error);

      // Provide helpful error messages
      let errorMessage = error.message || 'Deposit failed. Please try again.';

      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds. Please ensure you have enough USDC and ETH for gas.';
      } else if (errorMessage.includes('user rejected')) {
        errorMessage = 'Transaction was cancelled by user.';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      setDepositError(errorMessage);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleCeremonyClose = () => {
    setCeremonyOpen(false);
    if (account && ceremonyData) {
      markCeremonyAsSeen(account, ceremonyData.milestone);
    }
  };

  const handleShare = async () => {
    if (!ceremonyData) return;

    const shareText = `🌸 I just achieved a new milestone with OMAMORI!\n\n${ceremonyData.title}\n${ceremonyData.description}\n\nJoin me on the savings journey: ${window.location.origin}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'OMAMORI Achievement',
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Achievement details copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const getNetworkStatus = () => {
    if (!chainId) return null;
    if (chainId === 1442) return { status: 'correct', text: 'Polygon zkEVM Testnet' };
    return { status: 'wrong', text: `Wrong Network (${chainId})` };
  };

  const networkStatus = getNetworkStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-omamori-red mb-2 font-japanese">
            🌸 OMAMORI 🌸
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Traditional Japanese savings charm meets DeFi
          </p>
          {networkStatus && (
            <div
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                networkStatus.status === 'correct'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {networkStatus.text}
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          {!isMetaMaskInstalled ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-6 text-center"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">MetaMask Required</h2>
              <p className="text-gray-600 mb-6">
                Please install MetaMask to interact with OMAMORI savings contracts.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-omamori-red to-omamori-pink text-white font-bold py-3 px-6 rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors"
              >
                Install MetaMask
              </a>
            </motion.div>
          ) : !isConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Connect Your Wallet</h2>
                <p className="text-gray-600">
                  Connect MetaMask to start your OMAMORI savings journey
                </p>
              </div>

              {web3Error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {web3Error}
                </div>
              )}

              <button
                onClick={connect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-omamori-red to-omamori-pink text-white font-bold py-3 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    🦊 Connect MetaMask
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Connected Status */}
              <div className="bg-gradient-to-r from-omamori-red to-omamori-pink text-white p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">Connected</p>
                    <p className="font-medium">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={disconnect}
                    className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* User Stats */}
              {userStats && (
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-2">Your Progress</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total Savings</p>
                      <p className="font-bold text-omamori-red">
                        ¥{userStats.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Milestone</p>
                      <p className="font-bold text-omamori-pink">
                        Level {userStats.milestone || 0}
                      </p>
                    </div>
                  </div>
                  {userStats.hasNFT && userOmamori && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-500">Current Goal</p>
                      <p className="font-medium text-gray-800">{userOmamori.goal}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Deposit Form */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Create Savings Goal</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal
                    </label>
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-omamori-pink focus:border-transparent"
                      placeholder="e.g., Okinawa Trip"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (¥)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-omamori-pink focus:border-transparent"
                      placeholder="1000"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asset
                    </label>
                    <select
                      value={asset}
                      onChange={(e) => setAsset(e.target.value as 'USDC' | 'JPYC')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-omamori-pink focus:border-transparent"
                    >
                      <option value="USDC">USDC (Global)</option>
                      <option value="JPYC">JPYC (Japan)</option>
                    </select>
                  </div>

                  {depositError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {depositError}
                    </div>
                  )}

                  <AnimatePresence>
                    {depositSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
                      >
                        ✅ Deposit successful! Your Omamori is growing.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleDeposit}
                    disabled={isDepositing || !goal || !amount}
                    className="w-full bg-gradient-to-r from-omamori-red to-omamori-pink text-white font-bold py-3 px-4 rounded-lg hover:from-red-700 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDepositing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        📿 Create Omamori & Sign Deposit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-gray-500 text-sm"
        >
          Built for ETHTokyo 2025 • Where tradition meets innovation
        </motion.div>
      </div>

      {/* Ceremony Modal */}
      {ceremonyData && (
        <OmamoriCeremonyModal
          isOpen={ceremonyOpen}
          onClose={handleCeremonyClose}
          ceremonyData={ceremonyData}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

export default App;