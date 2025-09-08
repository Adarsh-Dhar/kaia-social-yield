// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "../lib/forge-std/src/Test.sol";
import {CampaignEscrow} from "../src/CampaignEscrow.sol";

contract CampaignEscrowTest is Test {
    CampaignEscrow public escrow;

    // --- Actors ---
    address public owner;
    address public depositor = makeAddr("depositor");
    address payable public recipient = payable(makeAddr("recipient"));

    // --- Constants ---
    bytes32 constant CAMPAIGN_ID = keccak256("my-first-campaign");
    uint256 constant DEPOSIT_AMOUNT = 1 ether;

    function setUp() public {
        // The test contract itself will be the owner
        owner = address(this);
        escrow = new CampaignEscrow();
    }

    // --- Test Deposit ---

    function test_DepositFunds() public {
        // Arrange: Give the depositor some Ether
        vm.deal(depositor, DEPOSIT_AMOUNT);

        // Act: Depositor sends funds to the contract for a campaign
        vm.prank(depositor);
        escrow.deposit{value: DEPOSIT_AMOUNT}(CAMPAIGN_ID);

        // Assert: Check if the contract's balance and mapping are correct
        assertEq(escrow.deposits(CAMPAIGN_ID), DEPOSIT_AMOUNT, "Deposit mapping should be updated.");
        assertEq(address(escrow).balance, DEPOSIT_AMOUNT, "Contract balance should be updated.");
    }

    // --- Test Release Funds ---

    function test_ReleaseFunds() public {
        // Arrange: Deposit funds first
        vm.deal(depositor, DEPOSIT_AMOUNT);
        vm.prank(depositor);
        escrow.deposit{value: DEPOSIT_AMOUNT}(CAMPAIGN_ID);

        uint256 recipientInitialBalance = recipient.balance;

        // Act: Owner releases the funds
        // Note: `vm.prank` is not needed here as `owner` is `address(this)`
        escrow.releaseFunds(CAMPAIGN_ID, recipient);

        // Assert: Check balances and state changes
        assertEq(recipient.balance, recipientInitialBalance + DEPOSIT_AMOUNT, "Recipient should receive the funds.");
        assertEq(escrow.deposits(CAMPAIGN_ID), 0, "Campaign deposit should be cleared.");
        assertEq(address(escrow).balance, 0, "Contract balance should be zero after release.");
    }

    // --- Test Failure Cases (Reverts) ---

    function test_Fail_ReleaseFunds_NotOwner() public {
        // Arrange: Deposit funds
        vm.deal(depositor, DEPOSIT_AMOUNT);
        vm.prank(depositor);
        escrow.deposit{value: DEPOSIT_AMOUNT}(CAMPAIGN_ID);

        // Act & Assert: Expect revert because a non-owner is calling
        vm.prank(depositor); // A non-owner
        vm.expectRevert(CampaignEscrow.NotOwner.selector);
        escrow.releaseFunds(CAMPAIGN_ID, recipient);
    }

    function test_Fail_ReleaseFunds_NoFunds() public {
        bytes32 emptyCampaignId = keccak256("empty-campaign");

        // Act & Assert: Expect revert because there are no funds for this campaign
        vm.expectRevert(CampaignEscrow.NoFunds.selector);
        escrow.releaseFunds(emptyCampaignId, recipient);
    }
}
