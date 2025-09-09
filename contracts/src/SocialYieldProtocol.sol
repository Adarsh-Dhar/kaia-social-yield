// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
import "../lib/openzeppelin-contracts-upgradeable/contracts/token/ERC20/IERC20Upgradeable.sol";
import "../lib/openzeppelin-contracts-upgradeable/contracts/access/OwnableUpgradeable.sol";
import "../lib/openzeppelin-contracts-upgradeable/contracts/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title SocialYieldProtocol
 * @author Your Name
 * @notice A comprehensive DeFi protocol for a social yield dApp.
 * Users can stake USDT to earn a base yield. Advertisers can create
 * campaigns to fund "yield boosts" for users who complete off-chain missions.
 * A trusted operator (backend server) verifies mission completion and applies boosts.
 */
contract SocialYieldProtocol is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    // --- State Variables ---

    IERC20Upgradeable public usdtToken;

    // A trusted backend address that can apply yield boosts to users.
    // This is the "oracle" that connects off-chain actions to on-chain rewards.
    address public operator;

    // --- User Staking Data ---
    struct Staker {
        uint256 amountStaked;       // Amount of USDT the user has staked
        uint256 rewards;            // Accumulated rewards not yet claimed
        // Active Boost Details
        uint256 boostMultiplier;    // e.g., 200 for a 2.0x boost (200%)
        uint256 boostExpiresAt;     // Timestamp when the boost ends
    }
    mapping(address => Staker) public stakers;
    uint256 public totalStaked;

    // --- Advertiser Campaign Data ---
    struct Campaign {
        bytes32 id;
        address creator;
        uint256 budget;             // Total USDT deposited by the advertiser
        uint256 spent;              // Total USDT paid out as rewards from this campaign
        bool isActive;
    }
    mapping(bytes32 => Campaign) public campaigns;

    // --- Protocol Configuration ---
    // Base Annual Percentage Yield (APY) for all stakers, e.g., 500 = 5.00%
    uint256 public baseApyBps = 500; // 5% APY in basis points

    // --- Events ---
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event CampaignCreated(bytes32 indexed campaignId, address indexed creator, uint256 budget);
    event CampaignFunded(bytes32 indexed campaignId, uint256 amount);
    event YieldBoostApplied(address indexed user, bytes32 indexed campaignId, uint256 multiplier, uint256 duration);
    event OperatorChanged(address indexed newOperator);


    // --- Errors ---
    error NotOperator();
    error CampaignNotFound();
    error CampaignInactive();
    error InsufficientCampaignBudget();
    error NoStake();

    // --- Initializer ---
    function initialize(address _usdtTokenAddress, address _initialOwner, address _initialOperator) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();

        usdtToken = IERC20Upgradeable(_usdtTokenAddress);
        operator = _initialOperator;

        if (_initialOwner != address(0) && _initialOwner != _msgSender()) {
            _transferOwnership(_initialOwner);
        }
    }

    // =================================================================
    //                           USER FUNCTIONS
    // =================================================================

    /**
     * @notice Stakes USDT into the protocol to start earning yield.
     * User must first approve the contract to spend their USDT.
     */
    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0");
        
        // Before changing stake, calculate and credit any pending rewards
        _updateUserRewards(msg.sender);

        Staker storage user = stakers[msg.sender];
        user.amountStaked += _amount;
        totalStaked += _amount;

        // Pull USDT from the user's wallet to this contract
        bool success = usdtToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "USDT transfer failed");

        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Withdraws staked USDT from the protocol.
     */
    function withdraw(uint256 _amount) external nonReentrant {
        Staker storage user = stakers[msg.sender];
        require(_amount > 0, "Cannot withdraw 0");
        require(user.amountStaked >= _amount, "Withdraw amount exceeds stake");

        // Before changing stake, calculate and credit any pending rewards
        _updateUserRewards(msg.sender);
        
        user.amountStaked -= _amount;
        totalStaked -= _amount;

        // Send USDT from this contract back to the user
        bool success = usdtToken.transfer(msg.sender, _amount);
        require(success, "USDT transfer failed");

        emit Withdrawn(msg.sender, _amount);
    }
    
    /**
     * @notice Claims all pending rewards.
     * Rewards are paid from the advertiser campaign budgets if a boost is active,
     * otherwise they are placeholder rewards until a source is defined (e.g., protocol treasury).
     */
    function claimRewards() external nonReentrant {
        _updateUserRewards(msg.sender);
        
        Staker storage user = stakers[msg.sender];
        uint256 rewardAmount = user.rewards;
        require(rewardAmount > 0, "No rewards to claim");

        user.rewards = 0;
        
        // This is a simplification. In a real system, you'd track which campaign
        // is paying for the rewards. For the hackathon, we assume the contract's
        // balance from all campaigns is one big reward pool.
        require(usdtToken.balanceOf(address(this)) >= totalStaked + rewardAmount, "Protocol reward pool insufficient");

        bool success = usdtToken.transfer(msg.sender, rewardAmount);
        require(success, "Reward transfer failed");

        emit RewardsClaimed(msg.sender, rewardAmount);
    }

    // =================================================================
    //                        ADVERTISER FUNCTIONS
    // =================================================================
    
    /**
     * @notice Creates a new campaign to fund yield boosts.
     * The advertiser must first approve the contract to spend their USDT for the budget.
     */
    function createCampaign(uint256 _budget) external nonReentrant returns (bytes32) {
        require(_budget > 0, "Budget must be greater than 0");

        bytes32 campaignId = keccak256(abi.encodePacked(block.timestamp, msg.sender, block.number));
        
        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: msg.sender,
            budget: _budget,
            spent: 0,
            isActive: true
        });

        // Pull the budget from the advertiser into this contract
        bool success = usdtToken.transferFrom(msg.sender, address(this), _budget);
        require(success, "USDT transfer for budget failed");

        emit CampaignCreated(campaignId, msg.sender, _budget);
        return campaignId;
    }

    // =================================================================
    //                     OPERATOR/BACKEND FUNCTIONS
    // =================================================================
    
    /**
     * @notice Called by the trusted backend operator to apply a yield boost to a user.
     * This is the function that links an off-chain action to an on-chain reward.
     */
    function applyYieldBoost(address _user, bytes32 _campaignId, uint256 _boostMultiplier, uint256 _durationSeconds) external {
        if (msg.sender != operator) revert NotOperator();

        Staker storage user = stakers[_user];
        if(user.amountStaked == 0) revert NoStake();

        Campaign storage campaign = campaigns[_campaignId];
        if (campaign.id == bytes32(0)) revert CampaignNotFound();
        if (!campaign.isActive) revert CampaignInactive();
        
        // Before applying a new boost, update and credit existing rewards
        _updateUserRewards(_user);

        user.boostMultiplier = _boostMultiplier;
        user.boostExpiresAt = block.timestamp + _durationSeconds;

        emit YieldBoostApplied(_user, _campaignId, _boostMultiplier, _durationSeconds);
    }
    
    // =================================================================
    //                      INTERNAL & VIEW FUNCTIONS
    // =================================================================
    
    /**
     * @notice Calculates the total rewards a user has earned since their last interaction.
     * THIS IS A SIMPLIFIED REWARD CALCULATION FOR HACKATHON PURPOSES.
     */
    function _updateUserRewards(address _user) internal {
        // In a real production system, you would store `lastUpdateTime` for each user
        // and calculate rewards based on the time delta. This is a simplification.
        // For the hackathon, this function is a placeholder for a more complex calculation.
        // We can simulate rewards being added when a boost is applied.
        
        // Example logic: Let's say we credit a small reward upon boost application
        // to simulate earnings.
        Staker storage user = stakers[_user];
        if (user.boostMultiplier > 0 && block.timestamp < user.boostExpiresAt) {
            // Simulate that 1% of their stake is earned as a reward instantly on update.
            uint256 simulatedReward = (user.amountStaked * 1) / 100;

            // This logic is complex. For now, we'll just add to rewards.
            // A real system needs to debit the correct campaign budget.
            user.rewards += simulatedReward;
        }
    }

    // =================================================================
    //                      ADMIN FUNCTIONS
    // =================================================================
    
    function setOperator(address _newOperator) external onlyOwner {
        operator = _newOperator;
        emit OperatorChanged(_newOperator);
    }
}
