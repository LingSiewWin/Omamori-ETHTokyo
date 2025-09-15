import { BigInt, Bytes, store, log } from "@graphprotocol/graph-ts";
import {
  DepositSigned,
  HeirDesignated,
  InheritanceActivated,
  InheritanceClaimed,
  OmamoriUpgraded,
  MilestoneVerified,
} from "../generated/OmamoriVault/OmamoriVault";
import {
  User,
  Deposit,
  Inheritance,
  InheritanceClaim,
  OmamoriUpgrade,
  ZKProofSubmission,
  AssetBalance,
  UserGoal,
  DailyStats,
} from "../generated/schema";

// Helper function to get or create user
function getOrCreateUser(address: Bytes): User {
  let user = User.load(address.toHexString());
  if (!user) {
    user = new User(address.toHexString());
    user.kycVerified = false;
    user.totalDeposits = BigInt.fromI32(0);
    user.depositCount = 0;
    user.currentMilestone = 0;
    user.hasOmamori = false;
    user.createdAt = BigInt.fromI32(0);
    user.updatedAt = BigInt.fromI32(0);
  }
  return user;
}

// Helper function to calculate milestone from total deposits
function calculateMilestone(totalAmount: BigInt): i32 {
  const amount = totalAmount.toI32();
  if (amount >= 100000) return 3; // Full bloom at ¥100,000
  if (amount >= 50000) return 2;  // Flower at ¥50,000
  if (amount >= 10000) return 1;  // Sprout at ¥10,000
  return 0; // Seed
}

// Helper function to get or create asset balance
function getOrCreateAssetBalance(userAddress: Bytes, asset: string): AssetBalance {
  const id = userAddress.toHexString() + "-" + asset;
  let balance = AssetBalance.load(id);
  if (!balance) {
    balance = new AssetBalance(id);
    balance.user = userAddress.toHexString();
    balance.asset = asset;
    balance.balance = BigInt.fromI32(0);
    balance.depositCount = 0;
    balance.withdrawalCount = 0;
    balance.lastUpdated = BigInt.fromI32(0);
  }
  return balance;
}

// Helper function to update daily stats
function updateDailyStats(timestamp: BigInt): void {
  const dayID = timestamp.toI32() / 86400; // seconds per day
  const dayStartTimestamp = BigInt.fromI32(dayID * 86400);
  const dayString = dayStartTimestamp.toString();

  let stats = DailyStats.load(dayString);
  if (!stats) {
    stats = new DailyStats(dayString);
    stats.date = dayStartTimestamp;
    stats.totalUsers = 0;
    stats.totalDeposits = BigInt.fromI32(0);
    stats.totalDepositCount = 0;
    stats.newUsers = 0;
    stats.activeUsers = 0;
    stats.jpycDeposits = BigInt.fromI32(0);
    stats.usdcDeposits = BigInt.fromI32(0);
    stats.familyGroups = 0;
    stats.familyDeposits = BigInt.fromI32(0);
    stats.newInheritances = 0;
    stats.totalUpgrades = 0;
    stats.usersAtMilestone0 = 0;
    stats.usersAtMilestone1 = 0;
    stats.usersAtMilestone2 = 0;
    stats.usersAtMilestone3 = 0;
  }
  stats.save();
}

