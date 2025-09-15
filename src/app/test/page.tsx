'use client';

import React, { useState } from 'react';
import MetaMaskConnect from '@/components/MetaMaskConnect';
import TransactionTest from '@/components/TransactionTest';
import LINEDemoPanel from '@/components/LINEDemoPanel';

export default function TestPage() {
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
    console.log('✅ Wallet connected:', address);
  };

  const handleDisconnect = () => {
    setConnectedAddress(undefined);
    console.log('❌ Wallet disconnected');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏆 OMAMORI Judge Demo
          </h1>
          <p className="text-gray-600">
            Live demo showing MetaMask, blockchain transactions, and LINE Bot integration
          </p>
        </div>

        {/* Demo Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* MetaMask Connection */}
            <div>
              <h2 className="text-2xl font-bold mb-4">🦊 Wallet Connection</h2>
              <MetaMaskConnect
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>

            {/* Transaction Testing */}
            <div>
              <h2 className="text-2xl font-bold mb-4">⚡ Make Deposit</h2>
              <TransactionTest userAddress={connectedAddress} />
            </div>
          </div>

          {/* Right Column - LINE Demo */}
          <div>
            <h2 className="text-2xl font-bold mb-4">📱 LINE Bot Integration</h2>
            <LINEDemoPanel userAddress={connectedAddress} />
          </div>
        </div>

        {/* Network Information */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4">🌐 Network Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Sepolia Testnet Details (Primary)</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Chain ID:</strong> 11155111</p>
                <p><strong>RPC URL:</strong> https://sepolia.infura.io/v3/...</p>
                <p><strong>Explorer:</strong> https://sepolia.etherscan.io/</p>
                <p><strong>Currency:</strong> ETH</p>
                <p><strong>Faucet:</strong> <a href="https://sepoliafaucet.com/" target="_blank" className="text-blue-600 hover:underline">Get test ETH</a></p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Contract Addresses</h4>
              <div className="space-y-1 text-sm font-mono">
                <p><strong>OmamoriVault:</strong> 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512</p>
                <p><strong>OmamoriNFT:</strong> 0x5FbDB2315678afecb367f032d93F642f64180aa3</p>
                <p><strong>JPYC Token:</strong> 0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-yellow-800">📋 Testing Instructions</h3>
          <div className="space-y-3 text-sm text-yellow-700">
            <div>
              <h4 className="font-bold">1. Connect MetaMask</h4>
              <p>Install MetaMask and connect to Polygon zkEVM Testnet. The app will help you switch networks.</p>
            </div>
            <div>
              <h4 className="font-bold">2. Get Test Tokens</h4>
              <p>You need ETH for gas fees. Get test ETH from the Polygon zkEVM faucet.</p>
            </div>
            <div>
              <h4 className="font-bold">3. Test Deposits</h4>
              <p>Try making a test deposit. This will create an EIP-712 signature and call the smart contract.</p>
            </div>
            <div>
              <h4 className="font-bold">4. Test Inheritance</h4>
              <p>Designate an heir address to test the inheritance functionality.</p>
            </div>
            <div>
              <h4 className="font-bold">5. Check User Stats</h4>
              <p>View your on-chain data including deposits, milestones, and NFT status.</p>
            </div>
          </div>
        </div>

        {/* Back to Main App */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-[#8B4513] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#7A3F12] transition-colors"
          >
            ← Back to OMAMORI Village
          </a>
        </div>
      </div>
    </div>
  );
}