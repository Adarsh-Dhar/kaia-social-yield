"use client"

import { useState, useEffect, useCallback } from "react"

export interface UserData {
  user: {
    id: string
    displayName: string | null
    pictureUrl: string | null
    walletAddress: string
    createdAt: string
  }
  financials: {
    stakedUsdt: string
    totalRewards: string
  }
  boost: {
    multiplier: number
    expiresAt: string | null
  }
}

export function useUserData() {
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/user/me")
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in to view your data")
          return
        }
        throw new Error(`Failed to fetch user data: ${response.status}`)
      }
      
      const userData = await response.json()
      setData(userData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUserData()
  }, [fetchUserData])

  return { data, loading, error, refetch: fetchUserData }
}
