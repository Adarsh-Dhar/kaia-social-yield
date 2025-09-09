import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther, 
  formatEther,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient
} from 'viem'
import { anvil } from 'viem/chains'
import { ESCROW_ABI } from './abi'
import { ESCROW_ADDRESS } from './address'

// Export the ABI and address for external use
export const CAMPAIGN_ESCROW_ABI = ESCROW_ABI
export const CAMPAIGN_ESCROW_ADDRESS = ESCROW_ADDRESS

// Types
export type Campaign = {
  id: `0x${string}` // bytes32 as hex string
  creator: Address
  totalFunding: bigint
  isActive: boolean
  createdAt: bigint
}

export type CampaignEscrowContract = {
  address: Address
  abi: typeof CAMPAIGN_ESCROW_ABI
}

// Contract configuration
export const CAMPAIGN_ESCROW_CONFIG: CampaignEscrowContract = {
  address: ESCROW_ADDRESS as Address,
  abi: CAMPAIGN_ESCROW_ABI
}

// Error types
export class ContractError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'ContractError'
  }
}

export class InsufficientFundsError extends ContractError {
  constructor() {
    super('Insufficient funds for transaction')
    this.name = 'InsufficientFundsError'
  }
}

export class CampaignNotFoundError extends ContractError {
  constructor() {
    super('Campaign not found')
    this.name = 'CampaignNotFoundError'
  }
}

export class CampaignInactiveError extends ContractError {
  constructor() {
    super('Campaign is inactive')
    this.name = 'CampaignInactiveError'
  }
}

export class InvalidAmountError extends ContractError {
  constructor() {
    super('Invalid amount provided')
    this.name = 'InvalidAmountError'
  }
}

export class NotOwnerError extends ContractError {
  constructor() {
    super('Only contract owner can perform this action')
    this.name = 'NotOwnerError'
  }
}

// Helper function to get the appropriate chain
function getChain() {
  return anvil // Always use Anvil for local development
}

// Helper function to get RPC URL
function getRpcUrl() {
  return 'http://127.0.0.1:8545' // Anvil local RPC
}

// Create clients
export function createClients() {
  const chain = getChain()
  const transport = http(getRpcUrl())
  
  const publicClient = createPublicClient({
    chain,
    transport
  })

  return { publicClient, chain }
}

// Contract interaction functions
export class CampaignEscrowService {
  private publicClient: PublicClient
  private walletClient?: WalletClient

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // Read functions
  async getCampaign(campaignId: `0x${string}`): Promise<Campaign> {
    try {
      const result = await this.publicClient.readContract({
        address: CAMPAIGN_ESCROW_CONFIG.address,
        abi: CAMPAIGN_ESCROW_CONFIG.abi,
        functionName: 'getCampaign',
        args: [campaignId]
      }) as {
        id: `0x${string}`
        creator: Address
        totalFunding: bigint
        isActive: boolean
        createdAt: bigint
      }

      return {
        id: result.id,
        creator: result.creator,
        totalFunding: result.totalFunding,
        isActive: result.isActive,
        createdAt: result.createdAt
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('CampaignNotFound')) {
        throw new CampaignNotFoundError()
      }
      throw new ContractError('Failed to get campaign', error)
    }
  }

  async getDepositAmount(campaignId: `0x${string}`): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: CAMPAIGN_ESCROW_CONFIG.address,
        abi: CAMPAIGN_ESCROW_CONFIG.abi,
        functionName: 'deposits',
        args: [campaignId]
      }) as bigint
    } catch (error) {
      throw new ContractError('Failed to get deposit amount', error)
    }
  }

  async getOwner(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: CAMPAIGN_ESCROW_CONFIG.address,
        abi: CAMPAIGN_ESCROW_CONFIG.abi,
        functionName: 'owner'
      }) as Address
    } catch (error) {
      throw new ContractError('Failed to get contract owner', error)
    }
  }

  // Write functions (require wallet client)
  async createCampaign(initialFunding: string): Promise<Hash> {
    console.log('Creating campaign with initial funding:', initialFunding)
    if (!this.walletClient || !this.walletClient.account) {
      throw new ContractError('Wallet client with account required for write operations')
    }
    console.log('Wallet client with account:', this.walletClient.account)
    try {
      const amount = parseEther(initialFunding)
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_ESCROW_CONFIG.address,
        abi: CAMPAIGN_ESCROW_CONFIG.abi,
        functionName: 'createCampaign',
        args: [amount],
        value: amount,
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('InvalidAmount')) {
          throw new InvalidAmountError()
        }
        if (error.message.includes('insufficient funds')) {
          throw new InsufficientFundsError()
        }
      }
      throw new ContractError('Failed to create campaign', error)
    }
  }

  async addFunds(campaignId: `0x${string}`, amount: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new ContractError('Wallet client with account required for write operations')
    }

    try {
      const parsedAmount = parseEther(amount)
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_ESCROW_CONFIG.address,
        abi: CAMPAIGN_ESCROW_CONFIG.abi,
        functionName: 'addFunds',
        args: [campaignId, parsedAmount],
        value: parsedAmount,
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('CampaignNotFound')) {
          throw new CampaignNotFoundError()
        }
        if (error.message.includes('CampaignInactive')) {
          throw new CampaignInactiveError()
        }
        if (error.message.includes('InvalidAmount')) {
          throw new InvalidAmountError()
        }
        if (error.message.includes('insufficient funds')) {
          throw new InsufficientFundsError()
        }
      }
      throw new ContractError('Failed to add funds to campaign', error)
    }
  }

  async deposit(campaignId: `0x${string}`, amount: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new ContractError('Wallet client with account required for write operations')
    }

    try {
      const parsedAmount = parseEther(amount)
      
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_ESCROW_CONFIG.address,
        abi: CAMPAIGN_ESCROW_CONFIG.abi,
        functionName: 'deposit',
        args: [campaignId],
        value: parsedAmount,
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error && error.message.includes('insufficient funds')) {
        throw new InsufficientFundsError()
      }
      throw new ContractError('Failed to deposit funds', error)
    }
  }

  async releaseFunds(campaignId: `0x${string}`, recipient: Address): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new ContractError('Wallet client with account required for write operations')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: CAMPAIGN_ESCROW_CONFIG.address,
        abi: CAMPAIGN_ESCROW_CONFIG.abi,
        functionName: 'releaseFunds',
        args: [campaignId, recipient],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('NotOwner')) {
          throw new NotOwnerError()
        }
        if (error.message.includes('NoFunds')) {
          throw new ContractError('No funds available to release')
        }
        if (error.message.includes('TransferFailed')) {
          throw new ContractError('Transfer failed')
        }
      }
      throw new ContractError('Failed to release funds', error)
    }
  }

  // Utility functions
  formatEther(wei: bigint): string {
    return formatEther(wei)
  }

  parseEther(ether: string): bigint {
    return parseEther(ether)
  }
}

// Factory function to create service instance
export function createCampaignEscrowService(walletClient?: WalletClient): CampaignEscrowService {
  const { publicClient } = createClients()
  return new CampaignEscrowService(publicClient, walletClient)
}

// Convenience functions for direct usage
export async function getCampaign(campaignId: `0x${string}`): Promise<Campaign> {
  const service = createCampaignEscrowService()
  return service.getCampaign(campaignId)
}

export async function getDepositAmount(campaignId: `0x${string}`): Promise<bigint> {
  const service = createCampaignEscrowService()
  return service.getDepositAmount(campaignId)
}

export async function getOwner(): Promise<Address> {
  const service = createCampaignEscrowService()
  return service.getOwner()
}