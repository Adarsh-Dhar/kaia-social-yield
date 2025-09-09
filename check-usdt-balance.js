#!/usr/bin/env node

// Simple script to check USDT balance and contract status
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking USDT balance and contract status...\n');

// Check contract address
const addressFile = path.join(__dirname, 'lib', 'social', 'address.ts');
try {
  const content = fs.readFileSync(addressFile, 'utf8');
  const addressMatch = content.match(/export const SOCIAL_YIELD_ADDRESS = "([^"]+)"/);
  
  if (!addressMatch) {
    console.log('❌ Could not find SOCIAL_YIELD_ADDRESS');
    process.exit(1);
  }
  
  const address = addressMatch[1];
  
  if (address === '0x0000000000000000000000000000000000000000') {
    console.log('❌ Contract address is still the placeholder address');
    console.log('📝 Please deploy the contract first:');
    console.log('   npm run deploy-contract');
    process.exit(1);
  }
  
  console.log('✅ Contract address found:', address);
  console.log('🔗 Contract on Kairos Explorer: https://explorer.kairos.kaia.io/address/' + address);
  
} catch (error) {
  console.log('❌ Error reading address file:', error.message);
  process.exit(1);
}

console.log('\n📋 Next steps:');
console.log('1. Make sure you have USDT tokens in your wallet');
console.log('2. Connect your wallet to the app');
console.log('3. Try staking a small amount (like 0.01 USDT) first');
console.log('4. If you see high gas fees, the contract might not be properly deployed');
console.log('\n💡 Tips:');
console.log('- USDT has 6 decimal places (1 USDT = 1,000,000 units)');
console.log('- Check your USDT balance in your wallet');
console.log('- Make sure you\'re connected to Kairos network');
console.log('- If staking fails, try a smaller amount first');
