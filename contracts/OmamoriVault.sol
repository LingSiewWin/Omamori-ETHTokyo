// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./OmamoriNFT.sol";

contract OmamoriVault is EIP712 {
    using ECDSA for bytes32;

    // Token addresses on Polygon zkEVM
    address public constant USDC = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address public constant JPYC = 0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c; // Mock address

    OmamoriNFT public immutable omamoriNFT;

    // User deposits tracking
    mapping(address => uint256) public totalDeposits;
    mapping(address => mapping(string => uint256)) public assetDeposits; // user => asset => amount
    mapping(address => string[]) public userGoals;

    // ZK proof storage (mock for demo)
    mapping(address => bytes32) public zkProofs;

    // EIP-712 type hash for deposit signatures
    bytes32 public constant DEPOSIT_TYPEHASH =
        keccak256("Deposit(address user,uint256 amount,string asset,string goal)");

    event DepositSigned(address indexed user, uint256 amount, string asset, string goal);
    event MilestoneVerified(address indexed user, bytes32 proof);
    event OmamoriUpgraded(address indexed user, uint256 milestone);

    constructor(address _omamoriNFT) EIP712("OmamoriVault", "1") {
        omamoriNFT = OmamoriNFT(_omamoriNFT);
    }

    function processSignedDeposit(
        address user,
        uint256 amount,
        string memory asset,
        string memory goal,
        bytes memory signature
    ) public {
        // Verify the signature matches the user and data
        bytes32 structHash = keccak256(abi.encode(DEPOSIT_TYPEHASH, user, amount, asset, goal));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        require(signer == user, "Invalid signature");
        require(
            keccak256(bytes(asset)) == keccak256(bytes("USDC")) ||
            keccak256(bytes(asset)) == keccak256(bytes("JPYC")),
            "Invalid asset"
        );

        // Update user deposits (mock - in real implementation would transfer tokens)
        totalDeposits[user] += amount;
        assetDeposits[user][asset] += amount;

        // Check if user needs an omamori NFT
        if (!hasOmamori(user)) {
            omamoriNFT.mintOmamori(user, goal);
            userGoals[user].push(goal);
        }

        // Check for milestone upgrades based on total deposits
        uint256 currentMilestone = getCurrentMilestone(totalDeposits[user]);
        (, , uint256 nftMilestone) = omamoriNFT.getUserOmamori(user);

        if (currentMilestone > nftMilestone) {
            omamoriNFT.upgradeMilestone(user, currentMilestone);
            emit OmamoriUpgraded(user, currentMilestone);
        }

        emit DepositSigned(user, amount, asset, goal);
    }

    function submitZKProof(address user, bytes32 proof) public {
        // Mock ZK proof verification - in real implementation would verify with circuit
        require(proof != bytes32(0), "Invalid proof");

        zkProofs[user] = proof;
        emit MilestoneVerified(user, proof);
    }

    function hasOmamori(address user) public view returns (bool) {
        (uint256 tokenId, , ) = omamoriNFT.getUserOmamori(user);
        return tokenId > 0;
    }

    function getCurrentMilestone(uint256 totalAmount) public pure returns (uint256) {
        if (totalAmount >= 100000) return 3; // Full bloom at ¥100,000
        if (totalAmount >= 50000) return 2;  // Flower at ¥50,000
        if (totalAmount >= 10000) return 1;  // Sprout at ¥10,000
        return 0; // Seed
    }

    function getUserStats(address user) public view returns (
        uint256 total,
        uint256 usdcAmount,
        uint256 jpycAmount,
        uint256 milestone,
        bool hasNFT,
        bytes32 zkProof
    ) {
        total = totalDeposits[user];
        usdcAmount = assetDeposits[user]["USDC"];
        jpycAmount = assetDeposits[user]["JPYC"];
        milestone = getCurrentMilestone(total);
        hasNFT = hasOmamori(user);
        zkProof = zkProofs[user];
    }
}