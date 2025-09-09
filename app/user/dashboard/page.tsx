"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CircularProgress } from "@/components/circular-progress"
import { useUserData } from "@/hooks/use-user-data"
import { useStaking } from "@/hooks/use-staking"
import { useAccount } from "wagmi"
import { Link } from "lucide-react"
import { Loader2, AlertCircle, TrendingUp, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"

function DashboardContent() {
  const { data: userData, loading: userLoading, error: userError } = useUserData()
  const { address, isConnected } = useAccount()
  const {
    stakerData,
    hasStake,
    hasActiveBoost,
    formattedAmountStaked,
    formattedRewards,
    formattedBaseApy,
    isLoading: stakingLoading,
    error: stakingError
  } = useStaking()

  // Use blockchain data if available, fallback to API data
  const stakedAmount = stakerData && formattedAmountStaked ? formattedAmountStaked : userData?.financials.stakedUsdt || "0"
  const rewards = stakerData && formattedRewards ? formattedRewards : userData?.financials.totalRewards || "0"
  const baseAPY = stakerData && formattedBaseApy ? parseFloat(formattedBaseApy.replace('%', '')) : 4.0
  const boostMultiplier = stakerData ? 
    (stakerData.boostMultiplier > 0 ? Number(stakerData.boostMultiplier) / 100 : 1) : 
    (userData?.boost.multiplier || 1)
  const socialBoost = boostMultiplier > 1 ? (boostMultiplier - 1) * 100 : 0
  const totalAPY = baseAPY + socialBoost
  const apyPercentage = Math.round(totalAPY * 10) / 10

  const formatUSDT = (amount: string) => {
    const num = parseFloat(amount)
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  const getUserInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (userLoading || stakingLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (userError || stakingError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userError || stakingError || "Failed to load dashboard data"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={userData?.user.pictureUrl || "/diverse-user-avatars.png"} 
                  alt={userData?.user.displayName || "User"} 
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(userData?.user.displayName ?? null)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {userData?.user.displayName || "User"}
                </h2>
                <p className="text-sm text-muted-foreground">Welcome back!</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                ${formatUSDT(stakedAmount)} USDT
              </div>
              <p className="text-sm text-muted-foreground mb-2">Staked Balance</p>
              <div className="text-lg font-semibold text-primary">
                +${formatUSDT(rewards)}
              </div>
              <p className="text-xs text-muted-foreground">Pending Rewards</p>
              {hasActiveBoost && stakerData && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full text-xs text-green-800 dark:text-green-200">
                  <Zap className="h-3 w-3" />
                  <span>Active Boost</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                <a href="/user/funds/deposit">Stake</a>
              </Button>
              <Button asChild variant="outline" className="flex-1 border-border text-foreground hover:bg-muted bg-transparent">
                <a href="/user/funds/withdraw">Withdraw</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Current Yield</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <CircularProgress value={Math.round((apyPercentage / 10) * 100)} className="mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{apyPercentage}%</div>
                  <div className="text-xs text-muted-foreground">APY</div>
                </div>
              </CircularProgress>

              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Base APY:</span>
                  <span className="text-sm font-medium text-foreground">{baseAPY.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Social Boosts:</span>
                  <span className="text-sm font-medium text-primary">
                    {socialBoost > 0 ? `+${socialBoost.toFixed(1)}%` : "0%"}
                  </span>
                </div>
                {hasActiveBoost && stakerData && stakerData.boostExpiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Boost expires:</span>
                    <span className="text-sm font-medium text-primary">
                      {new Date(Number(stakerData.boostExpiresAt) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button asChild variant="outline" className="h-20 flex flex-col gap-2 border-border text-foreground hover:bg-muted bg-transparent">
            <a href="/user/missions">
              <div className="text-lg">🎯</div>
              <div className="text-sm font-medium">Missions</div>
            </a>
          </Button>
          <Button asChild variant="outline" className="h-20 flex flex-col gap-2 border-border text-foreground hover:bg-muted bg-transparent">
            <a href="/user/profile">
              <div className="text-lg">👤</div>
              <div className="text-sm font-medium">Profile</div>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by only rendering client-side content after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading state during initial client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  )
}




