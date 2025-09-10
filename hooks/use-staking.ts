import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useSocialYieldProtocol } from './use-social-yield-protocol'
import type { Staker, Address } from '@/lib/social'

export function useStaking() {
  const { address } = useAccount()
  const {
    getStaker,
    getTotalStaked,
    getBaseApyBps,
    stake,
    withdraw,
    claimRewards,
    formatUsdt,
    isLoading,
    error,
    clearError
  } = useSocialYieldProtocol()

  const [stakerData, setStakerData] = useState<Staker | null>(null)
  const [totalStaked, setTotalStaked] = useState<bigint | null>(null)
  const [baseApyBps, setBaseApyBps] = useState<bigint | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  // Load staker data
  const loadStakerData = useCallback(async () => {
    if (!address) return

    try {
      const data = await getStaker(address as Address)
      if (data) {
        setStakerData(data)
      }
    } catch (error) {
      console.warn('Failed to load staker data:', error)
      // Don't set stakerData to null, keep existing data
    }
  }, [address, getStaker])

  // Load protocol data
  const loadProtocolData = useCallback(async () => {
    try {
      const [total, apy] = await Promise.all([
        getTotalStaked(),
        getBaseApyBps()
      ])
      
      if (total) setTotalStaked(total)
      if (apy) setBaseApyBps(apy)
    } catch (error) {
      console.warn('Failed to load protocol data:', error)
      // Don't clear existing data on error
    }
  }, [getTotalStaked, getBaseApyBps])

  // Load all data
  const loadData = useCallback(async () => {
    await Promise.all([
      loadStakerData(),
      loadProtocolData()
    ])
  }, [loadStakerData, loadProtocolData])

  // Stake function
  const handleStake = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      return null
    }

    setIsStaking(true)
    try {
      const txHash = await stake(amount)
      if (txHash) {
        // Reload staker data after successful stake
        await loadStakerData()
        await loadProtocolData()
      }
      return txHash
    } finally {
      setIsStaking(false)
    }
  }, [stake, loadStakerData, loadProtocolData])

  // Withdraw function
  const handleWithdraw = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      return null
    }

    setIsWithdrawing(true)
    try {
      const txHash = await withdraw(amount)
      if (txHash) {
        // Reload staker data after successful withdrawal
        await loadStakerData()
        await loadProtocolData()
      }
      return txHash
    } finally {
      setIsWithdrawing(false)
    }
  }, [withdraw, loadStakerData, loadProtocolData])

  // Claim rewards function
  const handleClaimRewards = useCallback(async () => {
    setIsClaiming(true)
    try {
      const txHash = await claimRewards()
      if (txHash) {
        // Reload staker data after successful claim
        await loadStakerData()
      }
      return txHash
    } finally {
      setIsClaiming(false)
    }
  }, [claimRewards, loadStakerData])

  // Load data on mount and when address changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Computed values
  const hasStake = stakerData ? stakerData.amountStaked > BigInt(0) : false
  const hasRewards = stakerData ? stakerData.rewards > BigInt(0) : false
  const hasActiveBoost = stakerData ? 
    stakerData.boostMultiplier > BigInt(0) && stakerData.boostExpiresAt > BigInt(Math.floor(Date.now() / 1000)) : 
    false

  const formattedAmountStaked = stakerData && stakerData.amountStaked !== undefined ? formatUsdt(stakerData.amountStaked) : '0'
  const formattedRewards = stakerData && stakerData.rewards !== undefined ? formatUsdt(stakerData.rewards) : '0'
  const formattedTotalStaked = totalStaked ? formatUsdt(totalStaked) : '0'
  const formattedBaseApy = baseApyBps ? (Number(baseApyBps) / 100).toFixed(2) + '%' : '0%'

  return {
    // State
    stakerData,
    totalStaked,
    baseApyBps,
    isLoading: isLoading || isStaking || isWithdrawing || isClaiming,
    error,
    clearError,

    // Actions
    loadData,
    loadStakerData,
    loadProtocolData,
    stake: handleStake,
    withdraw: handleWithdraw,
    claimRewards: handleClaimRewards,

    // Computed values
    hasStake,
    hasRewards,
    hasActiveBoost,
    formattedAmountStaked,
    formattedRewards,
    formattedTotalStaked,
    formattedBaseApy,

    // Individual loading states
    isStaking,
    isWithdrawing,
    isClaiming
  }
}
