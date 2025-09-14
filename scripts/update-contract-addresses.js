#!/usr/bin/env node

/**
 * Update Contract Addresses Script
 *
 * This script updates the contract addresses in the React frontend
 * after contracts have been deployed to Polygon zkEVM.
 *
 * Usage:
 *   node scripts/update-contract-addresses.js --vault=0x123... --nft=0x456...
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let vaultAddress = '';
let nftAddress = '';

args.forEach(arg => {
  if (arg.startsWith('--vault=')) {
    vaultAddress = arg.split('=')[1];
  }
  if (arg.startsWith('--nft=')) {
    nftAddress = arg.split('=')[1];
  }
});

if (!vaultAddress || !nftAddress) {
  console.error('❌ Missing contract addresses');
  console.log('Usage: node scripts/update-contract-addresses.js --vault=0x123... --nft=0x456...');
  process.exit(1);
}

// Validate addresses
if (!vaultAddress.startsWith('0x') || vaultAddress.length !== 42) {
  console.error('❌ Invalid vault address format');
  process.exit(1);
}

if (!nftAddress.startsWith('0x') || nftAddress.length !== 42) {
  console.error('❌ Invalid NFT address format');
  process.exit(1);
}

try {
  // Update .env file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Create from .env.example if .env doesn't exist
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    }
  }

  // Update or add contract addresses
  const lines = envContent.split('\n');
  let vaultFound = false;
  let nftFound = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('VAULT_ADDRESS=')) {
      lines[i] = `VAULT_ADDRESS=${vaultAddress}`;
      vaultFound = true;
    }
    if (lines[i].startsWith('NFT_ADDRESS=')) {
      lines[i] = `NFT_ADDRESS=${nftAddress}`;
      nftFound = true;
    }
  }

  // Add missing addresses
  if (!vaultFound) {
    lines.push(`VAULT_ADDRESS=${vaultAddress}`);
  }
  if (!nftFound) {
    lines.push(`NFT_ADDRESS=${nftAddress}`);
  }

  // Write updated .env file
  fs.writeFileSync(envPath, lines.join('\n'));

  // Update contract utilities file
  const contractUtilsPath = path.join(process.cwd(), 'src', 'utils', 'contracts.ts');
  if (fs.existsSync(contractUtilsPath)) {
    let contractsContent = fs.readFileSync(contractUtilsPath, 'utf8');

    // Update CONTRACT_ADDRESSES object
    contractsContent = contractsContent.replace(
      /VAULT: process\.env\.VAULT_ADDRESS \|\| '',/,
      `VAULT: process.env.VAULT_ADDRESS || '${vaultAddress}',`
    );

    contractsContent = contractsContent.replace(
      /NFT: process\.env\.NFT_ADDRESS \|\| '',/,
      `NFT: process.env.NFT_ADDRESS || '${nftAddress}',`
    );

    // Update EIP712_DOMAIN
    contractsContent = contractsContent.replace(
      /verifyingContract: '', \/\/ Will be set after deployment/,
      `verifyingContract: '${vaultAddress}',`
    );

    fs.writeFileSync(contractUtilsPath, contractsContent);
  }

  // Update HTML template contract address placeholder
  const indexHtmlPath = path.join(process.cwd(), 'frontend', 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    htmlContent = htmlContent.replace(
      /const VAULT_ADDRESS = "0x\.\.\.";/,
      `const VAULT_ADDRESS = "${vaultAddress}";`
    );
    fs.writeFileSync(indexHtmlPath, htmlContent);
  }

  console.log('✅ Contract addresses updated successfully!');
  console.log(`🏛️  Vault Contract: ${vaultAddress}`);
  console.log(`🎨 NFT Contract: ${nftAddress}`);
  console.log('');
  console.log('🚀 Run `npm run dev` to start the development server');
  console.log('🏗️  Run `npm run build` to build for production');

} catch (error) {
  console.error('❌ Failed to update contract addresses:', error.message);
  process.exit(1);
}