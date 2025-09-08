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

    /// @notice Structure to store campaign information
    struct Campaign {
        bytes32 id;
        address creator;
        uint256 totalFunding;
        bool isActive;
        uint256 createdAt;
    }

    /// @notice Mapping from a campaign's unique ID to the total amount deposited.
    mapping(bytes32 => uint256) public deposits;

    /// @notice Mapping from campaign ID to campaign information
    mapping(bytes32 => Campaign) public campaigns;

    /// @notice Counter for generating unique campaign IDs
    uint256 private campaignCounter;

    // --- Events ---
    event Deposit(bytes32 indexed campaignId, address indexed depositor, uint256 amount);
    event Release(bytes32 indexed campaignId, address indexed recipient, uint256 amount);
    event CampaignCreated(bytes32 indexed campaignId, address indexed creator, uint256 initialFunding);
    event FundsAdded(bytes32 indexed campaignId, address indexed contributor, uint256 amount, uint256 newTotal);

    // --- Errors ---
    error NotOwner();
    error NoFunds();
    error TransferFailed();
    error CampaignNotFound();
    error CampaignInactive();
    error InvalidAmount();

    /// @notice Sets the contract deployer as the owner.
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Creates a new campaign with initial funding.
     * @param initialFunding The amount of Ether to fund the campaign with initially.
     * @return campaignId The unique identifier for the created campaign.
     */
    function createCampaign(uint256 initialFunding) external payable returns (bytes32) {
        if (msg.value != initialFunding) {
            revert InvalidAmount();
        }
        if (initialFunding == 0) {
            revert InvalidAmount();
        }

        // Generate unique campaign ID
        bytes32 campaignId = keccak256(abi.encodePacked(block.timestamp, msg.sender, campaignCounter));
        campaignCounter++;

        // Create the campaign
        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: msg.sender,
            totalFunding: initialFunding,
            isActive: true,
            createdAt: block.timestamp
        });

        // Update the deposits mapping for backward compatibility
        deposits[campaignId] = initialFunding;

        emit CampaignCreated(campaignId, msg.sender, initialFunding);
        
        return campaignId;
    }

    /**
     * @notice Adds additional funds to an existing campaign.
     * @param campaignId The unique identifier for the campaign.
     * @param amount The amount of Ether to add to the campaign.
     */
    function addFunds(bytes32 campaignId, uint256 amount) external payable {
        if (msg.value != amount) {
            revert InvalidAmount();
        }
        if (amount == 0) {
            revert InvalidAmount();
        }

        Campaign storage campaign = campaigns[campaignId];
        if (campaign.id == bytes32(0)) {
            revert CampaignNotFound();
        }
        if (!campaign.isActive) {
            revert CampaignInactive();
        }

        // Update campaign funding
        campaign.totalFunding += amount;
        
        // Update the deposits mapping for backward compatibility
        deposits[campaignId] += amount;

        emit FundsAdded(campaignId, msg.sender, amount, campaign.totalFunding);
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
     * @notice Gets campaign information by campaign ID.
     * @param campaignId The unique identifier for the campaign.
     * @return campaign The campaign information.
     */
    function getCampaign(bytes32 campaignId) external view returns (Campaign memory) {
        Campaign memory campaign = campaigns[campaignId];
        if (campaign.id == bytes32(0)) {
            revert CampaignNotFound();
        }
        return campaign;
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

        // If this is a campaign, also update the campaign status
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.id != bytes32(0)) {
            campaign.isActive = false;
        }

        // Interaction: Send the funds
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            // If transfer fails, revert the state change
            deposits[campaignId] = amount;
            if (campaign.id != bytes32(0)) {
                campaign.isActive = true;
            }
            revert TransferFailed();
        }

        emit Release(campaignId, recipient, amount);
    }

    // Fallback function to accept Ether directly.
    receive() external payable {}
}
