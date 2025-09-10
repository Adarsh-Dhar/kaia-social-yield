# CampaignManager Contract Integration

This directory contains all the necessary functions and hooks to interact with the CampaignManager smart contract in your UI.

## Overview

The CampaignManager contract allows:
- **Advertisers** to create campaigns with randomized rewards
- **Operators** to award coupons to users who complete missions
- **Users** to redeem coupon NFTs for USDT rewards
- **Admins** to manage the contract settings

## Architecture

### Contract Relationship
- `@campaign_manager/` → `CampaignManager.sol` - Main campaign management contract
- `@coupon_nft/` → `CouponNFT.sol` - Soulbound NFT contract for coupons
- `@escrow/` → `CampaignEscrow.sol` - Simple escrow for campaign funding
- `@social/` → `SocialYieldProtocol.sol` - Full DeFi protocol with staking and yield boosts

### Key Features
- **Campaign Creation**: Advertisers create campaigns with budget and reward ranges
- **Coupon Awarding**: Trusted operator awards coupons to users
- **Coupon Redemption**: Users redeem soulbound NFTs for USDT
- **Randomized Rewards**: Off-chain randomness with on-chain validation
- **Budget Management**: Automatic campaign deactivation when budget is exhausted

## Files

- `index.ts` - Core contract interaction functions and types
- `abi.ts` - Contract ABI for CampaignManager
- `address.ts` - Contract address configuration
- `hooks/use-campaign-manager.ts` - Main React hook for contract interactions
- `hooks/use-campaigns.ts` - Specialized hook for campaign management
- `hooks/use-coupons.ts` - Specialized hook for coupon operations

## Setup

### Contract Configuration

The contract is configured with:
- **Contract Address**: `0x0000000000000000000000000000000000000000` (placeholder - update after deployment)
- **ABI**: Automatically imported from `lib/campaign_manager/abi.ts`
- **USDT Token**: Must be configured during contract initialization
- **Coupon NFT**: Must be set after CouponNFT contract deployment

### Environment Variables (Optional)

If you need to override the contract address or chain configuration, add these to your `.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=sonicBlazeTestnet # or sepolia
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key # for sepolia
```

## Usage

### Basic Hook Usage

