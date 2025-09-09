# SocialYieldProtocol Contract Integration

This directory contains all the necessary functions and hooks to interact with the SocialYieldProtocol smart contract in your UI.

## Overview

The SocialYieldProtocol contract is a comprehensive DeFi protocol that allows:
- **Users** to stake USDT and earn yield
- **Advertisers** to create campaigns that fund yield boosts
- **Operators** to apply yield boosts to users who complete off-chain missions
- **Protocol** to manage base APY and reward distribution

## Architecture

### Contract Relationship
- `@escrow/` → `CampaignEscrow.sol` - Simple escrow for campaign funding
- `@social/` → `SocialYieldProtocol.sol` - Full DeFi protocol with staking and yield boosts

### Key Features
- **USDT Staking**: Users stake USDT to earn base yield (5% APY)
- **Yield Boosts**: Advertisers can fund campaigns to boost user yields
- **Mission Integration**: Off-chain missions trigger on-chain yield boosts
- **Operator System**: Trusted backend can apply boosts to users

## Files

- `index.ts` - Core contract interaction functions and types
- `abi.ts` - Contract ABI for SocialYieldProtocol
- `address.ts` - Contract address configuration
- `hooks/use-social-yield-protocol.ts` - Main React hook for contract interactions
- `hooks/use-staking.ts` - Specialized hook for staking operations
- `hooks/use-campaigns-social.ts` - Specialized hook for campaign management

## Setup

### Contract Configuration

The contract is configured with:
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3` (from `lib/social/address.ts`)
- **ABI**: Automatically imported from `lib/social/abi.ts`
- **USDT Token**: Must be configured during contract initialization

### Environment Variables (Optional)

If you need to override the contract address or chain configuration, add these to your `.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=sonicBlazeTestnet # or sepolia
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key # for sepolia
```

## Usage

### Basic Hook Usage

```tsx
import { useSocialYieldProtocol } from '@/hooks/use-social-yield-protocol'

