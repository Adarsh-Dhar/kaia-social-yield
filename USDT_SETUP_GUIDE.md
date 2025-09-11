# 🪙 USDT Setup Guide

## Current USDT Distribution

The MockUSDT contract (`0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee`) has the following balances:

- **Test Wallet**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` - **100 USDT** ✅
- **Target Wallet**: `0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D` - **0 USDT** ❌
- **Contract Owner**: `0x7a39037548C388579266657e1e9037613Ee798F1` - **999,900 USDT** ✅

## Solutions

### Option 1: Use Test Wallet (Recommended)
Connect with the test wallet that already has 100 USDT:

**Wallet Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Option 2: Transfer USDT (Requires Owner)
If you have access to the contract owner wallet (`0x7a39037548C388579266657e1e9037613Ee798F1`), you can mint or transfer USDT.

### Option 3: Use Existing USDT
The system is already configured to work with the test wallet that has 100 USDT.

## How to Connect Test Wallet

1. **Open your wallet** (MetaMask, etc.)
2. **Import account** using the private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
3. **Switch to Kairos Testnet** (Chain ID: 1001)
4. **Refresh the page** to see the USDT balance

## Verification

To check any wallet's USDT balance:

```bash
node scripts/check-usdt-balance.js WALLET_ADDRESS
```

Example:
```bash
node scripts/check-usdt-balance.js 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## Current Status

✅ **USDT Contract**: Deployed and working  
✅ **Test Wallet**: Has 100 USDT  
✅ **Frontend**: Configured with correct contract address  
❌ **Target Wallet**: Needs USDT (0 balance)  

The system is ready to work with the test wallet! 🚀
