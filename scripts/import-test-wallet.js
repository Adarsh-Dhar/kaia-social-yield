#!/usr/bin/env node

/**
 * Test Wallet Import Helper
 * 
 * This script provides the details needed to import the test wallet
 * that already has 100 USDT on Kairos Testnet.
 */

const testWallet = {
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  network: 'Kairos Testnet',
  chainId: 1001,
  rpcUrl: 'https://public-en-kairos.node.kaia.io',
  usdtBalance: '100 USDT'
};

console.log('🔑 Test Wallet Details');
console.log('====================');
console.log('');
console.log('Address:', testWallet.address);
console.log('Private Key:', testWallet.privateKey);
console.log('Network:', testWallet.network);
console.log('Chain ID:', testWallet.chainId);
console.log('RPC URL:', testWallet.rpcUrl);
console.log('USDT Balance:', testWallet.usdtBalance);
console.log('');
console.log('📋 Import Instructions:');
console.log('1. Open MetaMask (or your wallet)');
console.log('2. Click "Import Account"');
console.log('3. Select "Private Key"');
console.log('4. Paste the private key above');
console.log('5. Switch to Kairos Testnet (Chain ID: 1001)');
console.log('6. Refresh your app');
console.log('');
console.log('✅ You should now see 100 USDT balance!');
console.log('');
console.log('🔗 Network Details for Manual Setup:');
console.log('Network Name: Kairos Testnet');
console.log('RPC URL: https://public-en-kairos.node.kaia.io');
console.log('Chain ID: 1001');
console.log('Currency Symbol: KAI');
console.log('Block Explorer: https://explorer.kairos.kaia.io');
