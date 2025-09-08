'use client'

import { useAccount, useWalletClient } from 'wagmi'
import { useCallback, useState } from 'react'
import { 
  CampaignEscrowService, 
  createCampaignEscrowService,
  type Campaign,
  type Hash,
  ContractError,
  InsufficientFundsError,
  CampaignNotFoundError,
  CampaignInactiveError,
  InvalidAmountError,
  NotOwnerError
} from '@/lib/contracts'

export interface UseCampaignEscrowReturn {
  // State
  isLoading: boolean
  error: string | null
  
  // Read functions
  getCampaign: (campaignId: `0x${string}`) => Promise<Campaign | null>
  getDepositAmount: (campaignId: `0x${string}`) => Promise<bigint | null>
  getOwner: () => Promise<string | null>
  
  // Write functions
  createCampaign: (initialFunding: string) => Promise<Hash | null>
  addFunds: (campaignId: `0x${string}`, amount: string) => Promise<Hash | null>
  deposit: (campaignId: `0x${string}`, amount: string) => Promise<Hash | null>
  releaseFunds: (campaignId: `0x${string}`, recipient: string) => Promise<Hash | null>
  
  // Utility functions
  formatEther: (wei: bigint) => string
  parseEther: (ether: string) => bigint
  
  // Clear error
  clearError: () => void
}

export function useCampaignEscrow(): UseCampaignEscrowReturn {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = createCampaignEscrowService(walletClient || undefined)

  const handleError = useCallback((err: unknown) => {
    console.error('CampaignEscrow error:', err)
    
    if (err instanceof ContractError) {
      setError(err.message)
    } else if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('An unexpected error occurred')
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithLoading = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    if (!isConnected || !address) {
      setError('Please connect your wallet')
      return null
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, handleError])

  // Read functions
  const getCampaign = useCallback(async (campaignId: `0x${string}`): Promise<Campaign | null> => {
    return executeWithLoading(() => service.getCampaign(campaignId))
  }, [executeWithLoading, service])

  const getDepositAmount = useCallback(async (campaignId: `0x${string}`): Promise<bigint | null> => {
    return executeWithLoading(() => service.getDepositAmount(campaignId))
  }, [executeWithLoading, service])

  const getOwner = useCallback(async (): Promise<string | null> => {
    return executeWithLoading(async () => {
      const owner = await service.getOwner()
      return owner
    })
  }, [executeWithLoading, service])

  // Write functions
  const createCampaign = useCallback(async (initialFunding: string): Promise<Hash | null> => {
    return executeWithLoading(() => service.createCampaign(initialFunding))
  }, [executeWithLoading, service])

  const addFunds = useCallback(async (campaignId: `0x${string}`, amount: string): Promise<Hash | null> => {
    return executeWithLoading(() => service.addFunds(campaignId, amount))
  }, [executeWithLoading, service])

  const deposit = useCallback(async (campaignId: `0x${string}`, amount: string): Promise<Hash | null> => {
    return executeWithLoading(() => service.deposit(campaignId, amount))
  }, [executeWithLoading, service])

  const releaseFunds = useCallback(async (campaignId: `0x${string}`, recipient: string): Promise<Hash | null> => {
    return executeWithLoading(() => service.releaseFunds(campaignId, recipient as `0x${string}`))
  }, [executeWithLoading, service])

  // Utility functions
  const formatEther = useCallback((wei: bigint): string => {
    return service.formatEther(wei)
  }, [service])

  const parseEther = useCallback((ether: string): bigint => {
    return service.parseEther(ether)
  }, [service])

  return {
    // State
    isLoading,
    error,
    
    // Read functions
    getCampaign,
    getDepositAmount,
    getOwner,
    
    // Write functions
    createCampaign,
    addFunds,
    deposit,
    releaseFunds,
    
    // Utility functions
    formatEther,
    parseEther,
    
    // Clear error
    clearError
  }
}

// Error type guards for better error handling in components
export function isContractError(error: unknown): error is ContractError {
  return error instanceof ContractError
}

export function isInsufficientFundsError(error: unknown): error is InsufficientFundsError {
  return error instanceof InsufficientFundsError
}

export function isCampaignNotFoundError(error: unknown): error is CampaignNotFoundError {
  return error instanceof CampaignNotFoundError
}

export function isCampaignInactiveError(error: unknown): error is CampaignInactiveError {
  return error instanceof CampaignInactiveError
}

export function isInvalidAmountError(error: unknown): error is InvalidAmountError {
  return error instanceof InvalidAmountError
}

export function isNotOwnerError(error: unknown): error is NotOwnerError {
  return error instanceof NotOwnerError
}

// Export all error types for convenience
export {
  ContractError,
  InsufficientFundsError,
  CampaignNotFoundError,
  CampaignInactiveError,
  InvalidAmountError,
  NotOwnerError
} from '@/lib/contracts'
