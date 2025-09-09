# How to Stake USDT - Step by Step Guide

## 🎯 What You Need

1. **USDT Tokens** - You need USDT tokens in your wallet on Kairos network
2. **MetaMask Wallet** - Connected to Kairos Testnet
3. **KAIA for Gas** - Small amount of KAIA for transaction fees

## 📋 Step-by-Step Process

### 1. Connect Your Wallet
- Make sure MetaMask is connected to Kairos Testnet
- Your wallet should show your USDT balance

### 2. Enter Amount
- Enter the amount of USDT you want to stake (e.g., 1.0)
- The app will validate the amount

### 3. Confirm Staking
- Click "Stake" button
- A confirmation dialog will appear explaining what will happen
- Click "OK" to proceed

### 4. Approve Transaction
- MetaMask will open automatically
- You'll see a transaction to stake your USDT
- **Click "Confirm" in MetaMask** to complete the staking

### 5. Wait for Confirmation
- The transaction will be processed on Kairos network
- You'll see a success message when complete

## ⚠️ Common Issues & Solutions

### "Transaction cancelled by user"
- **Cause**: You clicked "Reject" in MetaMask
- **Solution**: Try again and click "Confirm" in MetaMask

### "Insufficient USDT balance"
- **Cause**: You don't have enough USDT tokens
- **Solution**: Get USDT tokens on Kairos network first

### High gas fees (>100 KAIA)
- **Cause**: Contract not properly deployed or configuration issue
- **Solution**: Check contract status or try smaller amount

### "Contract not deployed"
- **Cause**: The staking contract isn't deployed to Kairos
- **Solution**: Deploy the contract first using `npm run deploy-contract`

## 💡 Tips for Success

1. **Start Small** - Try staking 0.01 USDT first to test
2. **Check Balance** - Make sure you have USDT tokens
3. **Approve Transaction** - Always click "Confirm" in MetaMask
4. **Be Patient** - Transactions can take a few minutes to confirm

## 🔍 Troubleshooting

### Check Your Setup
```bash
node check-usdt-balance.js
```

### View Contract
- Contract address: `0x54a658539952a41e8C00e1c7B6b1E678B1c08647`
- Explorer: https://explorer.kairos.kaia.io/address/0x54a658539952a41e8C00e1c7B6b1E678B1c08647

### Get Help
- Check the console for detailed error messages
- Use the "Check Contract Status" button in the app
- Refer to the troubleshooting guide

## 🎉 Success!

Once staking is complete, you'll see:
- Your staked balance updated
- Pending rewards displayed
- Success message with transaction hash

The staking process is now much more user-friendly with clear guidance at each step!
