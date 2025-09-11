const { createPublicClient, http } = require('viem');
const { kairos } = require('viem/chains');

const client = createPublicClient({
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

async function checkUSDTBalance(walletAddress) {
  try {
    const usdtAddress = '0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee';
    
    console.log('🔍 Checking USDT balance...');
    console.log('USDT Contract:', usdtAddress);
    console.log('Wallet Address:', walletAddress);
    
    const balance = await client.readContract({
      address: usdtAddress,
      abi: [{
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view'
      }],
      functionName: 'balanceOf',
      args: [walletAddress]
    });
    
    const formattedBalance = (Number(balance) / 1e6).toFixed(6);
    
    console.log('✅ Raw balance:', balance.toString());
    console.log('✅ Formatted balance:', formattedBalance, 'USDT');
    
    if (balance === 0n) {
      console.log('⚠️  This wallet has 0 USDT balance');
      console.log('💡 The test address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 has 100 USDT');
      console.log('💡 You can either:');
      console.log('   1. Connect with the test wallet (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)');
      console.log('   2. Transfer some USDT to your current wallet');
      console.log('   3. Mint some USDT to your wallet using the contract');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get wallet address from command line argument
const walletAddress = process.argv[2];
if (!walletAddress) {
  console.log('Usage: node scripts/check-usdt-balance.js <wallet-address>');
  console.log('Example: node scripts/check-usdt-balance.js 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
  process.exit(1);
}

checkUSDTBalance(walletAddress);
