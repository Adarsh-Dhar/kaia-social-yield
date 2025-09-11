const { createPublicClient, http, formatUnits, parseUnits } = require('viem');
const { kairos } = require('viem/chains');

// USDT Contract ABI (minimal)
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
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  }
];

const USDT_ADDRESS = '0x50DBbF87a5aED08BCACa0f9579494A7f74cc3fd2';
const CAMPAIGN_MANAGER_ADDRESS = '0x50e9Ca374279a600819e5b4444D9132cFC9b1c45';
const TARGET_WALLET = '0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D';

const publicClient = createPublicClient({
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

async function debugUSDTBalance() {
  try {
    console.log('🔍 Debugging USDT Balance and Allowance');
    console.log('=====================================');
    
    // Check USDT contract
    console.log('\n📋 USDT Contract Info:');
    console.log('Address:', USDT_ADDRESS);
    
    // Get decimals
    const decimals = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'decimals'
    });
    console.log('Decimals:', decimals);
    
    // Check target wallet balance
    console.log('\n💰 Target Wallet Balance:');
    console.log('Address:', TARGET_WALLET);
    
    const balance = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'balanceOf',
      args: [TARGET_WALLET]
    });
    
    console.log('Raw balance:', balance.toString());
    console.log('Formatted balance:', formatUnits(balance, Number(decimals)), 'USDT');
    
    // Check allowance
    console.log('\n🔐 Allowance Check:');
    console.log('Owner (Target Wallet):', TARGET_WALLET);
    console.log('Spender (Campaign Manager):', CAMPAIGN_MANAGER_ADDRESS);
    
    const allowance = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'allowance',
      args: [TARGET_WALLET, CAMPAIGN_MANAGER_ADDRESS]
    });
    
    console.log('Raw allowance:', allowance.toString());
    console.log('Formatted allowance:', formatUnits(allowance, Number(decimals)), 'USDT');
    
    // Test campaign parameters
    console.log('\n🎯 Campaign Parameters Test:');
    const testBudget = parseUnits('10', Number(decimals)); // 10 USDT
    const testMinReward = parseUnits('1', Number(decimals)); // 1 USDT
    const testMaxReward = parseUnits('5', Number(decimals)); // 5 USDT
    
    console.log('Test budget (10 USDT):', testBudget.toString());
    console.log('Test min reward (1 USDT):', testMinReward.toString());
    console.log('Test max reward (5 USDT):', testMaxReward.toString());
    
    // Check if balance is sufficient
    if (balance >= testBudget) {
      console.log('✅ Sufficient USDT balance for test campaign');
    } else {
      console.log('❌ Insufficient USDT balance for test campaign');
      console.log('Required:', formatUnits(testBudget, Number(decimals)), 'USDT');
      console.log('Available:', formatUnits(balance, Number(decimals)), 'USDT');
    }
    
    // Check if allowance is sufficient
    if (allowance >= testBudget) {
      console.log('✅ Sufficient USDT allowance for test campaign');
    } else {
      console.log('❌ Insufficient USDT allowance for test campaign');
      console.log('Required:', formatUnits(testBudget, Number(decimals)), 'USDT');
      console.log('Available:', formatUnits(allowance, Number(decimals)), 'USDT');
    }
    
  } catch (error) {
    console.error('❌ Error debugging USDT balance:', error);
  }
}

debugUSDTBalance();
