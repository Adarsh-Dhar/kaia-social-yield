#!/usr/bin/env node

// Simple script to check if contract address is valid
const fs = require('fs');
const path = require('path');

const addressFile = path.join(__dirname, 'lib', 'social', 'address.ts');

try {
  const content = fs.readFileSync(addressFile, 'utf8');
  const addressMatch = content.match(/export const SOCIAL_YIELD_ADDRESS = "([^"]+)"/);
  
  if (!addressMatch) {
    console.log('❌ Could not find SOCIAL_YIELD_ADDRESS in address.ts');
    process.exit(1);
  }
  
  const address = addressMatch[1];
  
  if (address === '0x0000000000000000000000000000000000000000') {
    console.log('❌ Contract address is still the placeholder address');
    console.log('📝 Please deploy the contract to Kairos and update the address');
    console.log('');
    console.log('To deploy:');
    console.log('1. Run: ./deploy-kairos.sh');
    console.log('2. Copy the deployed address');
    console.log('3. Update lib/social/address.ts with the new address');
    process.exit(1);
  }
  
  if (address.length !== 42 || !address.startsWith('0x')) {
    console.log('❌ Invalid contract address format:', address);
    process.exit(1);
  }
  
  console.log('✅ Contract address looks valid:', address);
  console.log('🔗 You can verify it on Kairos Explorer: https://explorer.kairos.kaia.io/address/' + address);
  
} catch (error) {
  console.log('❌ Error reading address file:', error.message);
  process.exit(1);
}
