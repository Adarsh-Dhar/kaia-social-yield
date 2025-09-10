'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { 
  parseUnits, 
  formatUnits,
  type Address,
  type Hash
} from 'viem'
import { kairos } from 'viem/chains'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'

// MockUSDT ABI
const MOCK_USDT_ABI = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export interface UseMockUSDTReturn {
  // State
  balance: bigint
  isLoading: boolean
  error: string | null
  
  // Read functions
  loadBalance: () => Promise<void>
  
  // Write functions
  transfer: (to: Address, amount: string) => Promise<Hash | null>
  approve: (spender: Address, amount: string) => Promise<Hash | null>
  mint: (amount: string) => Promise<Hash | null>
  
  // Utility functions
  formatUsdt: (amount: bigint) => string
  parseUsdt: (amount: string) => bigint
  
  // Clear error
  clearError: () => void
}

// Contract address
const MOCK_USDT_ADDRESS = CONTRACT_ADDRESSES.MOCK_USDT as Address

export function useMockUSDT(): UseMockUSDTReturn {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('MockUSDT error:', err)
    
    if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('An unexpected error occurred')
    }
  }, [])

  const formatUsdt = useCallback((amount: bigint): string => {
    return formatUnits(amount, 6) // USDT has 6 decimals
  }, [])

  const parseUsdt = useCallback((amount: string): bigint => {
    return parseUnits(amount, 6) // USDT has 6 decimals
  }, [])

  const loadBalance = useCallback(async () => {
    if (!address || !publicClient) return

    try {
      setIsLoading(true)
      setError(null)

      // Check if contract is deployed
      if (MOCK_USDT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.warn('MockUSDT contract not deployed')
        return
      }

      const balance = await publicClient.readContract({
        address: MOCK_USDT_ADDRESS,
        abi: MOCK_USDT_ABI,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint

      setBalance(balance)
    } catch (err) {
      console.warn('Failed to load USDT balance:', err)
      // Don't set error for balance loading failures
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient])

  const transfer = useCallback(async (to: Address, amount: string): Promise<Hash | null> => {
    if (!walletClient || !walletClient.account) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if contract is deployed
      if (MOCK_USDT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        setError('MockUSDT contract not deployed')
        return null
      }

      const parsedAmount = parseUsdt(amount)

      const hash = await walletClient.writeContract({
        address: MOCK_USDT_ADDRESS,
        abi: MOCK_USDT_ABI,
        functionName: 'transfer',
        args: [to, parsedAmount],
        account: walletClient.account,
        chain: kairos
      })

      // Reload balance after successful transfer
      await loadBalance()

      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, parseUsdt, loadBalance, handleError])

  const approve = useCallback(async (spender: Address, amount: string): Promise<Hash | null> => {
    if (!walletClient || !walletClient.account) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if contract is deployed
      if (MOCK_USDT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        setError('MockUSDT contract not deployed')
        return null
      }

      const parsedAmount = parseUsdt(amount)

      const hash = await walletClient.writeContract({
        address: MOCK_USDT_ADDRESS,
        abi: MOCK_USDT_ABI,
        functionName: 'approve',
        args: [spender, parsedAmount],
        account: walletClient.account,
        chain: kairos
      })

      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, parseUsdt, handleError])

  const mint = useCallback(async (amount: string): Promise<Hash | null> => {
    if (!walletClient || !walletClient.account) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if contract is deployed
      if (MOCK_USDT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        setError('MockUSDT contract not deployed')
        return null
      }

      const parsedAmount = parseUsdt(amount)

      const hash = await walletClient.writeContract({
        address: MOCK_USDT_ADDRESS,
        abi: MOCK_USDT_ABI,
        functionName: 'mint',
        args: [walletClient.account.address, parsedAmount],
        account: walletClient.account,
        chain: kairos
      })

      // Reload balance after successful mint
      await loadBalance()

      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, parseUsdt, loadBalance, handleError])

  // Load balance on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      loadBalance()
    }
  }, [isConnected, address, loadBalance])

  return {
    // State
    balance,
    isLoading,
    error,
    
    // Read functions
    loadBalance,
    
    // Write functions
    transfer,
    approve,
    mint,
    
    // Utility functions
    formatUsdt,
    parseUsdt,
    
    // Clear error
    clearError
  }
}
