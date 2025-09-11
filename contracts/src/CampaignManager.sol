// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for the CouponNFT contract
interface ICouponNFT {
    function mintCoupon(address recipient, uint256 value, string calldata tokenURI) external;
    function getCouponValue(uint256 tokenId) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function burnCoupon(uint256 tokenId) external;
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title CampaignManager
 * @author Your Name
 * @notice Manages advertiser campaigns with randomized rewards and allows users to redeem NFTs for USDT.
 * This contract validates rewards generated off-chain by a trusted operator.
 */
contract CampaignManager is Ownable, ReentrancyGuard {
    IERC20 public immutable usdtToken;
    ICouponNFT public couponNftContract;
    address public operator; // The backend server that awards coupons

    struct Campaign {
        address creator;
        uint256 totalBudget;
        uint256 spent;
        uint256 maxParticipants;
        uint256 participantsCount;
        uint256 minReward;
        uint256 maxReward;
        bool isActive;
        string nftTokenURI;
    }
    mapping(bytes32 => Campaign) public campaigns;

    // --- Events ---
    event CampaignCreated(bytes32 indexed campaignId, address indexed creator, uint256 budget, uint256 maxParticipants, uint256 minReward, uint256 maxReward);
    event CouponAwarded(address indexed user, bytes32 indexed campaignId, uint256 value);
    event CouponRedeemed(address indexed user, uint256 indexed tokenId, uint256 value);

    // --- Errors ---
    error NotOperator();
    error NotCouponOwner();
    error CampaignNotFound();
    error CampaignInactiveOrFull();
    error NftContractNotSet();
    error InvalidAmount();
    error InvalidRewardRange();
    error ValueOutOfBounds(); // Error for when the operator provides a value outside the set rules

    constructor(address _usdtTokenAddress, address _initialOperator) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtTokenAddress);
        operator = _initialOperator;
    }

    // =================================================================
    //                        ADVERTISER FUNCTIONS
    // =================================================================
    /**
     * @notice Creates a new campaign with rules for randomized rewards.
     * @param _budget Total USDT to fund the campaign.
     * @param _maxParticipants The maximum number of coupons that can be awarded.
     * @param _minReward The minimum USDT value a single coupon can have.
     * @param _maxReward The maximum USDT value a single coupon can have.
     * @param _nftTokenURI The metadata URI for the campaign's NFT artwork.
     */
    function createCampaign(
        uint256 _budget,
        uint256 _maxParticipants,
        uint256 _minReward,
        uint256 _maxReward,
        string calldata _nftTokenURI
    ) external nonReentrant returns (bytes32) {
        if (_budget == 0 || _maxParticipants == 0 || _maxReward == 0) revert InvalidAmount();
        if (_minReward > _maxReward || _maxReward > _budget) revert InvalidRewardRange();

        bytes32 campaignId = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        
        campaigns[campaignId] = Campaign({
            creator: msg.sender,
            totalBudget: _budget,
            spent: 0,
            maxParticipants: _maxParticipants,
            participantsCount: 0,
            minReward: _minReward,
            maxReward: _maxReward,
            isActive: true,
            nftTokenURI: _nftTokenURI
        });

        require(usdtToken.transferFrom(msg.sender, address(this), _budget), "TransferFrom failed");
        emit CampaignCreated(campaignId, msg.sender, _budget, _maxParticipants, _minReward, _maxReward);
        return campaignId;
    }

    // =================================================================
    //                     OPERATOR/BACKEND FUNCTIONS
    // =================================================================
    /**
     * @notice Called by the trusted operator to award a coupon to a user.
     * @dev The contract validates the randomly generated value against campaign rules.
     * @param _user The address of the user who completed the mission.
     * @param _campaignId The ID of the campaign.
     * @param _randomCouponValue The USDT value of the coupon, generated securely off-chain.
     */
    function awardCoupon(address _user, bytes32 _campaignId, uint256 _randomCouponValue) external {
        if (msg.sender != operator) revert NotOperator();
        if (address(couponNftContract) == address(0)) revert NftContractNotSet();

        Campaign storage campaign = campaigns[_campaignId];
        if (!campaign.isActive || campaign.participantsCount >= campaign.maxParticipants) {
            revert CampaignInactiveOrFull();
        }

        // --- VALIDATION STEP ---
        // The contract enforces the rules set by the advertiser.
        if (_randomCouponValue < campaign.minReward || _randomCouponValue > campaign.maxReward) {
            revert ValueOutOfBounds();
        }
        if (campaign.totalBudget - campaign.spent < _randomCouponValue) {
            campaign.isActive = false;
            revert CampaignInactiveOrFull();
        }

        campaign.participantsCount++;
        campaign.spent += _randomCouponValue;

        couponNftContract.mintCoupon(_user, _randomCouponValue, campaign.nftTokenURI);
        emit CouponAwarded(_user, _campaignId, _randomCouponValue);
    }

    // =================================================================
    //                           USER FUNCTIONS
    // =================================================================
    /**
     * @notice Allows a user to redeem their Coupon NFT for its USDT value.
     * @param _tokenId The ID of the Coupon NFT to redeem.
     */
    function redeemCoupon(uint256 _tokenId) external nonReentrant {
        if (address(couponNftContract) == address(0)) revert NftContractNotSet();
        
        // 1. Verify ownership of the NFT
        if (couponNftContract.ownerOf(_tokenId) != msg.sender) revert NotCouponOwner();
        
        // 2. Get the coupon's value from the NFT contract
        uint256 couponValue = couponNftContract.getCouponValue(_tokenId);

        // 3. Burn the NFT to ensure it can never be redeemed again
        couponNftContract.burnCoupon(_tokenId);

        // 4. Transfer the USDT prize to the user
        require(usdtToken.transfer(msg.sender, couponValue), "Transfer failed");

        emit CouponRedeemed(msg.sender, _tokenId, couponValue);
    }

    /**
     * @notice Gets all coupon token IDs owned by the caller.
     * @dev This function iterates through a range of token IDs to find owned coupons.
     * @param _startTokenId The starting token ID to search from.
     * @param _endTokenId The ending token ID to search to.
     * @return tokenIds Array of token IDs owned by the caller.
     * @return values Array of corresponding coupon values.
     */
    function getMyCoupons(uint256 _startTokenId, uint256 _endTokenId) external view returns (uint256[] memory tokenIds, uint256[] memory values) {
        if (address(couponNftContract) == address(0)) revert NftContractNotSet();
        
        // First pass: count how many tokens the user owns in the range
        uint256 ownedCount = 0;
        for (uint256 i = _startTokenId; i <= _endTokenId; i++) {
            try couponNftContract.ownerOf(i) returns (address owner) {
                if (owner == msg.sender) {
                    ownedCount++;
                }
            } catch {
                // Token doesn't exist, continue
                continue;
            }
        }
        
        // Second pass: collect the actual token IDs and values
        tokenIds = new uint256[](ownedCount);
        values = new uint256[](ownedCount);
        uint256 index = 0;
        
        for (uint256 i = _startTokenId; i <= _endTokenId; i++) {
            try couponNftContract.ownerOf(i) returns (address owner) {
                if (owner == msg.sender) {
                    tokenIds[index] = i;
                    values[index] = couponNftContract.getCouponValue(i);
                    index++;
                }
            } catch {
                // Token doesn't exist, continue
                continue;
            }
        }
        
        return (tokenIds, values);
    }

    /**
     * @notice Gets all coupon token IDs owned by a specific address.
     * @dev This function iterates through a range of token IDs to find owned coupons.
     * @param _user The address to check for owned coupons.
     * @param _startTokenId The starting token ID to search from.
     * @param _endTokenId The ending token ID to search to.
     * @return tokenIds Array of token IDs owned by the user.
     * @return values Array of corresponding coupon values.
     */
    function getUserCoupons(address _user, uint256 _startTokenId, uint256 _endTokenId) external view returns (uint256[] memory tokenIds, uint256[] memory values) {
        if (address(couponNftContract) == address(0)) revert NftContractNotSet();
        
        // First pass: count how many tokens the user owns in the range
        uint256 ownedCount = 0;
        for (uint256 i = _startTokenId; i <= _endTokenId; i++) {
            try couponNftContract.ownerOf(i) returns (address owner) {
                if (owner == _user) {
                    ownedCount++;
                }
            } catch {
                // Token doesn't exist, continue
                continue;
            }
        }
        
        // Second pass: collect the actual token IDs and values
        tokenIds = new uint256[](ownedCount);
        values = new uint256[](ownedCount);
        uint256 index = 0;
        
        for (uint256 i = _startTokenId; i <= _endTokenId; i++) {
            try couponNftContract.ownerOf(i) returns (address owner) {
                if (owner == _user) {
                    tokenIds[index] = i;
                    values[index] = couponNftContract.getCouponValue(i);
                    index++;
                }
            } catch {
                // Token doesn't exist, continue
                continue;
            }
        }
        
        return (tokenIds, values);
    }

    /**
     * @notice Gets all coupon token IDs owned by the caller (optimized version).
     * @dev This function first checks the user's balance and then searches efficiently.
     * @param _maxTokenId The maximum token ID to search up to.
     * @return tokenIds Array of token IDs owned by the caller.
     * @return values Array of corresponding coupon values.
     */
    function getMyCouponsOptimized(uint256 _maxTokenId) external view returns (uint256[] memory tokenIds, uint256[] memory values) {
        if (address(couponNftContract) == address(0)) revert NftContractNotSet();
        
        uint256 balance = couponNftContract.balanceOf(msg.sender);
        if (balance == 0) {
            return (new uint256[](0), new uint256[](0));
        }
        
        // Pre-allocate arrays with the known balance size
        tokenIds = new uint256[](balance);
        values = new uint256[](balance);
        uint256 index = 0;
        
        // Search through token IDs up to the maximum
        for (uint256 i = 0; i <= _maxTokenId && index < balance; i++) {
            try couponNftContract.ownerOf(i) returns (address owner) {
                if (owner == msg.sender) {
                    tokenIds[index] = i;
                    values[index] = couponNftContract.getCouponValue(i);
                    index++;
                }
            } catch {
                // Token doesn't exist, continue
                continue;
            }
        }
        
        return (tokenIds, values);
    }

    // =================================================================
    //                         ADMIN FUNCTIONS
    // =================================================================
    function setOperator(address _newOperator) external onlyOwner {
        operator = _newOperator;
    }

    function setCouponNftContract(address _nftAddress) external onlyOwner {
        couponNftContract = ICouponNFT(_nftAddress);
    }
}

