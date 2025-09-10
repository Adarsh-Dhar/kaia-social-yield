"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserData } from "@/hooks/use-user-data"
import { useMockUSDT } from "@/hooks/use-mock-usdt"
import { useCouponNFT } from "@/hooks/use-coupon-nft"
import { CouponDisplay } from "@/components/coupon-display"
import { useAccount } from "wagmi"
import { Loader2, AlertCircle, Gift, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"

function DashboardContent() {
  const { data: userData, loading: userLoading, error: userError } = useUserData()
  const { address, isConnected } = useAccount()
  
  // Contract hooks
  const { 
    balance: usdtBalance, 
    isLoading: usdtLoading, 
    error: usdtError,
    formatUsdt 
  } = useMockUSDT()
  
  const { 
    coupons, 
    usdtBalance: couponUsdtBalance,
    isLoading: couponLoading, 
    error: couponError,
    formatUsdt: formatCouponUsdt 
  } = useCouponNFT()

  // Calculate total USDT balance (from both sources)
  const totalUsdtBalance = usdtBalance + couponUsdtBalance
  const totalCouponValue = coupons.reduce((sum, coupon) => sum + coupon.value, BigInt(0))


  const getUserInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (userLoading || usdtLoading || couponLoading) {
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

  if (userError || usdtError || couponError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userError || usdtError || couponError || "Failed to load dashboard data"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* User Profile Card */}
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
          <CardContent>
            {/* USDT Balance Section */}
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                {formatUsdt(totalUsdtBalance)} USDT
              </div>
              <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
              {coupons.length > 0 && (
                <div className="text-sm text-primary">
                  +{formatCouponUsdt(totalCouponValue)} USDT in coupons
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coupon Display */}
        <CouponDisplay />

        {/* Action Buttons */}
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




