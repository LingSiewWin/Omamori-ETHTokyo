'use client';

import React, { useState } from 'react';
import { blockchainService } from '@/lib/contracts';

interface TransactionTestProps {
  userAddress: string | undefined;
}

export default function TransactionTest({ userAddress }: TransactionTestProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [amount, setAmount] = useState('1000');
  const [goal, setGoal] = useState('Emergency Fund');

  const saveTransactionId = async (txHash: string, amount: number, goal: string) => {
    try {
      // Save to localStorage for now (later will be The Graph)
      const transactions = JSON.parse(localStorage.getItem('omamori-transactions') || '[]');
      const newTx = {
        hash: txHash,
        amount,
        goal,
        timestamp: Date.now(),
        userAddress,
        status: 'confirmed'
      };

      transactions.push(newTx);
      localStorage.setItem('omamori-transactions', JSON.stringify(transactions));

      console.log('💾 Transaction saved:', newTx);
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleDeposit = async () => {
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError('');
    setTxHash('');

    try {
      const hash = await blockchainService.deposit(parseInt(amount), 'JPYC', goal);
      setTxHash(hash);

      // Save transaction ID
      await saveTransactionId(hash, parseInt(amount), goal);

      console.log('✅ Deposit successful:', hash);
    } catch (error: any) {
      console.error('❌ Deposit failed:', error);

      // Handle different types of errors
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        setError('Transaction cancelled by user. You can try again anytime!');
      } else if (error.message?.includes('insufficient funds')) {
        setError('Insufficient ETH for gas fees. Please get test ETH from faucet.');
      } else if (error.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(error.message || 'Transaction failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError('');
    setTxHash('');
  };

  if (!userAddress) {
    return (
      <div className="bg-gray-100 rounded-lg p-6">
        <p className="text-gray-600 text-center">Connect wallet to make deposits</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border">
      <h3 className="text-xl font-bold mb-4">💰 Make Deposit</h3>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center justify-between">
            <p className="flex-1">{error}</p>
            <button
              onClick={clearError}
              className="ml-3 text-red-500 hover:text-red-700 font-bold text-lg"
              title="Clear error"
            >
              ×
            </button>
          </div>
          {error.includes('cancelled') && (
            <p className="text-sm mt-2 opacity-75">
              💡 No worries! Your wallet is still connected and ready for the next transaction.
            </p>
          )}
        </div>
      )}

      {txHash && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">✅ Transaction Confirmed!</p>
          <p className="font-mono text-sm break-all">ID: {txHash}</p>
          <p className="text-xs mt-1">💾 Transaction saved for ZK proof generation</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Amount (JPYC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded px-3 py-2"
              min="100"
              step="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Savings Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Emergency Fund">Emergency Fund</option>
              <option value="Travel Savings">Travel Savings</option>
              <option value="Family Protection">Family Protection</option>
              <option value="Education Fund">Education Fund</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleDeposit}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Processing Transaction...' : `Deposit ¥${parseInt(amount || '0').toLocaleString()}`}
          </button>

          {error && !isLoading && (
            <button
              onClick={() => {
                clearError();
                setTimeout(handleDeposit, 100);
              }}
              className="w-full bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600 transition-colors"
            >
              🔄 Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}