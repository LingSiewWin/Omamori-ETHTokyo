import { ethers } from 'ethers';

// Real contract addresses on testnet (from deployments.json)
export const CONTRACT_ADDRESSES = {
  OmamoriVault: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  OmamoriNFT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  JPYC: '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c', // JSC testnet JPYC
  USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'  // Polygon USDC
};

// Polygon zkEVM Testnet configuration (alternative working endpoints)
export const POLYGON_ZKEVM_TESTNET = {
  chainId: 2442, // Polygon zkEVM Cardona testnet
  rpcUrl: 'https://rpc.cardona.zkevm-rpc.com',
  explorerUrl: 'https://cardona-zkevm.polygonscan.com/',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};

// Alternative Sepolia testnet as fallback
export const SEPOLIA_TESTNET = {
  chainId: 11155111,
  rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  explorerUrl: 'https://sepolia.etherscan.io/',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};

// Contract ABIs
export const OMAMORI_VAULT_ABI = [
  "function processSignedDeposit(address user, uint256 amount, string memory asset, string memory goal, bytes memory signature) public",
  "function designateHeir(address _heir) public",
  "function activateInheritance() public",
  "function claimInheritance(address _deceased) public",
  "function getUserStats(address user) public view returns (uint256 total, uint256 usdcAmount, uint256 jpycAmount, uint256 milestone, bool hasNFT, bytes32 zkProof)",
  "function getInheritanceInfo(address _owner) public view returns (address heir, bool isActive, uint256 activatedTimestamp, uint256 totalAmount, bool hasNFT)",
  "event DepositSigned(address indexed user, uint256 amount, string asset, string goal)",
  "event HeirDesignated(address indexed owner, address indexed heir, uint256 timestamp)",
  "event InheritanceClaimed(address indexed heir, address indexed previousOwner, uint256 amount, uint256 nftTokenId)"
];

export const JPYC_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

// Get contract instances
export function getOmamoriVaultContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESSES.OmamoriVault, OMAMORI_VAULT_ABI, signerOrProvider);
}

export function getJPYCContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESSES.JPYC, JPYC_ABI, signerOrProvider);
}

