const { createWalletClient, createPublicClient, http, parseEther, keccak256, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { kairos } = require('viem/chains');

// Contract addresses from the latest deployment
const CONTRACT_ADDRESSES = {
  CAMPAIGN_MANAGER: "0x50e9Ca374279a600819e5b4444D9132cFC9b1c45",
  COUPON_NFT: "0x84859a29725E4EDF8cc18a856253FD5f5d581D14", 
  MOCK_USDT: "0x50DBbF87a5aED08BCACa0f9579494A7f74cc3fd2"
};

// ABI for the functions we need
const CAMPAIGN_MANAGER_ABI = [
  {
    "type": "function",
    "name": "operator",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setOperator",
    "inputs": [{"name": "_newOperator", "type": "address", "internalType": "address"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
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
  },
  {
    "type": "function",
    "name": "awardCoupon",
    "inputs": [
      {"name": "_user", "type": "address", "internalType": "address"},
      {"name": "_campaignId", "type": "bytes32", "internalType": "bytes32"},
      {"name": "_randomCouponValue", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
];

async function testBlockchain() {
  const publicClient = createPublicClient({
    chain: kairos,
    transport: http('https://public-en-kairos.node.kaia.io')
  });

  try {
    // Check current operator
    const operator = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.CAMPAIGN_MANAGER,
      abi: CAMPAIGN_MANAGER_ABI,
      functionName: 'operator'
    });
    
    console.log('Current operator:', operator);
    console.log('Our test address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    
    if (operator.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') {
      console.log('✅ Operator is already set to our test address!');
      
      // Try to create a campaign
      console.log('\nCreating a test campaign...');
      
      const walletClient = createWalletClient({
        account: privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'),
        chain: kairos,
        transport: http('https://public-en-kairos.node.kaia.io')
      });
      
      const campaignId = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.CAMPAIGN_MANAGER,
        abi: CAMPAIGN_MANAGER_ABI,
        functionName: 'createCampaign',
        args: [
          parseEther('100'), // 100 USDT budget
          1000, // max participants
          parseEther('1'), // min reward 1 USDT
          parseEther('10'), // max reward 10 USDT
          'https://example.com/coupon-metadata.json'
        ]
      });
      
      console.log('Campaign created! Transaction hash:', campaignId);
      
    } else {
      console.log('❌ Operator is not our test address. We need to change it.');
      console.log('Current operator:', operator);
      console.log('We need the private key for address:', operator);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBlockchain();
