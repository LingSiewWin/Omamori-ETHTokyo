import { ethers } from "hardhat";

async function main() {
  console.log("🌸 Deploying OMAMORI contracts to Polygon zkEVM...");

  // Deploy OmamoriNFT first
  const OmamoriNFT = await ethers.getContractFactory("OmamoriNFT");
  const omamoriNFT = await OmamoriNFT.deploy();
  await omamoriNFT.waitForDeployment();

  const nftAddress = await omamoriNFT.getAddress();
  console.log("✅ OmamoriNFT deployed to:", nftAddress);

  // Deploy OmamoriVault with NFT address
  const OmamoriVault = await ethers.getContractFactory("OmamoriVault");
  const omamoriVault = await OmamoriVault.deploy(nftAddress);
  await omamoriVault.waitForDeployment();

  const vaultAddress = await omamoriVault.getAddress();
  console.log("✅ OmamoriVault deployed to:", vaultAddress);

  // Set vault as authorized minter for NFT
  const setVaultTx = await omamoriNFT.transferOwnership(vaultAddress);
  await setVaultTx.wait();
  console.log("✅ Vault set as NFT owner");

  console.log("\n📋 Deployment Summary:");
  console.log("- OmamoriNFT:", nftAddress);
  console.log("- OmamoriVault:", vaultAddress);
  console.log("- Network: Polygon zkEVM Testnet");

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: "polygon-zkevm-testnet",
    contracts: {
      OmamoriNFT: nftAddress,
      OmamoriVault: vaultAddress
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('./deployments.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("✅ Deployment info saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});