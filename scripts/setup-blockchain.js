const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { kairos } = require('viem/chains');

// Use a known test private key for the operator
const OPERATOR_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const operatorAccount = privateKeyToAccount(OPERATOR_PRIVATE_KEY);

console.log("Operator address:", operatorAccount.address);

// Contract addresses from the latest deployment
const CONTRACT_ADDRESSES = {
  CAMPAIGN_MANAGER: "0x90193C961A926261B756D1E5bb255e67ff9498A1",
  COUPON_NFT: "0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496", 
  MOCK_USDT: "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519"
};

console.log("Contract addresses:", CONTRACT_ADDRESSES);

// The issue is that the current operator is the deployer (0x1804c8ab1f12e6bbf3894d4083f33e07309d1f38)
// but we want to use our test key (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
// We need to either:
// 1. Deploy with our test key as the operator, or
// 2. Change the operator to our test key

console.log("\nTo fix the coupon minting issue:");
console.log("1. The operator needs to be set to:", operatorAccount.address);
console.log("2. Or we need to deploy with this address as the operator");
console.log("3. We also need to create campaigns on the blockchain first");

// For now, let's create a simple workaround by updating the contract addresses
// to use a new deployment with the correct operator
