# Smart Contract Integration

This document explains how the user dashboard has been updated to integrate with the new smart contracts: CampaignManager, CouponNFT, and MockUSDT.

## Overview

The dashboard now supports:
- **USDT Balance Display**: Shows both direct USDT balance and USDT from redeemed coupons
- **Coupon Management**: View owned coupons and redeem them for USDT
- **Real-time Updates**: Automatically refreshes data when transactions complete

## Smart Contracts

### 1. CampaignManager.sol
- Manages advertiser campaigns with randomized rewards
- Awards coupons to users who complete missions
- Handles coupon redemption for USDT

### 2. CouponNFT.sol
- Non-transferable (soulbound) ERC721 tokens representing gift cards
- Stores USDT value for each coupon
- Can only be minted/burned by the CampaignManager

### 3. MockUSDT.sol
- ERC20 token simulating USDT on testnet
- Used for campaign funding and coupon redemptions
- Has 6 decimals like real USDT

## Setup Instructions

### 1. Deploy Contracts
Deploy the contracts to Kairos Testnet and update the addresses in `lib/contract-addresses.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  CAMPAIGN_MANAGER: "0x...", // Your deployed CampaignManager address
  COUPON_NFT: "0x...",       // Your deployed CouponNFT address  
  MOCK_USDT: "0x...",        // Your deployed MockUSDT address
} as const
```

### 2. Configure Contract Relationships
After deployment, you need to configure the contracts:

1. **Set CouponNFT Manager**: Call `setCampaignManager()` on CouponNFT with CampaignManager address
2. **Set CouponNFT Contract**: Call `setCouponNftContract()` on CampaignManager with CouponNFT address
3. **Set Operator**: Call `setOperator()` on CampaignManager with your backend server address

### 3. Mint USDT for Testing
Use the `mint()` function on MockUSDT to create test tokens for users and advertisers.

## New Components

### useCouponNFT Hook
```typescript
const { 
  coupons,           // Array of owned coupons
  usdtBalance,       // USDT balance from redemptions
  redeemCoupon,      // Function to redeem a coupon
  formatUsdt,        // Format USDT amounts
  isLoading,         // Loading state
  error             // Error state
} = useCouponNFT()
```

### useMockUSDT Hook
```typescript
const { 
  balance,           // USDT balance
  transfer,          // Transfer USDT
  approve,           // Approve USDT spending
  mint,              // Mint new USDT (owner only)
  formatUsdt,        // Format USDT amounts
  isLoading,         // Loading state
  error             // Error state
} = useMockUSDT()
```

### CouponDisplay Component
A complete UI component that shows:
- USDT balance
- List of owned coupons with values
- Redeem buttons for each coupon
- Total coupon value summary

## Dashboard Updates

The user dashboard now includes:

1. **Enhanced Balance Display**: Shows both staked USDT and available USDT balance
2. **Coupon Section**: Displays all owned coupons with redemption functionality
3. **Real-time Updates**: Automatically refreshes when coupons are redeemed
4. **Error Handling**: Graceful fallbacks when contracts aren't deployed

## Usage Flow

1. **User completes mission** → Backend calls `awardCoupon()` on CampaignManager
2. **Coupon is minted** → CouponNFT contract mints a soulbound token to user
3. **User views dashboard** → Shows new coupon in the CouponDisplay component
4. **User redeems coupon** → Calls `redeemCoupon()` on CampaignManager
5. **USDT is transferred** → User receives USDT, coupon is burned
6. **Balance updates** → Dashboard shows updated USDT balance

## Error Handling

The integration includes comprehensive error handling:
- Contract not deployed warnings
- Network connectivity issues
- Transaction failures
- Insufficient balance errors

All errors are displayed to users with clear messages and retry options.

## Testing

To test the integration:

1. Deploy contracts to Kairos Testnet
2. Update contract addresses
3. Mint USDT tokens for testing
4. Create a test campaign
5. Award coupons to users
6. Test redemption flow

The dashboard will work seamlessly with both deployed contracts and fallback gracefully when contracts aren't available.
