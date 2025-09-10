'use client'

import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { useCallback, useState } from 'react'
import { 
  parseEther,
  formatEther,
  createWalletClient,
  custom,
  type Address,
  type Hash
} from 'viem'
import { kairos } from 'viem/chains'
import { CAMPAIGN_ESCROW_ABI, CAMPAIGN_ESCROW_ADDRESS } from '@/lib/escrow'

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
    
    // Resolve an effective wallet client (force network switch first, then build)
    let effectiveWallet = walletClient
    const provider = (typeof window !== 'undefined' ? (window as any)?.ethereum : undefined)
    try {
      if (provider?.request) {
        await provider.request({ method: 'eth_requestAccounts' })
        // Force switch to Kairos (1001)
        const desiredHex = '0x3e9'
        let currentHex = await provider.request({ method: 'eth_chainId' })
        if (currentHex?.toLowerCase() !== desiredHex) {
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: desiredHex }]
            })
          } catch (switchError: any) {
            if (switchError?.code === 4902) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: desiredHex,
                  chainName: 'Kairos Testnet',
                  nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
                  rpcUrls: ['https://public-en-kairos.node.kaia.io'],
                  blockExplorerUrls: ['https://explorer.kairos.kaia.io']
                }]
              })
            } else {
              throw switchError
            }
          }
          // Re-check after switch
          currentHex = await provider.request({ method: 'eth_chainId' })
        }
        if (currentHex?.toLowerCase() !== '0x3e9') {
          setError('Please switch your wallet to Kairos Testnet (1001) and try again.')
          return null
        }
        // Rebuild fresh client bound to Kairos
        effectiveWallet = createWalletClient({
          chain: kairos,
          transport: custom(provider)
        }) as typeof walletClient
      }
    } catch (e) {
      console.warn('Failed to set up wallet on Kairos:', e)
    }

    if (!effectiveWallet) {
      console.log('No wallet client available');
      setError('Please connect your wallet on Kairos Testnet (1001)');
      return null
    }

    return executeWithLoading(async () => {
      const amount = parseEther(initialFunding)
      console.log('Parsed amount:', amount.toString());
      console.log('Contract address:', CAMPAIGN_ESCROW_ADDRESS);
      // Preflight checks: chain and contract deployment
      if (!publicClient || !publicClient.chain) {
        setError('Network not detected. Please switch to Kairos Testnet (1001).')
        return null
      }
      if (publicClient.chain.id !== 1001) {
        setError(`Wrong network: ${publicClient.chain.name} (${publicClient.chain.id}). Switch to Kairos Testnet (1001).`)
        return null
      }

      // Wallet is ensured on Kairos above
      const bytecode = await publicClient.getBytecode({ address: CAMPAIGN_ESCROW_ADDRESS })
      if (!bytecode) {
        setError('CampaignEscrow not deployed on Kairos. Update lib/escrow/address.ts with the Kairos address.')
        return null
      }
      
      try {
        // Determine the active account directly from MetaMask/provider first
        let txAccount: Address | undefined
        try {
          const providerAccounts: string[] = await (provider as any)?.request?.({ method: 'eth_accounts' })
          if (Array.isArray(providerAccounts) && providerAccounts.length > 0) {
            txAccount = providerAccounts[0] as Address
          }
        } catch {}
        // Fallback to client-derived addresses
        if (!txAccount) {
          try {
            const addrs = await (effectiveWallet as any).getAddresses?.()
            if (addrs && addrs.length > 0) txAccount = addrs[0] as Address
          } catch {}
        }
        // Final fallback: wagmi address (may be wrong if using local json-rpc)
        if (!txAccount && address) {
          txAccount = address as Address
        }
        if (!txAccount) {
          setError('No wallet account detected. Please reconnect your wallet.')
          return null
        }

        // Preflight: ensure sufficient balance and simulate call
        try {
          const balance = await publicClient.getBalance({ address: txAccount })
          if (balance < amount) {
            setError('Insufficient KAIA balance for the provided initial funding.')
            return null
          }
        } catch {}

        try {
          await publicClient.simulateContract({
            address: CAMPAIGN_ESCROW_ADDRESS,
            abi: CAMPAIGN_ESCROW_ABI,
            functionName: 'createCampaign',
            args: [amount],
            account: txAccount,
            value: amount,
            chain: kairos
          })
        } catch (simErr: any) {
          const reason = (simErr?.shortMessage || simErr?.message || 'Simulation failed') as string
          setError(reason)
          throw simErr
        }

        const result = await effectiveWallet.writeContract({
          address: CAMPAIGN_ESCROW_ADDRESS,
          abi: CAMPAIGN_ESCROW_ABI,
          functionName: 'createCampaign',
          args: [amount],
          value: amount,
          account: txAccount,
          chain: kairos
        })
        console.log('Contract call successful, hash:', result);
        return result
      } catch (error) {
        console.error('Contract call failed:', error);
        if (error && typeof error === 'object' && 'details' in (error as any) && typeof (error as any).details === 'string') {
          setError((error as any).details as string)
        } else if (error instanceof Error && error.message) {
          setError(error.message)
        } else {
          setError('Transaction failed')
        }
        throw error
      }
    })
  }, [walletClient, address, publicClient, executeWithLoading])

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