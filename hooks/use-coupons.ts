import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCouponNft } from './use-coupon-nft'
import type { Coupon, Address } from '@/lib/coupon_nft'

export interface FormattedCoupon extends Coupon {
  formattedValue: string
  shortTokenId: string
  shortOwner: string
}

export function useCoupons() {
  const { address } = useAccount()
  const couponNft = useCouponNft()
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([])
  const [totalSupply, setTotalSupply] = useState<bigint | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('Coupons error:', err)
    setError(err instanceof Error ? err.message : 'An unknown error occurred')
  }, [])

  // Load user's coupons
  const loadUserCoupons = useCallback(async (userAddress?: Address) => {
    const targetAddress = userAddress || address
    if (!targetAddress) return

    try {
      setIsLoading(true)
      setError(null)
      
      const coupons = await couponNft.getUserCoupons(targetAddress)
      setUserCoupons(coupons)
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [address, couponNft, handleError])

  // Load total supply
  const loadTotalSupply = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const supply = await couponNft.getTotalSupply()
      setTotalSupply(supply)
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [couponNft, handleError])

  // Load coupon value
  const loadCouponValue = useCallback(async (tokenId: bigint) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const value = await couponNft.getCouponValue(tokenId)
      return value
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [couponNft, handleError])

  // Load token URI
  const loadTokenURI = useCallback(async (tokenId: bigint) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const uri = await couponNft.getTokenURI(tokenId)
      return uri
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [couponNft, handleError])

  // Mint coupon (manager function)
  const mintCoupon = useCallback(async (
    recipient: Address,
    value: string,
    tokenURI: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const hash = await couponNft.mintCoupon(recipient, value, tokenURI)
      
      if (hash) {
        // Refresh user coupons if it's for the current user
        if (address && recipient.toLowerCase() === address.toLowerCase()) {
          await loadUserCoupons()
        }
        // Refresh total supply
        await loadTotalSupply()
      }
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [couponNft, address, loadUserCoupons, loadTotalSupply, handleError])

  // Burn coupon (manager function)
  const burnCoupon = useCallback(async (tokenId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const hash = await couponNft.burnCoupon(tokenId)
      
      if (hash) {
        // Refresh user coupons
        await loadUserCoupons()
        // Refresh total supply
        await loadTotalSupply()
      }
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [couponNft, loadUserCoupons, loadTotalSupply, handleError])

  // Format coupon data
  const formatCoupon = useCallback((coupon: Coupon): FormattedCoupon => {
    const formattedValue = couponNft.formatUsdt(coupon.value)
    const shortTokenId = coupon.tokenId.toString().slice(0, 8) + '...'
    const shortOwner = coupon.owner.slice(0, 6) + '...' + coupon.owner.slice(-4)

    return {
      ...coupon,
      formattedValue,
      shortTokenId,
      shortOwner
    }
  }, [couponNft])

  // Get formatted coupons
  const getFormattedCoupons = useCallback((): FormattedCoupon[] => {
    return userCoupons.map(formatCoupon)
  }, [userCoupons, formatCoupon])

  // Get coupons by value range
  const getCouponsByValueRange = useCallback((minValue: bigint, maxValue: bigint): FormattedCoupon[] => {
    return userCoupons
      .filter(coupon => coupon.value >= minValue && coupon.value <= maxValue)
      .map(formatCoupon)
  }, [userCoupons, formatCoupon])

  // Get total value of user's coupons
  const getTotalCouponValue = useCallback((): bigint => {
    return userCoupons.reduce((total, coupon) => total + coupon.value, BigInt(0))
  }, [userCoupons])

  // Get formatted total value
  const getFormattedTotalValue = useCallback((): string => {
    const total = getTotalCouponValue()
    return couponNft.formatUsdt(total)
  }, [getTotalCouponValue, couponNft])

  // Check if user has coupons
  const hasCoupons = userCoupons.length > 0

  // Get coupon count
  const couponCount = userCoupons.length

  // Auto-load user coupons when address changes
  useEffect(() => {
    if (address) {
      loadUserCoupons()
      loadTotalSupply()
    }
  }, [address, loadUserCoupons, loadTotalSupply])

  return {
    // State
    userCoupons,
    totalSupply,
    hasCoupons,
    couponCount,
    isLoading: isLoading || couponNft.isLoading,
    error: error || couponNft.error,
    clearError: () => {
      clearError()
      couponNft.clearError()
    },
    
    // Actions
    loadUserCoupons,
    loadTotalSupply,
    loadCouponValue,
    loadTokenURI,
    mintCoupon,
    burnCoupon,
    
    // Formatted data
    getFormattedCoupons,
    getCouponsByValueRange,
    getTotalCouponValue,
    getFormattedTotalValue,
    
    // Utility functions
    formatUsdt: couponNft.formatUsdt,
    parseUsdt: couponNft.parseUsdt,
    formatEther: couponNft.formatEther,
    parseEther: couponNft.parseEther
  }
}
