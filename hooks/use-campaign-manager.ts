import { useState, useCallback } from 'react'
import { useWalletClient } from 'wagmi'
import { 
  createCampaignManagerService,
  type Campaign,
  type Address,
  type Hash,
  CampaignManagerError,
  NotOperatorError,
  CampaignNotFoundError,
  CampaignInactiveOrFullError,
  NftContractNotSetError,
  NotCouponOwnerError,
  InvalidAmountError,
  InvalidRewardRangeError,
  ValueOutOfBoundsError,
  ContractNotDeployedError
} from '@/lib/campaign_manager'

export function useCampaignManager() {
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('CampaignManager error:', err)
    
    if (err instanceof CampaignManagerError) {
      setError(err.message)
    } else if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('An unknown error occurred')
    }
  }, [])

  // Read functions
  const getCampaign = useCallback(async (campaignId: `0x${string}`): Promise<Campaign | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const campaign = await service.getCampaign(campaignId)
      
      return campaign
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getUsdtTokenAddress = useCallback(async (): Promise<Address | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const address = await service.getUsdtTokenAddress()
      
      return address
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getCouponNftContract = useCallback(async (): Promise<Address | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const address = await service.getCouponNftContract()
      
      return address
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const getOperator = useCallback(async (): Promise<Address | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const address = await service.getOperator()
      
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
      
      const service = await createCampaignManagerService(walletClient)
      const address = await service.getOwner()
      
      return address
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  // Write functions
  const createCampaign = useCallback(async (
    budget: string,
    maxParticipants: string,
    minReward: string,
    maxReward: string,
    nftTokenURI: string
  ): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const hash = await service.createCampaign(
        budget,
        maxParticipants,
        minReward,
        maxReward,
        nftTokenURI
      )
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const awardCoupon = useCallback(async (
    user: Address,
    campaignId: `0x${string}`,
    randomCouponValue: string
  ): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const hash = await service.awardCoupon(user, campaignId, randomCouponValue)
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const redeemCoupon = useCallback(async (tokenId: string): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const hash = await service.redeemCoupon(tokenId)
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const setOperator = useCallback(async (newOperator: Address): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const hash = await service.setOperator(newOperator)
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  const setCouponNftContract = useCallback(async (nftAddress: Address): Promise<Hash | null> => {
    if (!walletClient) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const service = await createCampaignManagerService(walletClient)
      const hash = await service.setCouponNftContract(nftAddress)
      
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
      const service = createCampaignManagerService()
      return service.formatUsdt(amount)
    } catch (err) {
      console.error('Error formatting USDT:', err)
      return '0'
    }
  }, [])

  const parseUsdt = useCallback((amount: string): bigint => {
    try {
      const service = createCampaignManagerService()
      return service.parseUsdt(amount)
    } catch (err) {
      console.error('Error parsing USDT:', err)
      return BigInt(0)
    }
  }, [])

  const formatEther = useCallback((wei: bigint): string => {
    try {
      const service = createCampaignManagerService()
      return service.formatEther(wei)
    } catch (err) {
      console.error('Error formatting Ether:', err)
      return '0'
    }
  }, [])

  const parseEther = useCallback((ether: string): bigint => {
    try {
      const service = createCampaignManagerService()
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
    getCampaign,
    getUsdtTokenAddress,
    getCouponNftContract,
    getOperator,
    getOwner,
    
    // Write functions
    createCampaign,
    awardCoupon,
    redeemCoupon,
    setOperator,
    setCouponNftContract,
    
    // Utility functions
    formatUsdt,
    parseUsdt,
    formatEther,
    parseEther
  }
}
