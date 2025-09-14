// OMAMORI Deployment Script - Production Ready
// Combined functionality from deploy.ts with JavaScript improvements

const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🌸 Deploying OMAMORI contracts...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy OmamoriNFT
  console.log("📜 Deploying OmamoriNFT...");
  const OmamoriNFT = await ethers.getContractFactory("OmamoriNFT");
  const omamoriNFT = await OmamoriNFT.deploy();
  await omamoriNFT.waitForDeployment();
  const nftAddress = await omamoriNFT.getAddress();

  console.log("✅ OmamoriNFT deployed to:", nftAddress);

  // Deploy OmamoriVault
  console.log("🏛️ Deploying OmamoriVault...");
  const OmamoriVault = await ethers.getContractFactory("OmamoriVault");
  const omamoriVault = await OmamoriVault.deploy(nftAddress);
  await omamoriVault.waitForDeployment();
  const vaultAddress = await omamoriVault.getAddress();

  console.log("✅ OmamoriVault deployed to:", vaultAddress);

  // Update deployments.json
  const deployments = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contracts: {
      OmamoriNFT: nftAddress,
      OmamoriVault: vaultAddress
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  console.log("📝 Updated deployments.json");

  console.log("\n🎌 Deployment Summary:");
  console.log("Network:", deployments.network);
  console.log("Chain ID:", deployments.chainId);
  console.log("OmamoriNFT:", nftAddress);
  console.log("OmamoriVault:", vaultAddress);
  console.log("🌸 Ready for cultural preservation!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });