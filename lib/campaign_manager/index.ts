import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseUnits, 
  formatUnits,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient
} from 'viem'
import { kairos } from 'viem/chains'
import { CAMPAIGN_MANAGER_ABI } from './abi'
import { CAMPAIGN_MANAGER_ADDRESS } from './address'

// Export the ABI and address for external use
export const CAMPAIGN_MANAGER_ABI_EXPORT = CAMPAIGN_MANAGER_ABI
export const CAMPAIGN_MANAGER_ADDRESS_EXPORT = CAMPAIGN_MANAGER_ADDRESS

// Types
export type Campaign = {
  creator: Address
  totalBudget: bigint
  spent: bigint
  maxParticipants: bigint
  participantsCount: bigint
  minReward: bigint
  maxReward: bigint
  isActive: boolean
  nftTokenURI: string
}

export type CampaignManagerContract = {
  address: Address
  abi: typeof CAMPAIGN_MANAGER_ABI
}

// Contract configuration
export const CAMPAIGN_MANAGER_CONFIG: CampaignManagerContract = {
  address: CAMPAIGN_MANAGER_ADDRESS as Address,
  abi: CAMPAIGN_MANAGER_ABI
}

// Check if contract address is valid (not placeholder)
export function isContractAddressValid(address: string): boolean {
  return address !== "0x0000000000000000000000000000000000000000" && 
         address !== "0x" && 
         address.length === 42 && 
         address.startsWith("0x")
}

// Error types
export class CampaignManagerError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'CampaignManagerError'
  }
}

export class NotOperatorError extends CampaignManagerError {
  constructor() {
    super('Only the operator can perform this action')
    this.name = 'NotOperatorError'
  }
}

export class CampaignNotFoundError extends CampaignManagerError {
  constructor() {
    super('Campaign not found')
    this.name = 'CampaignNotFoundError'
  }
}

export class CampaignInactiveOrFullError extends CampaignManagerError {
  constructor() {
    super('Campaign is inactive or full')
    this.name = 'CampaignInactiveOrFullError'
  }
}

export class NftContractNotSetError extends CampaignManagerError {
  constructor() {
    super('NFT contract not set')
    this.name = 'NftContractNotSetError'
  }
}

export class NotCouponOwnerError extends CampaignManagerError {
  constructor() {
    super('Not the owner of this coupon')
    this.name = 'NotCouponOwnerError'
  }
}

export class InvalidAmountError extends CampaignManagerError {
  constructor() {
    super('Invalid amount provided')
    this.name = 'InvalidAmountError'
  }
}

export class InvalidRewardRangeError extends CampaignManagerError {
  constructor() {
    super('Invalid reward range provided')
    this.name = 'InvalidRewardRangeError'
  }
}

export class ValueOutOfBoundsError extends CampaignManagerError {
  constructor() {
    super('Value is out of bounds for this campaign')
    this.name = 'ValueOutOfBoundsError'
  }
}

export class ContractNotDeployedError extends CampaignManagerError {
  constructor() {
    super('Contract not deployed. Please deploy the Campaign Manager contract to Kairos.')
    this.name = 'ContractNotDeployedError'
  }
}

// Helper function to get the appropriate chain
function getChain() {
  return kairos // Use Kairos network
}

// Helper function to get RPC URL
function getRpcUrl() {
  return 'https://public-en-kairos.node.kaia.io' // Kairos RPC
}

// Check if RPC is available
async function isRpcAvailable(): Promise<boolean> {
  try {
    const response = await fetch('https://public-en-kairos.node.kaia.io', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })
    return response.ok
  } catch {
    return false
  }
}

// Create clients with error handling
export async function createClients() {
  const chain = getChain()
  const rpcAvailable = await isRpcAvailable()
  
  if (!rpcAvailable) {
    throw new CampaignManagerError('Kairos network not available. Please check your internet connection.')
  }
  
  const transport = http(getRpcUrl())
  
  const publicClient = createPublicClient({
    chain,
    transport
  })

  return { publicClient, chain }
}

