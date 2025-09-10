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
    } catch (error) {
      throw new CampaignManagerError('Failed to read USDT allowance', error)
    }

    if (allowance >= amount) return

    // Approve a generous amount to reduce future approvals (e.g., 1e12 tokens)
    const approveAmount = parseUnits('1000000000000', 6)
    try {
      await this.walletClient.writeContract({
        address: token,
        abi: CampaignManagerService.ERC20_ABI,
        functionName: 'approve',
        args: [spender, approveAmount],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })
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
      
      // Ensure USDT allowance for protocol
      await this.ensureUsdtAllowance(parsedBudget)
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'createCampaign',
        args: [parsedBudget, parsedMaxParticipants, parsedMinReward, parsedMaxReward, nftTokenURI],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
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
        if (error.message.includes('USDT transfer failed')) {
          throw new CampaignManagerError('Insufficient USDT balance')
        }
        if (error.message.includes('execution reverted')) {
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
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'awardCoupon',
        args: [user, campaignId, parsedValue],
        account: this.walletClient.account,
        chain: this.publicClient.chain
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
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'redeemCoupon',
        args: [parsedTokenId],
        account: this.walletClient.account,
        chain: this.publicClient.chain
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
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'setOperator',
        args: [newOperator],
        account: this.walletClient.account,
        chain: this.publicClient.chain
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
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_MANAGER_CONFIG.address,
        abi: CAMPAIGN_MANAGER_CONFIG.abi,
        functionName: 'setCouponNftContract',
        args: [nftAddress],
        account: this.walletClient.account,
        chain: this.publicClient.chain
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
