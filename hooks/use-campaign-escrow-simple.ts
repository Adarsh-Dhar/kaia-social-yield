'use client'

import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useCallback, useState } from 'react'
import { 
  parseEther,
  formatEther,
  type Address,
  type Hash
} from 'viem'
import { CAMPAIGN_ESCROW_ABI, CAMPAIGN_ESCROW_ADDRESS } from '@/lib/contracts'

export interface Campaign {
  id: `0x${string}` // bytes32 as hex string
  creator: Address
  totalFunding: bigint
  isActive: boolean
  createdAt: bigint
}

export interface UseCampaignEscrowSimpleReturn {
  // State
  isLoading: boolean
  error: string | null
  
  // Read functions
  getCampaign: (campaignId: `0x${string}`) => Promise<Campaign | null>
  getDepositAmount: (campaignId: `0x${string}`) => Promise<bigint | null>
  getOwner: () => Promise<Address | null>
  
  // Write functions
  createCampaign: (initialFunding: string) => Promise<Hash | null>
  addFunds: (campaignId: `0x${string}`, amount: string) => Promise<Hash | null>
  deposit: (campaignId: `0x${string}`, amount: string) => Promise<Hash | null>
  releaseFunds: (campaignId: `0x${string}`, recipient: Address) => Promise<Hash | null>
  
  // Utility functions
  formatEther: (wei: bigint) => string
  parseEther: (ether: string) => bigint
  
  // Clear error
  clearError: () => void
}

export function useCampaignEscrowSimple(): UseCampaignEscrowSimpleReturn {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((err: unknown) => {
    console.error('CampaignEscrow error:', err)
    
    if (err instanceof Error) {
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

  // Read functions using publicClient directly
  const getCampaign = useCallback(async (campaignId: `0x${string}`): Promise<Campaign | null> => {
    if (!publicClient) return null

    return executeWithLoading(async () => {
      const result = await publicClient.readContract({
        address: CAMPAIGN_ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
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
    })
  }, [publicClient, executeWithLoading])

  const getDepositAmount = useCallback(async (campaignId: `0x${string}`): Promise<bigint | null> => {
    if (!publicClient) return null

    return executeWithLoading(async () => {
      return await publicClient.readContract({
        address: CAMPAIGN_ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: 'deposits',
        args: [campaignId]
      }) as bigint
    })
  }, [publicClient, executeWithLoading])

  const getOwner = useCallback(async (): Promise<Address | null> => {
    if (!publicClient) return null

    return executeWithLoading(async () => {
      return await publicClient.readContract({
        address: CAMPAIGN_ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: 'owner'
      }) as Address
    })
  }, [publicClient, executeWithLoading])

  // Write functions using walletClient directly
  const createCampaign = useCallback(async (initialFunding: string): Promise<Hash | null> => {
    console.log('createCampaign called with:', initialFunding);
    console.log('walletClient:', !!walletClient);
    console.log('walletClient.account:', walletClient?.account);
    
    if (!walletClient || !walletClient.account) {
      console.log('No wallet client or account available');
      setError('Wallet not connected or account not available');
      return null
    }

    return executeWithLoading(async () => {
      const amount = parseEther(initialFunding)
      console.log('Parsed amount:', amount.toString());
      console.log('Contract address:', CAMPAIGN_ESCROW_ADDRESS);
      
      try {
        const result = await walletClient.writeContract({
          address: CAMPAIGN_ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: 'createCampaign',
          args: [amount],
          value: amount,
          account: walletClient.account
        })
        console.log('Contract call successful, hash:', result);
        return result
      } catch (error) {
        console.error('Contract call failed:', error);
        throw error
      }
    })
  }, [walletClient, executeWithLoading])

  const addFunds = useCallback(async (campaignId: `0x${string}`, amount: string): Promise<Hash | null> => {
    if (!walletClient || !walletClient.account) return null

    return executeWithLoading(async () => {
      const parsedAmount = parseEther(amount)
      
      return await walletClient.writeContract({
        address: CAMPAIGN_ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: 'addFunds',
        args: [campaignId, parsedAmount],
        value: parsedAmount,
        account: walletClient.account
      })
    })
  }, [walletClient, executeWithLoading])

  const deposit = useCallback(async (campaignId: `0x${string}`, amount: string): Promise<Hash | null> => {
    if (!walletClient || !walletClient.account) return null

    return executeWithLoading(async () => {
      const parsedAmount = parseEther(amount)
      
      return await walletClient.writeContract({
        address: CAMPAIGN_ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: 'deposit',
        args: [campaignId],
        value: parsedAmount,
        account: walletClient.account
      })
    })
  }, [walletClient, executeWithLoading])

  const releaseFunds = useCallback(async (campaignId: `0x${string}`, recipient: Address): Promise<Hash | null> => {
    if (!walletClient || !walletClient.account) return null

    return executeWithLoading(async () => {
      return await walletClient.writeContract({
        address: CAMPAIGN_ESCROW_ADDRESS,
        abi: CAMPAIGN_ESCROW_ABI,
        functionName: 'releaseFunds',
        args: [campaignId, recipient],
        account: walletClient.account
      })
    })
  }, [walletClient, executeWithLoading])

  // Utility functions
  const formatEtherUtil = useCallback((wei: bigint): string => {
    return formatEther(wei)
  }, [])

  const parseEtherUtil = useCallback((ether: string): bigint => {
    return parseEther(ether)
  }, [])

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
    formatEther: formatEtherUtil,
    parseEther: parseEtherUtil,
    
    // Clear error
    clearError
  }
}