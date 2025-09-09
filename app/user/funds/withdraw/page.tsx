"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useStaking } from "@/hooks/use-staking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Wallet, Loader2, AlertCircle, TrendingDown } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function WithdrawPage() {
  const { address, isConnected } = useAccount()
  const {
    stakerData,
    hasStake,
    formattedAmountStaked,
    withdraw,
    isLoading,
    error,
    clearError,
    loadData
  } = useStaking()

  const [amount, setAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Load data on mount
  useEffect(() => {
    if (isConnected) {
      loadData()
    }
  }, [isConnected, loadData])

  // Clear error when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  const availableBalance = stakerData ? parseFloat(formattedAmountStaked) : 0
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
        description: `You can only withdraw up to ${availableBalance.toFixed(2)} USDT`,
        variant: "destructive",
      })
      return
    }

    setIsWithdrawing(true)
    try {
      const txHash = await withdraw(amount)
      if (txHash) {
      toast({
          title: "Withdrawal Successful",
          description: `Successfully withdrew ${amount} USDT. Transaction: ${txHash.slice(0, 10)}...`,
      })
      setAmount("")
        await loadData() // Refresh data
      }
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to withdraw USDT",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const setMaxAmount = () => {
    setAmount(availableBalance.toString())
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
              <p className="text-muted-foreground">Please connect your wallet to withdraw USDT</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show blockchain connection error with instructions
  if (error && (error.includes('Kairos network not available') || error.includes('Contract not deployed') || error.includes('Contract not found'))) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/user/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Withdraw USDT</h1>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Contract Not Deployed</h2>
                  <p className="text-muted-foreground">The Social Yield Protocol contract needs to be deployed to Kairos</p>
                </div>
                <div className="text-left space-y-2 p-4 bg-muted rounded-lg">
                  <h3 className="font-medium text-foreground">To deploy the contract:</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open a terminal in the project root</li>
                    <li>Run: <code className="bg-background px-1 rounded">cd contracts</code></li>
                    <li>Run: <code className="bg-background px-1 rounded">forge script script/Deploy.s.sol --rpc-url https://public-en-kairos.node.kaia.io --broadcast</code></li>
                    <li>Update the contract address in <code className="bg-background px-1 rounded">lib/social/address.ts</code></li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!hasStake) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <a href="/user/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Withdraw USDT</h1>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <TrendingDown className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h2 className="text-xl font-semibold text-foreground">No Staked Funds</h2>
                  <p className="text-muted-foreground">You don't have any staked USDT to withdraw</p>
                </div>
                <Button asChild className="mt-4">
                  <a href="/user/funds/deposit">Stake USDT First</a>
                </Button>
              </div>
            </CardContent>
          </Card>
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
          <h1 className="text-2xl font-bold text-foreground">Withdraw USDT</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Available Balance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-1">
                {formattedAmountStaked} USDT
              </div>
              <p className="text-sm text-muted-foreground">Available for withdrawal</p>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Withdrawal Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (USDT)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg pr-20"
                  step="0.01"
                  min="0"
                  max={maxWithdraw}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={setMaxAmount}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2 text-xs"
                >
                  Max
                </Button>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Min: 0.01 USDT</span>
                <span>Max: {availableBalance.toFixed(2)} USDT</span>
              </div>
            </div>

            {/* Withdrawal Address */}
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Withdrawal Address
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="text-foreground">Anvil (Local)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token:</span>
                  <span className="text-foreground">USDT</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Address:</span>
                  <div className="p-2 bg-background rounded border font-mono text-xs break-all">
                    {address || "Not connected"}
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal Details */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-foreground">Withdrawal Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="text-foreground">{amount || "0"} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee:</span>
                  <span className="text-foreground">~0.001 ETH</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">You'll receive:</span>
                  <span className="text-foreground">{amount || "0"} USDT</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing || isLoading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isWithdrawing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Withdrawing...</>
              ) : (
                <>Withdraw {amount || "0"} USDT</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-foreground">Important Notes:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Withdrawals are processed instantly</li>
                <li>• You can withdraw any amount from your stake</li>
                <li>• Withdrawing stops earning yield on that amount</li>
                <li>• Small network fees apply (paid in ETH)</li>
                <li>• Funds are sent directly to your connected wallet</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}