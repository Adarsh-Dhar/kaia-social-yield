"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Header } from "@/components/header"
import { useUserData } from "@/hooks/use-user-data"
import { ArrowLeft, User, Wallet, Calendar, LogOut, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { data: userData, loading: userLoading, error: userError } = useUserData()
  const [copied, setCopied] = useState(false)

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    // Clear session and redirect to auth
    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/auth"
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-4 max-w-md mx-auto">
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg">
            {userError || "Failed to load profile data"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        </div>

        {/* User Info Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={userData?.user.pictureUrl || "/diverse-user-avatars.png"} 
                  alt={userData?.user.displayName || "User"} 
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getUserInitials(userData?.user.displayName ?? null)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">
                  {userData?.user.displayName || "User"}
                </h3>
                <p className="text-sm text-muted-foreground">Social Yield Protocol User</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Display Name</label>
                <div className="p-3 bg-muted rounded-lg text-foreground">
                  {userData?.user.displayName || "Not set"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Member Since</label>
                <div className="p-3 bg-muted rounded-lg text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {userData?.user.createdAt ? new Date(userData.user.createdAt).toLocaleDateString() : "Unknown"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Wallet Address</label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground break-all flex-1">
                    {userData?.user.walletAddress || "Not connected"}
                  </code>
                  {userData?.user.walletAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(userData.user.walletAddress!)}
                      className="h-8 w-8 p-0"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Network</label>
              <div className="p-3 bg-muted rounded-lg text-foreground">
                KAIA Network
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-foreground">
                  ${formatUSDT(userData?.financials.stakedUsdt || "0")}
                </div>
                <div className="text-sm text-muted-foreground">Staked USDT</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  +${formatUSDT(userData?.financials.totalRewards || "0")}
                </div>
                <div className="text-sm text-muted-foreground">Total Rewards</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current APY:</span>
                <span className="text-sm font-medium text-foreground">
                  {userData?.boost.multiplier ? `${(userData.boost.multiplier * 4).toFixed(1)}%` : "4.0%"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Boost Multiplier:</span>
                <span className="text-sm font-medium text-primary">
                  {userData?.boost.multiplier || 1}x
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
          </CardContent>
        </Card>

        {/* Transaction History Placeholder */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-2">No recent transactions</div>
              <p className="text-sm text-muted-foreground">
                Your transaction history will appear here
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
