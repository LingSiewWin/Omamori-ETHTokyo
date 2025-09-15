// TypeScript deployment script (experimental)
// Note: Use scripts/deploy.js for production deployment

import { ethers } from "hardhat";

async function main() {
  console.log("🌸 TypeScript deployment (experimental)");
  console.log("For production, use: npm run deploy-local");

  // Basic deployment logic for testing
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
}

main().catch((error) => {
  console.error("TypeScript deployment error:", error);
  process.exit(1);
});