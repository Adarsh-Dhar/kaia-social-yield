import { useState, useCallback } from 'react'
import { useWalletClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { 
  createSocialYieldProtocolService,
  type Staker,
  type Campaign,
  type Address,
  type Hash,
  SocialProtocolError,
  NotOperatorError,
  CampaignNotFoundError,
  CampaignInactiveError,
  InsufficientCampaignBudgetError,
  NoStakeError,
  InsufficientFundsError,
  InvalidAmountError,
  ContractNotDeployedError
} from '@/lib/social'

export function useSocialYieldProtocol() {
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const handleError = useCallback((error: unknown) => {
    console.error('Social Yield Protocol Error:', error)
    
    if (error instanceof ContractNotDeployedError) {
      setError('Contract not deployed. Please deploy the Social Yield Protocol contract to Kairos.')
    } else if (error instanceof NotOperatorError) {
      setError('Only the operator can perform this action')
    } else if (error instanceof CampaignNotFoundError) {
      setError('Campaign not found')
    } else if (error instanceof CampaignInactiveError) {
      setError('Campaign is inactive')
    } else if (error instanceof InsufficientCampaignBudgetError) {
      setError('Insufficient campaign budget')
    } else if (error instanceof NoStakeError) {
      setError('User has no stake')
    } else if (error instanceof InsufficientFundsError) {
      setError('Insufficient funds for transaction')
    } else if (error instanceof InvalidAmountError) {
      setError('Invalid amount provided')
    } else if (error instanceof SocialProtocolError) {
      setError(error.message)
    } else if (error instanceof Error) {
      setError(error.message)
    } else {
      setError('An unknown error occurred')
    }
  }, [])

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!walletClient) {
      setError('Wallet client required')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await operation()
      return result
    } catch (error) {
      handleError(error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, handleError])

  // Read functions
  const getStaker = useCallback(async (userAddress: Address): Promise<Staker | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.getStaker(userAddress)
    })
  }, [executeOperation, walletClient])

  const getCampaign = useCallback(async (campaignId: `0x${string}`): Promise<Campaign | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.getCampaign(campaignId)
    })
  }, [executeOperation, walletClient])

  const getTotalStaked = useCallback(async (): Promise<bigint | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.getTotalStaked()
    })
  }, [executeOperation, walletClient])

  const getBaseApyBps = useCallback(async (): Promise<bigint | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.getBaseApyBps()
    })
  }, [executeOperation, walletClient])

  const getUsdtTokenAddress = useCallback(async (): Promise<Address | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.getUsdtTokenAddress()
    })
  }, [executeOperation, walletClient])

  const getOperator = useCallback(async (): Promise<Address | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.getOperator()
    })
  }, [executeOperation, walletClient])

  const getOwner = useCallback(async (): Promise<Address | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.getOwner()
    })
  }, [executeOperation, walletClient])

  // Write functions
  const stake = useCallback(async (amount: string): Promise<Hash | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.stake(amount)
    })
  }, [executeOperation, walletClient])

  const withdraw = useCallback(async (amount: string): Promise<Hash | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.withdraw(amount)
    })
  }, [executeOperation, walletClient])

  const claimRewards = useCallback(async (): Promise<Hash | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.claimRewards()
    })
  }, [executeOperation, walletClient])

  const createCampaign = useCallback(async (budget: string, nftTokenURI: string = ''): Promise<Hash | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.createCampaign(budget, nftTokenURI)
    })
  }, [executeOperation, walletClient])

  const applyYieldBoost = useCallback(async (
    user: Address,
    campaignId: `0x${string}`,
    boostMultiplier: number,
    durationSeconds: number
  ): Promise<Hash | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.applyYieldBoost(user, campaignId, boostMultiplier, durationSeconds)
    })
  }, [executeOperation, walletClient])

  const setOperator = useCallback(async (newOperator: Address): Promise<Hash | null> => {
    return executeOperation(async () => {
      const service = await createSocialYieldProtocolService(walletClient)
      return service.setOperator(newOperator)
    })
  }, [executeOperation, walletClient])

  // Utility functions
  const formatUsdt = useCallback((amount: bigint | undefined | null): string => {
    // These are pure utility functions, no need for async
    if (amount === undefined || amount === null) {
      return '0'
    }
    return formatUnits(amount, 6) // USDT has 6 decimals
  }, [])

  const parseUsdt = useCallback((amount: string): bigint => {
    // These are pure utility functions, no need for async
    return parseUnits(amount, 6) // USDT has 6 decimals
  }, [])

  const formatEther = useCallback((wei: bigint): string => {
    // These are pure utility functions, no need for async
    return formatUnits(wei, 18)
  }, [])

  const parseEther = useCallback((ether: string): bigint => {
    // These are pure utility functions, no need for async
    return parseUnits(ether, 18)
  }, [])

  return {
    // State
    isLoading,
    error,
    clearError,

    // Read functions
    getStaker,
    getCampaign,
    getTotalStaked,
    getBaseApyBps,
    getUsdtTokenAddress,
    getOperator,
    getOwner,

    // Write functions
    stake,
    withdraw,
    claimRewards,
    createCampaign,
    applyYieldBoost,
    setOperator,

    // Utility functions
    formatUsdt,
    parseUsdt,
    formatEther,
    parseEther
  }
}
