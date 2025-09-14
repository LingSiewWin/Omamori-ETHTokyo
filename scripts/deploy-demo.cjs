#!/usr/bin/env node

// Mock deployment for OMAMORI demo
const fs = require('fs');
const crypto = require('crypto');

function generateMockAddress() {
  const buffer = crypto.randomBytes(20);
  return '0x' + buffer.toString('hex');
}

async function deployDemo() {
  console.log('🚀 Starting OMAMORI demo deployment...');

  // Generate mock addresses for demo
  const mockNFTAddress = generateMockAddress();
  const mockVaultAddress = generateMockAddress();

  console.log('📜 Mock deployment completed:');
  console.log('🎨 OmamoriNFT deployed to:', mockNFTAddress);
  console.log('🏛️ OmamoriVault deployed to:', mockVaultAddress);

  // Create/update .env file
  const envContent = `# OMAMORI Contract Addresses - Demo
LINE_CHANNEL_ACCESS_TOKEN=your_line_token_here
LINE_CHANNEL_SECRET=your_line_secret_here
POLYGON_ZKEVM_RPC_URL=https://rpc.polygon-zkevm-testnet.gelato.digital
PRIVATE_KEY=your_private_key_without_0x_prefix
USDC_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
JPYC_ADDRESS=0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c
VAULT_ADDRESS=${mockVaultAddress}
NFT_ADDRESS=${mockNFTAddress}
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Contract addresses saved to .env file');

  // Update frontend utils with contract addresses
  const contractUtilsPath = 'src/utils/contracts.ts';
  if (fs.existsSync(contractUtilsPath)) {
    let contractsContent = fs.readFileSync(contractUtilsPath, 'utf8');

    // Update CONTRACT_ADDRESSES
    contractsContent = contractsContent.replace(
      /VAULT: process\.env\.VAULT_ADDRESS \|\| '',/,
      `VAULT: process.env.VAULT_ADDRESS || '${mockVaultAddress}',`
    );

    contractsContent = contractsContent.replace(
      /NFT: process\.env\.NFT_ADDRESS \|\| '',/,
      `NFT: process.env.NFT_ADDRESS || '${mockNFTAddress}',`
    );

    // Update EIP712_DOMAIN
    contractsContent = contractsContent.replace(
      /verifyingContract: '', \/\/ Will be set after deployment/,
      `verifyingContract: '${mockVaultAddress}',`
    );

    fs.writeFileSync(contractUtilsPath, contractsContent);
    console.log('✅ Frontend contracts updated');
  }

  // Create deployment info
  const deploymentInfo = {
    network: 'polygon-zkevm-testnet',
    chainId: 1442,
    contracts: {
      OmamoriNFT: mockNFTAddress,
      OmamoriVault: mockVaultAddress,
      USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      JPYC: '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c'
    },
    timestamp: new Date().toISOString(),
    status: 'demo-deployment',
    note: 'Mock addresses for ETHTokyo 2025 demo'
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('📄 Deployment info saved to deployment.json');

  console.log('\n🎉 Demo deployment complete! Next steps:');
  console.log('1. ✅ Contract addresses are ready');
  console.log('2. ✅ Frontend is configured');
  console.log('3. 🚀 Run: npm run dev');
  console.log('4. 🧪 Test the complete flow');

  console.log('\n📋 Demo Addresses:');
  console.log('NFT Contract:', mockNFTAddress);
  console.log('Vault Contract:', mockVaultAddress);

  return {
    nft: mockNFTAddress,
    vault: mockVaultAddress
  };
}

if (require.main === module) {
  deployDemo()
    .then((result) => {
      console.log('\n✨ Ready for ETHTokyo 2025 Finals!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

module.exports = deployDemo;