```tsx
import { useCampaignManager } from '@/hooks/use-campaign-manager'

function MyComponent() {
  const {
    isLoading,
    error,
    getCampaign,
    createCampaign,
    redeemCoupon,
    formatUsdt
  } = useCampaignManager()

  const handleCreateCampaign = async () => {
    const txHash = await createCampaign(
      '1000.0',    // budget: 1000 USDT
      '100',       // maxParticipants: 100
      '1.0',       // minReward: 1 USDT
      '50.0',      // maxReward: 50 USDT
      'https://example.com/nft-metadata.json'
    )
    if (txHash) {
      console.log('Campaign created:', txHash)
    }
  }

  const handleRedeemCoupon = async (tokenId: string) => {
    const txHash = await redeemCoupon(tokenId)
    if (txHash) {
      console.log('Coupon redeemed:', txHash)
    }
  }

  return (
    <div>
      <button onClick={handleCreateCampaign} disabled={isLoading}>
        Create Campaign
      </button>
      <button onClick={() => handleRedeemCoupon('1')} disabled={isLoading}>
        Redeem Coupon #1
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

### Campaign Management Hook

```tsx
import { useCampaigns } from '@/hooks/use-campaigns'

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
  } = useCampaigns()

  const handleCreateCampaign = async () => {
    const txHash = await createCampaign({
      budget: '1000.0',
      maxParticipants: '100',
      minReward: '1.0',
      maxReward: '50.0',
      nftTokenURI: 'https://example.com/nft-metadata.json'
    })
    if (txHash) {
      console.log('Campaign created:', txHash)
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
                    <p className="text-gray-600">Participants</p>
                    <p className="font-medium">{campaign.participantsCount}/{campaign.maxParticipants}</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Reward Range</p>
                    <p className="font-medium">{campaign.formattedMinReward} - {campaign.formattedMaxReward} USDT</p>
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

### Coupon Management Hook

```tsx
import { useCoupons } from '@/hooks/use-coupons'

function CouponComponent() {
  const {
    userCoupons,
    getFormattedCoupons,
    redeemCoupon,
    isLoading,
    error
  } = useCoupons()

  const handleRedeemCoupon = async (tokenId: string) => {
    const txHash = await redeemCoupon(tokenId)
    if (txHash) {
      console.log('Coupon redeemed successfully')
    }
  }

  const formattedCoupons = getFormattedCoupons()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">My Coupons</h3>
      {formattedCoupons.length === 0 ? (
        <p className="text-gray-500">No coupons available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formattedCoupons.map((coupon) => (
            <div key={coupon.tokenId} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">Coupon #{coupon.tokenId}</h4>
                <span className="text-sm text-gray-500">#{coupon.tokenId}</span>
              </div>
              <div className="mb-4">
                <p className="text-2xl font-bold text-green-600">
                  {coupon.formattedValue} USDT
                </p>
                <p className="text-sm text-gray-600">Value</p>
              </div>
              <button
                onClick={() => handleRedeemCoupon(coupon.tokenId)}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Redeem Coupon
              </button>
            </div>
          ))}
        </div>
      )}

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
import { useCampaignManager } from '@/hooks/use-campaign-manager'

function OperatorComponent() {
  const {
    awardCoupon,
    setOperator,
    getOperator,
    isLoading,
    error
  } = useCampaignManager()

  const handleAwardCoupon = async (
    user: Address,
    campaignId: `0x${string}`,
    value: string
  ) => {
    const txHash = await awardCoupon(user, campaignId, value)
    if (txHash) {
      console.log('Coupon awarded:', txHash)
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
        onClick={() => handleAwardCoupon(
          '0x...', // user address
          '0x...', // campaign ID
          '25.0'   // 25 USDT value
        )}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Award 25 USDT Coupon
      </button>
      
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}
```

## API Reference

### useCampaignManager Hook

#### State
- `isLoading: boolean` - Whether any operation is in progress
- `error: string | null` - Current error message
- `clearError: () => void` - Clear the current error

#### Read Functions
- `getCampaign(campaignId: string): Promise<Campaign | null>` - Get campaign details
- `getUsdtTokenAddress(): Promise<Address | null>` - Get USDT token address
- `getCouponNftContract(): Promise<Address | null>` - Get Coupon NFT contract address
- `getOperator(): Promise<Address | null>` - Get operator address
- `getOwner(): Promise<Address | null>` - Get contract owner

#### Write Functions
- `createCampaign(budget, maxParticipants, minReward, maxReward, nftTokenURI): Promise<Hash | null>` - Create new campaign
- `awardCoupon(user, campaignId, value): Promise<Hash | null>` - Award coupon (operator only)
- `redeemCoupon(tokenId): Promise<Hash | null>` - Redeem coupon for USDT
- `setOperator(newOperator): Promise<Hash | null>` - Set new operator (owner only)
- `setCouponNftContract(nftAddress): Promise<Hash | null>` - Set Coupon NFT contract (owner only)

#### Utility Functions
- `formatUsdt(amount: bigint): string` - Convert USDT amount to string
- `parseUsdt(amount: string): bigint` - Convert USDT string to bigint
- `formatEther(wei: bigint): string` - Convert wei to ETH string
- `parseEther(ether: string): bigint` - Convert ETH string to wei

### Campaign Type

```typescript
interface Campaign {
  creator: Address           // Creator address
  totalBudget: bigint       // Total budget in USDT
  spent: bigint            // Amount spent from budget
  maxParticipants: bigint   // Maximum number of participants
  participantsCount: bigint // Current number of participants
  minReward: bigint        // Minimum reward per coupon
  maxReward: bigint        // Maximum reward per coupon
  isActive: boolean        // Whether campaign is active
  nftTokenURI: string      // NFT metadata URI
}
```

### Error Handling

The hooks provide comprehensive error handling with specific error types:

```typescript
import { 
  CampaignManagerError,
  NotOperatorError,
  CampaignNotFoundError,
  CampaignInactiveOrFullError,
  NftContractNotSetError,
  NotCouponOwnerError,
  InvalidAmountError,
  InvalidRewardRangeError,
  ValueOutOfBoundsError
} from '@/lib/campaign_manager'

// Error type guards
if (error instanceof NotOperatorError) {
  // Handle operator-only action
} else if (error instanceof CampaignNotFoundError) {
  // Handle campaign not found
} else if (error instanceof NotCouponOwnerError) {
  // Handle user doesn't own coupon
}
```

## Best Practices

1. **Always check wallet connection** before calling write functions
2. **Handle errors gracefully** and provide user feedback
3. **Use loading states** to improve UX
4. **Refresh data** after successful write operations
5. **Validate inputs** before calling contract functions
6. **Check user permissions** before operator functions
7. **Format amounts** using the provided utility functions
8. **Verify campaign status** before awarding coupons

## Troubleshooting

### Common Issues

1. **"Wallet client required" error**: Make sure the user has connected their wallet
2. **"Invalid amount" error**: Check that the amount is a valid number and greater than 0
3. **"NotOperator" error**: Only the operator can award coupons
4. **"Campaign not found" error**: Verify the campaign ID is correct
5. **"NotCouponOwner" error**: User must own the coupon to redeem it
6. **"USDT transfer failed" error**: Check USDT balance and approval
7. **"ValueOutOfBounds" error**: Coupon value must be within campaign's min/max range

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed error information in the console.

## Contract ABI

The contract ABI is automatically included and exported from `@/lib/campaign_manager`. You can use it directly with viem if needed:

```typescript
import { CAMPAIGN_MANAGER_ABI_EXPORT } from '@/lib/campaign_manager'
```
