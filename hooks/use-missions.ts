"use client"

import { useState, useEffect } from "react"

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

  useEffect(() => {
    async function fetchMissions() {
      try {
        setLoading(true)
        const response = await fetch("/api/missions")
        
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
    }

    fetchMissions()
  }, [])

  const completeMission = async (missionId: string) => {
    try {
      const response = await fetch("/api/missions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ missionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to complete mission")
      }

      const result = await response.json()
      
      // Refresh missions data
      const missionsResponse = await fetch("/api/missions")
      if (missionsResponse.ok) {
        const missionsData = await missionsResponse.json()
        setData(missionsData)
      }

      return result
    } catch (err) {
      throw err
    }
  }

  return { data, loading, error, completeMission, refetch: () => fetchMissions() }
}
