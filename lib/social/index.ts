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
import { SOCIAL_YIELD_ABI } from './abi'
import { SOCIAL_YIELD_ADDRESS } from './address'

// Export the ABI and address for external use
export const SOCIAL_YIELD_PROTOCOL_ABI = SOCIAL_YIELD_ABI
export const SOCIAL_YIELD_PROTOCOL_ADDRESS = SOCIAL_YIELD_ADDRESS

// Types
export type Staker = {
  amountStaked: bigint
  rewards: bigint
  boostMultiplier: bigint
  boostExpiresAt: bigint
}

export type Campaign = {
  id: `0x${string}` // bytes32 as hex string
  creator: Address
  budget: bigint
  spent: bigint
  isActive: boolean
}

export type SocialYieldProtocolContract = {
  address: Address
  abi: typeof SOCIAL_YIELD_PROTOCOL_ABI
}

// Contract configuration
export const SOCIAL_YIELD_PROTOCOL_CONFIG: SocialYieldProtocolContract = {
  address: SOCIAL_YIELD_ADDRESS as Address,
  abi: SOCIAL_YIELD_PROTOCOL_ABI
}

// Check if contract address is valid (not placeholder)
export function isContractAddressValid(address: string): boolean {
  return address !== "0x0000000000000000000000000000000000000000" && 
         address !== "0x" && 
         address.length === 42 && 
         address.startsWith("0x")
}

// Error types
export class SocialProtocolError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'SocialProtocolError'
  }
}

export class NotOperatorError extends SocialProtocolError {
  constructor() {
    super('Only the operator can perform this action')
    this.name = 'NotOperatorError'
  }
}

export class CampaignNotFoundError extends SocialProtocolError {
  constructor() {
    super('Campaign not found')
    this.name = 'CampaignNotFoundError'
  }
}

export class CampaignInactiveError extends SocialProtocolError {
  constructor() {
    super('Campaign is inactive')
    this.name = 'CampaignInactiveError'
  }
}

export class InsufficientCampaignBudgetError extends SocialProtocolError {
  constructor() {
    super('Insufficient campaign budget')
    this.name = 'InsufficientCampaignBudgetError'
  }
}

export class NoStakeError extends SocialProtocolError {
  constructor() {
    super('User has no stake')
    this.name = 'NoStakeError'
  }
}

export class InsufficientFundsError extends SocialProtocolError {
  constructor() {
    super('Insufficient funds for transaction')
    this.name = 'InsufficientFundsError'
  }
}

export class InvalidAmountError extends SocialProtocolError {
  constructor() {
    super('Invalid amount provided')
    this.name = 'InvalidAmountError'
  }
}

export class ContractNotDeployedError extends SocialProtocolError {
  constructor() {
    super('Contract not deployed. Please deploy the Social Yield Protocol contract to Kairos.')
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
    throw new SocialProtocolError('Kairos network not available. Please check your internet connection.')
  }
  
  const transport = http(getRpcUrl())
  
  const publicClient = createPublicClient({
    chain,
    transport
  })

  return { publicClient, chain }
}

