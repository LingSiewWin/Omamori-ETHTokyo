/**
 * Wallet and MetaMask utilities for OMAMORI
 * Handles EIP-712 signatures, transaction signing, and Web3 interactions
 */

import { ethers } from 'ethers';

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
  gasLimit?: string;
}

/**
 * Connect to MetaMask wallet
 */
export async function connectWallet(): Promise<WalletConnection> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);

    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    return {
      address,
      chainId: Number(network.chainId),
      isConnected: true
    };
  } catch (error) {
    console.error('Wallet connection failed:', error);
    throw error;
  }
}

/**
 * Sign EIP-712 typed data for JSC compliance
 */
export async function signTypedData(
  domain: any,
  types: any,
  value: any
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return await signer.signTypedData(domain, types, value);
}

/**
 * Send transaction with cultural context
 */
export async function sendTransaction(
  request: TransactionRequest,
  culturalMessage?: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Add cultural context to transaction metadata
  const tx = {
    to: request.to,
    value: ethers.parseEther(request.value),
    data: request.data || '0x',
    gasLimit: request.gasLimit || '21000'
  };

  if (culturalMessage) {
    console.log('🌸 Cultural Context:', culturalMessage);
  }

  const txResponse = await signer.sendTransaction(tx);
  return txResponse.hash;
}

/**
 * Get current network info
 */
export async function getNetworkInfo(): Promise<{
  chainId: number;
  name: string;
  isJSC: boolean;
}> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  return {
    chainId: Number(network.chainId),
    name: network.name,
    isJSC: Number(network.chainId) === 8888 // JSC Chain ID
  };
}

/**
 * Switch to JSC network
 */
export async function switchToJSC(): Promise<void> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not found');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x22B8' }], // 8888 in hex
    });
  } catch (switchError: any) {
    // Chain not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x22B8',
          chainName: 'Japan Smart Chain',
          nativeCurrency: {
            name: 'JSC',
            symbol: 'JSC',
            decimals: 18
          },
          rpcUrls: [process.env.NEXT_PUBLIC_JSC_RPC || 'https://rpc.kaigan.jsc.dev'],
          blockExplorerUrls: ['https://scan.kaigan.jsc.dev/']
        }]
      });
    } else {
      throw switchError;
    }
  }
}