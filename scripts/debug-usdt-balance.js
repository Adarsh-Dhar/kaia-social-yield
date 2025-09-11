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

const USDT_ADDRESS = '0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee';
const CAMPAIGN_MANAGER_ADDRESS = '0xBDc85FDE8A360013594Af89484D625D62bE4860c';
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