// Contract interaction functions
export class SocialYieldProtocolService {
  private publicClient: PublicClient
  private walletClient?: WalletClient

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // Read functions
  async getStaker(userAddress: Address): Promise<Staker> {
    if (!isContractAddressValid(SOCIAL_YIELD_PROTOCOL_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      const result = await this.publicClient.readContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'stakers',
        args: [userAddress]
      }) as unknown as {
        amountStaked: bigint
        rewards: bigint
        boostMultiplier: bigint
        boostExpiresAt: bigint
      }

      return {
        amountStaked: result.amountStaked,
        rewards: result.rewards,
        boostMultiplier: result.boostMultiplier,
        boostExpiresAt: result.boostExpiresAt
      }
    } catch (error) {
      throw new SocialProtocolError('Failed to get staker data', error)
    }
  }

  async getCampaign(campaignId: `0x${string}`): Promise<Campaign> {
    try {
      const result = await this.publicClient.readContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'campaigns',
        args: [campaignId]
      }) as unknown as {
        id: `0x${string}`
        creator: Address
        budget: bigint
        spent: bigint
        isActive: boolean
      }

      return {
        id: result.id,
        creator: result.creator,
        budget: result.budget,
        spent: result.spent,
        isActive: result.isActive
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('CampaignNotFound')) {
        throw new CampaignNotFoundError()
      }
      throw new SocialProtocolError('Failed to get campaign', error)
    }
  }

  async getTotalStaked(): Promise<bigint> {
    if (!isContractAddressValid(SOCIAL_YIELD_PROTOCOL_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'totalStaked'
      }) as bigint
    } catch (error) {
      throw new SocialProtocolError('Failed to get total staked', error)
    }
  }

  async getBaseApyBps(): Promise<bigint> {
    if (!isContractAddressValid(SOCIAL_YIELD_PROTOCOL_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'baseApyBps'
      }) as bigint
    } catch (error) {
      throw new SocialProtocolError('Failed to get base APY', error)
    }
  }

  async getUsdtTokenAddress(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'usdtToken'
      }) as Address
    } catch (error) {
      throw new SocialProtocolError('Failed to get USDT token address', error)
    }
  }

  async getOperator(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'operator'
      }) as Address
    } catch (error) {
      throw new SocialProtocolError('Failed to get operator address', error)
    }
  }

  async getOwner(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'owner'
      }) as Address
    } catch (error) {
      throw new SocialProtocolError('Failed to get contract owner', error)
    }
  }

  // Write functions (require wallet client)
  async stake(amount: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new SocialProtocolError('Wallet client with account required for write operations')
    }

    // Check if contract address is valid
    if (!isContractAddressValid(SOCIAL_YIELD_PROTOCOL_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      const parsedAmount = parseUnits(amount, 6) // USDT has 6 decimals
      
      // Check if amount is reasonable (not more than 1 million USDT)
      if (parsedAmount > parseUnits('1000000', 6)) {
        throw new InvalidAmountError()
      }
      
      const hash = await this.walletClient.writeContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'stake',
        args: [parsedAmount],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('User denied')) {
          throw new SocialProtocolError('Transaction cancelled by user')
        }
        if (error.message.includes('Cannot stake 0')) {
          throw new InvalidAmountError()
        }
        if (error.message.includes('USDT transfer failed')) {
          throw new InsufficientFundsError()
        }
        if (error.message.includes('execution reverted')) {
          throw new SocialProtocolError('Transaction failed. Please check your USDT balance and ensure the contract is properly deployed.')
        }
        if (error.message.includes('gas')) {
          throw new SocialProtocolError('Transaction failed due to gas issues. The contract may not be properly deployed.')
        }
      }
      throw new SocialProtocolError('Failed to stake', error)
    }
  }

  async withdraw(amount: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new SocialProtocolError('Wallet client with account required for write operations')
    }

    try {
      const parsedAmount = parseUnits(amount, 6) // USDT has 6 decimals
      
      const hash = await this.walletClient.writeContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'withdraw',
        args: [parsedAmount],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Cannot withdraw 0')) {
          throw new InvalidAmountError()
        }
        if (error.message.includes('Withdraw amount exceeds stake')) {
          throw new InsufficientFundsError()
        }
        if (error.message.includes('USDT transfer failed')) {
          throw new SocialProtocolError('USDT transfer failed')
        }
      }
      throw new SocialProtocolError('Failed to withdraw', error)
    }
  }

  async claimRewards(): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new SocialProtocolError('Wallet client with account required for write operations')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'claimRewards',
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('No rewards to claim')) {
          throw new SocialProtocolError('No rewards to claim')
        }
        if (error.message.includes('Protocol reward pool insufficient')) {
          throw new SocialProtocolError('Protocol reward pool insufficient')
        }
        if (error.message.includes('Reward transfer failed')) {
          throw new SocialProtocolError('Reward transfer failed')
        }
      }
      throw new SocialProtocolError('Failed to claim rewards', error)
    }
  }

  async createCampaign(budget: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new SocialProtocolError('Wallet client with account required for write operations')
    }

    try {
      const parsedBudget = parseUnits(budget, 6) // USDT has 6 decimals
      
      const hash = await this.walletClient.writeContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'createCampaign',
        args: [parsedBudget],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Budget must be greater than 0')) {
          throw new InvalidAmountError()
        }
        if (error.message.includes('USDT transfer for budget failed')) {
          throw new InsufficientFundsError()
        }
      }
      throw new SocialProtocolError('Failed to create campaign', error)
    }
  }

  async applyYieldBoost(
    user: Address, 
    campaignId: `0x${string}`, 
    boostMultiplier: number, 
    durationSeconds: number
  ): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new SocialProtocolError('Wallet client with account required for write operations')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'applyYieldBoost',
        args: [user, campaignId, BigInt(boostMultiplier), BigInt(durationSeconds)],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('NotOperator')) {
          throw new NotOperatorError()
        }
        if (error.message.includes('NoStake')) {
          throw new NoStakeError()
        }
        if (error.message.includes('CampaignNotFound')) {
          throw new CampaignNotFoundError()
        }
        if (error.message.includes('CampaignInactive')) {
          throw new CampaignInactiveError()
        }
      }
      throw new SocialProtocolError('Failed to apply yield boost', error)
    }
  }

  async setOperator(newOperator: Address): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new SocialProtocolError('Wallet client with account required for write operations')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
        abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
        functionName: 'setOperator',
        args: [newOperator],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      throw new SocialProtocolError('Failed to set operator', error)
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
export async function createSocialYieldProtocolService(walletClient?: WalletClient): Promise<SocialYieldProtocolService> {
  const { publicClient } = await createClients()
  return new SocialYieldProtocolService(publicClient, walletClient)
}

