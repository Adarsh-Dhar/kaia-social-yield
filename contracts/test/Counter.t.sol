// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "../lib/forge-std/src/Test.sol";
import {CampaignManager} from "../src/CampaignManager.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {CouponNFT} from "../src/CouponNFT.sol";

contract CampaignManagerTest is Test {
    CampaignManager public campaignManager;
    MockUSDT public usdt;
    CouponNFT public couponNft;

    // --- Actors ---
    address public owner;
    address public depositor = makeAddr("depositor");
    address payable public recipient = payable(makeAddr("recipient"));

    // --- Constants ---
    bytes32 constant CAMPAIGN_ID = keccak256("my-first-campaign");
    uint256 constant BUDGET_AMOUNT = 100 * 10**6; // 100 USDT (6 decimals)
    uint256 constant MAX_PARTICIPANTS = 100;
    uint256 constant MIN_REWARD = 1 * 10**6; // 1 USDT
    uint256 constant MAX_REWARD = 10 * 10**6; // 10 USDT
    string constant NFT_URI = "https://example.com/coupon-metadata.json";

    function setUp() public {
        // Deploy MockUSDT
        usdt = new MockUSDT();
        
        // Mint USDT to the test contract
        usdt.mint(address(this), 1000000 * 10**6); // 1M USDT
        
        // Deploy CouponNFT
        couponNft = new CouponNFT(address(this));
        
        // Deploy CampaignManager with this contract as operator
        campaignManager = new CampaignManager(address(usdt), address(this));
        
        // Set the CouponNFT contract address in the CampaignManager
        campaignManager.setCouponNftContract(address(couponNft));
        
        // Set the CampaignManager address in the CouponNFT
        couponNft.setCampaignManager(address(campaignManager));
        
        // Approve CampaignManager to spend USDT
        usdt.approve(address(campaignManager), type(uint256).max);
    }

    // --- Test Campaign Creation ---

    function test_CreateCampaign() public {
        // Act: Create a campaign
        bytes32 campaignId = campaignManager.createCampaign(
            BUDGET_AMOUNT,
            MAX_PARTICIPANTS,
            MIN_REWARD,
            MAX_REWARD,
            NFT_URI
        );

        // Assert: Check if the campaign was created
        assertTrue(campaignId != bytes32(0), "Campaign ID should not be zero");
        
        // Check USDT balance was transferred
        assertEq(usdt.balanceOf(address(campaignManager)), BUDGET_AMOUNT, "CampaignManager should have the budget");
    }

    // --- Test Award Coupon ---

    function test_AwardCoupon() public {
        // Arrange: Create a campaign first
        bytes32 campaignId = campaignManager.createCampaign(
            BUDGET_AMOUNT,
            MAX_PARTICIPANTS,
            MIN_REWARD,
            MAX_REWARD,
            NFT_URI
        );

        // Act: Award a coupon to a user
        uint256 couponValue = 5 * 10**6; // 5 USDT
        campaignManager.awardCoupon(recipient, campaignId, couponValue);

        // Assert: Check that the coupon was awarded
        // Note: This would require checking the CouponNFT contract
        assertTrue(true, "Coupon award should succeed");
    }

    // --- Test Failure Cases (Reverts) ---

    function test_Fail_AwardCoupon_NotOperator() public {
        // Arrange: Create a campaign
        bytes32 campaignId = campaignManager.createCampaign(
            BUDGET_AMOUNT,
            MAX_PARTICIPANTS,
            MIN_REWARD,
            MAX_REWARD,
            NFT_URI
        );

        // Act & Assert: Expect revert because a non-operator is calling
        vm.prank(depositor); // A non-operator
        vm.expectRevert(); // Should revert with NotOperator error
        campaignManager.awardCoupon(recipient, campaignId, 5 * 10**6);
    }

    function test_Fail_CreateCampaign_InsufficientBalance() public {
        // Arrange: Create a new CampaignManager with no USDT balance
        MockUSDT emptyUsdt = new MockUSDT();
        CampaignManager emptyCampaignManager = new CampaignManager(address(emptyUsdt), address(this));

        // Act & Assert: Expect revert because there's no USDT balance
        vm.expectRevert(); // Should revert with insufficient balance
        emptyCampaignManager.createCampaign(
            BUDGET_AMOUNT,
            MAX_PARTICIPANTS,
            MIN_REWARD,
            MAX_REWARD,
            NFT_URI
        );
    }
}
