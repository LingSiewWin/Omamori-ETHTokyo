// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OmamoriNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    // Mapping from token ID to goal
    mapping(uint256 => string) public goals;

    // Mapping from token ID to milestone level (0 = seed, 1 = sprout, 2 = flower, 3 = full bloom)
    mapping(uint256 => uint256) public milestones;

    // Mapping from user to their current token ID
    mapping(address => uint256) public userTokens;

    // IPFS base URI for metadata
    string private _baseTokenURI;

    event OmamoriMinted(address indexed user, uint256 indexed tokenId, string goal);
    event MilestoneReached(address indexed user, uint256 indexed tokenId, uint256 milestone);

    constructor() ERC721("OmamoriCharm", "OMAMORI") Ownable(msg.sender) {
        _baseTokenURI = "ipfs://QmYourHashHere/"; // Replace with actual IPFS hash
    }

    function mintOmamori(address user, string memory goal) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;

        _mint(user, tokenId);
        goals[tokenId] = goal;
        milestones[tokenId] = 0; // Start with seed level
        userTokens[user] = tokenId;

        // Set initial metadata URI (seed level)
        _setTokenURI(tokenId, "seed.json");

        emit OmamoriMinted(user, tokenId, goal);
        return tokenId;
    }

    function upgradeMilestone(address user, uint256 newMilestone) public {
        require(userTokens[user] > 0 || _ownerOf(userTokens[user]) == user, "User has no omamori");
        require(newMilestone > milestones[userTokens[user]], "Milestone must increase");
        require(newMilestone <= 3, "Maximum milestone is 3");

        uint256 tokenId = userTokens[user];
        milestones[tokenId] = newMilestone;

        // Update metadata based on milestone
        string memory newURI;
        if (newMilestone == 0) newURI = "seed.json";
        else if (newMilestone == 1) newURI = "sprout.json";
        else if (newMilestone == 2) newURI = "flower.json";
        else newURI = "fullbloom.json";

        _setTokenURI(tokenId, newURI);

        emit MilestoneReached(user, tokenId, newMilestone);
    }

    function getUserOmamori(address user) public view returns (uint256 tokenId, string memory goal, uint256 milestone) {
        tokenId = userTokens[user];
        if (tokenId > 0 && _ownerOf(tokenId) == user) {
            goal = goals[tokenId];
            milestone = milestones[tokenId];
        }
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}