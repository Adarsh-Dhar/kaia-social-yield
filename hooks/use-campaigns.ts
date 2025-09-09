'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCampaignEscrow } from './use-campaign-escrow'
import type { Campaign } from '@/lib/escrow'

export interface CampaignWithBalance extends Campaign {
  depositBalance: string
  formattedTotalFunding: string
  formattedCreatedAt: string
}

export function useCampaigns() {
  const { getCampaign, getDepositAmount, formatEther, isLoading, error } = useCampaignEscrow()
  const [campaigns, setCampaigns] = useState<Map<string, CampaignWithBalance>>(new Map())

  const loadCampaign = useCallback(async (campaignId: `0x${string}`) => {
    try {
      const [campaign, depositBalance] = await Promise.all([
        getCampaign(campaignId),
        getDepositAmount(campaignId)
      ])

      if (campaign && depositBalance !== null) {
        const campaignWithBalance: CampaignWithBalance = {
          ...campaign,
          depositBalance: formatEther(depositBalance),
          formattedTotalFunding: formatEther(campaign.totalFunding),
          formattedCreatedAt: new Date(Number(campaign.createdAt) * 1000).toLocaleString()
        }

        setCampaigns(prev => new Map(prev.set(campaignId, campaignWithBalance)))
        return campaignWithBalance
      }
    } catch (err) {
      console.error('Failed to load campaign:', err)
    }
    return null
  }, [getCampaign, getDepositAmount, formatEther])

  const refreshCampaign = useCallback((campaignId: `0x${string}`) => {
    return loadCampaign(campaignId)
  }, [loadCampaign])

  const getCampaignById = useCallback((campaignId: string) => {
    return campaigns.get(campaignId)
  }, [campaigns])

  const getAllCampaigns = useCallback(() => {
    return Array.from(campaigns.values())
  }, [campaigns])

  return {
    campaigns: getAllCampaigns(),
    loadCampaign,
    refreshCampaign,
    getCampaignById,
    isLoading,
    error
  }
}

// Hook for managing a single campaign
export function useCampaign(campaignId: `0x${string}` | null) {
  const { getCampaign, getDepositAmount, formatEther, isLoading, error } = useCampaignEscrow()
  const [campaign, setCampaign] = useState<CampaignWithBalance | null>(null)

  const loadCampaign = useCallback(async () => {
    if (!campaignId) return

    try {
      const [campaignData, depositBalance] = await Promise.all([
        getCampaign(campaignId),
        getDepositAmount(campaignId)
      ])

      if (campaignData && depositBalance !== null) {
        const campaignWithBalance: CampaignWithBalance = {
          ...campaignData,
          depositBalance: formatEther(depositBalance),
          formattedTotalFunding: formatEther(campaignData.totalFunding),
          formattedCreatedAt: new Date(Number(campaignData.createdAt) * 1000).toLocaleString()
        }
        setCampaign(campaignWithBalance)
      }
    } catch (err) {
      console.error('Failed to load campaign:', err)
    }
  }, [campaignId, getCampaign, getDepositAmount, formatEther])

  useEffect(() => {
    loadCampaign()
  }, [loadCampaign])

  return {
    campaign,
    loadCampaign,
    isLoading,
    error
  }
}

// Hook for campaign creation
export function useCreateCampaign() {
  const { createCampaign, isLoading, error } = useCampaignEscrow()
  const [isCreating, setIsCreating] = useState(false)
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)

  const create = useCallback(async (initialFunding: string) => {
    setIsCreating(true)
    try {
      const txHash = await createCampaign(initialFunding)
      if (txHash) {
        setLastCreatedId(txHash)
        return txHash
      }
    } catch (err) {
      console.error('Failed to create campaign:', err)
    } finally {
      setIsCreating(false)
    }
    return null
  }, [createCampaign])

  return {
    createCampaign: create,
    isCreating: isCreating || isLoading,
    error,
    lastCreatedId
  }
}

// Hook for campaign funding
export function useCampaignFunding(campaignId: `0x${string}` | null) {
  const { addFunds, deposit, isLoading, error } = useCampaignEscrow()
  const [isFunding, setIsFunding] = useState(false)

  const addFundsToCampaign = useCallback(async (amount: string) => {
    if (!campaignId) return null

    setIsFunding(true)
    try {
      const txHash = await addFunds(campaignId, amount)
      return txHash
    } catch (err) {
      console.error('Failed to add funds:', err)
      return null
    } finally {
      setIsFunding(false)
    }
  }, [campaignId, addFunds])

  const depositToCampaign = useCallback(async (amount: string) => {
    if (!campaignId) return null

    setIsFunding(true)
    try {
      const txHash = await deposit(campaignId, amount)
      return txHash
    } catch (err) {
      console.error('Failed to deposit:', err)
      return null
    } finally {
      setIsFunding(false)
    }
  }, [campaignId, deposit])

  return {
    addFunds: addFundsToCampaign,
    deposit: depositToCampaign,
    isFunding: isFunding || isLoading,
    error
  }
}
