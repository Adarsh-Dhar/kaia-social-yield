# Award Coupon Function Usage Guide

This guide explains how to use the `awardCoupon` function from the CampaignManager contract to award coupons to connected wallets.

## Overview

The `awardCoupon` function allows the operator to award USDT coupons to users who complete missions or participate in campaigns. These coupons are minted as NFTs and can be redeemed for USDT.

## Contract Function

```solidity
function awardCoupon(
    address _user,           // User's wallet address
    bytes32 _campaignId,     // Campaign ID (0x...)
    uint256 _randomCouponValue // Coupon value in USDT (6 decimals)
) external
```

## Prerequisites

1. **Operator Role**: Only the operator address can call this function
2. **Active Campaign**: Campaign must exist and be active
3. **Sufficient Budget**: Campaign must have remaining budget
4. **Available Slots**: Campaign must not have reached max participants
5. **Valid Range**: Coupon value must be within campaign's min/max reward range
6. **NFT Contract**: Coupon NFT contract must be set

## Usage Examples

### 1. Using the React Hook (Recommended)

```typescript
import { useCampaignManager } from '@/hooks/use-campaign-manager';

function MyComponent() {
  const { awardCoupon, isLoading, error } = useCampaignManager();
  
  const handleAwardCoupon = async () => {
    const hash = await awardCoupon(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // user address
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', // campaign ID
      '10.50' // coupon value in USDT
    );
    
    if (hash) {
      console.log('Coupon awarded:', hash);
    }
  };
  
  return (
    <button onClick={handleAwardCoupon} disabled={isLoading}>
      Award Coupon
    </button>
  );
}
```

### 2. Using the Simplified Hook

```typescript
import { useAwardCoupon } from '@/hooks/use-award-coupon';

function MyComponent() {
  const { awardCoupon, isLoading, error, isConnected } = useAwardCoupon();
  
  const handleAwardCoupon = async () => {
    try {
      const hash = await awardCoupon({
        user: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        campaignId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        randomCouponValue: '10.50'
      });
      
      if (hash) {
        console.log('Coupon awarded:', hash);
      }
    } catch (err) {
      console.error('Failed to award coupon:', err);
    }
  };
  
  return (
    <button onClick={handleAwardCoupon} disabled={isLoading || !isConnected}>
      Award Coupon
    </button>
  );
}
```

### 3. Direct Service Usage

```typescript
import { createCampaignManagerService } from '@/lib/campaign_manager';
import { useWalletClient } from 'wagmi';

function MyComponent() {
  const { data: walletClient } = useWalletClient();
  
  const handleAwardCoupon = async () => {
    if (!walletClient) return;
    
    const service = await createCampaignManagerService(walletClient);
    const hash = await service.awardCoupon(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // user address
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', // campaign ID
      '10.50' // coupon value in USDT
    );
    
    console.log('Coupon awarded:', hash);
  };
  
  return (
    <button onClick={handleAwardCoupon}>
      Award Coupon
    </button>
  );
}
```

### 4. Backend API Integration

```typescript
// POST /api/missions/award-coupon
const response = await fetch('/api/missions/award-coupon', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    missionId: 'mission-123',
    campaignId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    couponValue: '10.50'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Coupon awarded:', result.txHash);
}
```

## Error Handling

The function can throw several types of errors:

### Contract Errors

- **NotOperator**: Only the operator can award coupons
- **CampaignInactiveOrFull**: Campaign is inactive or has reached max participants
- **ValueOutOfBounds**: Coupon value is outside the campaign's reward range
- **NftContractNotSet**: Coupon NFT contract is not set
- **InvalidAmount**: Invalid amount provided

### JavaScript Errors

- **Wallet not connected**: User must connect their wallet
- **Invalid parameters**: Missing or invalid parameters
- **Transaction failed**: Blockchain transaction failed
- **Network error**: RPC connection issues

### Example Error Handling

```typescript
try {
  const hash = await awardCoupon(user, campaignId, couponValue);
  console.log('Success:', hash);
} catch (error) {
  if (error instanceof NotOperatorError) {
    console.error('Only operator can award coupons');
  } else if (error instanceof CampaignInactiveOrFullError) {
    console.error('Campaign is inactive or full');
  } else if (error instanceof ValueOutOfBoundsError) {
    console.error('Coupon value is out of bounds');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## UI Components

### AwardCouponDemo Component

A complete demo component that shows how to use the awardCoupon function:

```typescript
import { AwardCouponDemo } from '@/components/award-coupon-demo';

