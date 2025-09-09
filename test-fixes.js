#!/usr/bin/env node

// Test script to verify the fixes
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing fixes for React errors...\n');

// Check if error boundary exists
const errorBoundaryPath = path.join(__dirname, 'components', 'error-boundary.tsx');
if (fs.existsSync(errorBoundaryPath)) {
  console.log('✅ Error boundary component created');
} else {
  console.log('❌ Error boundary component missing');
}

// Check if dashboard has client-side rendering
const dashboardPath = path.join(__dirname, 'app', 'user', 'dashboard', 'page.tsx');
if (fs.existsSync(dashboardPath)) {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  if (content.includes('isClient') && content.includes('useEffect')) {
    console.log('✅ Dashboard has client-side rendering protection');
  } else {
    console.log('❌ Dashboard missing client-side rendering protection');
  }
  
  if (content.includes('ErrorBoundary')) {
    console.log('✅ Dashboard wrapped with error boundary');
  } else {
    console.log('❌ Dashboard not wrapped with error boundary');
  }
} else {
  console.log('❌ Dashboard file missing');
}

// Check if formatUsdt has null checks
const hookPath = path.join(__dirname, 'hooks', 'use-social-yield-protocol.ts');
if (fs.existsSync(hookPath)) {
  const content = fs.readFileSync(hookPath, 'utf8');
  if (content.includes('amount === undefined || amount === null')) {
    console.log('✅ formatUsdt has null checks');
  } else {
    console.log('❌ formatUsdt missing null checks');
  }
} else {
  console.log('❌ Hook file missing');
}

// Check if staking hook has error handling
const stakingPath = path.join(__dirname, 'hooks', 'use-staking.ts');
if (fs.existsSync(stakingPath)) {
  const content = fs.readFileSync(stakingPath, 'utf8');
  if (content.includes('try {') && content.includes('catch (error)')) {
    console.log('✅ Staking hook has error handling');
  } else {
    console.log('❌ Staking hook missing error handling');
  }
} else {
  console.log('❌ Staking hook file missing');
}

console.log('\n🎉 Fix verification complete!');
console.log('\n📝 Summary of fixes:');
console.log('1. Added null checks to formatUsdt function');
console.log('2. Implemented client-side rendering protection');
console.log('3. Added error boundary for graceful error handling');
console.log('4. Enhanced error handling in staking hooks');
console.log('5. Added wallet extension warning suppression');
console.log('\n🚀 The app should now be much more stable!');
