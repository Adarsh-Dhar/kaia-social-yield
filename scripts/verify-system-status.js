#!/usr/bin/env node

/**
 * System Status Verification
 * 
 * This script verifies the current system status and provides
 * instructions for getting USDT balance.
 */

const { createPublicClient, http } = require('viem');
const { kairos } = require('viem/chains');

const client = createPublicClient({
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

async function verifySystemStatus() {
  try {
    console.log('🔍 Verifying System Status...');
    console.log('============================');
    
    const usdtAddress = '0x50DBbF87a5aED08BCACa0f9579494A7f74cc3fd2';
    const targetWallet = '0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D';
    const testWallet = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    
    // Check USDT contract
    console.log('\\n📋 USDT Contract Status:');
    console.log('Contract Address:', usdtAddress);
    
    try {
      const totalSupply = await client.readContract({
        address: usdtAddress,
        abi: [{
          type: 'function',
          name: 'totalSupply',
          inputs: [],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view'
        }],
        functionName: 'totalSupply'
      });
      console.log('Total Supply:', (Number(totalSupply) / 1e6).toFixed(6), 'USDT');
    } catch (e) {
      console.log('❌ USDT Contract Error:', e.message);
    }
    
    // Check target wallet balance
    console.log('\\n🎯 Target Wallet Status:');
    console.log('Address:', targetWallet);
    
    try {
      const targetBalance = await client.readContract({
        address: usdtAddress,
        abi: [{
          type: 'function',
          name: 'balanceOf',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view'
        }],
        functionName: 'balanceOf',
        args: [targetWallet]
      });
      console.log('Balance:', (Number(targetBalance) / 1e6).toFixed(6), 'USDT');
      
      if (Number(targetBalance) === 0) {
        console.log('❌ Target wallet has 0 USDT');
      } else {
        console.log('✅ Target wallet has USDT!');
      }
    } catch (e) {
      console.log('❌ Error checking target wallet:', e.message);
    }
    
    // Check test wallet balance
    console.log('\\n🧪 Test Wallet Status:');
    console.log('Address:', testWallet);
    
    try {
      const testBalance = await client.readContract({
        address: usdtAddress,
        abi: [{
          type: 'function',
          name: 'balanceOf',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view'
        }],
        functionName: 'balanceOf',
        args: [testWallet]
      });
      console.log('Balance:', (Number(testBalance) / 1e6).toFixed(6), 'USDT');
      
      if (Number(testBalance) > 0) {
        console.log('✅ Test wallet has USDT!');
      } else {
        console.log('❌ Test wallet has 0 USDT');
      }
    } catch (e) {
      console.log('❌ Error checking test wallet:', e.message);
    }
    
    // Provide solution
    console.log('\\n💡 SOLUTION:');
    console.log('============');
    console.log('To get 100 USDT, import the test wallet:');
    console.log('Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    console.log('Network: Kairos Testnet (Chain ID: 1001)');
    console.log('RPC URL: https://public-en-kairos.node.kaia.io');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifySystemStatus();
