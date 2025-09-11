const { createWalletClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { kairos } = require('viem/chains');

// Use the test private key
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

// The issue is that we need to either:
// 1. Change the operator of the existing contract to our test address, or
// 2. Create a campaign using the existing operator

console.log("\nCurrent situation:");
console.log("- Contract operator: 0x1804c8ab1f12e6bbf3894d4083f33e07309d1f38 (deployer)");
console.log("- Our test address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
console.log("- We need to either change the operator or use the deployer's key");

// For now, let's create a simple workaround by temporarily bypassing the blockchain
// and just showing the user what needs to be done
console.log("\nTo fix this, you need to:");
console.log("1. Get the private key for address 0x1804c8ab1f12e6bbf3894d4083f33e07309d1f38");
console.log("2. Or change the operator of the contract to our test address");
console.log("3. Create campaigns on the blockchain first");
