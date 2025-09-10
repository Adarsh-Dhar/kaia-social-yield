'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
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
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'

// CouponNFT ABI - extracted from the contract
const COUPON_NFT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "recipient", "type": "address" },
      { "internalType": "uint256", "name": "value", "type": "uint256" },
      { "string": "tokenUri", "type": "string" }
    ],
    "name": "mintCoupon",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "burnCoupon",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getCouponValue",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

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
  }
] as const

export interface Coupon {
  tokenId: bigint
  value: bigint
  tokenURI: string
}

export interface UseCouponNFTReturn {
  // State
  coupons: Coupon[]
  usdtBalance: bigint
  isLoading: boolean
  error: string | null
  
  // Read functions
  loadCoupons: () => Promise<void>
  loadUsdtBalance: () => Promise<void>
  
  // Write functions
  redeemCoupon: (tokenId: string) => Promise<Hash | null>
  
  // Utility functions
  formatUsdt: (amount: bigint) => string
  parseUsdt: (amount: string) => bigint
  
  // Clear error
  clearError: () => void
}

// Contract addresses
const COUPON_NFT_ADDRESS = CONTRACT_ADDRESSES.COUPON_NFT as Address
const MOCK_USDT_ADDRESS = CONTRACT_ADDRESSES.MOCK_USDT as Address
const CAMPAIGN_MANAGER_ADDRESS = CONTRACT_ADDRESSES.CAMPAIGN_MANAGER as Address

export function useCouponNFT(): UseCouponNFTReturn {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [usdtBalance, setUsdtBalance] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('CouponNFT error:', err)
    
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

  const loadUsdtBalance = useCallback(async () => {
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

      setUsdtBalance(balance)
    } catch (err) {
      console.warn('Failed to load USDT balance:', err)
      // Don't set error for balance loading failures
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient])

  const loadCoupons = useCallback(async () => {
    if (!address || !publicClient) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Check if contract is deployed
      if (COUPON_NFT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.warn('CouponNFT contract not deployed')
        return
      }

      // Get user's coupon balance
      const balance = await publicClient.readContract({
        address: COUPON_NFT_ADDRESS,
        abi: COUPON_NFT_ABI,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint

      const userCoupons: Coupon[] = []

      // Load each coupon
      for (let i = 0; i < Number(balance); i++) {
        try {
          const tokenId = await publicClient.readContract({
            address: COUPON_NFT_ADDRESS,
            abi: COUPON_NFT_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, BigInt(i)]
          }) as bigint

          const [value, tokenURI] = await Promise.all([
            publicClient.readContract({
              address: COUPON_NFT_ADDRESS,
              abi: COUPON_NFT_ABI,
              functionName: 'getCouponValue',
              args: [tokenId]
            }) as Promise<bigint>,
            publicClient.readContract({
              address: COUPON_NFT_ADDRESS,
              abi: COUPON_NFT_ABI,
              functionName: 'tokenURI',
              args: [tokenId]
            }) as Promise<string>
          ])

          userCoupons.push({
            tokenId,
            value,
            tokenURI
          })
    } catch (err) {
          console.warn(`Failed to load coupon at index ${i}:`, err)
        }
      }

      setCoupons(userCoupons)
    } catch (err) {
      console.warn('Failed to load coupons:', err)
      // Don't set error for coupon loading failures
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient])

  const redeemCoupon = useCallback(async (tokenId: string): Promise<Hash | null> => {
    if (!walletClient || !walletClient.account) {
      setError('Wallet not connected')
      return null
    }

    try {
      setIsLoading(true)
      setError(null)
      
      // Check if contract is deployed
      if (CAMPAIGN_MANAGER_ADDRESS === "0x0000000000000000000000000000000000000000") {
        setError('Campaign Manager contract not deployed')
      return null
    }

      // Import CampaignManager ABI for redeemCoupon function
      const CAMPAIGN_MANAGER_ABI = [
        {
          "inputs": [{ "internalType": "uint256", "name": "_tokenId", "type": "uint256" }],
          "name": "redeemCoupon",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ] as const

      const hash = await walletClient.writeContract({
        address: CAMPAIGN_MANAGER_ADDRESS,
        abi: CAMPAIGN_MANAGER_ABI,
        functionName: 'redeemCoupon',
        args: [BigInt(tokenId)],
        account: walletClient.account,
        chain: kairos
      })

      // Reload data after successful redemption
      await Promise.all([
        loadCoupons(),
        loadUsdtBalance()
      ])
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, loadCoupons, loadUsdtBalance, handleError])

  // Load data on mount and when address changes
  useEffect(() => {
    if (isConnected && address) {
      loadCoupons()
      loadUsdtBalance()
    }
  }, [isConnected, address, loadCoupons, loadUsdtBalance])

  return {
    // State
    coupons,
    usdtBalance,
    isLoading,
    error,
    
    // Read functions
    loadCoupons,
    loadUsdtBalance,
    
    // Write functions
    redeemCoupon,
    
    // Utility functions
    formatUsdt,
    parseUsdt,
    
    // Clear error
    clearError
  }
}