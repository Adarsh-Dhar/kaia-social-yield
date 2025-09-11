"use client"

import { useState, useEffect, useCallback } from "react"

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
      
      // Refresh missions data
      await fetchMissions()

      return result
    } catch (err) {
      throw err
    }
  }

  return { data, loading, error, completeMission, refetch: fetchMissions }
}
