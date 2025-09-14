import { expect } from "chai";
import { ethers } from "hardhat";
import { OmamoriNFT, OmamoriVault } from "../typechain-types";

describe("OMAMORI Contracts", function () {
  let omamoriNFT: OmamoriNFT;
  let omamoriVault: OmamoriVault;
  let owner: any;
  let user: any;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy NFT contract
    const OmamoriNFT = await ethers.getContractFactory("OmamoriNFT");
    omamoriNFT = await OmamoriNFT.deploy();
    await omamoriNFT.waitForDeployment();

    // Deploy Vault contract
    const OmamoriVault = await ethers.getContractFactory("OmamoriVault");
    omamoriVault = await OmamoriVault.deploy(await omamoriNFT.getAddress());
    await omamoriVault.waitForDeployment();

    // Transfer NFT ownership to vault
    await omamoriNFT.transferOwnership(await omamoriVault.getAddress());
  });

  describe("OmamoriNFT", function () {
    it("Should mint an omamori NFT with goal", async function () {
      await omamoriNFT.connect(owner).mintOmamori(user.address, "Okinawa Trip");

      const userOmamori = await omamoriNFT.getUserOmamori(user.address);
      expect(userOmamori.goal).to.equal("Okinawa Trip");
      expect(userOmamori.milestone).to.equal(0); // Seed level
    });

    it("Should upgrade milestone", async function () {
      await omamoriNFT.connect(owner).mintOmamori(user.address, "Okinawa Trip");
      await omamoriNFT.connect(owner).upgradeMilestone(user.address, 1);

      const userOmamori = await omamoriNFT.getUserOmamori(user.address);
      expect(userOmamori.milestone).to.equal(1); // Sprout level
    });
  });

  describe("OmamoriVault", function () {
    it("Should process signed deposits correctly", async function () {
      const goal = "Okinawa Trip";
      const amount = 1000;
      const asset = "USDC";

      // Create EIP-712 signature
      const domain = {
        name: 'OmamoriVault',
        version: '1',
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: await omamoriVault.getAddress()
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
        user: user.address,
        amount: amount,
        asset: asset,
        goal: goal
      };

      const signature = await user.signTypedData(domain, types, value);

      // Process the deposit
      await omamoriVault.processSignedDeposit(user.address, amount, asset, goal, signature);

      // Check user stats
      const stats = await omamoriVault.getUserStats(user.address);
      expect(stats.total).to.equal(amount);
      expect(stats.hasNFT).to.be.true;
    });

    it("Should calculate milestones correctly", async function () {
      expect(await omamoriVault.getCurrentMilestone(5000)).to.equal(0);  // Seed
      expect(await omamoriVault.getCurrentMilestone(15000)).to.equal(1); // Sprout
      expect(await omamoriVault.getCurrentMilestone(60000)).to.equal(2); // Flower
      expect(await omamoriVault.getCurrentMilestone(150000)).to.equal(3); // Full Bloom
    });
  });
});