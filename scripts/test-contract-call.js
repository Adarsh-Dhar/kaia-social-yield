const { createPublicClient, createWalletClient, http, formatUnits, parseUnits } = require('viem');
const { kairos } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

// Contract ABIs
const USDT_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  }
];

const CAMPAIGN_MANAGER_ABI = [
  {
    type: 'function',
    name: 'createCampaign',
    inputs: [
      { name: '_budget', type: 'uint256' },
      { name: '_maxParticipants', type: 'uint256' },
      { name: '_minReward', type: 'uint256' },
      { name: '_maxReward', type: 'uint256' },
      { name: '_nftTokenURI', type: 'string' }
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'usdtToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'operator',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  }
];

const USDT_ADDRESS = '0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee';
const CAMPAIGN_MANAGER_ADDRESS = '0xBDc85FDE8A360013594Af89484D625D62bE4860c';
const TARGET_WALLET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Test private key

const publicClient = createPublicClient({
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(TARGET_WALLET_PRIVATE_KEY),
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

async function testContractCall() {
  try {
    console.log('🧪 Testing Contract Call');
    console.log('========================');
    
    const account = walletClient.account.address;
    console.log('Using account:', account);
    
    // Check contract state
    console.log('\n📋 Contract State:');
    const usdtTokenAddress = await publicClient.readContract({
      address: CAMPAIGN_MANAGER_ADDRESS,
      abi: CAMPAIGN_MANAGER_ABI,
      functionName: 'usdtToken'
    });
    console.log('USDT Token Address from contract:', usdtTokenAddress);
    console.log('Expected USDT Token Address:', USDT_ADDRESS);
    console.log('Match:', usdtTokenAddress.toLowerCase() === USDT_ADDRESS.toLowerCase());
    
    const operator = await publicClient.readContract({
      address: CAMPAIGN_MANAGER_ADDRESS,
      abi: CAMPAIGN_MANAGER_ABI,
      functionName: 'operator'
    });
    console.log('Operator address:', operator);
    
    // Check balance and allowance
    console.log('\n💰 Balance and Allowance:');
    const balance = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'balanceOf',
      args: [account]
    });
    console.log('USDT Balance:', formatUnits(balance, 6), 'USDT');
    
    const allowance = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'allowance',
      args: [account, CAMPAIGN_MANAGER_ADDRESS]
    });
    console.log('USDT Allowance:', formatUnits(allowance, 6), 'USDT');
    
    // Test parameters
    const budget = parseUnits('10', 6); // 10 USDT
    const maxParticipants = BigInt(100);
    const minReward = parseUnits('1', 6); // 1 USDT
    const maxReward = parseUnits('5', 6); // 5 USDT
    const nftTokenURI = 'https://example.com/nft-metadata.json';
    
    console.log('\n🎯 Test Parameters:');
    console.log('Budget:', formatUnits(budget, 6), 'USDT');
    console.log('Max Participants:', maxParticipants.toString());
    console.log('Min Reward:', formatUnits(minReward, 6), 'USDT');
    console.log('Max Reward:', formatUnits(maxReward, 6), 'USDT');
    console.log('NFT Token URI:', nftTokenURI);
    
    // Check if balance is sufficient
    if (balance < budget) {
      console.log('❌ Insufficient balance for test');
      return;
    }
    
    // Check if allowance is sufficient
    if (allowance < budget) {
      console.log('❌ Insufficient allowance for test');
      return;
    }
    
    console.log('\n🚀 Attempting to create campaign...');
    
    // Try to create campaign
    const hash = await walletClient.writeContract({
      address: CAMPAIGN_MANAGER_ADDRESS,
      abi: CAMPAIGN_MANAGER_ABI,
      functionName: 'createCampaign',
      args: [budget, maxParticipants, minReward, maxReward, nftTokenURI],
      account: walletClient.account,
      chain: kairos,
      gas: BigInt(200000),
      gasPrice: BigInt(1000000000) // 1 gwei
    });
    
    console.log('✅ Transaction submitted:', hash);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 30000
    });
    
    console.log('✅ Transaction confirmed:', receipt.status);
    
  } catch (error) {
    console.error('❌ Error testing contract call:', error);
    
    // Try to extract more specific error information
    if (error.message) {
      console.log('Error message:', error.message);
    }
    if (error.cause) {
      console.log('Error cause:', error.cause);
    }
    if (error.details) {
      console.log('Error details:', error.details);
    }
  }
}

testContractCall();