function MyComponent() {
  const {
    isLoading,
    error,
    getStaker,
    stake,
    createCampaign,
    formatUsdt
  } = useSocialYieldProtocol()

  const handleStake = async () => {
    const txHash = await stake('100.0') // 100 USDT
    if (txHash) {
      console.log('Staked:', txHash)
    }
  }

  const handleCreateCampaign = async () => {
    const txHash = await createCampaign('1000.0') // 1000 USDT budget
    if (txHash) {
      console.log('Campaign created:', txHash)
    }
  }

  return (
    <div>
      <button onClick={handleStake} disabled={isLoading}>
        Stake 100 USDT
      </button>
      <button onClick={handleCreateCampaign} disabled={isLoading}>
        Create Campaign
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

### Staking Hook

```tsx
import { useStaking } from '@/hooks/use-staking'

function StakingComponent() {
  const {
    stakerData,
    totalStaked,
    baseApyBps,
    hasStake,
    hasRewards,
    hasActiveBoost,
    formattedAmountStaked,
    formattedRewards,
    formattedBaseApy,
    stake,
    withdraw,
    claimRewards,
    isLoading,
    error
  } = useStaking()

  const handleStake = async () => {
    const txHash = await stake('100.0')
    if (txHash) {
      console.log('Staked successfully')
    }
  }

  const handleWithdraw = async () => {
    const txHash = await withdraw('50.0')
    if (txHash) {
      console.log('Withdrawn successfully')
    }
  }

  const handleClaimRewards = async () => {
    const txHash = await claimRewards()
    if (txHash) {
      console.log('Rewards claimed successfully')
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Your Staking Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Amount Staked</p>
            <p className="text-xl font-bold">{formattedAmountStaked} USDT</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pending Rewards</p>
            <p className="text-xl font-bold">{formattedRewards} USDT</p>
          </div>
        </div>
        
        {hasActiveBoost && (
          <div className="mt-4 p-3 bg-green-100 rounded">
            <p className="text-green-800 font-medium">🎉 Active Yield Boost!</p>
          </div>
        )}

        <div className="mt-4 space-x-2">
          <button 
            onClick={handleStake} 
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Stake
          </button>
          {hasStake && (
            <button 
              onClick={handleWithdraw} 
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Withdraw
            </button>
          )}
          {hasRewards && (
            <button 
              onClick={handleClaimRewards} 
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Claim Rewards
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Protocol Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Staked</p>
            <p className="text-xl font-bold">{totalStaked ? formatUsdt(totalStaked) : '0'} USDT</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Base APY</p>
            <p className="text-xl font-bold">{formattedBaseApy}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
```

### Campaign Management Hook

```tsx
import { useCampaignsSocial } from '@/hooks/use-campaigns-social'

function CampaignComponent() {
  const {
    campaigns,
    activeCampaigns,
    myCampaigns,
    getFormattedCampaigns,
    getFormattedMyCampaigns,
    createCampaign,
    loadCampaign,
    isLoading,
    error
  } = useCampaignsSocial()

  const handleCreateCampaign = async () => {
    const txHash = await createCampaign('1000.0')
    if (txHash) {
      console.log('Campaign created:', txHash)
      // Optionally load the new campaign
      // await loadCampaign(campaignId)
    }
  }

  const formattedCampaigns = getFormattedCampaigns()
  const formattedMyCampaigns = getFormattedMyCampaigns()

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Create Campaign</h3>
        <button 
          onClick={handleCreateCampaign} 
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Create Campaign (1000 USDT)
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">My Campaigns</h3>
        {formattedMyCampaigns.length === 0 ? (
          <p className="text-gray-500">No campaigns created yet</p>
        ) : (
          <div className="space-y-4">
            {formattedMyCampaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">Campaign {campaign.id.slice(0, 8)}...</h4>
                    <p className="text-sm text-gray-600">Creator: {campaign.creator}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {campaign.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Budget</p>
                    <p className="font-medium">{campaign.formattedBudget} USDT</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Spent</p>
                    <p className="font-medium">{campaign.formattedSpent} USDT</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Utilization</p>
                    <p className="font-medium">{campaign.budgetUtilization.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
```

### Operator Functions

```tsx
import { useSocialYieldProtocol } from '@/hooks/use-social-yield-protocol'

function OperatorComponent() {
  const {
    applyYieldBoost,
    setOperator,
    getOperator,
    isLoading,
    error
  } = useSocialYieldProtocol()

  const handleApplyBoost = async (
    user: Address,
    campaignId: `0x${string}`,
    multiplier: number,
    duration: number
  ) => {
    const txHash = await applyYieldBoost(user, campaignId, multiplier, duration)
    if (txHash) {
      console.log('Boost applied:', txHash)
    }
  }

  const handleSetOperator = async (newOperator: Address) => {
    const txHash = await setOperator(newOperator)
    if (txHash) {
      console.log('Operator updated:', txHash)
    }
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={() => handleApplyBoost(
          '0x...', // user address
          '0x...', // campaign ID
          200,     // 2x multiplier
          3600     // 1 hour duration
        )}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Apply 2x Boost
      </button>
      
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}
```

## API Reference

### useSocialYieldProtocol Hook

#### State
- `isLoading: boolean` - Whether any operation is in progress
- `error: string | null` - Current error message
- `clearError: () => void` - Clear the current error

#### Read Functions
- `getStaker(userAddress: Address): Promise<Staker | null>` - Get user staking data
- `getCampaign(campaignId: string): Promise<Campaign | null>` - Get campaign details
- `getTotalStaked(): Promise<bigint | null>` - Get total protocol staked amount
- `getBaseApyBps(): Promise<bigint | null>` - Get base APY in basis points
- `getUsdtTokenAddress(): Promise<Address | null>` - Get USDT token address
- `getOperator(): Promise<Address | null>` - Get operator address
- `getOwner(): Promise<Address | null>` - Get contract owner

#### Write Functions
- `stake(amount: string): Promise<Hash | null>` - Stake USDT
- `withdraw(amount: string): Promise<Hash | null>` - Withdraw staked USDT
- `claimRewards(): Promise<Hash | null>` - Claim pending rewards
- `createCampaign(budget: string): Promise<Hash | null>` - Create new campaign
- `applyYieldBoost(user, campaignId, multiplier, duration): Promise<Hash | null>` - Apply yield boost (operator only)
- `setOperator(newOperator: Address): Promise<Hash | null>` - Set new operator (owner only)

#### Utility Functions
- `formatUsdt(amount: bigint): string` - Convert USDT amount to string
- `parseUsdt(amount: string): bigint` - Convert USDT string to bigint
- `formatEther(wei: bigint): string` - Convert wei to ETH string
- `parseEther(ether: string): bigint` - Convert ETH string to wei

### useStaking Hook

Specialized hook for staking operations with additional state management:

#### State
- `stakerData: Staker | null` - Current user's staking data
- `totalStaked: bigint | null` - Total protocol staked amount
- `baseApyBps: bigint | null` - Base APY in basis points
- `hasStake: boolean` - Whether user has any stake
- `hasRewards: boolean` - Whether user has pending rewards
- `hasActiveBoost: boolean` - Whether user has an active yield boost

#### Actions
- `loadData()` - Load all staking data
- `stake(amount: string)` - Stake USDT with auto-refresh
- `withdraw(amount: string)` - Withdraw USDT with auto-refresh
- `claimRewards()` - Claim rewards with auto-refresh

### useCampaignsSocial Hook

Specialized hook for campaign management:

#### State
- `campaigns: Campaign[]` - All loaded campaigns
- `activeCampaigns: Campaign[]` - Only active campaigns
- `myCampaigns: Campaign[]` - Current user's campaigns

#### Actions
- `loadCampaign(campaignId)` - Load specific campaign
- `createCampaign(budget)` - Create new campaign
- `applyYieldBoost(user, campaignId, multiplier, duration)` - Apply yield boost

#### Formatted Data
- `getFormattedCampaigns()` - All campaigns with formatted values
- `getFormattedActiveCampaigns()` - Active campaigns with formatted values
- `getFormattedMyCampaigns()` - User's campaigns with formatted values

## Types

### Staker
```typescript
interface Staker {
  amountStaked: bigint      // Amount of USDT staked
  rewards: bigint           // Pending rewards
  boostMultiplier: bigint   // Current boost multiplier (e.g., 200 for 2x)
  boostExpiresAt: bigint    // Timestamp when boost expires
}
```

### Campaign
```typescript
interface Campaign {
  id: `0x${string}`         // Campaign ID
  creator: Address          // Creator address
  budget: bigint            // Total budget in USDT
  spent: bigint             // Amount spent from budget
  isActive: boolean         // Whether campaign is active
}
```

## Error Handling

The hooks provide comprehensive error handling with specific error types:

```typescript
import { 
  SocialProtocolError,
  NotOperatorError,
  CampaignNotFoundError,
  CampaignInactiveError,
  InsufficientCampaignBudgetError,
  NoStakeError,
  InsufficientFundsError,
  InvalidAmountError
} from '@/lib/social'

// Error type guards
if (error instanceof NotOperatorError) {
  // Handle operator-only action
} else if (error instanceof CampaignNotFoundError) {
  // Handle campaign not found
} else if (error instanceof NoStakeError) {
  // Handle user has no stake
}
```

## Best Practices

1. **Always check wallet connection** before calling write functions
2. **Handle errors gracefully** and provide user feedback
3. **Use loading states** to improve UX
4. **Refresh data** after successful write operations
5. **Validate inputs** before calling contract functions
6. **Use specialized hooks** for better state management
7. **Format amounts** using the provided utility functions
8. **Check user permissions** before operator functions

## Troubleshooting

### Common Issues

1. **"Wallet client required" error**: Make sure the user has connected their wallet
2. **"Invalid amount" error**: Check that the amount is a valid number and greater than 0
3. **"NotOperator" error**: Only the operator can apply yield boosts
4. **"NoStake" error**: User must have a stake to receive boosts
5. **"Campaign not found" error**: Verify the campaign ID is correct
6. **"USDT transfer failed" error**: Check USDT balance and approval

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed error information in the console.

## Contract ABI

The contract ABI is automatically included and exported from `@/lib/social`. You can use it directly with viem if needed:

```typescript
import { SOCIAL_YIELD_PROTOCOL_ABI } from '@/lib/social'
```