// Fallback data when blockchain is not available
export const FALLBACK_DATA = {
  baseApyBps: BigInt(500), // 5% APY in basis points
  totalStaked: BigInt(0),
  staker: {
    amountStaked: BigInt(0),
    rewards: BigInt(0),
    boostMultiplier: BigInt(0),
    boostExpiresAt: BigInt(0)
  }
}

// Convenience functions for direct usage
export async function getStaker(userAddress: Address): Promise<Staker> {
  try {
    const service = await createSocialYieldProtocolService()
    return service.getStaker(userAddress)
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return FALLBACK_DATA.staker
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return FALLBACK_DATA.staker
  }
}

export async function getCampaign(campaignId: `0x${string}`): Promise<Campaign> {
  const service = await createSocialYieldProtocolService()
  return service.getCampaign(campaignId)
}

export async function getTotalStaked(): Promise<bigint> {
  try {
    const service = await createSocialYieldProtocolService()
    return service.getTotalStaked()
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return FALLBACK_DATA.totalStaked
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return FALLBACK_DATA.totalStaked
  }
}

export async function getBaseApyBps(): Promise<bigint> {
  try {
    const service = await createSocialYieldProtocolService()
    return service.getBaseApyBps()
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return FALLBACK_DATA.baseApyBps
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return FALLBACK_DATA.baseApyBps
  }
}

export async function getUsdtTokenAddress(): Promise<Address> {
  const service = await createSocialYieldProtocolService()
  return service.getUsdtTokenAddress()
}

export async function getOperator(): Promise<Address> {
  const service = await createSocialYieldProtocolService()
  return service.getOperator()
}

export async function getOwner(): Promise<Address> {
  const service = await createSocialYieldProtocolService()
  return service.getOwner()
}
