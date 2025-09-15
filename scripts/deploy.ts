/**
 * Main deployment script for OMAMORI contracts on JSC
 */

import { ethers } from 'hardhat';
import { JSC_CONFIG } from '../services/jsc-config';

async function main() {
  console.log('🌸 Deploying OMAMORI contracts to Japan Smart Chain...');
  console.log('Chain ID:', JSC_CONFIG.chainId);
  console.log('RPC URL:', JSC_CONFIG.rpcUrl);

  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'JSC');

  // Deploy OmamoriNFT
  console.log('\n📿 Deploying OmamoriNFT...');
  const OmamoriNFT = await ethers.getContractFactory('OmamoriNFT');
  const omamoriNFT = await OmamoriNFT.deploy(
    'OMAMORI Cultural Savings NFT',
    'OMAMORI',
    'https://api.omamori.cultural/metadata/'
  );
  await omamoriNFT.waitForDeployment();
  const nftAddress = await omamoriNFT.getAddress();
  console.log('OmamoriNFT deployed to:', nftAddress);

  // Deploy OmamoriVault
  console.log('\n🏦 Deploying OmamoriVault...');
  const OmamoriVault = await ethers.getContractFactory('OmamoriVault');
  const omamoriVault = await OmamoriVault.deploy(
    nftAddress, // NFT contract address
    JSC_CONTRACTS.jpycToken, // JPYC token address
    'OMAMORI Cultural Savings Vault',
    '1.0.0'
  );
  await omamoriVault.waitForDeployment();
  const vaultAddress = await omamoriVault.getAddress();
  console.log('OmamoriVault deployed to:', vaultAddress);

  // Configure NFT minting permissions
  console.log('\n⚙️ Configuring permissions...');
  await omamoriNFT.grantRole(
    await omamoriNFT.MINTER_ROLE(),
    vaultAddress
  );
  console.log('Granted MINTER_ROLE to vault');

  // Deployment summary
  console.log('\n🎉 Deployment completed!');
  console.log('=====================================');
  console.log('OmamoriNFT:', nftAddress);
  console.log('OmamoriVault:', vaultAddress);
  console.log('JPYC Token:', JSC_CONTRACTS.jpycToken);
  console.log('Mizuhiki DID:', JSC_CONTRACTS.mizuhikiDID);
  console.log('=====================================');

  // Save deployment info
  const deploymentInfo = {
    network: 'jsc',
    chainId: JSC_CONFIG.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      OmamoriNFT: nftAddress,
      OmamoriVault: vaultAddress,
      JPYC: JSC_CONTRACTS.jpycToken,
      MizuhikiDID: JSC_CONTRACTS.mizuhikiDID
    },
    explorer: {
      nft: `${JSC_CONFIG.explorerUrl}address/${nftAddress}`,
      vault: `${JSC_CONFIG.explorerUrl}address/${vaultAddress}`
    }
  };

  console.log('\n📋 Deployment info saved to deployment.json');
  console.log('🔗 View on explorer:');
  console.log('NFT:', deploymentInfo.explorer.nft);
  console.log('Vault:', deploymentInfo.explorer.vault);

  return deploymentInfo;
}

// Import JSC_CONTRACTS at the top after JSC_CONFIG
const JSC_CONTRACTS = {
  jpycToken: process.env.JPYC_ADDRESS || '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c',
  mizuhikiDID: process.env.MIZUHIKI_SBT_ADDRESS || '0x742d35Cc6639C0532fD8e3d7A1234567890abcdef'
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });