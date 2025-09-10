// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
/**
 * @title CouponNFT
 * @author Your Name
 * @notice A non-transferable (soulbound) ERC721 token representing a gift card.
 * It securely stores a specific USDT value for each token and can only be managed by a trusted manager contract.
 */
contract CouponNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    address public campaignManager; // The only address allowed to mint/burn

    // Mapping from tokenId to its USDT value
    mapping(uint256 => uint256) private _couponValues;

    // --- Events ---
    event CouponMinted(address indexed owner, uint256 indexed tokenId, uint256 value);

    // --- Errors ---
    error NotManager();
    error NonTransferable();

    constructor(address initialOwner) ERC721("CouponNFT", "COUPON") Ownable(initialOwner) {}

    // =================================================================
    //                      MANAGER-ONLY FUNCTIONS
    // =================================================================

    /**
     * @notice Mints a new coupon NFT with a specific value.
     * @dev Can only be called by the CampaignManager contract.
     */
    function mintCoupon(address recipient, uint256 value, string memory tokenUri) external {
        if (msg.sender != campaignManager) revert NotManager();
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _couponValues[tokenId] = value;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenUri);

        emit CouponMinted(recipient, tokenId, value);
    }

    /**
     * @notice Burns a coupon NFT after it has been redeemed.
     * @dev Can only be called by the CampaignManager contract.
     */
    function burnCoupon(uint256 tokenId) external {
        if (msg.sender != campaignManager) revert NotManager();
        _burn(tokenId);
    }

    // =================================================================
    //                           VIEW FUNCTIONS
    // =================================================================

    /**
     * @notice Returns the USDT value of a specific coupon NFT.
     */
    function getCouponValue(uint256 tokenId) external view returns (uint256) {
        return _couponValues[tokenId];
    }
    
    // =================================================================
    //                         ADMIN FUNCTIONS
    // =================================================================

    /**
     * @notice Sets the address of the trusted CampaignManager contract.
     */
    function setCampaignManager(address _managerAddress) external onlyOwner {
        campaignManager = _managerAddress;
    }

    // =================================================================
    //                  SOULBOUND MECHANISM OVERRIDE
    // =================================================================

    /**
     * @dev Hook that is called before any token transfer.
     * This override prevents all transfers except for minting (from address 0) and burning (to address 0),
     * making the NFT "soulbound" or non-transferable.
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert NonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

