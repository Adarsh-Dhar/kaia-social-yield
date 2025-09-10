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
import { COUPON_NFT_ABI } from './abi'
import { COUPON_NFT_ADDRESS } from './address'

// Export the ABI and address for external use
export const COUPON_NFT_ABI_EXPORT = COUPON_NFT_ABI
export const COUPON_NFT_ADDRESS_EXPORT = COUPON_NFT_ADDRESS

// Types
export type Coupon = {
  tokenId: bigint
  owner: Address
  value: bigint
  tokenURI: string
}

export type CouponNftContract = {
  address: Address
  abi: typeof COUPON_NFT_ABI
}

// Contract configuration
export const COUPON_NFT_CONFIG: CouponNftContract = {
  address: COUPON_NFT_ADDRESS as Address,
  abi: COUPON_NFT_ABI
}

// Check if contract address is valid (not placeholder)
export function isContractAddressValid(address: string): boolean {
  return address !== "0x0000000000000000000000000000000000000000" && 
         address !== "0x" && 
         address.length === 42 && 
         address.startsWith("0x")
}

// Error types
export class CouponNftError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'CouponNftError'
  }
}

export class NotManagerError extends CouponNftError {
  constructor() {
    super('Only the campaign manager can perform this action')
    this.name = 'NotManagerError'
  }
}

export class NonTransferableError extends CouponNftError {
  constructor() {
    super('Coupon NFTs are non-transferable (soulbound)')
    this.name = 'NonTransferableError'
  }
}

export class ContractNotDeployedError extends CouponNftError {
  constructor() {
    super('Contract not deployed. Please deploy the Coupon NFT contract to Kairos.')
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
    throw new CouponNftError('Kairos network not available. Please check your internet connection.')
  }
  
  const transport = http(getRpcUrl())
  
  const publicClient = createPublicClient({
    chain,
    transport
  })

  return { publicClient, chain }
}

// Contract interaction functions
export class CouponNftService {
  private publicClient: PublicClient
  private walletClient?: WalletClient

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // Read functions
  async getCouponValue(tokenId: bigint): Promise<bigint> {
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'getCouponValue',
        args: [tokenId]
      }) as bigint
    } catch (error) {
      throw new CouponNftError('Failed to get coupon value', error)
    }
  }

  async getOwnerOf(tokenId: bigint): Promise<Address> {
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'ownerOf',
        args: [tokenId]
      }) as Address
    } catch (error) {
      throw new CouponNftError('Failed to get token owner', error)
    }
  }

  async getBalanceOf(owner: Address): Promise<bigint> {
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'balanceOf',
        args: [owner]
      }) as bigint
    } catch (error) {
      throw new CouponNftError('Failed to get balance', error)
    }
  }

  async getTokenURI(tokenId: bigint): Promise<string> {
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'tokenURI',
        args: [tokenId]
      }) as string
    } catch (error) {
      throw new CouponNftError('Failed to get token URI', error)
    }
  }

  async getTokenByIndex(index: bigint): Promise<bigint> {
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'tokenByIndex',
        args: [index]
      }) as bigint
    } catch (error) {
      throw new CouponNftError('Failed to get token by index', error)
    }
  }

  async getTokenOfOwnerByIndex(owner: Address, index: bigint): Promise<bigint> {
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'tokenOfOwnerByIndex',
        args: [owner, index]
      }) as bigint
    } catch (error) {
      throw new CouponNftError('Failed to get token of owner by index', error)
    }
  }

  async getTotalSupply(): Promise<bigint> {
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'totalSupply'
      }) as bigint
    } catch (error) {
      throw new CouponNftError('Failed to get total supply', error)
    }
  }

  async getCampaignManager(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'campaignManager'
      }) as Address
    } catch (error) {
      throw new CouponNftError('Failed to get campaign manager address', error)
    }
  }

  async getOwner(): Promise<Address> {
    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'owner'
      }) as Address
    } catch (error) {
      throw new CouponNftError('Failed to get contract owner', error)
    }
  }

  async getName(): Promise<string> {
    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'name'
      }) as string
    } catch (error) {
      throw new CouponNftError('Failed to get contract name', error)
    }
  }

  async getSymbol(): Promise<string> {
    try {
      return await this.publicClient.readContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'symbol'
      }) as string
    } catch (error) {
      throw new CouponNftError('Failed to get contract symbol', error)
    }
  }

  // Write functions (require wallet client)
  async mintCoupon(
    recipient: Address,
    value: string,
    tokenURI: string
  ): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CouponNftError('Wallet client with account required for write operations')
    }

    // Check if contract address is valid
    if (!isContractAddressValid(COUPON_NFT_CONFIG.address)) {
      throw new ContractNotDeployedError()
    }

    try {
      const parsedValue = parseUnits(value, 6) // USDT has 6 decimals
      
      const hash = await this.walletClient.writeContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'mintCoupon',
        args: [recipient, parsedValue, tokenURI],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('User denied')) {
          throw new CouponNftError('Transaction cancelled by user')
        }
        if (error.message.includes('NotManager')) {
          throw new NotManagerError()
        }
        if (error.message.includes('execution reverted')) {
          throw new CouponNftError('Transaction failed. Please ensure the contract is properly deployed and you have the correct permissions.')
        }
        if (error.message.includes('gas')) {
          throw new CouponNftError('Transaction failed due to gas issues. The contract may not be properly deployed.')
        }
      }
      throw new CouponNftError('Failed to mint coupon', error)
    }
  }

  async burnCoupon(tokenId: string): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CouponNftError('Wallet client with account required for write operations')
    }

    try {
      const parsedTokenId = BigInt(tokenId)
      
      const hash = await this.walletClient.writeContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'burnCoupon',
        args: [parsedTokenId],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('NotManager')) {
          throw new NotManagerError()
        }
        if (error.message.includes('Token does not exist')) {
          throw new CouponNftError('Token does not exist')
        }
      }
      throw new CouponNftError('Failed to burn coupon', error)
    }
  }

  async setCampaignManager(managerAddress: Address): Promise<Hash> {
    if (!this.walletClient || !this.walletClient.account) {
      throw new CouponNftError('Wallet client with account required for write operations')
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: COUPON_NFT_CONFIG.address,
        abi: COUPON_NFT_CONFIG.abi,
        functionName: 'setCampaignManager',
        args: [managerAddress],
        account: this.walletClient.account,
        chain: this.publicClient.chain
      })

      return hash
    } catch (error) {
      throw new CouponNftError('Failed to set campaign manager', error)
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

  // Helper function to get all coupons for a user
  async getUserCoupons(userAddress: Address): Promise<Coupon[]> {
    try {
      const balance = await this.getBalanceOf(userAddress)
      const coupons: Coupon[] = []

      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await this.getTokenOfOwnerByIndex(userAddress, BigInt(i))
          const value = await this.getCouponValue(tokenId)
          const tokenURI = await this.getTokenURI(tokenId)

          coupons.push({
            tokenId,
            owner: userAddress,
            value,
            tokenURI
          })
        } catch (error) {
          // Skip invalid tokens
          console.warn(`Failed to get token at index ${i}:`, error)
        }
      }

      return coupons
    } catch (error) {
      throw new CouponNftError('Failed to get user coupons', error)
    }
  }
}

