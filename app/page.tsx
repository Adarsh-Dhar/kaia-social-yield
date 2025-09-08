"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CircularProgress } from "@/components/circular-progress"
import { MissionCard } from "@/components/mission-card"
import { Header } from "@/components/header"
import { useUserData } from "@/hooks/use-user-data"
import { useMissions } from "@/hooks/use-missions"
import { Gift, UserPlus, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

// Icon mapping for mission types
const missionIcons: Record<string, any> = {
  INVITE: Gift,
  FOLLOW: UserPlus,
  STREAK: CheckCircle,
  DEFAULT: Gift,
}

export default function Dashboard() {
  const { data: userData, loading: userLoading, error: userError } = useUserData()
  const { data: missionsData, loading: missionsLoading, error: missionsError, completeMission } = useMissions()

  const handleMissionComplete = async (missionId: string) => {
    try {
      await completeMission(missionId)
      toast({
        title: "Mission Completed!",
        description: "Your yield boost has been activated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete mission",
        variant: "destructive",
      })
    }
  }

  // Calculate APY and boost information
  const baseAPY = 4.0
  const boostMultiplier = userData?.boost.multiplier || 1
  const socialBoost = boostMultiplier > 1 ? (boostMultiplier - 1) * 100 : 0
  const totalAPY = baseAPY + socialBoost
  const apyPercentage = Math.round(totalAPY * 10) / 10

  // Format USDT amounts
  const formatUSDT = (amount: string) => {
    const num = parseFloat(amount)
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (userLoading || missionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (userError || missionsError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-4 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userError || missionsError || "Failed to load dashboard data"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Main Balance Card */}
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
                ${formatUSDT(userData?.financials.stakedUsdt || "0")} USDT
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
              <div className="text-lg font-semibold text-primary">
                +${formatUSDT(userData?.financials.totalRewards || "0")}
              </div>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">Deposit</Button>
              <Button variant="outline" className="flex-1 border-border text-foreground hover:bg-muted bg-transparent">
                Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* APY & Boosts Card */}
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
                  <span className="text-sm font-medium text-foreground">{baseAPY}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Social Boosts:</span>
                  <span className="text-sm font-medium text-primary">
                    {socialBoost > 0 ? `+${socialBoost.toFixed(1)}%` : "0%"}
                  </span>
                </div>
                {userData?.boost.expiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Boost expires:</span>
                    <span className="text-sm font-medium text-primary">
                      {new Date(userData.boost.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Yield Boost Missions</h3>

          <div className="space-y-3">
            {missionsData?.missions.map((mission) => {
              const IconComponent = missionIcons[mission.type] || missionIcons.DEFAULT
              const isCompleted = mission.status === "COMPLETED"
              
              return (
                <MissionCard
                  key={mission.id}
                  icon={IconComponent}
                  title={mission.title}
                  description={mission.description}
                  buttonText={isCompleted ? undefined : "Complete"}
                  onButtonClick={isCompleted ? undefined : () => handleMissionComplete(mission.id)}
                  completed={isCompleted}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
