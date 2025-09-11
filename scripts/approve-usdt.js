const { createPublicClient, createWalletClient, http, formatUnits, parseUnits } = require('viem');
const { kairos } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

// USDT Contract ABI
const USDT_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view'
  }
];

const USDT_ADDRESS = '0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee';
const CAMPAIGN_MANAGER_ADDRESS = '0xBDc85FDE8A360013594Af89484D625D62bE4860c';
const TARGET_WALLET_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Test private key

const publicClient = createPublicClient({
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

const walletClient = createWalletClient({
  account: privateKeyToAccount(TARGET_WALLET_PRIVATE_KEY),
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

async function approveUSDT() {
  try {
    console.log('🔐 Approving USDT for Campaign Manager');
    console.log('=====================================');
    
    const account = walletClient.account.address;
    console.log('Using account:', account);
    
    // Check current balance and allowance
    const balance = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'balanceOf',
      args: [account]
    });
    
    const currentAllowance = await publicClient.readContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'allowance',
      args: [account, CAMPAIGN_MANAGER_ADDRESS]
    });
    
    console.log('Current USDT Balance:', formatUnits(balance, 6), 'USDT');
    console.log('Current Allowance:', formatUnits(currentAllowance, 6), 'USDT');
    
    if (currentAllowance > BigInt(0)) {
      console.log('✅ Allowance already exists, no need to approve');
      return;
    }
    
    // Approve a large amount (1 trillion USDT)
    const approveAmount = parseUnits('1000000000000', 6); // 1 trillion USDT
    console.log('Approving amount:', formatUnits(approveAmount, 6), 'USDT');
    
    // Get current gas price for EIP-1559
    const block = await publicClient.getBlock();
    const baseFee = block.baseFeePerGas || BigInt(1000000000); // 1 gwei fallback
    const maxPriorityFeePerGas = BigInt(2000000000); // 2 gwei
    const maxFeePerGas = baseFee * BigInt(2) + maxPriorityFeePerGas;
    
    console.log('Base fee:', baseFee.toString(), 'wei');
    console.log('Max priority fee:', maxPriorityFeePerGas.toString(), 'wei');
    console.log('Max fee per gas:', maxFeePerGas.toString(), 'wei');
    console.log('Max fee per gas in gwei:', (Number(maxFeePerGas) / 1e9).toFixed(2));
    
    // Estimate gas
    const gasEstimate = await publicClient.estimateContractGas({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'approve',
      args: [CAMPAIGN_MANAGER_ADDRESS, approveAmount],
      account: account
    });
    
    console.log('Gas estimate:', gasEstimate.toString());
    
    // Send approval transaction with EIP-1559
    const hash = await walletClient.writeContract({
      address: USDT_ADDRESS,
      abi: USDT_ABI,
      functionName: 'approve',
      args: [CAMPAIGN_MANAGER_ADDRESS, approveAmount],
      account: walletClient.account,
      chain: kairos,
      gas: gasEstimate + BigInt(10000), // Add buffer
      maxFeePerGas: maxFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas
    });
    
    console.log('Approval transaction hash:', hash);
    
    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
      timeout: 30000
    });
    
    console.log('Transaction status:', receipt.status);
    
    if (receipt.status === 'success') {
      // Verify new allowance
      const newAllowance = await publicClient.readContract({
        address: USDT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'allowance',
        args: [account, CAMPAIGN_MANAGER_ADDRESS]
      });
      
      console.log('New allowance:', formatUnits(newAllowance, 6), 'USDT');
      console.log('✅ USDT approval successful!');
    } else {
      console.log('❌ USDT approval failed');
    }
    
  } catch (error) {
    console.error('❌ Error approving USDT:', error);
  }
}

approveUSDT();
