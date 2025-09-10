import { useState, useCallback } from 'react'
import { useWalletClient } from 'wagmi'
import { 
  createCouponNftService,
  type Coupon,
  type Address,
  type Hash,
  CouponNftError,
  NotManagerError,
  NonTransferableError,
  ContractNotDeployedError
} from '@/lib/coupon_nft'

export function useCouponNft() {
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('CouponNFT error:', err)
    
    if (err instanceof CouponNftError) {
      setError(err.message)
    } else if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('An unknown error occurred')
    }
  }, [])

  // Read functions
  const getCouponValue = useCallback(async (tokenId: bigint): Promise<bigint | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const value = await service.getCouponValue(tokenId)
      
      return value
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getOwnerOf = useCallback(async (tokenId: bigint): Promise<Address | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const owner = await service.getOwnerOf(tokenId)
      
      return owner
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getBalanceOf = useCallback(async (owner: Address): Promise<bigint | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const balance = await service.getBalanceOf(owner)
      
      return balance
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getTokenURI = useCallback(async (tokenId: bigint): Promise<string | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const uri = await service.getTokenURI(tokenId)
      
      return uri
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getTotalSupply = useCallback(async (): Promise<bigint | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const supply = await service.getTotalSupply()
      
      return supply
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getUserCoupons = useCallback(async (userAddress: Address): Promise<Coupon[]> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return []
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const coupons = await service.getUserCoupons(userAddress)
      
      return coupons
    } catch (err) {
      handleError(err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getCampaignManager = useCallback(async (): Promise<Address | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const address = await service.getCampaignManager()
      
      return address
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getOwner = useCallback(async (): Promise<Address | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const address = await service.getOwner()
      
      return address
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getName = useCallback(async (): Promise<string | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const name = await service.getName()
      
      return name
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getSymbol = useCallback(async (): Promise<string | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const symbol = await service.getSymbol()
      
      return symbol
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  // Write functions
  const mintCoupon = useCallback(async (
    recipient: Address,
    value: string,
    tokenURI: string
  ): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const hash = await service.mintCoupon(recipient, value, tokenURI)
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const burnCoupon = useCallback(async (tokenId: string): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const hash = await service.burnCoupon(tokenId)
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const setCampaignManager = useCallback(async (managerAddress: Address): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCouponNftService(walletClient)
      const hash = await service.setCampaignManager(managerAddress)
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  // Utility functions
  const formatUsdt = useCallback((amount: bigint): string => {
    try {
      const service = createCouponNftService()
      return service.formatUsdt(amount)
    } catch (err) {
      console.error('Error formatting USDT:', err)
      return '0'
    }
  }, [])

  const parseUsdt = useCallback((amount: string): bigint => {
    try {
      const service = createCouponNftService()
      return service.parseUsdt(amount)
    } catch (err) {
      console.error('Error parsing USDT:', err)
      return BigInt(0)
    }
  }, [])

  const formatEther = useCallback((wei: bigint): string => {
    try {
      const service = createCouponNftService()
      return service.formatEther(wei)
    } catch (err) {
      console.error('Error formatting Ether:', err)
      return '0'
    }
  }, [])

  const parseEther = useCallback((ether: string): bigint => {
    try {
      const service = createCouponNftService()
      return service.parseEther(ether)
    } catch (err) {
      console.error('Error parsing Ether:', err)
      return BigInt(0)
    }
  }, [])

  return {
    // State
    isLoading,
    error,
    clearError,
    
    // Read functions
    getCouponValue,
    getOwnerOf,
    getBalanceOf,
    getTokenURI,
    getTotalSupply,
    getUserCoupons,
    getCampaignManager,
    getOwner,
    getName,
    getSymbol,
    
    // Write functions
    mintCoupon,
    burnCoupon,
    setCampaignManager,
    
    // Utility functions
    formatUsdt,
    parseUsdt,
    formatEther,
    parseEther
  }
}
