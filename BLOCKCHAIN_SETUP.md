# Blockchain Setup for Social Yield Protocol

This application uses the Kairos network for staking functionality.

## Quick Start

### 1. Deploy the Contracts to Kairos

Open a terminal in the project root and run:

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url https://public-en-kairos.node.kaia.io --broadcast
```

### 2. Update Contract Addresses

After deployment, update the contract address in:
- `lib/social/address.ts` - Replace the placeholder address with the deployed address

### 3. Start the Application

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

### 4. Connect Your Wallet

Connect your wallet to the Kairos network and ensure you have some KAIA for gas fees.

## Troubleshooting

### Error: "Kairos network not available"

This means there's a network connectivity issue. Check your internet connection.

### Error: "Contract not found"

This means the contracts haven't been deployed to Kairos. Follow step 1 above.

### Error: "Invalid contract address"

This means the contract address in the code doesn't match the deployed contract. Follow step 2 above.

## Development Workflow

1. **Deploy contracts** to Kairos (one time, or when contracts change)
2. **Update contract addresses** in the code
3. **Start the app**
4. **Connect wallet** to Kairos network
5. **Use staking features**

## Network Configuration

- **Network**: Kairos
- **RPC URL**: https://public-en-kairos.node.kaia.io
- **Chain ID**: 1001
- **Currency**: KAIA (for gas fees)

## Contract Addresses

Current deployed addresses (update these if you redeploy):

- **Social Yield Protocol**: `0x0000000000000000000000000000000000000000` (TODO: Deploy to Kairos)
- **Campaign Escrow**: Check `lib/escrow/address.ts`

## Features Available

When the contracts are deployed to Kairos, you can:

- ✅ **Stake USDT** and earn yield
- ✅ **Withdraw staked USDT**
- ✅ **Claim rewards**
- ✅ **View real-time staking data**
- ✅ **See active yield boosts**

## Fallback Mode

If the contracts are not deployed, the app will show fallback data and instructions to deploy the contracts.
