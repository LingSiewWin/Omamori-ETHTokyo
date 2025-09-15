import { useState, useEffect } from 'react';
import { blockchainService } from '@/lib/contracts';

interface UseAccountReturn {
  address: string | undefined;
  isConnected: boolean;
}

interface UseConnectReturn {
  connect: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useAccount(): UseAccountReturn {
  const [address, setAddress] = useState<string | undefined>();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (blockchainService.isConnected()) {
        try {
          const addr = await blockchainService.getAddress();
          setAddress(addr);
          setIsConnected(true);
        } catch (error) {
          console.error('Failed to get address:', error);
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        } else {
          setAddress(undefined);
          setIsConnected(false);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  return { address, isConnected };
}

export function useConnect(): UseConnectReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await blockchainService.connect();
      if (!success) {
        throw new Error('Failed to connect to blockchain');
      }

      // Trigger re-render
      window.dispatchEvent(new Event('walletConnected'));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { connect, isLoading, error };
}