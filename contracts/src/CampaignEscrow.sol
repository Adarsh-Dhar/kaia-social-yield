// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CampaignEscrow
 * @author Your Name
 * @notice A simple escrow contract to hold funds for campaigns, identified by a campaign ID.
 * The contract owner is the only one who can release the funds to a specified recipient.
 */
contract CampaignEscrow {
    /// @notice The address of the contract owner/arbiter.
    address public immutable owner;

    /// @notice Mapping from a campaign's unique ID to the total amount deposited.
    mapping(bytes32 => uint256) public deposits;

    // --- Events ---
    event Deposit(bytes32 indexed campaignId, address indexed depositor, uint256 amount);
    event Release(bytes32 indexed campaignId, address indexed recipient, uint256 amount);

    // --- Errors ---
    error NotOwner();
    error NoFunds();
    error TransferFailed();

    /// @notice Sets the contract deployer as the owner.
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Allows anyone to deposit Ether into the escrow for a specific campaign.
     * @param campaignId A unique identifier for the campaign.
     */
    function deposit(bytes32 campaignId) external payable {
        deposits[campaignId] += msg.value;
        emit Deposit(campaignId, msg.sender, msg.value);
    }

    /**
     * @notice Allows the owner to release the full escrowed amount for a campaign to a recipient.
     * @param campaignId The unique identifier for the campaign whose funds are to be released.
     * @param recipient The address that will receive the funds.
     */
    function releaseFunds(bytes32 campaignId, address payable recipient) external {
        if (msg.sender != owner) {
            revert NotOwner();
        }

        uint256 amount = deposits[campaignId];
        if (amount == 0) {
            revert NoFunds();
        }

        // Checks-Effects-Interactions pattern to prevent re-entrancy
        // Effect: Clear the deposit amount for this campaign
        deposits[campaignId] = 0;

        // Interaction: Send the funds
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            // If transfer fails, revert the state change
            deposits[campaignId] = amount;
            revert TransferFailed();
        }

        emit Release(campaignId, recipient, amount);
    }

    // Fallback function to accept Ether directly.
    receive() external payable {}
}
