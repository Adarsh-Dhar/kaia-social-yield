"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CircularProgress } from "@/components/circular-progress"
import { MissionCard } from "@/components/mission-card"
import { Gift, UserPlus, CheckCircle } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      <div className="space-y-6">
        {/* Main Balance Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/diverse-user-avatars.png" alt="Alex" />
                <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Alex</h2>
                <p className="text-sm text-muted-foreground">Welcome back!</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">$500.00 USDT</div>
              <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
              <div className="text-lg font-semibold text-primary">+$12.50</div>
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
              <CircularProgress value={61} className="mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">6.1%</div>
                  <div className="text-xs text-muted-foreground">APY</div>
                </div>
              </CircularProgress>

              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Base APY:</span>
                  <span className="text-sm font-medium text-foreground">4.0%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Social Boosts:</span>
                  <span className="text-sm font-medium text-primary">+2.1%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Yield Boost Missions</h3>

          <div className="space-y-3">
            <MissionCard
              icon={Gift}
              title="Invite a Friend"
              description="Get a 1.5x yield multiplier for 24 hours!"
              buttonText="Invite"
              onButtonClick={() => console.log("Invite clicked")}
            />

            <MissionCard
              icon={UserPlus}
              title="Follow Official Account"
              description="Get a permanent +0.1% APY boost."
              buttonText="Follow"
              onButtonClick={() => console.log("Follow clicked")}
            />

            <MissionCard
              icon={CheckCircle}
              title="7-Day Streak"
              description="You've earned a loyalty NFT!"
              completed={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
