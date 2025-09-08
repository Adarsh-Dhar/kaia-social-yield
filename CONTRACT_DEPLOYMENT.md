# Contract Deployment Instructions

## Current Issue
The campaign creation is failing because the contract is deployed to the local network (chain ID 31337) but the frontend is trying to connect to sonicBlazeTestnet (chain ID 64165).

## Solutions

### Option 1: Use Local Network (Recommended for Development)
1. Install and start Anvil (local Ethereum node):
   ```bash
   # Install Foundry (includes Anvil)
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Start Anvil in a separate terminal
   anvil
   ```

2. Connect your wallet to the local network:
   - Network Name: Localhost
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Import the test account in your wallet:
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Address: `0xf39Fd6e51aad88F6f4ce6aB8827279cffFb92266`

### Option 2: Deploy to sonicBlazeTestnet (Production)
1. Get testnet tokens from the sonicBlazeTestnet faucet
2. Set your private key:
   ```bash
   export PRIVATE_KEY=your_private_key_here
   ```
3. Deploy the contract:
   ```bash
   node deploy-contract.js
   ```
4. Update the contract address in `lib/contracts/address.ts`

### Option 3: Use a Different Testnet
1. Deploy the contract to Sepolia or another testnet
2. Update the network configuration in `app/providers.tsx`
3. Update the contract address in `lib/contracts/address.ts`

## Current Contract Address
The contract is currently deployed at: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

## Testing
Once you have the correct network setup:
1. Open http://localhost:3000/advertiser
2. Connect your wallet to the correct network
3. Click "New Campaign"
4. Fill out the form and click "Create Campaign"
5. Your wallet should popup asking to confirm the transaction!

## Troubleshooting
- Make sure your wallet is connected to the correct network
- Check the browser console for detailed error messages
- Ensure you have enough ETH for gas fees
- Verify the contract is deployed and accessible