// Contract interaction functions
export class CampaignManagerService {
  private publicClient: PublicClient
  private walletClient?: WalletClient

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // Minimal ERC20 ABI for approvals and allowance
  private static ERC20_ABI = [
    { type: 'function', name: 'decimals', inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view' },
    { type: 'function', name: 'balanceOf', inputs: [
      { name: 'account', type: 'address' }
    ], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'allowance', inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
    { type: 'function', name: 'approve', inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' }
  ] as const

  private async ensureUsdtAllowance(amount: bigint): Promise<void> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CampaignManagerError('Wallet client with account required for approval')
    }

    // Get USDT token address
    const token = await this.getUsdtTokenAddress()
    const owner = this.walletClient.account.address as Address
    const spender = CAMPAIGN_MANAGER_CONFIG.address

    // Check current allowance
    let allowance: bigint
    try {
      allowance = await this.publicClient.readContract({
        address: token,
        abi: CampaignManagerService.ERC20_ABI,
        functionName: 'allowance',
        args: [owner, spender]
      }) as bigint
      console.log('Current USDT allowance:', formatUnits(allowance, 6), 'USDT')
      console.log('Required amount:', formatUnits(amount, 6), 'USDT')
    } catch (error) {
      throw new CampaignManagerError('Failed to read USDT allowance', error)
    }

    if (allowance >= amount) {
      console.log('Sufficient allowance already exists')
      return
    }

    // Approve a generous amount to reduce future approvals (e.g., 1e12 tokens)
    const approveAmount = parseUnits('1000000000000', 6)
    console.log('Approving USDT amount:', formatUnits(approveAmount, 6), 'USDT')
    console.log('Spender (CampaignManager):', spender)
    try {
      // Estimate gas for approval
      let gasEstimate: bigint
      try {
        gasEstimate = await this.publicClient.estimateContractGas({
          address: token,
          abi: CampaignManagerService.ERC20_ABI,
          functionName: 'approve',
          args: [spender, approveAmount],
          account: this.walletClient.account.address
        })
        // Add 20% buffer to gas estimate
        gasEstimate = (gasEstimate * BigInt(120)) / BigInt(100)
      } catch (error) {
        console.warn('Gas estimation failed for approval, using default:', error)
        // Use a reasonable default gas limit for ERC20 approve (around 50k gas)
        gasEstimate = BigInt(50000)
      }

      // Get current gas price for EIP-1559
      let maxFeePerGas: bigint
      let maxPriorityFeePerGas: bigint
      try {
        const block = await this.publicClient.getBlock()
        const baseFee = block.baseFeePerGas || BigInt(1000000000) // 1 gwei fallback
        maxPriorityFeePerGas = BigInt(2000000000) // 2 gwei
        maxFeePerGas = baseFee * BigInt(2) + maxPriorityFeePerGas
      } catch (error) {
        console.warn('Failed to get gas price for approval, using defaults:', error)
        maxPriorityFeePerGas = BigInt(2000000000) // 2 gwei
        maxFeePerGas = BigInt(10000000000) // 10 gwei
      }

      const approvalHash = await this.walletClient.writeContract({
        address: token,
        abi: CampaignManagerService.ERC20_ABI,
        functionName: 'approve',
        args: [spender, approveAmount],
        account: this.walletClient.account,
        chain: this.publicClient.chain,
        gas: gasEstimate,
        maxFeePerGas: maxFeePerGas,
        maxPriorityFeePerGas: maxPriorityFeePerGas
      })
      
      console.log('USDT approval transaction hash:', approvalHash)
      
      // Wait for approval confirmation
      try {
        const approvalReceipt = await this.publicClient.waitForTransactionReceipt({
          hash: approvalHash,
          confirmations: 1,
          timeout: 30000
        })
        console.log('USDT approval confirmed, status:', approvalReceipt.status)
        
        if (approvalReceipt.status !== 'success') {
          throw new CampaignManagerError('USDT approval transaction failed')
        }
        
        // Verify the allowance was actually set
        const newAllowance = await this.publicClient.readContract({
          address: token,
          abi: CampaignManagerService.ERC20_ABI,
          functionName: 'allowance',
          args: [owner, spender]
        }) as bigint
        
        console.log('New USDT allowance:', formatUnits(newAllowance, 6), 'USDT')
        
        if (newAllowance < amount) {
          throw new CampaignManagerError('USDT allowance was not set correctly')
        }
        
      } catch (error) {
        console.warn('USDT approval confirmation failed:', error)
        throw new CampaignManagerError('USDT approval failed or was not confirmed')
      }
    } catch (error) {
      if (error instanceof Error && (error.message.includes('User rejected') || error.message.includes('User denied'))) {
        throw new CampaignManagerError('Transaction cancelled by user')
      }
      throw new CampaignManagerError('USDT approval failed', error)
    }
  }

  // Read functions
  async getCampaign(campaignId: `0x${string}`): Promise<Campaign> {
    if (!isContractAddressValid(CAMPAIGN_MANAGER_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      const result = await this.publicClient.readContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'campaigns',
        args: [campaignId]
      }) as unknown as {
        creator: Address
        totalBudget: bigint
        spent: bigint
        maxParticipants: bigint
        participantsCount: bigint
        minReward: bigint
        maxReward: bigint
        isActive: boolean
        nftTokenURI: string
      }

      return {
        creator: result.creator,
        totalBudget: result.totalBudget,
        spent: result.spent,
        maxParticipants: result.maxParticipants,
        participantsCount: result.participantsCount,
        minReward: result.minReward,
        maxReward: result.maxReward,
        isActive: result.isActive,
        nftTokenURI: result.nftTokenURI
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('CampaignNotFound')) {
        throw new CampaignNotFoundError()
      }
      throw new CampaignManagerError('Failed to get campaign', error)
    }
  }

