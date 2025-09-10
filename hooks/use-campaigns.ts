import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useCampaignManager } from './use-campaign-manager'
import type { Campaign, Address } from '@/lib/campaign_manager'

export interface FormattedCampaign extends Campaign {
  id: `0x${string}`
  formattedBudget: string
  formattedSpent: string
  formattedMinReward: string
  formattedMaxReward: string
  budgetUtilization: number
  remainingBudget: bigint
  remainingParticipants: bigint
}

export function useCampaigns() {
  const { address } = useAccount()
  const campaignManager = useCampaignManager()
  const [campaigns, setCampaigns] = useState<Map<string, Campaign>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((err: unknown) => {
    console.error('Campaigns error:', err)
    setError(err instanceof Error ? err.message : 'An unknown error occurred')
  }, [])

  // Load a specific campaign
  const loadCampaign = useCallback(async (campaignId: `0x${string}`) => {
    if (!campaignId) return

    try {
      setIsLoading(true)
      setError(null)
      
      const campaign = await campaignManager.getCampaign(campaignId)
      if (campaign) {
        setCampaigns(prev => new Map(prev.set(campaignId, campaign)))
      }
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [campaignManager, handleError])

  // Create a new campaign
  const createCampaign = useCallback(async (params: {
    budget: string
    maxParticipants: string
    minReward: string
    maxReward: string
    nftTokenURI: string
  }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const hash = await campaignManager.createCampaign(
        params.budget,
        params.maxParticipants,
        params.minReward,
        params.maxReward,
        params.nftTokenURI
      )
      
      if (hash) {
        // Note: In a real implementation, you'd need to extract the campaign ID from the transaction receipt
        // For now, we'll just refresh the campaigns list
        console.log('Campaign created with hash:', hash)
      }
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [campaignManager, handleError])

  // Get all campaigns (this would need to be implemented with events or a different approach)
  const loadAllCampaigns = useCallback(async () => {
    // In a real implementation, you'd listen to CampaignCreated events
    // or have a function that returns all campaign IDs
    console.log('Loading all campaigns - this would need to be implemented with events')
  }, [])

  // Get campaigns created by the current user
  const myCampaigns = Array.from(campaigns.values()).filter(
    campaign => address && campaign.creator.toLowerCase() === address.toLowerCase()
  )

  // Get active campaigns
  const activeCampaigns = Array.from(campaigns.values()).filter(
    campaign => campaign.isActive
  )

  // Format campaign data
  const formatCampaign = useCallback((campaign: Campaign, campaignId: `0x${string}`): FormattedCampaign => {
    const formattedBudget = campaignManager.formatUsdt(campaign.totalBudget)
    const formattedSpent = campaignManager.formatUsdt(campaign.spent)
    const formattedMinReward = campaignManager.formatUsdt(campaign.minReward)
    const formattedMaxReward = campaignManager.formatUsdt(campaign.maxReward)
    
    const budgetUtilization = campaign.totalBudget > 0 
      ? Number((campaign.spent * BigInt(100)) / campaign.totalBudget)
      : 0
    
    const remainingBudget = campaign.totalBudget - campaign.spent
    const remainingParticipants = campaign.maxParticipants - campaign.participantsCount

    return {
      ...campaign,
      id: campaignId,
      formattedBudget,
      formattedSpent,
      formattedMinReward,
      formattedMaxReward,
      budgetUtilization,
      remainingBudget,
      remainingParticipants
    }
  }, [campaignManager])

  // Get formatted campaigns
  const getFormattedCampaigns = useCallback((): FormattedCampaign[] => {
    return Array.from(campaigns.entries()).map(([id, campaign]) => 
      formatCampaign(campaign, id as `0x${string}`)
    )
  }, [campaigns, formatCampaign])

  // Get formatted active campaigns
  const getFormattedActiveCampaigns = useCallback((): FormattedCampaign[] => {
    return Array.from(campaigns.entries())
      .filter(([, campaign]) => campaign.isActive)
      .map(([id, campaign]) => formatCampaign(campaign, id as `0x${string}`))
  }, [campaigns, formatCampaign])

  // Get formatted user campaigns
  const getFormattedMyCampaigns = useCallback((): FormattedCampaign[] => {
    if (!address) return []
    
    return Array.from(campaigns.entries())
      .filter(([, campaign]) => campaign.creator.toLowerCase() === address.toLowerCase())
      .map(([id, campaign]) => formatCampaign(campaign, id as `0x${string}`))
  }, [campaigns, address, formatCampaign])

  // Award coupon (operator function)
  const awardCoupon = useCallback(async (
    user: Address,
    campaignId: `0x${string}`,
    randomCouponValue: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const hash = await campaignManager.awardCoupon(user, campaignId, randomCouponValue)
      
      if (hash) {
        // Refresh the campaign data
        await loadCampaign(campaignId)
      }
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [campaignManager, loadCampaign, handleError])

  // Redeem coupon
  const redeemCoupon = useCallback(async (tokenId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const hash = await campaignManager.redeemCoupon(tokenId)
      
      return hash
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [campaignManager, handleError])

  return {
    // State
    campaigns: Array.from(campaigns.values()),
    activeCampaigns,
    myCampaigns,
    isLoading: isLoading || campaignManager.isLoading,
    error: error || campaignManager.error,
    clearError: () => {
      clearError()
      campaignManager.clearError()
    },
    
    // Actions
    loadCampaign,
    loadAllCampaigns,
    createCampaign,
    awardCoupon,
    redeemCoupon,
    
    // Formatted data
    getFormattedCampaigns,
    getFormattedActiveCampaigns,
    getFormattedMyCampaigns,
    
    // Utility functions
    formatUsdt: campaignManager.formatUsdt,
    parseUsdt: campaignManager.parseUsdt,
    formatEther: campaignManager.formatEther,
    parseEther: campaignManager.parseEther
  }
}