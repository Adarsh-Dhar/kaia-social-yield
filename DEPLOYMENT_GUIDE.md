# 🚀 Blockchain Deployment Guide

## Current Status
✅ **Single Deploy Script**: `contracts/script/Deploy.s.sol`  
❌ **Deployment Issue**: Account key mismatch on Kairos Testnet

## The Problem
The deployment fails with error: `invalid sender: a legacy transaction must be with a legacy account key`

This is a blockchain configuration issue where the private key format doesn't match the network requirements.

## Solutions

### Option 1: Use Different Network
Try deploying to a different testnet that supports the account key format:

```bash
# Ethereum Sepolia
forge script script/Deploy.s.sol --rpc-url https://sepolia.infura.io/v3/YOUR_KEY --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Polygon Mumbai
forge script script/Deploy.s.sol --rpc-url https://polygon-mumbai.infura.io/v3/YOUR_KEY --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Option 2: Use Different Private Key
Try with a different private key that works with Kairos:

```bash
# Try with a different private key
forge script script/Deploy.s.sol --rpc-url https://public-en-kairos.node.kaia.io --broadcast --private-key YOUR_PRIVATE_KEY
```

### Option 3: Use Existing Contracts
The system is already configured to work with existing contracts:
- **CampaignManager**: `0xBDc85FDE8A360013594Af89484D625D62bE4860c`
- **CouponNFT**: `0x1AF0BaD3C852a601B243d942737A526B823C5E1b`
- **MockUSDT**: `0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee`

## What the Deploy Script Does

1. **Deploys MockUSDT** - USDT-like token with 6 decimals
2. **Mints 1M USDT** to deployer
3. **Transfers 100 USDT** to test operator
4. **Deploys CampaignManager** with test operator
5. **Deploys CouponNFT** with deployer as owner
6. **Links contracts** together

## Current Working System

The application is already configured for real blockchain transactions:
- ✅ **Advertiser page** creates real campaigns
- ✅ **Mission completion** attempts real coupon minting
- ✅ **No simulation** - all transactions are real
- ❌ **Operator mismatch** - needs correct private key

## Next Steps

1. **Get correct private key** for operator `0x7a39037548C388579266657e1e9037613Ee798F1`
2. **Or deploy new contracts** with working private key
3. **Update environment variables** with correct addresses

The system is ready for real blockchain transactions once the operator issue is resolved!
