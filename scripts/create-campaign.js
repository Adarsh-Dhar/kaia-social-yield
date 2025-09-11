const { createWalletClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { kairos } = require('viem/chains');

// Contract addresses
const CONTRACT_ADDRESSES = {
  CAMPAIGN_MANAGER: "0x90193C961A926261B756D1E5bb255e67ff9498A1",
  COUPON_NFT: "0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496", 
  MOCK_USDT: "0x5b73C5498c1E3b4dbA84de0F1833c4a029d90519"
};

// ABI for createCampaign function
const CAMPAIGN_MANAGER_ABI = [
  {
    "type": "function",
    "name": "createCampaign",
    "inputs": [
      {"name": "_budget", "type": "uint256", "internalType": "uint256"},
      {"name": "_maxParticipants", "type": "uint256", "internalType": "uint256"},
      {"name": "_minReward", "type": "uint256", "internalType": "uint256"},
      {"name": "_maxReward", "type": "uint256", "internalType": "uint256"},
      {"name": "_nftTokenURI", "type": "string", "internalType": "string"}
    ],
    "outputs": [{"name": "", "type": "bytes32", "internalType": "bytes32"}],
    "stateMutability": "nonpayable"
  }
];

async function createCampaign() {
  // We need the deployer's private key to create a campaign
  // For now, let's try with a different approach
  
  console.log("To create a campaign on the blockchain, we need:");
  console.log("1. The private key for address: 0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38");
  console.log("2. Or change the operator to our test address");
  console.log("3. Or deploy a new contract with our test address as operator");
  
  console.log("\nCurrent contract addresses:");
  console.log("CampaignManager:", CONTRACT_ADDRESSES.CAMPAIGN_MANAGER);
  console.log("CouponNFT:", CONTRACT_ADDRESSES.COUPON_NFT);
  console.log("MockUSDT:", CONTRACT_ADDRESSES.MOCK_USDT);
  
  console.log("\nLet's try to deploy a new contract with the correct operator...");
}

createCampaign();