  async getUsdtTokenAddress(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'usdtToken'
      }) as Address
    } catch (error) {
      throw new CampaignManagerError('Failed to get USDT token address', error)
    }
  }

  async getCouponNftContract(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'couponNftContract'
      }) as Address
    } catch (error) {
      throw new CampaignManagerError('Failed to get Coupon NFT contract address', error)
    }
  }

  async getOperator(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'operator'
      }) as Address
    } catch (error) {
      throw new CampaignManagerError('Failed to get operator address', error)
    }
  }

  async getOwner(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'owner'
      }) as Address
    } catch (error) {
      throw new CampaignManagerError('Failed to get contract owner', error)
    }
  }

  // Write functions (require wallet client)
  async createCampaign(
    budget: string,
    maxParticipants: string,
    minReward: string,
    maxReward: string,
    nftTokenURI: string
  ): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CampaignManagerError('Wallet client with account required for write operations')
    }

    // Check if contract address is valid
    if (!isContractAddressValid(CAMPAIGN_MANAGER_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      const parsedBudget = parseUnits(budget, 6) // USDT has 6 decimals
      const parsedMaxParticipants = BigInt(maxParticipants)
      const parsedMinReward = parseUnits(minReward, 6)
      const parsedMaxReward = parseUnits(maxReward, 6)
      
      // Check if amount is reasonable (not more than 1 million USDT)
      if (parsedBudget > parseUnits('1000000', 6)) {
        throw new InvalidAmountError()
      }
      
      // Check USDT balance first
      const usdtTokenAddress = await this.getUsdtTokenAddress()
      const userBalance = await this.publicClient.readContract({
        address: usdtTokenAddress,
        abi: CampaignManagerService.ERC20_ABI,
        functionName: 'balanceOf',
        args: [this.walletClient.account.address]
      }) as bigint
      
      console.log('User USDT balance:', formatUnits(userBalance, 6), 'USDT')
      console.log('Required budget:', formatUnits(parsedBudget, 6), 'USDT')
      
      if (userBalance < parsedBudget) {
        throw new CampaignManagerError(`Insufficient USDT balance. Required: ${formatUnits(parsedBudget, 6)} USDT, Available: ${formatUnits(userBalance, 6)} USDT`)
      }
      
      // Ensure USDT allowance for protocol
      await this.ensureUsdtAllowance(parsedBudget)
      
      // Estimate gas for the transaction
      let gasEstimate: bigint
      try {
        console.log('Estimating gas for createCampaign...')
        gasEstimate = await this.publicClient.estimateContractGas({
          address: CAMPAIGN_MANAGER_CONFIG.address,
          abi: CAMPAIGN_MANAGER_CONFIG.abi,
          functionName: 'createCampaign',
          args: [parsedBudget, parsedMaxParticipants, parsedMinReward, parsedMaxReward, nftTokenURI],
          account: this.walletClient.account.address
        })
        console.log('Gas estimate received:', gasEstimate.toString())
        // Add 20% buffer to gas estimate
        gasEstimate = (gasEstimate * BigInt(120)) / BigInt(100)
        // Cap gas estimate at 500k to prevent extremely high estimates
        const maxGas = BigInt(500000)
        if (gasEstimate > maxGas) {
          console.warn('Gas estimate too high, capping at:', maxGas.toString())
          gasEstimate = maxGas
        }
        console.log('Final gas estimate:', gasEstimate.toString())
      } catch (error) {
        console.warn('Gas estimation failed, using default:', error)
        // Use a reasonable default gas limit for createCampaign (around 200k gas)
        gasEstimate = BigInt(200000)
        console.log('Using default gas estimate:', gasEstimate.toString())
      }

      // Get current gas price for EIP-1559
      let maxFeePerGas: bigint
      let maxPriorityFeePerGas: bigint
      try {
        console.log('Getting gas price for EIP-1559...')
        const block = await this.publicClient.getBlock()
        const baseFee = block.baseFeePerGas || BigInt(1000000000) // 1 gwei fallback
        maxPriorityFeePerGas = BigInt(2000000000) // 2 gwei
        maxFeePerGas = baseFee * BigInt(2) + maxPriorityFeePerGas
        
        console.log('Base fee:', baseFee.toString(), 'wei')
        console.log('Max priority fee per gas:', maxPriorityFeePerGas.toString(), 'wei')
        console.log('Max fee per gas:', maxFeePerGas.toString(), 'wei')
        console.log('Max fee per gas in gwei:', (Number(maxFeePerGas) / 1e9).toFixed(2))
        
        // Cap max fee per gas at 100 gwei to prevent extremely high prices
        const maxFeeCap = BigInt(100000000000) // 100 gwei
        if (maxFeePerGas > maxFeeCap) {
          console.warn('Max fee per gas too high, capping at:', maxFeeCap.toString(), 'wei (100 gwei)')
          maxFeePerGas = maxFeeCap
        }
      } catch (error) {
        console.warn('Failed to get gas price, using defaults:', error)
        maxPriorityFeePerGas = BigInt(2000000000) // 2 gwei
        maxFeePerGas = BigInt(10000000000) // 10 gwei
        console.log('Using default max fee per gas:', maxFeePerGas.toString(), 'wei')
      }

      console.log('Sending transaction with:')
      console.log('- Gas limit:', gasEstimate.toString())
      console.log('- Max fee per gas:', maxFeePerGas.toString(), 'wei')
      console.log('- Max priority fee per gas:', maxPriorityFeePerGas.toString(), 'wei')
      console.log('- Estimated total cost:', (gasEstimate * maxFeePerGas).toString(), 'wei')
      console.log('- Estimated total cost in KAIA:', formatUnits(gasEstimate * maxFeePerGas, 18))

      // Try with explicit gas parameters first, fallback to wallet estimation if it fails
      let hash: Hash
      try {
        console.log('Attempting transaction with EIP-1559 gas parameters...')
        hash = await this.walletClient.writeContract({
          address: CAMPAIGN_MANAGER_CONFIG.address,
          abi: CAMPAIGN_MANAGER_CONFIG.abi,
          functionName: 'createCampaign',
          args: [parsedBudget, parsedMaxParticipants, parsedMinReward, parsedMaxReward, nftTokenURI],
          account: this.walletClient.account,
          chain: this.publicClient.chain,
          gas: gasEstimate,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas
        })
      } catch (gasError) {
        console.warn('Transaction with explicit gas failed, trying with wallet estimation:', gasError)
        // Fallback to wallet gas estimation
        hash = await this.walletClient.writeContract({
          address: CAMPAIGN_MANAGER_CONFIG.address,
          abi: CAMPAIGN_MANAGER_CONFIG.abi,
          functionName: 'createCampaign',
          args: [parsedBudget, parsedMaxParticipants, parsedMinReward, parsedMaxReward, nftTokenURI],
          account: this.walletClient.account,
          chain: this.publicClient.chain
        })
      }

      return hash
    } catch (error) {
      console.error('createCampaign error details:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('User denied')) {
          throw new CampaignManagerError('Transaction cancelled by user')
        }
        if (error.message.includes('InvalidAmount')) {
          throw new InvalidAmountError()
        }
        if (error.message.includes('InvalidRewardRange')) {
          throw new InvalidRewardRangeError()
        }
        if (error.message.includes('USDT transfer failed') || error.message.includes('TransferFrom failed')) {
          throw new CampaignManagerError('USDT transfer failed. Please check your USDT balance and allowance.')
        }
        if (error.message.includes('execution reverted')) {
          // Try to extract more specific error information
          if (error.message.includes('Internal JSON-RPC error')) {
            throw new CampaignManagerError('Contract execution failed. This might be due to insufficient USDT balance, allowance, or contract configuration issues.')
          }
          throw new CampaignManagerError('Transaction failed. Please check your USDT balance and ensure the contract is properly deployed.')
        }
        if (error.message.includes('gas')) {
          throw new CampaignManagerError('Transaction failed due to gas issues. The contract may not be properly deployed.')
        }
      }
      throw new CampaignManagerError('Failed to create campaign', error)
    }
  }

  async awardCoupon(
    user: Address,
    campaignId: `0x${string}`,
    randomCouponValue: string
  ): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CampaignManagerError('Wallet client with account required for write operations')
    }

    try {
      const parsedValue = parseUnits(randomCouponValue, 6) // USDT has 6 decimals
      
      // Estimate gas for the transaction
      let gasEstimate: bigint
      try {
        gasEstimate = await this.publicClient.estimateContractGas({
          address: CAMPAIGN_MANAGER_CONFIG.address,
          abi: CAMPAIGN_MANAGER_CONFIG.abi,
          functionName: 'awardCoupon',
          args: [user, campaignId, parsedValue],
          account: this.walletClient.account.address
        })
        // Add 20% buffer to gas estimate
        gasEstimate = (gasEstimate * BigInt(120)) / BigInt(100)
      } catch (error) {
        console.warn('Gas estimation failed for awardCoupon, using default:', error)
        // Use a reasonable default gas limit for awardCoupon (around 150k gas)
        gasEstimate = BigInt(150000)
      }
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'awardCoupon',
        args: [user, campaignId, parsedValue],
        account: this.walletClient.account,
        chain: this.publicClient.chain,
        gas: gasEstimate
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('NotOperator')) {
          throw new NotOperatorError()
        }
        if (error.message.includes('CampaignInactiveOrFull')) {
          throw new CampaignInactiveOrFullError()
        }
        if (error.message.includes('NftContractNotSet')) {
          throw new NftContractNotSetError()
        }
        if (error.message.includes('ValueOutOfBounds')) {
          throw new ValueOutOfBoundsError()
        }
      }
      throw new CampaignManagerError('Failed to award coupon', error)
    }
  }

  async redeemCoupon(tokenId: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CampaignManagerError('Wallet client with account required for write operations')
    }

    try {
      const parsedTokenId = BigInt(tokenId)
      
      // Estimate gas for the transaction
      let gasEstimate: bigint
      try {
        gasEstimate = await this.publicClient.estimateContractGas({
          address: CAMPAIGN_MANAGER_CONFIG.address,
          abi: CAMPAIGN_MANAGER_CONFIG.abi,
          functionName: 'redeemCoupon',
          args: [parsedTokenId],
          account: this.walletClient.account.address
        })
        // Add 20% buffer to gas estimate
        gasEstimate = (gasEstimate * BigInt(120)) / BigInt(100)
      } catch (error) {
        console.warn('Gas estimation failed for redeemCoupon, using default:', error)
        // Use a reasonable default gas limit for redeemCoupon (around 100k gas)
        gasEstimate = BigInt(100000)
      }
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'redeemCoupon',
        args: [parsedTokenId],
        account: this.walletClient.account,
        chain: this.publicClient.chain,
        gas: gasEstimate
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('NotCouponOwner')) {
          throw new NotCouponOwnerError()
        }
        if (error.message.includes('NftContractNotSet')) {
          throw new NftContractNotSetError()
        }
        if (error.message.includes('USDT transfer failed')) {
          throw new CampaignManagerError('USDT transfer failed')
        }
      }
      throw new CampaignManagerError('Failed to redeem coupon', error)
    }
  }

  async setOperator(newOperator: Address): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CampaignManagerError('Wallet client with account required for write operations')
    }

    try {
      // Estimate gas for the transaction
      let gasEstimate: bigint
      try {
        gasEstimate = await this.publicClient.estimateContractGas({
          address: CAMPAIGN_MANAGER_CONFIG.address,
          abi: CAMPAIGN_MANAGER_CONFIG.abi,
          functionName: 'setOperator',
          args: [newOperator],
          account: this.walletClient.account.address
        })
        // Add 20% buffer to gas estimate
        gasEstimate = (gasEstimate * BigInt(120)) / BigInt(100)
      } catch (error) {
        console.warn('Gas estimation failed for setOperator, using default:', error)
        // Use a reasonable default gas limit for setOperator (around 50k gas)
        gasEstimate = BigInt(50000)
      }
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'setOperator',
        args: [newOperator],
        account: this.walletClient.account,
        chain: this.publicClient.chain,
        gas: gasEstimate
      })

      return hash
    } catch (error) {
      throw new CampaignManagerError('Failed to set operator', error)
    }
  }

  async setCouponNftContract(nftAddress: Address): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CampaignManagerError('Wallet client with account required for write operations')
    }

    try {
      // Estimate gas for the transaction
      let gasEstimate: bigint
      try {
        gasEstimate = await this.publicClient.estimateContractGas({
          address: CAMPAIGN_MANAGER_CONFIG.address,
          abi: CAMPAIGN_MANAGER_CONFIG.abi,
          functionName: 'setCouponNftContract',
          args: [nftAddress],
          account: this.walletClient.account.address
        })
        // Add 20% buffer to gas estimate
        gasEstimate = (gasEstimate * BigInt(120)) / BigInt(100)
      } catch (error) {
        console.warn('Gas estimation failed for setCouponNftContract, using default:', error)
        // Use a reasonable default gas limit for setCouponNftContract (around 50k gas)
        gasEstimate = BigInt(50000)
      }
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'setCouponNftContract',
        args: [nftAddress],
        account: this.walletClient.account,
        chain: this.publicClient.chain,
        gas: gasEstimate
      })

      return hash
    } catch (error) {
      throw new CampaignManagerError('Failed to set Coupon NFT contract', error)
    }
  }

  // Utility functions
  formatUsdt(amount: bigint): string {
    return formatUnits(amount, 6) // USDT has 6 decimals
  }

  parseUsdt(amount: string): bigint {
    return parseUnits(amount, 6) // USDT has 6 decimals
  }

  formatEther(wei: bigint): string {
    return formatUnits(wei, 18)
  }

  parseEther(ether: string): bigint {
    return parseUnits(ether, 18)
  }
}

