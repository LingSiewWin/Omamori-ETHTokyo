import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import type { Web3State } from '../types/omamori';
import { POLYGON_ZKEVM_CONFIG } from '../types/omamori';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    account: null,
    provider: null,
    signer: null,
    isConnected: false,
    chainId: null,
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }, []);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Request account access
      await provider.send('eth_requestAccounts', []);

      // Get signer
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      // Get chain ID
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Switch to Polygon zkEVM if not already connected
      if (chainId !== 1442) {
        await switchToPolygonZkEVM();
        // Re-get network info after switch
        const newNetwork = await provider.getNetwork();
        const newChainId = Number(newNetwork.chainId);

        setWeb3State({
          account,
          provider,
          signer,
          isConnected: true,
          chainId: newChainId,
        });
      } else {
        setWeb3State({
          account,
          provider,
          signer,
          isConnected: true,
          chainId,
        });
      }

      console.log('Connected to MetaMask:', account);
    } catch (err: any) {
      console.error('Failed to connect:', err);
      setError(err?.message || 'Failed to connect to MetaMask');
      setWeb3State({
        account: null,
        provider: null,
        signer: null,
        isConnected: false,
        chainId: null,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled]);

  // Switch to Polygon zkEVM network
  const switchToPolygonZkEVM = useCallback(async () => {
    if (!window.ethereum) throw new Error('MetaMask not found');

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_ZKEVM_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [POLYGON_ZKEVM_CONFIG],
        });
      } else {
        throw switchError;
      }
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    setWeb3State({
      account: null,
      provider: null,
      signer: null,
      isConnected: false,
      chainId: null,
    });
    setError(null);
  }, []);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_accounts', []);

        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const account = await signer.getAddress();
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);

          setWeb3State({
            account,
            provider,
            signer,
            isConnected: true,
            chainId,
          });
        }
      } catch (err) {
        console.error('Failed to check existing connection:', err);
      }
    };

    checkConnection();
  }, [isMetaMaskInstalled]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== web3State.account) {
        // Reconnect with new account
        connect();
      }
    };

    const handleChainChanged = (chainId: string) => {
      // Reload the page on chain change for simplicity
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [web3State.account, connect, disconnect]);

  // Sign typed data (EIP-712)
  const signTypedData = useCallback(async (domain: any, types: any, value: any) => {
    if (!web3State.signer) {
      throw new Error('No signer available');
    }

    try {
      return await web3State.signer.signTypedData(domain, types, value);
    } catch (err: any) {
      console.error('Failed to sign typed data:', err);
      throw new Error(err?.message || 'Failed to sign data');
    }
  }, [web3State.signer]);

  // Get contract instance
  const getContract = useCallback((address: string, abi: any) => {
    if (!web3State.signer) {
      throw new Error('No signer available');
    }

    return new ethers.Contract(address, abi, web3State.signer);
  }, [web3State.signer]);

  return {
    ...web3State,
    isConnecting,
    error,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connect,
    disconnect,
    switchToPolygonZkEVM,
    signTypedData,
    getContract,
  };
};