function MyPage() {
  return (
    <div>
      <h1>Award Coupon Demo</h1>
      <AwardCouponDemo campaignId="0x1234..." />
    </div>
  );
}
```

### MissionCompletionWithCoupon Component

A component that integrates mission completion with coupon awarding:

```typescript
import { MissionCompletionWithCoupon } from '@/components/mission-completion-with-coupon';

function MissionPage() {
  const mission = {
    id: 'mission-123',
    title: 'Follow on Twitter',
    type: 'FOLLOW',
    description: 'Follow our Twitter account',
    boostMultiplier: 1.5,
    boostDuration: 24,
    targetCompletions: 100,
    completions: 45,
    status: 'PENDING'
  };

  return (
    <MissionCompletionWithCoupon
      mission={mission}
      campaignId="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12"
      onComplete={(missionId, txHash) => {
        console.log('Mission completed:', missionId, txHash);
      }}
    />
  );
}
```

## Integration with Mission System

The awardCoupon function is designed to integrate with the existing mission system:

1. **User completes mission** → Backend validates completion
2. **Backend calls awardCoupon** → Coupon is minted to user's wallet
3. **User sees coupon** → Coupon appears in user's dashboard
4. **User redeems coupon** → Coupon is burned, USDT is transferred

## Best Practices

1. **Validate Parameters**: Always validate user address and campaign ID format
2. **Handle Errors Gracefully**: Provide clear error messages to users
3. **Check Wallet Connection**: Ensure wallet is connected before calling
4. **Verify Operator Role**: Only the operator should call this function
5. **Monitor Campaign Status**: Check if campaign is active and has budget
6. **Generate Random Values**: Use secure random number generation for coupon values
7. **Log Transactions**: Keep track of all coupon awards for auditing

## Testing

### Local Testing

1. Deploy contracts to local network
2. Set up test accounts with USDT
3. Create test campaigns
4. Test awardCoupon function with various parameters

### Testnet Testing

1. Deploy to Kairos Testnet
2. Use test USDT tokens
3. Test with real wallet connections
4. Verify coupon minting and redemption

## Security Considerations

1. **Operator Key Management**: Store operator private key securely
2. **Input Validation**: Validate all inputs on both frontend and backend
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Audit Logging**: Log all coupon awards for security auditing
5. **Access Control**: Ensure only authorized users can trigger coupon awards

## Troubleshooting

### Common Issues

1. **"NotOperator" Error**: Check if connected wallet is the operator
2. **"CampaignInactiveOrFull" Error**: Verify campaign status and participant count
3. **"ValueOutOfBounds" Error**: Check if coupon value is within campaign range
4. **Transaction Fails**: Check gas fees and network connectivity
5. **Wallet Not Connected**: Ensure user has connected their wallet

### Debug Steps

1. Check wallet connection status
2. Verify campaign exists and is active
3. Check campaign budget and participant count
4. Validate coupon value is within range
5. Check operator permissions
6. Verify NFT contract is set

## API Reference

### useCampaignManager Hook

```typescript
const {
  awardCoupon,        // Function to award coupons
  isLoading,          // Loading state
  error,              // Error state
  clearError          // Clear error function
} = useCampaignManager();
```

### useAwardCoupon Hook

```typescript
const {
  awardCoupon,        // Function to award coupons
  isLoading,          // Loading state
  error,              // Error state
  clearError,         // Clear error function
  isConnected,        // Wallet connection status
  address             // Connected wallet address
} = useAwardCoupon();
```

### CampaignManagerService

```typescript
const service = await createCampaignManagerService(walletClient);
const hash = await service.awardCoupon(user, campaignId, couponValue);
```

## Examples

See the following files for complete examples:

- `components/award-coupon-demo.tsx` - Complete demo component
- `components/mission-completion-with-coupon.tsx` - Mission integration
- `app/award-coupon/page.tsx` - Demo page
- `app/api/missions/award-coupon/route.ts` - Backend API
- `hooks/use-award-coupon.ts` - Simplified hook
