import { ethers } from 'ethers';
import type { DepositData, CeremonyData } from '../types/omamori';

// Contract ABIs (simplified for demo - in production, import from typechain)
export const VAULT_ABI = [
  'function processSignedDeposit(address user, uint256 amount, string asset, string goal, bytes signature)',
  'function getUserStats(address user) view returns (uint256 total, uint256 usdcAmount, uint256 jpycAmount, uint256 milestone, bool hasNFT, bytes32 zkProof)',
  'function hasOmamori(address user) view returns (bool)',
  'function getCurrentMilestone(uint256 totalAmount) pure returns (uint256)',
  'event DepositSigned(address indexed user, uint256 amount, string asset, string goal)',
  'event OmamoriUpgraded(address indexed user, uint256 milestone)',
];

export const NFT_ABI = [
  'function getUserOmamori(address user) view returns (uint256 tokenId, string goal, uint256 milestone)',
  'function goals(uint256 tokenId) view returns (string)',
  'function milestones(uint256 tokenId) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event OmamoriMinted(address indexed user, uint256 indexed tokenId, string goal)',
  'event MilestoneReached(address indexed user, uint256 indexed tokenId, uint256 milestone)',
];

export const USDC_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
];

// EIP-712 Domain for signing
export const EIP712_DOMAIN = {
  name: 'OmamoriVault',
  version: '1',
  chainId: 1442, // Polygon zkEVM testnet
  verifyingContract: '0xb0ed0d662b8aab40d571c3a3b7a3b92b0f2391a2',
};

// EIP-712 Types for deposit
export const DEPOSIT_TYPES = {
  Deposit: [
    { name: 'user', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'asset', type: 'string' },
    { name: 'goal', type: 'string' },
  ],
};

// Contract addresses (to be updated after deployment)
export const CONTRACT_ADDRESSES = {
  VAULT: process.env.VAULT_ADDRESS || '0xb0ed0d662b8aab40d571c3a3b7a3b92b0f2391a2',
  NFT: process.env.NFT_ADDRESS || '0x200eda961fbd53f6a62d1dcae2fe71fd46d1b5f5',
  USDC: process.env.USDC_ADDRESS || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  JPYC: process.env.JPYC_ADDRESS || '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c',
};

// Utility functions for contract interactions
export class ContractUtils {
  private signer: any;

  constructor(signer: any) {
    this.signer = signer;
  }

  // Process a signed deposit
  async processDeposit(depositData: DepositData): Promise<string> {
    if (!CONTRACT_ADDRESSES.VAULT) {
      throw new Error('Vault contract address not set');
    }

    const vault = new ethers.Contract(CONTRACT_ADDRESSES.VAULT, VAULT_ABI, this.signer);

    // Create EIP-712 signature
    const userAddress = await this.signer.getAddress();
    const amountWei = ethers.parseUnits(depositData.amount, 0); // Assuming yen as integer

    const value = {
      user: userAddress,
      amount: amountWei,
      asset: depositData.asset,
      goal: depositData.goal,
    };

    // Update domain with correct contract address
    const domain = {
      ...EIP712_DOMAIN,
      verifyingContract: CONTRACT_ADDRESSES.VAULT,
    };

    const signature = await this.signer.signTypedData(domain, DEPOSIT_TYPES, value);

    // If USDC, approve first
    if (depositData.asset === 'USDC') {
      await this.approveUSDC(depositData.amount);
    }

    // Process the deposit
    const tx = await vault.processSignedDeposit(
      userAddress,
      amountWei,
      depositData.asset,
      depositData.goal,
      signature
    );

    return tx.hash;
  }

  // Approve USDC spending
  async approveUSDC(amount: string): Promise<string> {
    const usdc = new ethers.Contract(CONTRACT_ADDRESSES.USDC, USDC_ABI, this.signer);
    const amountWei = ethers.parseUnits(amount, 6); // USDC has 6 decimals

    const tx = await usdc.approve(CONTRACT_ADDRESSES.VAULT, amountWei);
    await tx.wait(); // Wait for confirmation
    return tx.hash;
  }

  // Get user statistics
  async getUserStats(userAddress: string) {
    if (!CONTRACT_ADDRESSES.VAULT) {
      throw new Error('Vault contract address not set');
    }

    const vault = new ethers.Contract(CONTRACT_ADDRESSES.VAULT, VAULT_ABI, this.signer);
    const stats = await vault.getUserStats(userAddress);

    return {
      total: Number(stats.total),
      usdcAmount: Number(stats.usdcAmount),
      jpycAmount: Number(stats.jpycAmount),
      milestone: Number(stats.milestone),
      hasNFT: stats.hasNFT,
      zkProof: stats.zkProof,
    };
  }

