"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUserData } from "@/hooks/use-user-data"
import { ArrowLeft, Wallet, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

export default function WithdrawPage() {
  const { data: userData, loading: userLoading, error: userError } = useUserData()
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const formatUSDT = (amount: string) => {
    const num = parseFloat(amount)
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  const availableBalance = parseFloat(userData?.financials.stakedUsdt || "0")
  const maxWithdraw = availableBalance

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    if (parseFloat(amount) > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You can only withdraw up to ${formatUSDT(availableBalance.toString())} USDT`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Withdrawal Initiated",
        description: `Withdrawal of ${amount} USDT has been initiated. Funds will be sent to your wallet.`,
      })
      setAmount("")
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to initiate withdrawal",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const setMaxAmount = () => {
    setAmount(availableBalance.toString())
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userError || "Failed to load user data"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Withdraw Funds</h1>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                ${formatUSDT(userData?.financials.stakedUsdt || "0")} USDT
              </div>
              <p className="text-sm text-muted-foreground">Available for withdrawal</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Withdrawal Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (USDT)</Label>
              <div className="relative">
                <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg pr-20" step="0.01" min="0" max={maxWithdraw} />
                <Button type="button" variant="outline" size="sm" onClick={setMaxAmount} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 text-xs">Max</Button>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Min: 10 USDT</span>
                <span>Max: {formatUSDT(maxWithdraw.toString())} USDT</span>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Withdrawal Address
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="text-foreground">KAIA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token:</span>
                  <span className="text-foreground">USDT</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Address:</span>
                  <div className="p-2 bg-background rounded border font-mono text-xs break-all">
                    {userData?.user.walletAddress || "Not connected"}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-foreground">Withdrawal Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="text-foreground">{amount || "0"} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee:</span>
                  <span className="text-foreground">~0.1 USDT</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">You'll receive:</span>
                  <span className="text-foreground">{amount ? `${(parseFloat(amount) - 0.1).toFixed(2)} USDT` : "0 USDT"}</span>
                </div>
              </div>
            </div>

            <Button onClick={handleWithdraw} disabled={isProcessing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (`Withdraw ${amount || "0"} USDT`)}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




