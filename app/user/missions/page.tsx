"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MissionCard } from "@/components/mission-card"
import { useMissions } from "@/hooks/use-missions"
import { useAwardCoupon } from "@/hooks/use-award-coupon"
import { ArrowLeft, Loader2, AlertCircle, Gift, UserPlus, CheckCircle, Wallet } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

const missionIcons: Record<string, any> = {
  INVITE: Gift,
  FOLLOW: UserPlus,
  STREAK: CheckCircle,
  DEFAULT: Gift,
}

export default function MissionsPage() {
  const { data: missionsData, loading: missionsLoading, error: missionsError } = useMissions()
  const { awardCoupon, isLoading: isAwardingCoupon, error: awardError, isConnected, address } = useAwardCoupon()

  const handleMissionComplete = async (missionId: string) => {
    try {
      // 1) Mark mission complete in backend and get coupon params
      const response = await fetch("/api/missions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ missionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to complete mission")
      }

      const result = await response.json()

      // 2) Award coupon using frontend hook (requires wallet connection)
      if (result.ok && result.campaignId && result.couponValue) {
        if (!isConnected || !address) {
          toast({
            title: "Wallet Required",
            description: "Please connect your wallet to claim your coupon NFT.",
            variant: "destructive",
          })
          return
        }

        try {
          const txHash = await awardCoupon({
            user: address,
            campaignId: result.campaignId as `0x${string}`,
            randomCouponValue: result.couponValue.toString()
          })

          if (txHash) {
            toast({
              title: "Mission Completed! 🎉",
              description: `You've earned a ${result.couponValue} USDT coupon NFT! Transaction: ${txHash.slice(0, 10)}...`,
              duration: 5000,
            })
          } else {
            throw new Error("Failed to mint coupon NFT")
          }
        } catch (awardError) {
          console.error("Coupon award error:", awardError)
          toast({
            title: "Mission Completed",
            description: `You've earned a ${result.couponValue} USDT coupon! (NFT minting failed - please try again)`,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Mission Completed",
          description: "Your yield boost has been activated.",
        })
      }

      // Refresh to reflect updated mission statuses
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete mission",
        variant: "destructive",
      })
    }
  }

  if (missionsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading missions...</p>
          </div>
        </div>
      </div>
    )
  }

  if (missionsError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {missionsError || "Failed to load missions"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const completedMissions = missionsData?.missions.filter(mission => mission.status === "COMPLETED") || []
  const pendingMissions = missionsData?.missions.filter(mission => mission.status === "PENDING") || []

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Yield Boost Missions</h1>
        </div>

        {!isConnected && (
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to claim coupon NFTs when completing missions.
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{completedMissions.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{pendingMissions.length}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {pendingMissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Available Missions</h2>
            <div className="space-y-3">
              {pendingMissions.map((mission) => {
                const IconComponent = missionIcons[mission.type] || missionIcons.DEFAULT
                return (
                  <MissionCard
                    key={mission.id}
                    icon={IconComponent}
                    title={mission.title}
                    description={mission.description}
                    buttonText={isAwardingCoupon ? "Minting NFT..." : "Complete"}
                    onButtonClick={() => handleMissionComplete(mission.id)}
                    completed={false}
                    boostInfo={`${mission.boostMultiplier}x boost for ${mission.boostDuration}h`}
                    disabled={!isConnected || isAwardingCoupon}
                  />
                )
              })}
            </div>
          </div>
        )}

        {completedMissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Completed Missions</h2>
            <div className="space-y-3">
              {completedMissions.map((mission) => {
                const IconComponent = missionIcons[mission.type] || missionIcons.DEFAULT
                return (
                  <MissionCard
                    key={mission.id}
                    icon={IconComponent}
                    title={mission.title}
                    description={mission.description}
                    completed={true}
                    boostInfo={`${mission.boostMultiplier}x boost for ${mission.boostDuration}h`}
                  />
                )
              })}
            </div>
          </div>
        )}

        {missionsData?.missions.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No Missions Available</h3>
              <p className="text-muted-foreground">Check back later for new yield boost missions!</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-foreground">How Missions Work:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Complete missions to earn yield boosts</li>
                <li>• Get USDT coupon NFTs as rewards</li>
                <li>• Boosts multiply your base APY</li>
                <li>• Some missions are repeatable</li>
                <li>• Boosts stack for maximum yield</li>
                <li>• Connect wallet to claim NFT rewards</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




