# CouponNFT Contract Integration

This directory contains all the necessary functions and hooks to interact with the CouponNFT smart contract in your UI.

## Overview

The CouponNFT contract is a soulbound (non-transferable) ERC721 token that represents gift cards with specific USDT values. It allows:
- **Campaign Manager** to mint and burn coupon NFTs
- **Users** to view their coupon NFTs and their values
- **Admins** to manage the contract settings

## Architecture

### Contract Relationship
- `@coupon_nft/` → `CouponNFT.sol` - Soulbound NFT contract for coupons
- `@campaign_manager/` → `CampaignManager.sol` - Main campaign management contract
- `@escrow/` → `CampaignEscrow.sol` - Simple escrow for campaign funding
- `@social/` → `SocialYieldProtocol.sol` - Full DeFi protocol with staking and yield boosts

### Key Features
- **Soulbound NFTs**: Non-transferable tokens that represent gift cards
- **Value Storage**: Each NFT stores a specific USDT value
- **Manager Control**: Only the CampaignManager can mint/burn tokens
- **Metadata Support**: Each token has a unique metadata URI
- **Soulbound Mechanism**: Prevents all transfers except minting and burning

## Files

- `index.ts` - Core contract interaction functions and types
- `abi.ts` - Contract ABI for CouponNFT
- `address.ts` - Contract address configuration
- `hooks/use-coupon-nft.ts` - Main React hook for contract interactions
- `hooks/use-coupons.ts` - Specialized hook for coupon management

## Setup

### Contract Configuration

The contract is configured with:
- **Contract Address**: `0x0000000000000000000000000000000000000000` (placeholder - update after deployment)
- **ABI**: Automatically imported from `lib/coupon_nft/abi.ts`
- **Campaign Manager**: Must be set after CampaignManager contract deployment

### Environment Variables (Optional)

If you need to override the contract address or chain configuration, add these to your `.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=sonicBlazeTestnet # or sepolia
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key # for sepolia
```

## Usage

### Basic Hook Usage

```tsx
import { useCouponNft } from '@/hooks/use-coupon-nft'

function MyComponent() {
  const {
    isLoading,
    error,
    getCouponValue,
    getBalanceOf,
    getUserCoupons,
    formatUsdt
  } = useCouponNft()

  const handleGetCouponValue = async (tokenId: string) => {
    const value = await getCouponValue(BigInt(tokenId))
    if (value) {
      console.log('Coupon value:', formatUsdt(value))
    }
  }

  const handleGetUserCoupons = async (userAddress: Address) => {
    const coupons = await getUserCoupons(userAddress)
    console.log('User coupons:', coupons)
  }

  return (
    <div>
      <button onClick={() => handleGetCouponValue('1')} disabled={isLoading}>
        Get Coupon #1 Value
      </button>
      <button onClick={() => handleGetUserCoupons('0x...')} disabled={isLoading}>
        Get User Coupons
      </button>
      {error && <p>Error: {error}</p>}
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
    totalSupply,
    getFormattedCoupons,
    loadUserCoupons,
    isLoading,
    error
  } = useCoupons()

  const handleLoadCoupons = async () => {
    await loadUserCoupons()
  }

  const formattedCoupons = getFormattedCoupons()

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">My Coupons</h3>
        <button 
          onClick={handleLoadCoupons} 
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Load My Coupons
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Coupon Collection</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Total Supply</p>
          <p className="text-xl font-bold">{totalSupply?.toString() || '0'} Coupons</p>
        </div>
        
        {formattedCoupons.length === 0 ? (
          <p className="text-gray-500">No coupons available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formattedCoupons.map((coupon) => (
              <div key={coupon.tokenId.toString()} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">Coupon #{coupon.tokenId.toString()}</h4>
                  <span className="text-sm text-gray-500">#{coupon.tokenId.toString()}</span>
                </div>
                <div className="mb-4">
                  <p className="text-2xl font-bold text-green-600">
                    {coupon.formattedValue} USDT
                  </p>
                  <p className="text-sm text-gray-600">Value</p>
                </div>
                <div className="text-xs text-gray-500">
                  <p>Owner: {coupon.owner.slice(0, 6)}...{coupon.owner.slice(-4)}</p>
                  <p>Token URI: {coupon.tokenURI.slice(0, 30)}...</p>
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

### Manager Functions

```tsx
import { useCouponNft } from '@/hooks/use-coupon-nft'

