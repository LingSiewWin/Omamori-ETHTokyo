'use client';

import React, { useState, useEffect } from 'react';
import { blockchainService } from '@/lib/contracts';

interface MetaMaskConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export default function MetaMaskConnect({ onConnect, onDisconnect }: MetaMaskConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [network, setNetwork] = useState<string>('');
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  useEffect(() => {
    checkConnection();
    setupEventListeners();
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          const userAddress = accounts[0];
          console.log('🔍 Found existing connection:', userAddress);

          setAddress(userAddress);
          setIsConnected(true);

          // Update additional info
          await updateBalance(userAddress);
          await updateNetwork();

          // Notify parent
          onConnect?.(userAddress);
        } else {
          console.log('🔍 No existing wallet connection');
        }
      } catch (error) {
        console.error('❌ Error checking connection:', error);
      }
    }
  };

  const setupEventListeners = () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAddress('');
      setBalance('');
      onDisconnect?.();
    } else {
      setAddress(accounts[0]);
      setIsConnected(true);
      updateBalance(accounts[0]);
      onConnect?.(accounts[0]);
    }
  };

  const handleChainChanged = async () => {
    console.log('🔄 Chain changed, updating network info...');
    await updateNetwork();
    if (address) {
      await updateBalance(address);
    }
  };

  const updateBalance = async (address: string) => {
    try {
      if (window.ethereum) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        // Convert from wei to ETH/JSC
        const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
        setBalance(balanceInEth.toFixed(4));
      }
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  const updateNetwork = async () => {
    try {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const chainIdDecimal = parseInt(chainId, 16);

        switch (chainIdDecimal) {
          case 11155111:
            setNetwork('Sepolia Testnet');
            break;
          case 1442:
            setNetwork('Polygon zkEVM Testnet');
            break;
          case 2442:
            setNetwork('Polygon zkEVM Cardona Testnet');
            break;
          case 1:
            setNetwork('Ethereum Mainnet');
            break;
          case 137:
            setNetwork('Polygon');
            break;
          default:
            setNetwork(`Unknown (${chainIdDecimal})`);
        }
      }
    } catch (error) {
      console.error('Error getting network:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask and try again.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      console.log('🔄 Connecting to MetaMask...');
      const success = await blockchainService.connect();

      if (success) {
        const userAddress = await blockchainService.getAddress();
        console.log('✅ Connected to address:', userAddress);

        setAddress(userAddress);
        setIsConnected(true);

        // Update UI state
        await updateBalance(userAddress);
        await updateNetwork();

        // Notify parent component
        onConnect?.(userAddress);

        console.log('✅ Connection setup completed');
      } else {
        setError('Failed to connect to wallet');
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
    setBalance('');
    setNetwork('');
    onDisconnect?.();
  };

  const switchToPolygonzkEVM = async () => {
    try {
      setError('');
      setIsSwitchingNetwork(true);
      console.log('🔄 Switching to testnet...');

      await blockchainService.switchToTestnet();

      // Update UI immediately after successful switch
      await updateNetwork();
      if (address) {
        await updateBalance(address);
      }

      setIsSwitchingNetwork(false);
      console.log('✅ Network switch completed');

    } catch (error: any) {
      console.error('❌ Network switch failed:', error);
      if (error.message.includes('cancelled')) {
        setError('Network switch cancelled. You can try again.');
      } else {
        setError(error.message || 'Failed to switch network');
      }
      setIsSwitchingNetwork(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-[#8B4513]">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold text-[#8B4513]">Connect Your Wallet</h3>
          <p className="text-gray-600">Connect MetaMask to interact with OMAMORI platform</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-[#8B4513] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#7A3F12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? 'Connecting...' : '🦊 Connect MetaMask'}
          </button>

          <div className="text-sm text-gray-500 space-y-1">
            <p>Don't have MetaMask?</p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Download MetaMask →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-green-500">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-green-600">✅ Wallet Connected</h3>
          <button
            onClick={disconnectWallet}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Disconnect
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
              {address}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Balance</label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {balance} ETH
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Network</label>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {network}
            </p>
          </div>

          {network && !network.includes('Sepolia') && !network.includes('zkEVM') && !network.includes('Mainnet') && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="text-sm">⚠️ For best experience, switch to Sepolia Testnet</p>
              <button
                onClick={switchToPolygonzkEVM}
                disabled={isSwitchingNetwork}
                className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSwitchingNetwork ? '🔄 Switching...' : 'Switch to Sepolia Testnet'}
              </button>
            </div>
          )}

          {network && (network.includes('Sepolia') || network.includes('zkEVM') || network.includes('Mainnet')) && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="text-sm">✅ Connected to {network}</p>
              <p className="text-xs mt-1 opacity-75">Ready for OMAMORI transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}