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

    // Family inheritance system
    mapping(address => address) public heirs; // owner => heir address
    mapping(address => bool) public inheritanceActive; // whether inheritance is activated
    mapping(address => uint256) public inheritanceTimestamp; // when inheritance was activated

    // ZK proof storage (mock for demo)
    mapping(address => bytes32) public zkProofs;

    // EIP-712 type hash for deposit signatures
    bytes32 public constant DEPOSIT_TYPEHASH =
        keccak256("Deposit(address user,uint256 amount,string asset,string goal)");

    event DepositSigned(address indexed user, uint256 amount, string asset, string goal);
    event MilestoneVerified(address indexed user, bytes32 proof);
    event OmamoriUpgraded(address indexed user, uint256 milestone);

    // Family inheritance events
    event HeirDesignated(address indexed owner, address indexed heir, uint256 timestamp);
    event InheritanceActivated(address indexed owner, address indexed heir, uint256 timestamp);
    event InheritanceClaimed(address indexed heir, address indexed previousOwner, uint256 amount, uint256 nftTokenId);

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

    // Family inheritance functions
    function designateHeir(address _heir) public {
        require(_heir != address(0), "Invalid heir address");
        require(_heir != msg.sender, "Cannot designate yourself as heir");

        heirs[msg.sender] = _heir;
        inheritanceActive[msg.sender] = false; // Reset if previously activated

        emit HeirDesignated(msg.sender, _heir, block.timestamp);
    }

    function activateInheritance() public {
        require(heirs[msg.sender] != address(0), "No heir designated");
        require(!inheritanceActive[msg.sender], "Inheritance already activated");

        inheritanceActive[msg.sender] = true;
        inheritanceTimestamp[msg.sender] = block.timestamp;

        emit InheritanceActivated(msg.sender, heirs[msg.sender], block.timestamp);
    }

    function claimInheritance(address _deceased) public {
        require(heirs[_deceased] == msg.sender, "You are not the designated heir");
        require(inheritanceActive[_deceased], "Inheritance not activated");

        // In production, add time-based or oracle-based death verification
        // For demo: allow immediate claiming for testing

        uint256 inheritedAmount = totalDeposits[_deceased];
        require(inheritedAmount > 0, "No deposits to inherit");

        // Transfer deposits
        totalDeposits[msg.sender] += inheritedAmount;
        totalDeposits[_deceased] = 0;

        // Transfer USDC deposits
        uint256 usdcAmount = assetDeposits[_deceased]["USDC"];
        if (usdcAmount > 0) {
            assetDeposits[msg.sender]["USDC"] += usdcAmount;
            assetDeposits[_deceased]["USDC"] = 0;
        }

        // Transfer JPYC deposits
        uint256 jpycAmount = assetDeposits[_deceased]["JPYC"];
        if (jpycAmount > 0) {
            assetDeposits[msg.sender]["JPYC"] += jpycAmount;
            assetDeposits[_deceased]["JPYC"] = 0;
        }

        // Transfer NFT if exists
        uint256 nftTokenId = 0;
        if (hasOmamori(_deceased)) {
            (nftTokenId, , ) = omamoriNFT.getUserOmamori(_deceased);
            // In production, implement NFT transfer logic
            // For demo: just track the inheritance
        }

        // Clean up inheritance state
        inheritanceActive[_deceased] = false;
        heirs[_deceased] = address(0);

        emit InheritanceClaimed(msg.sender, _deceased, inheritedAmount, nftTokenId);
    }

    function getInheritanceInfo(address _owner) public view returns (
        address heir,
        bool isActive,
        uint256 activatedTimestamp,
        uint256 totalAmount,
        bool hasNFT
    ) {
        heir = heirs[_owner];
        isActive = inheritanceActive[_owner];
        activatedTimestamp = inheritanceTimestamp[_owner];
        totalAmount = totalDeposits[_owner];
        hasNFT = hasOmamori(_owner);
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