function ManagerComponent() {
  const {
    mintCoupon,
    burnCoupon,
    setCampaignManager,
    isLoading,
    error
  } = useCouponNft()

  const handleMintCoupon = async (
    recipient: Address,
    value: string,
    tokenURI: string
  ) => {
    const txHash = await mintCoupon(recipient, value, tokenURI)
    if (txHash) {
      console.log('Coupon minted:', txHash)
    }
  }

  const handleBurnCoupon = async (tokenId: string) => {
    const txHash = await burnCoupon(tokenId)
    if (txHash) {
      console.log('Coupon burned:', txHash)
    }
  }

  const handleSetCampaignManager = async (managerAddress: Address) => {
    const txHash = await setCampaignManager(managerAddress)
    if (txHash) {
      console.log('Campaign manager updated:', txHash)
    }
  }

  return (
    <div className="space-y-4">
      <button 
        onClick={() => handleMintCoupon(
          '0x...', // recipient address
          '25.0',  // 25 USDT value
          'https://example.com/nft-metadata.json'
        )}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        Mint 25 USDT Coupon
      </button>
      
      <button 
        onClick={() => handleBurnCoupon('1')}
        disabled={isLoading}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        Burn Coupon #1
      </button>
      
      {error && <p className="text-red-600">{error}</p>}
    </div>
  )
}
```

## API Reference

### useCouponNft Hook

#### State
- `isLoading: boolean` - Whether any operation is in progress
- `error: string | null` - Current error message
- `clearError: () => void` - Clear the current error

#### Read Functions
- `getCouponValue(tokenId: bigint): Promise<bigint>` - Get coupon USDT value
- `getOwnerOf(tokenId: bigint): Promise<Address>` - Get token owner
- `getBalanceOf(owner: Address): Promise<bigint>` - Get owner's balance
- `getTokenURI(tokenId: bigint): Promise<string>` - Get token metadata URI
- `getTotalSupply(): Promise<bigint>` - Get total supply
- `getUserCoupons(userAddress: Address): Promise<Coupon[]>` - Get all user's coupons
- `getCampaignManager(): Promise<Address>` - Get campaign manager address
- `getOwner(): Promise<Address>` - Get contract owner

#### Write Functions
- `mintCoupon(recipient, value, tokenURI): Promise<Hash | null>` - Mint new coupon (manager only)
- `burnCoupon(tokenId): Promise<Hash | null>` - Burn coupon (manager only)
- `setCampaignManager(managerAddress): Promise<Hash | null>` - Set campaign manager (owner only)

#### Utility Functions
- `formatUsdt(amount: bigint): string` - Convert USDT amount to string
- `parseUsdt(amount: string): bigint` - Convert USDT string to bigint
- `formatEther(wei: bigint): string` - Convert wei to ETH string
- `parseEther(ether: string): bigint` - Convert ETH string to wei

### Coupon Type

```typescript
interface Coupon {
  tokenId: bigint        // Token ID
  owner: Address         // Owner address
  value: bigint         // USDT value in wei
  tokenURI: string      // Metadata URI
}
```

### Error Handling

The hooks provide comprehensive error handling with specific error types:

```typescript
import { 
  CouponNftError,
  NotManagerError,
  NonTransferableError,
  ContractNotDeployedError
} from '@/lib/coupon_nft'

// Error type guards
if (error instanceof NotManagerError) {
  // Handle manager-only action
} else if (error instanceof NonTransferableError) {
  // Handle transfer attempt on soulbound token
} else if (error instanceof ContractNotDeployedError) {
  // Handle contract not deployed
}
```

## Best Practices

1. **Always check wallet connection** before calling write functions
2. **Handle errors gracefully** and provide user feedback
3. **Use loading states** to improve UX
4. **Refresh data** after successful write operations
5. **Validate inputs** before calling contract functions
6. **Check user permissions** before manager functions
7. **Format amounts** using the provided utility functions
8. **Remember soulbound nature** - these tokens cannot be transferred

## Troubleshooting

### Common Issues

1. **"Wallet client required" error**: Make sure the user has connected their wallet
2. **"NotManager" error**: Only the campaign manager can mint/burn tokens
3. **"NonTransferable" error**: These are soulbound tokens that cannot be transferred
4. **"Token does not exist" error**: Verify the token ID is correct
5. **"Contract not deployed" error**: Ensure the contract is deployed to Kairos

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed error information in the console.

## Contract ABI

The contract ABI is automatically included and exported from `@/lib/coupon_nft`. You can use it directly with viem if needed:

```typescript
import { COUPON_NFT_ABI_EXPORT } from '@/lib/coupon_nft'
```

## Soulbound Mechanism

The CouponNFT contract implements a soulbound mechanism that prevents all transfers except:
- **Minting**: From address(0) to recipient
- **Burning**: From owner to address(0)

This ensures that coupon NFTs cannot be transferred between users, making them truly "soulbound" to the original recipient. This is important for gift card functionality where the value should only be redeemable by the intended recipient.
