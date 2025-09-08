"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/header"
import { useUserData } from "@/hooks/use-user-data"
import { ArrowLeft, CreditCard, Coins, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

export default function DepositPage() {
  const { data: userData, loading: userLoading, error: userError } = useUserData()
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "fiat">("crypto")
  const [isProcessing, setIsProcessing] = useState(false)

  const formatUSDT = (amount: string) => {
    const num = parseFloat(amount)
    return isNaN(num) ? "0.00" : num.toFixed(2)
  }

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast({
        title: "Deposit Initiated",
        description: `Deposit of ${amount} USDT has been initiated. Please complete the transaction in your wallet.`,
      })
      setAmount("")
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "Failed to initiate deposit",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
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
        <Header />
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
      <Header />
      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Deposit Funds</h1>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                ${formatUSDT(userData?.financials.stakedUsdt || "0")} USDT
              </div>
              <p className="text-sm text-muted-foreground">Available for staking</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Deposit Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (USDT)</Label>
              <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-lg" step="0.01" min="0" />
            </div>

            <div className="space-y-3">
              <Label className="text-foreground">Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button variant={paymentMethod === "crypto" ? "default" : "outline"} onClick={() => setPaymentMethod("crypto")} className="flex flex-col gap-2 h-20">
                  <Coins className="h-5 w-5" />
                  <span className="text-sm">Crypto</span>
                </Button>
                <Button variant={paymentMethod === "fiat" ? "default" : "outline"} onClick={() => setPaymentMethod("fiat")} className="flex flex-col gap-2 h-20">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm">Credit Card</span>
                </Button>
              </div>
            </div>

            {paymentMethod === "crypto" && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground">Crypto Payment</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="text-foreground">KAIA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token:</span>
                    <span className="text-foreground">USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Wallet:</span>
                    <span className="text-foreground font-mono text-xs">{userData?.user.walletAddress?.slice(0, 6)}...{userData?.user.walletAddress?.slice(-4)}</span>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "fiat" && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground">Credit Card Payment</h4>
                <p className="text-sm text-muted-foreground">Powered by Stripe. Secure and instant processing.</p>
              </div>
            )}

            <Button onClick={handleDeposit} disabled={isProcessing || !amount || parseFloat(amount) <= 0} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isProcessing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (`Deposit ${amount || "0"} USDT`)}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-foreground">Important Notes:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Minimum deposit: 10 USDT</li>
                <li>• Deposits are processed instantly</li>
                <li>• Funds start earning yield immediately</li>
                <li>• No deposit fees for USDT</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