  // Get user's Omamori NFT data
  async getUserOmamori(userAddress: string) {
    if (!CONTRACT_ADDRESSES.NFT) {
      throw new Error('NFT contract address not set');
    }

    const nft = new ethers.Contract(CONTRACT_ADDRESSES.NFT, NFT_ABI, this.signer);

    try {
      const omamori = await nft.getUserOmamori(userAddress);
      const tokenURI = omamori.tokenId > 0 ? await nft.tokenURI(omamori.tokenId) : '';

      return {
        tokenId: omamori.tokenId.toString(),
        goal: omamori.goal,
        milestone: Number(omamori.milestone),
        tokenURI,
        image: tokenURI ? `https://ipfs.io/ipfs/${tokenURI}` : this.getDefaultNFTImage(Number(omamori.milestone)),
      };
    } catch (error) {
      console.error('Failed to get user omamori:', error);
      return null;
    }
  }

  // Get default NFT image based on milestone
  private getDefaultNFTImage(milestone: number): string {
    const images = {
      0: '/images/omamori-seed.png',
      1: '/images/omamori-sprout.png',
      2: '/images/omamori-flower.png',
      3: '/images/omamori-fullbloom.png',
    };

    return images[milestone as keyof typeof images] || images[0];
  }

  // Generate ceremony data from user stats and omamori
  async generateCeremonyData(userAddress: string): Promise<CeremonyData | null> {
    try {
      const stats = await this.getUserStats(userAddress);
      const omamori = await getUserOmamori(userAddress);

      if (!omamori || !stats.hasNFT) {
        return null;
      }

      const milestoneNames = ['Seed', 'Sprout', 'Flower', 'Full Bloom'];
      const milestoneJapanese = ['種', '芽', '花', '満開'];

      return {
        nftImage: omamori.image,
        title: `家守・${milestoneJapanese[stats.milestone] || '種'}`,
        description: this.getMilestoneDescription(stats.milestone, stats.total),
        aiMessage: this.generateAIMessage(stats.milestone, omamori.goal, stats.total),
        milestone: stats.milestone,
        goal: omamori.goal,
      };
    } catch (error) {
      console.error('Failed to generate ceremony data:', error);
      return null;
    }
  }

  // Generate milestone-specific descriptions
  private getMilestoneDescription(milestone: number, total: number): string {
    switch (milestone) {
      case 0:
        return `貯蓄の種を植えました。合計 ¥${total.toLocaleString()} の節約を達成。`;
      case 1:
        return `芽が出ました！¥${total.toLocaleString()} を貯蓄し、目標への第一歩を踏み出しました。`;
      case 2:
        return `美しい花が咲きました。¥${total.toLocaleString()} の貯蓄により、大きな進歩を遂げています。`;
      case 3:
        return `満開の成果です！¥${total.toLocaleString()} を達成し、お守りが完全に成長しました。`;
      default:
        return `継続的な節約により ¥${total.toLocaleString()} を達成しました。`;
    }
  }

  // Generate AI messages based on milestone and context
  private generateAIMessage(milestone: number, goal: string, total: number): string {
    const messages = [
      `${goal}への第一歩として、小さな種を植えました。継続が力となります。`,
      `${goal}に向けて順調に成長しています。あなたの努力が実を結び始めています。`,
      `${goal}への道のりで美しい花が咲きました。この成果はあなたの dedication の証です。`,
      `${goal}を達成するための満開の成果です。この経験は一生の宝物となるでしょう。`,
    ];

    return messages[milestone] || `${goal}に向けて着実に進歩しています。¥${total.toLocaleString()} の達成おめでとうございます。`;
  }
}

// Helper function to get user omamori (standalone)
export async function getUserOmamori(userAddress: string, signer?: any) {
  if (!CONTRACT_ADDRESSES.NFT) {
    throw new Error('NFT contract address not set');
  }

  const nft = new ethers.Contract(CONTRACT_ADDRESSES.NFT, NFT_ABI, signer);

  try {
    const omamori = await nft.getUserOmamori(userAddress);
    return {
      tokenId: omamori.tokenId.toString(),
      goal: omamori.goal,
      milestone: Number(omamori.milestone),
    };
  } catch (error) {
    console.error('Failed to get user omamori:', error);
    return null;
  }
}

// Helper to check if user should see ceremony
export async function shouldShowCeremony(userAddress: string, signer: any): Promise<boolean> {
  try {
    const contractUtils = new ContractUtils(signer);
    const stats = await contractUtils.getUserStats(userAddress);

    // Check if user has NFT and hasn't seen ceremony for current milestone
    const lastSeenMilestone = localStorage.getItem(`omamori_ceremony_${userAddress}`);
    return stats.hasNFT && (!lastSeenMilestone || Number(lastSeenMilestone) < stats.milestone);
  } catch (error) {
    console.error('Failed to check ceremony status:', error);
    return false;
  }
}

// Mark ceremony as seen
export function markCeremonyAsSeen(userAddress: string, milestone: number) {
  localStorage.setItem(`omamori_ceremony_${userAddress}`, milestone.toString());
}