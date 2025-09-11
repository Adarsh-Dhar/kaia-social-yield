"use client"

import { useState, useEffect, useCallback } from "react"
import { useAwardCoupon } from "./use-award-coupon"
import { useAccount } from "wagmi"

export interface Mission {
  id: string
  title: string
  description: string
  type: string
  boostMultiplier: number
  boostDuration: number
  isRepeatable: boolean
  status: "PENDING" | "COMPLETED"
}

export interface MissionsData {
  missions: Mission[]
}

export function useMissions() {
  const [data, setData] = useState<MissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { awardCoupon, isLoading: isAwardingCoupon, error: awardError } = useAwardCoupon()
  const { address } = useAccount()

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/missions", {
        credentials: "include" // Include cookies in the request
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in to view missions")
          return
        }
        throw new Error(`Failed to fetch missions: ${response.status}`)
      }
      
      const missionsData = await response.json()
      setData(missionsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch missions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMissions()
  }, [fetchMissions])

  const completeMission = async (missionId: string) => {
    try {
      // Step 1: Complete mission in database
      const response = await fetch("/api/missions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the request
        body: JSON.stringify({ missionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to complete mission")
      }

      const result = await response.json()
      
      // Step 2: If mission completion was successful and we have the required data, mint the NFT
      if (result.ok && result.campaignId && result.couponValue && address) {
        try {
          console.log("🎯 Calling contract to mint NFT...", {
            user: address,
            campaignId: result.campaignId,
            couponValue: result.couponValue
          })
          
          const txHash = await awardCoupon({
            user: address as `0x${string}`,
            campaignId: result.campaignId as `0x${string}`,
            randomCouponValue: result.couponValue.toString()
          })
          
          if (txHash) {
            console.log("✅ NFT minted successfully! Transaction hash:", txHash)
            result.txHash = txHash
          } else {
            console.log("⚠️ NFT minting failed, but mission was completed in database")
            result.txHash = "dev-mode-simulation" // Fallback for development
          }
        } catch (contractError) {
          console.error("❌ Contract call failed:", contractError)
          // Mission is still completed in database, but NFT minting failed
          result.txHash = "dev-mode-simulation" // Fallback for development
          result.contractError = contractError instanceof Error ? contractError.message : "Contract call failed"
        }
      } else {
        console.log("⚠️ Missing data for NFT minting:", { 
          ok: result.ok, 
          campaignId: result.campaignId, 
          couponValue: result.couponValue, 
          address 
        })
        result.txHash = "dev-mode-simulation" // Fallback for development
      }
      
      // Refresh missions data
      await fetchMissions()

      return result
    } catch (err) {
      throw err
    }
  }

  return { 
    data, 
    loading: loading || isAwardingCoupon, 
    error: error || awardError, 
    completeMission, 
    refetch: fetchMissions 
  }
}
