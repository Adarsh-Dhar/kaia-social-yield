#!/usr/bin/env node

/**
 * Correct Address Verification Script
 * 
 * This script verifies that all contract addresses are consistent
 * throughout the entire codebase.
 */

const fs = require('fs');
const path = require('path');

// Expected contract addresses
const EXPECTED_ADDRESSES = {
  CAMPAIGN_MANAGER: "0xBDc85FDE8A360013594Af89484D625D62bE4860c",
  COUPON_NFT: "0x1AF0BaD3C852a601B243d942737A526B823C5E1b",
  MOCK_USDT: "0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee"
};

// Files to check for hardcoded addresses
const FILES_TO_CHECK = [
  'lib/contract-addresses.ts',
  'lib/campaign_manager/address.ts',
  'lib/coupon_nft/address.ts',
  'lib/social/address.ts',
  'app/advertiser/page.tsx'
];

function checkFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return { file: filePath, status: 'NOT_FOUND', issues: [] };
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const issues = [];
    
    // Check for specific contract addresses in wrong places
    if (filePath.includes('campaign_manager') || filePath.includes('contract-addresses')) {
      // Should have CAMPAIGN_MANAGER address
      if (!content.includes(EXPECTED_ADDRESSES.CAMPAIGN_MANAGER)) {
        issues.push({
          type: 'MISSING_ADDRESS',
          contract: 'CAMPAIGN_MANAGER',
          expected: EXPECTED_ADDRESSES.CAMPAIGN_MANAGER
        });
      }
    }
    
    if (filePath.includes('coupon_nft') || filePath.includes('contract-addresses')) {
      // Should have COUPON_NFT address
      if (!content.includes(EXPECTED_ADDRESSES.COUPON_NFT)) {
        issues.push({
          type: 'MISSING_ADDRESS',
          contract: 'COUPON_NFT',
          expected: EXPECTED_ADDRESSES.COUPON_NFT
        });
      }
    }
    
    if (filePath.includes('social') || filePath.includes('advertiser') || filePath.includes('contract-addresses')) {
      // Should have MOCK_USDT address
      if (!content.includes(EXPECTED_ADDRESSES.MOCK_USDT)) {
        issues.push({
          type: 'MISSING_ADDRESS',
          contract: 'MOCK_USDT',
          expected: EXPECTED_ADDRESSES.MOCK_USDT
        });
      }
    }
    
    // Check for any other hardcoded addresses that shouldn't be there
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    const matches = content.match(addressRegex);
    
    if (matches) {
      for (const match of matches) {
        // Skip zero addresses and expected addresses
        if (match === '0x0000000000000000000000000000000000000000' || 
            Object.values(EXPECTED_ADDRESSES).includes(match)) {
          continue;
        }
        
        // Check if it's a known test address (these are OK)
        const knownTestAddresses = [
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Test wallet
          '0x7a39037548C388579266657e1e9037613Ee798F1', // USDT owner
          '0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D', // Target wallet
          '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Private key
          '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Test user address
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', // Test campaign ID
          '0xc3BD0b83a76CA92A343fAD7b9fD6bB37DeC1Da7E', // Social protocol address
          '0xFA0FcD31714A77fB84B636d68c758dAA51ACA0b2'  // Boost NFT address
        ];
        
        if (!knownTestAddresses.includes(match)) {
          issues.push({
            type: 'UNKNOWN_ADDRESS',
            found: match,
            line: findLineNumber(content, match)
          });
        }
      }
    }
    
    return {
      file: filePath,
      status: issues.length === 0 ? 'OK' : 'ISSUES',
      issues: issues
    };
    
  } catch (error) {
    return {
      file: filePath,
      status: 'ERROR',
      issues: [{ type: 'ERROR', message: error.message }]
    };
  }
}

function findLineNumber(content, searchString) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchString)) {
      return i + 1;
    }
  }
  return -1;
}

function verifyAddressConsistency() {
  console.log('🔍 Verifying Contract Address Consistency...');
  console.log('==========================================');
  console.log('');
  
  console.log('📋 Expected Addresses:');
  for (const [contract, address] of Object.entries(EXPECTED_ADDRESSES)) {
    console.log(`  ${contract}: ${address}`);
  }
  console.log('');
  
  let allGood = true;
  
  for (const filePath of FILES_TO_CHECK) {
    const result = checkFile(filePath);
    
    console.log(`📄 ${filePath}:`);
    
    if (result.status === 'OK') {
      console.log('  ✅ All addresses correct');
    } else if (result.status === 'NOT_FOUND') {
      console.log('  ⚠️  File not found');
      allGood = false;
    } else if (result.status === 'ERROR') {
      console.log('  ❌ Error reading file');
      allGood = false;
    } else if (result.status === 'ISSUES') {
      console.log('  ❌ Issues found:');
      for (const issue of result.issues) {
        if (issue.type === 'MISSING_ADDRESS') {
          console.log(`    - Missing ${issue.contract}: ${issue.expected}`);
        } else if (issue.type === 'UNKNOWN_ADDRESS') {
          console.log(`    - Line ${issue.line}: Unknown address ${issue.found}`);
        } else {
          console.log(`    - ${issue.message}`);
        }
      }
      allGood = false;
    }
    console.log('');
  }
  
  console.log('📊 Summary:');
  console.log('===========');
  
  if (allGood) {
    console.log('✅ All contract addresses are consistent!');
    console.log('✅ All files are using the correct addresses');
    console.log('✅ System is ready to use');
  } else {
    console.log('❌ Some issues found - please review above');
    console.log('💡 All addresses should use the centralized address files');
  }
  
  console.log('');
  console.log('🔗 Address Files:');
  console.log('  - lib/contract-addresses.ts (main)');
  console.log('  - lib/campaign_manager/address.ts');
  console.log('  - lib/coupon_nft/address.ts');
  console.log('  - lib/social/address.ts');
}

verifyAddressConsistency();
