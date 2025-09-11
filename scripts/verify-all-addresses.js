#!/usr/bin/env node

/**
 * Comprehensive Address Verification Script
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
    
    // Check for hardcoded addresses
    for (const [contractName, expectedAddress] of Object.entries(EXPECTED_ADDRESSES)) {
      const addressRegex = new RegExp(`0x[a-fA-F0-9]{40}`, 'g');
      const matches = content.match(addressRegex);
      
      if (matches) {
        for (const match of matches) {
          if (match !== expectedAddress) {
            // Check if it's a placeholder or zero address
            if (match !== '0x0000000000000000000000000000000000000000') {
              issues.push({
                type: 'HARDCODED_ADDRESS',
                contract: contractName,
                found: match,
                expected: expectedAddress,
                line: findLineNumber(content, match)
              });
            }
          }
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
        if (issue.type === 'HARDCODED_ADDRESS') {
          console.log(`    - Line ${issue.line}: Found ${issue.found}, expected ${issue.expected}`);
        } else {
          console.log(`    - ${issue.message}`);
        }
      }
      allGood = false;
    }
    console.log('');
  }
  
  // Check for any other files with hardcoded addresses
  console.log('🔍 Checking for other hardcoded addresses...');
  
  const otherFiles = [
    'app/api/missions/award-coupon/route.ts',
    'hooks/use-mock-usdt.ts',
    'hooks/use-coupon-nft.ts'
  ];
  
  for (const filePath of otherFiles) {
    const result = checkFile(filePath);
    if (result.status === 'ISSUES') {
      console.log(`📄 ${filePath}:`);
      for (const issue of result.issues) {
        if (issue.type === 'HARDCODED_ADDRESS') {
          console.log(`  ⚠️  Line ${issue.line}: Hardcoded address ${issue.found}`);
        }
      }
      console.log('');
    }
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