export function handleDepositSigned(event: DepositSigned): void {
  const userAddress = event.params.user;
  const amount = event.params.amount;
  const asset = event.params.asset;
  const goal = event.params.goal;

  // Create or update user
  let user = getOrCreateUser(userAddress);
  user.totalDeposits = user.totalDeposits.plus(amount);
  user.depositCount = user.depositCount + 1;
  user.updatedAt = event.block.timestamp;

  // Check for milestone upgrade
  const previousMilestone = user.currentMilestone;
  const newMilestone = calculateMilestone(user.totalDeposits);
  user.currentMilestone = newMilestone;

  // Create deposit entity
  const depositId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const deposit = new Deposit(depositId);
  deposit.user = userAddress.toHexString();
  deposit.amount = amount;
  deposit.asset = asset;
  deposit.goal = goal;
  deposit.signature = event.transaction.input;
  deposit.transactionHash = event.transaction.hash;
  deposit.blockNumber = event.block.number;
  deposit.blockTimestamp = event.block.timestamp;
  deposit.gasUsed = event.transaction.gasUsed;
  deposit.gasPrice = event.transaction.gasPrice;
  deposit.userMilestoneAfter = newMilestone;
  deposit.triggeredUpgrade = newMilestone > previousMilestone;

  // Update asset balance
  let assetBalance = getOrCreateAssetBalance(userAddress, asset);
  assetBalance.balance = assetBalance.balance.plus(amount);
  assetBalance.depositCount = assetBalance.depositCount + 1;
  assetBalance.lastUpdated = event.block.timestamp;

  // Update or create user goal
  const goalId = userAddress.toHexString() + "-" + goal;
  let userGoal = UserGoal.load(goalId);
  if (!userGoal) {
    userGoal = new UserGoal(goalId);
    userGoal.user = userAddress.toHexString();
    userGoal.goalName = goal;
    userGoal.targetAmount = BigInt.fromI32(100000); // Default target
    userGoal.currentAmount = BigInt.fromI32(0);
    userGoal.currency = asset;
    userGoal.isCompleted = false;
    userGoal.createdAt = event.block.timestamp;
  }
  userGoal.currentAmount = userGoal.currentAmount.plus(amount);
  if (userGoal.currentAmount >= userGoal.targetAmount) {
    userGoal.isCompleted = true;
    userGoal.completedAt = event.block.timestamp;
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  const dayString = (event.block.timestamp.toI32() / 86400 * 86400).toString();
  let stats = DailyStats.load(dayString)!;
  stats.totalDepositCount = stats.totalDepositCount + 1;
  stats.totalDeposits = stats.totalDeposits.plus(amount);

  if (asset == "JPYC") {
    stats.jpycDeposits = stats.jpycDeposits.plus(amount);
  } else if (asset == "USDC") {
    stats.usdcDeposits = stats.usdcDeposits.plus(amount);
  }

  // Save all entities
  user.save();
  deposit.save();
  assetBalance.save();
  userGoal.save();
  stats.save();

  log.info("Processed deposit: {} {} for user {} in goal {}", [
    amount.toString(),
    asset,
    userAddress.toHexString(),
    goal
  ]);
}

export function handleHeirDesignated(event: HeirDesignated): void {
  const owner = event.params.owner;
  const heir = event.params.heir;
  const timestamp = event.params.timestamp;

  // Ensure both users exist
  let ownerUser = getOrCreateUser(owner);
  let heirUser = getOrCreateUser(heir);

  // Create or update inheritance
  let inheritance = Inheritance.load(owner.toHexString());
  if (!inheritance) {
    inheritance = new Inheritance(owner.toHexString());
    inheritance.totalAmount = BigInt.fromI32(0);
    inheritance.designatedAt = timestamp;
  }

  inheritance.owner = owner.toHexString();
  inheritance.heir = heir.toHexString();
  inheritance.isActive = false;
  inheritance.totalAmount = ownerUser.totalDeposits;
  inheritance.updatedAt = event.block.timestamp;

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  const dayString = (event.block.timestamp.toI32() / 86400 * 86400).toString();
  let stats = DailyStats.load(dayString)!;
  stats.newInheritances = stats.newInheritances + 1;

  ownerUser.save();
  heirUser.save();
  inheritance.save();
  stats.save();

  log.info("Heir designated: {} -> {} at {}", [
    owner.toHexString(),
    heir.toHexString(),
    timestamp.toString()
  ]);
}

export function handleInheritanceActivated(event: InheritanceActivated): void {
  const owner = event.params.owner;
  const heir = event.params.heir;
  const timestamp = event.params.timestamp;

  let inheritance = Inheritance.load(owner.toHexString());
  if (inheritance) {
    inheritance.isActive = true;
    inheritance.activatedAt = timestamp;
    inheritance.updatedAt = event.block.timestamp;
    inheritance.save();

    log.info("Inheritance activated: {} -> {} at {}", [
      owner.toHexString(),
      heir.toHexString(),
      timestamp.toString()
    ]);
  }
}

export function handleInheritanceClaimed(event: InheritanceClaimed): void {
  const heir = event.params.heir;
  const previousOwner = event.params.previousOwner;
  const amount = event.params.amount;
  const nftTokenId = event.params.nftTokenId;

  // Create inheritance claim record
  const claimId = event.transaction.hash.toHexString();
  const claim = new InheritanceClaim(claimId);
  claim.inheritance = previousOwner.toHexString();
  claim.heir = heir.toHexString();
  claim.previousOwner = previousOwner.toHexString();
  claim.amount = amount;
  claim.nftTokenId = nftTokenId;
  claim.transactionHash = event.transaction.hash;
  claim.blockNumber = event.block.number;
  claim.blockTimestamp = event.block.timestamp;

  // Update inheritance status
  let inheritance = Inheritance.load(previousOwner.toHexString());
  if (inheritance) {
    inheritance.isActive = false;
    inheritance.updatedAt = event.block.timestamp;
    inheritance.save();
  }

  // Update heir's total deposits
  let heirUser = getOrCreateUser(heir);
  heirUser.totalDeposits = heirUser.totalDeposits.plus(amount);
  heirUser.currentMilestone = calculateMilestone(heirUser.totalDeposits);
  heirUser.updatedAt = event.block.timestamp;

  claim.save();
  heirUser.save();

  log.info("Inheritance claimed: {} inherited {} from {}", [
    heir.toHexString(),
    amount.toString(),
    previousOwner.toHexString()
  ]);
}

export function handleOmamoriUpgraded(event: OmamoriUpgraded): void {
  const user = event.params.user;
  const milestone = event.params.milestone;

  let userEntity = getOrCreateUser(user);
  const previousMilestone = userEntity.currentMilestone;
  userEntity.currentMilestone = milestone.toI32();
  userEntity.hasOmamori = true;
  userEntity.updatedAt = event.block.timestamp;

  // Create upgrade record
  const upgradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const upgrade = new OmamoriUpgrade(upgradeId);
  upgrade.user = user.toHexString();
  upgrade.fromMilestone = previousMilestone;
  upgrade.toMilestone = milestone.toI32();
  upgrade.totalDepositsAtUpgrade = userEntity.totalDeposits;
  upgrade.transactionHash = event.transaction.hash;
  upgrade.blockNumber = event.block.number;
  upgrade.blockTimestamp = event.block.timestamp;

  // Update daily stats
  updateDailyStats(event.block.timestamp);
  const dayString = (event.block.timestamp.toI32() / 86400 * 86400).toString();
  let stats = DailyStats.load(dayString)!;
  stats.totalUpgrades = stats.totalUpgrades + 1;

  userEntity.save();
  upgrade.save();
  stats.save();

  log.info("Omamori upgraded: {} to milestone {}", [
    user.toHexString(),
    milestone.toString()
  ]);
}

export function handleMilestoneVerified(event: MilestoneVerified): void {
  const user = event.params.user;
  const proof = event.params.proof;

  let userEntity = getOrCreateUser(user);
  userEntity.zkProof = proof;
  userEntity.updatedAt = event.block.timestamp;

  // Create ZK proof submission record
  const proofId = event.transaction.hash.toHexString();
  const zkProof = new ZKProofSubmission(proofId);
  zkProof.user = user.toHexString();
  zkProof.proof = proof;
  zkProof.milestone = userEntity.currentMilestone;
  zkProof.verified = true;
  zkProof.transactionHash = event.transaction.hash;
  zkProof.blockNumber = event.block.number;
  zkProof.blockTimestamp = event.block.timestamp;

  userEntity.save();
  zkProof.save();

  log.info("ZK proof verified: {} with proof {}", [
    user.toHexString(),
    proof.toHexString()
  ]);
}