// Factory function to create service instance
export async function createCampaignManagerService(walletClient?: WalletClient): Promise<CampaignManagerService> {
  const { publicClient } = await createClients()
  return new CampaignManagerService(publicClient, walletClient)
}

// Fallback data when blockchain is not available
export const FALLBACK_DATA = {
  campaign: {
    creator: '0x0000000000000000000000000000000000000000' as Address,
    totalBudget: BigInt(0),
    spent: BigInt(0),
    maxParticipants: BigInt(0),
    participantsCount: BigInt(0),
    minReward: BigInt(0),
    maxReward: BigInt(0),
    isActive: false,
    nftTokenURI: ''
  }
}

// Convenience functions for direct usage
export async function getCampaign(campaignId: `0x${string}`): Promise<Campaign> {
  try {
    const service = await createCampaignManagerService()
    return service.getCampaign(campaignId)
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return FALLBACK_DATA.campaign
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return FALLBACK_DATA.campaign
  }
}

export async function getUsdtTokenAddress(): Promise<Address> {
  const service = await createCampaignManagerService()
  return service.getUsdtTokenAddress()
}

export async function getCouponNftContract(): Promise<Address> {
  const service = await createCampaignManagerService()
  return service.getCouponNftContract()
}

export async function getOperator(): Promise<Address> {
  const service = await createCampaignManagerService()
  return service.getOperator()
}

export async function getOwner(): Promise<Address> {
  const service = await createCampaignManagerService()
  return service.getOwner()
}
