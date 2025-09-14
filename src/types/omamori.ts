// Type definitions for OMAMORI ceremony components
export interface OmamoriNFTData {
  tokenId: string;
  image: string;
  goal: string;
  milestone: number;
  level: 'seed' | 'sprout' | 'flower' | 'full-bloom';
}

export interface CeremonyData {
  nftImage: string;
  title: string;
  description: string;
  aiMessage: string;
  milestone: number;
  goal: string;
}

export interface Web3State {
  account: string | null;
  provider: any;
  signer: any;
  isConnected: boolean;
  chainId: number | null;
}

export interface DepositData {
  goal: string;
  amount: string;
  asset: 'USDC' | 'JPYC';
  signature?: string;
}

export type CeremonyStage = 'seal' | 'reveal' | 'achievement';

export interface MilestoneThresholds {
  seed: 0;
  sprout: 10000;
  flower: 50000;
  fullBloom: 100000;
}

// Contract addresses
export const CONTRACT_ADDRESSES = {
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  JPYC: '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c', // Mock
  VAULT: '', // To be set after deployment
  NFT: '', // To be set after deployment
} as const;

// Network configuration
export const POLYGON_ZKEVM_CONFIG = {
  chainId: '0x5A2', // 1442 in hex
  chainName: 'Polygon zkEVM Testnet',
  rpcUrls: ['https://rpc.polygon-zkevm-testnet.gelato.digital'],
  blockExplorerUrls: ['https://testnet-zkevm.polygonscan.com/'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
} as const;