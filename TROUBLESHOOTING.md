# Staking Troubleshooting Guide

## 🚨 High Gas Fees Issue

If you're seeing extremely high gas fees (like 9,625 KAIA = $1,508.24) when trying to stake 1 USDT, this indicates a problem with the contract deployment or configuration.

### Root Causes

1. **Contract not properly deployed** - The contract exists but USDT token address is not set
2. **USDT token not available** - You don't have USDT tokens in your wallet
3. **Contract function failing** - The stake function is reverting due to configuration issues

### Solutions

#### 1. Check Your USDT Balance
```bash
# Run this to check your setup
node check-usdt-balance.js
```

#### 2. Verify Contract Deployment
- Contract address: `0x54a658539952a41e8C00e1c7B6b1E678B1c08647`
- Check on Kairos Explorer: https://explorer.kairos.kaia.io/address/0x54a658539952a41e8C00e1c7B6b1E678B1c08647

#### 3. Get USDT Tokens
You need USDT tokens on Kairos network to stake. You can:
- Bridge USDT from another network
- Buy USDT on a Kairos DEX
- Get testnet USDT from a faucet

#### 4. Test with Small Amount
Try staking a very small amount first (like 0.01 USDT) to test the functionality.

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Contract not deployed" | Deploy the contract to Kairos |
| "Insufficient USDT balance" | Get USDT tokens in your wallet |
| "USDT transfer failed" | Approve the contract to spend your USDT |
| "Transaction failed due to gas issues" | Contract may not be properly configured |

### Step-by-Step Fix

1. **Check USDT Balance**
   ```bash
   node check-usdt-balance.js
   ```

2. **Deploy Contract (if needed)**
   ```bash
   npm run deploy-contract
   ```

3. **Update Contract Address**
   - Copy the deployed address
   - Update `lib/social/address.ts`

4. **Test Staking**
   - Try staking 0.01 USDT first
   - Check if gas fees are reasonable (< 0.1 KAIA)

### Expected Behavior

- **Normal gas fee**: < 0.1 KAIA
- **Staking 1 USDT**: Should cost minimal gas
- **Transaction success**: You should see your staked balance update

### If Still Having Issues

1. Check the contract on Kairos Explorer
2. Verify USDT token address is set in the contract
3. Ensure you have USDT tokens in your wallet
4. Try a different wallet or browser
5. Check if you're connected to the correct network (Kairos)

### Contact Support

If you continue to have issues, please provide:
- Your wallet address
- The exact error message
- Screenshot of the transaction details
- Your USDT balance
