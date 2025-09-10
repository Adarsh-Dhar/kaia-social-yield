import type { WalletClient, PublicClient } from 'viem'
import { createPublicClient, createWalletClient, http } from 'viem'
import { kairos } from 'viem/chains'
import { SOCIAL_YIELD_PROTOCOL_ABI } from './abi'
import { SOCIAL_YIELD_PROTOCOL_ADDRESS } from './address'
import type { Address, Hash, Staker, Campaign } from './types'

// Contract configuration
export const SOCIAL_YIELD_PROTOCOL_CONFIG = {
  address: SOCIAL_YIELD_PROTOCOL_ADDRESS as Address,
  abi: SOCIAL_YIELD_PROTOCOL_ABI
} as const

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
    throw new Error('Kairos network not available. Please check your internet connection.')
  }
  
  const transport = http(getRpcUrl())
  
  const publicClient = createPublicClient({
    chain,
    transport
  })

  return { publicClient, chain }
}

export class SocialYieldProtocolService {
  private publicClient: PublicClient
  private walletClient?: WalletClient

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // Read functions
  async getStaker(userAddress: Address): Promise<Staker> {
    const result = await this.publicClient.readContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'stakers',
      args: [userAddress]
    } as any) as [bigint, bigint, bigint]

    return {
      amountStaked: result[0],
      lastRewardUpdateTime: result[1],
      accumulatedRewards: result[2],
      rewards: result[2], // Use accumulatedRewards as rewards for now
      boostMultiplier: BigInt(0), // Placeholder - would need to be calculated
      boostExpiresAt: BigInt(0), // Placeholder - would need to be calculated
    }
  }

  async getCampaign(campaignId: `0x${string}`): Promise<Campaign> {
    const result = await this.publicClient.readContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'campaigns',
      args: [campaignId]
    } as any) as [Address, bigint, bigint, boolean, string]
    
    return {
      creator: result[0],
      budget: result[1],
      spent: result[2],
      isActive: result[3],
      nftTokenURI: result[4],
    }
  }

  async getTotalStaked(): Promise<bigint> {
    // This would need to be implemented differently as the contract doesn't have this function
    // For now, return 0 as a placeholder
    return BigInt(0)
  }

  async getBaseApyBps(): Promise<bigint> {
    return await this.publicClient.readContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'baseApyBps'
    } as any) as bigint
  }

  async getUsdtTokenAddress(): Promise<Address> {
    return await this.publicClient.readContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'usdtToken'
    } as any) as Address
  }

  async getOperator(): Promise<Address> {
    return await this.publicClient.readContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'operator'
    } as any) as Address
  }

  async getOwner(): Promise<Address> {
    return await this.publicClient.readContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'owner'
    } as any) as Address
  }

  // Write functions
  async stake(amount: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error('Wallet client with account required for write operations')
    }

    const amountBigInt = BigInt(amount)
    const hash = await this.walletClient.writeContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'stake',
      args: [amountBigInt],
      account: this.walletClient.account,
      chain: this.publicClient.chain
    })
    return hash as Hash
  }

  async withdraw(amount: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error('Wallet client with account required for write operations')
    }

    const amountBigInt = BigInt(amount)
    const hash = await this.walletClient.writeContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'withdraw',
      args: [amountBigInt],
      account: this.walletClient.account,
      chain: this.publicClient.chain
    })
    return hash as Hash
  }

  async claimRewards(): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error('Wallet client with account required for write operations')
    }

    const hash = await this.walletClient.writeContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'claimRewards',
      account: this.walletClient.account,
      chain: this.publicClient.chain
    })
    return hash as Hash
  }

  async createCampaign(budget: string, nftTokenURI: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error('Wallet client with account required for write operations')
    }

    const budgetBigInt = BigInt(budget)
    const hash = await this.walletClient.writeContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'createCampaign',
      args: [budgetBigInt, nftTokenURI],
      account: this.walletClient.account,
      chain: this.publicClient.chain
    })
    return hash as Hash
  }

  async applyYieldBoost(
    user: Address,
    campaignId: `0x${string}`,
    boostMultiplier: number,
    durationSeconds: number
  ): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error('Wallet client with account required for write operations')
    }

    const boostBps = BigInt(boostMultiplier * 100) // Convert to basis points
    const duration = BigInt(durationSeconds)
    const hash = await this.walletClient.writeContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'awardBoostNft',
      args: [user, campaignId, boostBps, duration],
      account: this.walletClient.account,
      chain: this.publicClient.chain
    })
    return hash as Hash
  }

  async setOperator(newOperator: Address): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new Error('Wallet client with account required for write operations')
    }

    const hash = await this.walletClient.writeContract({
      address: SOCIAL_YIELD_PROTOCOL_CONFIG.address,
      abi: SOCIAL_YIELD_PROTOCOL_CONFIG.abi,
      functionName: 'setOperator',
      args: [newOperator],
      account: this.walletClient.account,
      chain: this.publicClient.chain
    })
    return hash as Hash
  }
}

export async function createSocialYieldProtocolService(walletClient?: WalletClient): Promise<SocialYieldProtocolService> {
  const { publicClient } = await createClients()
  return new SocialYieldProtocolService(publicClient as any, walletClient)
}
