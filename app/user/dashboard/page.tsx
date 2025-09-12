"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUserData } from "@/hooks/use-user-data"
import { useMockUSDT } from "@/hooks/use-mock-usdt"
import { useCouponNFT } from "@/hooks/use-coupon-nft"
import { CouponDisplay } from "@/components/coupon-display"
import { useAccount } from "wagmi"
import { Loader2, AlertCircle, Gift } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { getMyCouponsOptimized } from "@/lib/campaign_manager"

function DashboardContent() {
  const { data: userData, loading: userLoading, error: userError } = useUserData()
  const { address, isConnected } = useAccount()
  const [cmCoupons, setCmCoupons] = useState<{ id: bigint; value: bigint }[]>([])
  const [cmLoading, setCmLoading] = useState(false)
  const [cmError, setCmError] = useState<string | null>(null)
  
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
    formatUsdt: formatCouponUsdt,
    redeemCoupon: redeemCouponFromHook
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

  const handleRedeemCoupon = async (tokenId: string) => {
    try {
      const hash = await redeemCouponFromHook(tokenId)
      if (hash) {
        toast({
          title: "USDT Retrieved! 💰",
          description: `Successfully retrieved USDT from coupon NFT! Transaction: ${hash.slice(0, 10)}...`,
          duration: 5000,
        })
        // Refresh the page to update balances
        window.location.reload()
      }
    } catch (error) {
      toast({
        title: "Retrieval Failed",
        description: error instanceof Error ? error.message : "Failed to retrieve USDT from coupon",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!isConnected) {
        setCmCoupons([])
        return
      }
      setCmLoading(true)
      setCmError(null)
      try {
        // Conservatively scan first 2000 tokenIds; adjust as needed
        const { tokenIds, values } = await getMyCouponsOptimized(BigInt(2000), address)
        console.log('[Dashboard] getMyCouponsOptimized', { tokenIds, values })
        if (!cancelled) {
          const items = tokenIds.map((id, i) => ({ id, value: values[i] }))
          console.log('[Dashboard] cmCoupons items', items)
          setCmCoupons(items)
        }
      } catch (e) {
        if (!cancelled) setCmError(e instanceof Error ? e.message : 'Failed to load coupons')
      } finally {
        if (!cancelled) setCmLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isConnected])

  if (userLoading || usdtLoading || couponLoading || cmLoading) {
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

  if (userError || usdtError || couponError || cmError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userError || usdtError || couponError || cmError || "Failed to load dashboard data"}
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

        {/* Coupons from CampaignManager.getMyCouponsOptimized */}
        {cmCoupons.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Gift className="h-4 w-4" /> My Coupons (on-chain)
              </h3>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {cmCoupons.map((c) => (
                  <div key={c.id.toString()} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">#{c.id.toString()}</span>
                      <span className="text-sm font-medium text-foreground">{formatUsdt(c.value)} USDT</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeemCoupon(c.id.toString())}
                      disabled={couponLoading}
                      className="h-8 px-3 text-xs"
                    >
                      {couponLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Retrieve"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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