// Factory function to create service instance
export async function createCouponNftService(walletClient?: WalletClient): Promise<CouponNftService> {
  const { publicClient } = await createClients()
  return new CouponNftService(publicClient, walletClient)
}

// Fallback data when blockchain is not available
export const FALLBACK_DATA = {
  coupon: {
    tokenId: BigInt(0),
    owner: '0x0000000000000000000000000000000000000000' as Address,
    value: BigInt(0),
    tokenURI: ''
  }
}

// Convenience functions for direct usage
export async function getCouponValue(tokenId: bigint): Promise<bigint> {
  try {
    const service = await createCouponNftService()
    return service.getCouponValue(tokenId)
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return FALLBACK_DATA.coupon.value
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return FALLBACK_DATA.coupon.value
  }
}

export async function getOwnerOf(tokenId: bigint): Promise<Address> {
  const service = await createCouponNftService()
  return service.getOwnerOf(tokenId)
}

export async function getBalanceOf(owner: Address): Promise<bigint> {
  try {
    const service = await createCouponNftService()
    return service.getBalanceOf(owner)
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return BigInt(0)
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return BigInt(0)
  }
}

export async function getTokenURI(tokenId: bigint): Promise<string> {
  const service = await createCouponNftService()
  return service.getTokenURI(tokenId)
}

export async function getTotalSupply(): Promise<bigint> {
  try {
    const service = await createCouponNftService()
    return service.getTotalSupply()
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return BigInt(0)
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return BigInt(0)
  }
}

export async function getCampaignManager(): Promise<Address> {
  const service = await createCouponNftService()
  return service.getCampaignManager()
}

export async function getOwner(): Promise<Address> {
  const service = await createCouponNftService()
  return service.getOwner()
}

export async function getUserCoupons(userAddress: Address): Promise<Coupon[]> {
  try {
    const service = await createCouponNftService()
    return service.getUserCoupons(userAddress)
  } catch (error) {
    if (error instanceof ContractNotDeployedError) {
      console.warn('Contract not deployed, using fallback data:', error.message)
      return []
    }
    console.warn('Blockchain not available, using fallback data:', error)
    return []
  }
}
