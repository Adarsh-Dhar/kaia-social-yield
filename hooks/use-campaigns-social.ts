import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useSocialYieldProtocol } from './use-social-yield-protocol'
import type { Campaign, Address } from '@/lib/social'

export function useCampaignsSocial() {
  const { address } = useAccount()
  const {
    getCampaign,
    createCampaign,
    applyYieldBoost,
    formatUsdt,
    isLoading,
    error,
    clearError
  } = useSocialYieldProtocol()

  const [campaigns, setCampaigns] = useState<Map<string, Campaign>>(new Map())
  const [isCreating, setIsCreating] = useState(false)
  const [isApplyingBoost, setIsApplyingBoost] = useState(false)

  // Load campaign data
  const loadCampaign = useCallback(async (campaignId: `0x${string}`) => {
    const campaign = await getCampaign(campaignId)
    if (campaign) {
      setCampaigns(prev => new Map(prev.set(campaignId, campaign)))
    }
    return campaign
  }, [getCampaign])

  // Create campaign
  const handleCreateCampaign = useCallback(async (budget: string) => {
    if (!budget || parseFloat(budget) <= 0) {
      return null
    }

    setIsCreating(true)
    try {
      const txHash = await createCampaign(budget)
      return txHash
    } finally {
      setIsCreating(false)
    }
  }, [createCampaign])

  // Apply yield boost
  const handleApplyYieldBoost = useCallback(async (
    user: Address,
    campaignId: `0x${string}`,
    boostMultiplier: number,
    durationSeconds: number
  ) => {
    setIsApplyingBoost(true)
    try {
      const txHash = await applyYieldBoost(user, campaignId, boostMultiplier, durationSeconds)
      return txHash
    } finally {
      setIsApplyingBoost(false)
    }
  }, [applyYieldBoost])

  // Get campaign by ID
  const getCampaignById = useCallback((campaignId: string): Campaign | undefined => {
    return campaigns.get(campaignId)
  }, [campaigns])

  // Get all campaigns as array
  const getAllCampaigns = useCallback((): Campaign[] => {
    return Array.from(campaigns.values())
  }, [campaigns])

  // Get active campaigns
  const getActiveCampaigns = useCallback((): Campaign[] => {
    return Array.from(campaigns.values()).filter(campaign => campaign.isActive)
  }, [campaigns])

  // Get campaigns by creator
  const getCampaignsByCreator = useCallback((creator: Address): Campaign[] => {
    return Array.from(campaigns.values()).filter(campaign => campaign.creator === creator)
  }, [campaigns])

  // Get my campaigns (if address is available)
  const getMyCampaigns = useCallback((): Campaign[] => {
    if (!address) return []
    return getCampaignsByCreator(address as Address)
  }, [address, getCampaignsByCreator])

  // Format campaign data
  const formatCampaign = useCallback((campaign: Campaign) => {
    return {
      ...campaign,
      formattedBudget: formatUsdt(campaign.budget),
      formattedSpent: formatUsdt(campaign.spent),
      remainingBudget: campaign.budget - campaign.spent,
      formattedRemainingBudget: formatUsdt(campaign.budget - campaign.spent),
      budgetUtilization: campaign.budget > BigInt(0) ?
        Number((campaign.spent * BigInt(10000)) / campaign.budget) / 100 : 0
    }
  }, [formatUsdt])

  // Format all campaigns
  const getFormattedCampaigns = useCallback(() => {
    return getAllCampaigns().map(formatCampaign)
  }, [getAllCampaigns, formatCampaign])

  // Format active campaigns
  const getFormattedActiveCampaigns = useCallback(() => {
    return getActiveCampaigns().map(formatCampaign)
  }, [getActiveCampaigns, formatCampaign])

  // Format my campaigns
  const getFormattedMyCampaigns = useCallback(() => {
    return getMyCampaigns().map(formatCampaign)
  }, [getMyCampaigns, formatCampaign])

  return {
    // State
    campaigns: getAllCampaigns(),
    activeCampaigns: getActiveCampaigns(),
    myCampaigns: getMyCampaigns(),
    isLoading: isLoading || isCreating || isApplyingBoost,
    error,
    clearError,

    // Actions
    loadCampaign,
    createCampaign: handleCreateCampaign,
    applyYieldBoost: handleApplyYieldBoost,

    // Getters
    getCampaignById,
    getAllCampaigns,
    getActiveCampaigns,
    getCampaignsByCreator,
    getMyCampaigns,

    // Formatted data
    getFormattedCampaigns,
    getFormattedActiveCampaigns,
    getFormattedMyCampaigns,
    formatCampaign,

    // Individual loading states
    isCreating,
    isApplyingBoost
  }
}
