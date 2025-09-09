#!/usr/bin/env node

// Test script for small stake amounts
console.log('🧪 Testing Small Stake Amounts...\n');

console.log('📊 Gas Fee Analysis:');
console.log('- Current issue: 9,625 KAIA for 1 USDT stake');
console.log('- This is 9,625x higher than normal');
console.log('- Normal gas fee should be < 0.1 KAIA\n');

console.log('🎯 Recommended Test Sequence:');
console.log('1. Try staking 0.001 USDT (1,000 units)');
console.log('2. If that fails, try 0.0001 USDT (100 units)');
console.log('3. If that fails, try 0.00001 USDT (10 units)');
console.log('4. If all fail, the contract needs USDT token configuration\n');

console.log('⚠️  Safety Guidelines:');
console.log('- DO NOT approve any transaction with gas > 100 KAIA');
console.log('- Start with the smallest amount possible');
console.log('- If gas fees are high, the contract is misconfigured\n');

console.log('🔍 What to Look For:');
console.log('- Gas estimate should be < 0.1 KAIA');
console.log('- Transaction should succeed, not revert');
console.log('- You should see your staked balance update\n');

console.log('📋 Next Steps:');
console.log('1. Go to the staking page');
console.log('2. Enter 0.001 in the amount field');
console.log('3. Click "Stake"');
console.log('4. Check the gas estimate in MetaMask');
console.log('5. If gas > 100 KAIA, DO NOT approve');
console.log('6. If gas < 0.1 KAIA, approve and test');

console.log('\n💡 If all small amounts fail:');
console.log('- The contract needs USDT token address configuration');
console.log('- You may need to deploy a new contract');
console.log('- Or the contract owner needs to set the USDT token address');
