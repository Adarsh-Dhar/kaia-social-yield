const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { kairos } = require('viem/chains');

// Use the test private key for minting
const MINT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const USDT_CONTRACT_ADDRESS = "0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee";
const TARGET_WALLET = "0xf76daC24BaEf645ee0b3dfAc1997c6b838eF280D";

const walletClient = createWalletClient({
  account: privateKeyToAccount(MINT_PRIVATE_KEY),
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

const publicClient = createPublicClient({
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

async function mintUSDT() {
  try {
    console.log('🪙 Minting 100 USDT...');
    console.log('USDT Contract:', USDT_CONTRACT_ADDRESS);
    console.log('Target Wallet:', TARGET_WALLET);
    console.log('Minter Wallet:', walletClient.account.address);
    
    // Check current balance
    const currentBalance = await publicClient.readContract({
      address: USDT_CONTRACT_ADDRESS,
      abi: [{
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view'
      }],
      functionName: 'balanceOf',
      args: [TARGET_WALLET]
    });
    
    console.log('Current balance:', (Number(currentBalance) / 1e6).toFixed(6), 'USDT');
    
    // Mint 100 USDT (100 * 10^6 for 6 decimals)
    const mintAmount = 100n * 10n ** 6n; // 100 USDT with 6 decimals
    
    console.log('Minting amount:', mintAmount.toString(), 'units');
    
    const hash = await walletClient.writeContract({
      address: USDT_CONTRACT_ADDRESS,
      abi: [{
        type: 'function',
        name: 'mint',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' }
        ],
        outputs: [],
        stateMutability: 'nonpayable'
      }],
      functionName: 'mint',
      args: [TARGET_WALLET, mintAmount]
    });
    
    console.log('✅ Mint transaction submitted:', hash);
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      console.log('🎉 USDT minted successfully!');
      
      // Check new balance
      const newBalance = await publicClient.readContract({
        address: USDT_CONTRACT_ADDRESS,
        abi: [{
          type: 'function',
          name: 'balanceOf',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view'
        }],
        functionName: 'balanceOf',
        args: [TARGET_WALLET]
      });
      
      console.log('New balance:', (Number(newBalance) / 1e6).toFixed(6), 'USDT');
      console.log('Transaction hash:', hash);
    } else {
      console.log('❌ Transaction failed');
    }
    
  } catch (error) {
    console.error('❌ Error minting USDT:', error.message);
    
    if (error.message.includes('NotOwner')) {
      console.log('💡 The minter wallet is not the owner of the USDT contract');
      console.log('💡 You need to use the owner wallet to mint tokens');
    }
  }
}

mintUSDT();
