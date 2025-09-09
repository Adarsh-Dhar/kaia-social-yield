# CampaignEscrow Contract Integration

This directory contains all the necessary functions and hooks to interact with the CampaignEscrow smart contract in your UI.

## Overview

The CampaignEscrow contract allows users to:
- Create campaigns with initial funding
- Add additional funds to existing campaigns
- Deposit funds to campaigns
- Release funds (owner only)
- View campaign information and deposit amounts

## Files

- `index.ts` - Core contract interaction functions and types
- `hooks/use-campaign-escrow.ts` - React hook for contract interactions
- `hooks/use-campaign-escrow-simple.ts` - Simplified wagmi-based hook
- `hooks/use-campaigns.ts` - Specialized hooks for campaign management
- `components/campaign-escrow-demo.tsx` - Example UI component

## Setup

### Contract Configuration

The contract is already configured with:
- **Contract Address**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` (from `lib/contracts/address.ts`)
- **ABI**: Automatically imported from `lib/contracts/abi.ts`

### Environment Variables (Optional)

If you need to override the contract address or chain configuration, add these to your `.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=sonicBlazeTestnet # or sepolia
NEXT_PUBLIC_INFURA_API_KEY=your_infura_key # for sepolia
```

The contract address is hardcoded in the address file, but you can modify it there if needed.

## Usage

### Basic Hook Usage

```tsx
import { useCampaignEscrowSimple } from '@/hooks/use-campaign-escrow-simple'

function MyComponent() {
  const {
    isLoading,
    error,
    createCampaign,
    getCampaign,
    addFunds,
    deposit,
    releaseFunds,
    formatEther
  } = useCampaignEscrowSimple()

  const handleCreateCampaign = async () => {
    const txHash = await createCampaign('1.0') // 1 ETH
    if (txHash) {
      console.log('Campaign created:', txHash)
    }
  }

  const handleGetCampaign = async () => {
    const campaign = await getCampaign('0x...')
    if (campaign) {
      console.log('Campaign:', campaign)
    }
  }

  return (
    <div>
      <button onClick={handleCreateCampaign} disabled={isLoading}>
        Create Campaign
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

### Specialized Hooks

#### Campaign Management

```tsx
import { useCampaigns, useCampaign, useCreateCampaign } from '@/hooks/use-campaigns'

function CampaignList() {
  const { campaigns, loadCampaign } = useCampaigns()
  const { createCampaign, isCreating } = useCreateCampaign()

  const handleCreate = async () => {
    const txHash = await createCampaign('1.0')
    if (txHash) {
      // Refresh the campaign list
      await loadCampaign(txHash)
    }
  }

  return (
    <div>
      <button onClick={handleCreate} disabled={isCreating}>
        Create Campaign
      </button>
      {campaigns.map(campaign => (
        <div key={campaign.id}>
          <h3>Campaign {campaign.id}</h3>
          <p>Total Funding: {campaign.formattedTotalFunding} ETH</p>
          <p>Deposit Balance: {campaign.depositBalance} ETH</p>
          <p>Active: {campaign.isActive ? 'Yes' : 'No'}</p>
        </div>
      ))}
    </div>
  )
}
```

#### Single Campaign Management

```tsx
import { useCampaign, useCampaignFunding } from '@/hooks/use-campaigns'

function CampaignDetails({ campaignId }: { campaignId: string }) {
  const { campaign, loadCampaign } = useCampaign(campaignId as `0x${string}`)
  const { addFunds, deposit, isFunding } = useCampaignFunding(campaignId as `0x${string}`)

  const handleAddFunds = async () => {
    const txHash = await addFunds('0.5') // 0.5 ETH
    if (txHash) {
      await loadCampaign() // Refresh campaign data
    }
  }

  if (!campaign) return <div>Loading...</div>

  return (
    <div>
      <h2>Campaign {campaign.id}</h2>
      <p>Creator: {campaign.creator}</p>
      <p>Total Funding: {campaign.formattedTotalFunding} ETH</p>
      <p>Deposit Balance: {campaign.depositBalance} ETH</p>
      <p>Created: {campaign.formattedCreatedAt}</p>
      
      <button onClick={handleAddFunds} disabled={isFunding}>
        Add 0.5 ETH
      </button>
    </div>
  )
}
```

### Direct Service Usage

```tsx
import { createCampaignEscrowService } from '@/lib/contracts'

async function createCampaignDirectly() {
  const service = createCampaignEscrowService()
  
  try {
    const campaign = await service.getCampaign('0x...')
    console.log('Campaign:', campaign)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

## API Reference

### useCampaignEscrowSimple Hook

#### State
- `isLoading: boolean` - Whether any operation is in progress
- `error: string | null` - Current error message
- `clearError: () => void` - Clear the current error

#### Read Functions
- `getCampaign(campaignId: string): Promise<Campaign | null>` - Get campaign details
- `getDepositAmount(campaignId: string): Promise<bigint | null>` - Get deposit amount
- `getOwner(): Promise<Address | null>` - Get contract owner

#### Write Functions
- `createCampaign(initialFunding: string): Promise<Hash | null>` - Create new campaign
- `addFunds(campaignId: string, amount: string): Promise<Hash | null>` - Add funds to campaign
- `deposit(campaignId: string, amount: string): Promise<Hash | null>` - Deposit to campaign
- `releaseFunds(campaignId: string, recipient: Address): Promise<Hash | null>` - Release funds (owner only)

#### Utility Functions
- `formatEther(wei: bigint): string` - Convert wei to ETH string
- `parseEther(ether: string): bigint` - Convert ETH string to wei

### Campaign Type

```typescript
interface Campaign {
  id: `0x${string}`        // Campaign ID
  creator: Address         // Creator address
  totalFunding: bigint     // Total funding in wei
  isActive: boolean        // Whether campaign is active
  createdAt: bigint        // Creation timestamp
}
```

### Error Handling

The hooks provide comprehensive error handling with specific error types:

```typescript
import { 
  ContractError,
  InsufficientFundsError,
  CampaignNotFoundError,
  CampaignInactiveError,
  InvalidAmountError,
  NotOwnerError
} from '@/lib/contracts'

// Error type guards
if (error instanceof InsufficientFundsError) {
  // Handle insufficient funds
} else if (error instanceof CampaignNotFoundError) {
  // Handle campaign not found
}
```

## Example UI Component

See `components/campaign-escrow-demo.tsx` for a complete example of how to use all the contract functions in a React component.

## Best Practices

1. **Always check wallet connection** before calling write functions
2. **Handle errors gracefully** and provide user feedback
3. **Use loading states** to improve UX
4. **Refresh data** after successful write operations
5. **Validate inputs** before calling contract functions
6. **Use the simplified hook** (`useCampaignEscrowSimple`) for most use cases

## Troubleshooting

### Common Issues

1. **"Wallet client required" error**: Make sure the user has connected their wallet
2. **"Invalid amount" error**: Check that the amount is a valid number and greater than 0
3. **"Campaign not found" error**: Verify the campaign ID is correct
4. **"Only contract owner" error**: Only the contract owner can release funds

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed error information in the console.

## Contract ABI

The contract ABI is automatically included and exported from `@/lib/contracts`. You can use it directly with viem if needed:

```typescript
import { CAMPAIGN_ESCROW_ABI } from '@/lib/contracts'
```