// Real blockchain service
export class BlockchainService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not found');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Get the current network
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      console.log('🔗 Current network:', chainId);

      // Check if we're on a supported testnet
      const supportedChains = [SEPOLIA_TESTNET.chainId, POLYGON_ZKEVM_TESTNET.chainId, 1, 137]; // Include mainnet for testing
      if (!supportedChains.includes(chainId)) {
        console.log('⚠️ Not on supported network, switching to Sepolia...');
        await this.switchToTestnet();
      } else {
        console.log('✅ Already on supported network:', chainId);
      }

      console.log('✅ Connected successfully!');
      return true;
    } catch (error) {
      console.error('❌ Blockchain connection failed:', error);
      return false;
    }
  }

  async switchToTestnet(): Promise<void> {
    if (!window.ethereum) throw new Error('MetaMask not found');

    // Try Sepolia first as it's more reliable
    const sepoliaChainIdHex = `0x${SEPOLIA_TESTNET.chainId.toString(16)}`;

    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainIdHex }],
      });
      console.log('✅ Switched to Sepolia testnet');

      // Update provider after switch
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

    } catch (switchError: any) {
      // Sepolia not added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: sepoliaChainIdHex,
              chainName: 'Sepolia Test Network',
              nativeCurrency: SEPOLIA_TESTNET.nativeCurrency,
              rpcUrls: [SEPOLIA_TESTNET.rpcUrl],
              blockExplorerUrls: [SEPOLIA_TESTNET.explorerUrl]
            }],
          });
          console.log('✅ Added and switched to Sepolia testnet');

          // Update provider after adding network
          this.provider = new ethers.BrowserProvider(window.ethereum);
          this.signer = await this.provider.getSigner();

        } catch (addError: any) {
          console.error('Failed to add Sepolia:', addError);
          throw new Error('Please manually add Sepolia testnet to MetaMask');
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        console.log('ℹ️ User cancelled network switch');
        throw new Error('Network switch cancelled');
      } else {
        console.error('Network switch error:', switchError);
        throw new Error('Unable to switch networks. Please try manually.');
      }
    }
  }

  // Keep the old method for backward compatibility but make it use Sepolia
  async switchToPolygonzkEVM(): Promise<void> {
    return this.switchToTestnet();
  }

  async deposit(amount: number, asset: string, goal: string): Promise<string> {
    if (!this.signer) throw new Error('Not connected');

    const vault = getOmamoriVaultContract(this.signer);
    const userAddress = await this.signer.getAddress();

    // Convert amount to wei (assuming 18 decimals)
    const amountWei = ethers.parseUnits(amount.toString(), 18);

    // If depositing JPYC, need to approve first
    if (asset === 'JPYC') {
      const jpyc = getJPYCContract(this.signer);
      const allowance = await jpyc.allowance(userAddress, CONTRACT_ADDRESSES.OmamoriVault);

      if (allowance < amountWei) {
        console.log('💰 Approving JPYC spend...');
        const approveTx = await jpyc.approve(CONTRACT_ADDRESSES.OmamoriVault, amountWei);
        await approveTx.wait();
        console.log('✅ JPYC approved');
      }
    }

    // Create signature for EIP-712
    const domain = {
      name: 'OmamoriVault',
      version: '1',
      chainId: POLYGON_ZKEVM_TESTNET.chainId,
      verifyingContract: CONTRACT_ADDRESSES.OmamoriVault
    };

    const types = {
      Deposit: [
        { name: 'user', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'asset', type: 'string' },
        { name: 'goal', type: 'string' }
      ]
    };

    const value = {
      user: userAddress,
      amount: amountWei,
      asset,
      goal
    };

    console.log('🔏 Signing deposit...');
    let signature;
    try {
      signature = await this.signer.signTypedData(domain, types, value);
    } catch (signError: any) {
      if (signError.code === 4001) {
        throw new Error('User rejected the signature request');
      }
      throw signError;
    }

    // Process the signed deposit
    console.log('📝 Processing deposit on blockchain...');
    let tx;
    try {
      tx = await vault.processSignedDeposit(userAddress, amountWei, asset, goal, signature);
    } catch (txError: any) {
      if (txError.code === 4001) {
        throw new Error('User rejected the transaction');
      }
      throw txError;
    }

    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Deposit confirmed!', receipt.transactionHash);
    return receipt.transactionHash;
  }

  async designateHeir(heirAddress: string): Promise<string> {
    if (!this.signer) throw new Error('Not connected');

    const vault = getOmamoriVaultContract(this.signer);

    console.log('⚖️ Designating heir on blockchain...');
    const tx = await vault.designateHeir(heirAddress);

    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Heir designated!', receipt.transactionHash);
    return receipt.transactionHash;
  }

  async getUserStats(address: string): Promise<{
    totalDeposits: bigint;
    usdcAmount: bigint;
    jpycAmount: bigint;
    milestone: bigint;
    hasNFT: boolean;
    zkProof: string;
  }> {
    if (!this.provider) throw new Error('Not connected');

    const vault = getOmamoriVaultContract(this.provider);
    const stats = await vault.getUserStats(address);

    return {
      totalDeposits: stats[0],
      usdcAmount: stats[1],
      jpycAmount: stats[2],
      milestone: stats[3],
      hasNFT: stats[4],
      zkProof: stats[5]
    };
  }

  async getJPYCBalance(address: string): Promise<bigint> {
    if (!this.provider) throw new Error('Not connected');

    const jpyc = getJPYCContract(this.provider);
    return await jpyc.balanceOf(address);
  }

  isConnected(): boolean {
    return this.signer !== null;
  }

  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('Not connected');
    return await this.signer.getAddress();
  }
}

// Global instance
export const blockchainService = new BlockchainService();

// Types for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}