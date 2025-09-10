"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useStaking } from "@/hooks/use-staking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, TrendingUp, Wallet, Loader2, AlertCircle, CheckCircle, Zap } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"

export default function DepositPage() {
  const { address, isConnected } = useAccount()
  const {
    stakerData,
    totalStaked,
    baseApyBps,
    hasStake,
    hasRewards,
    hasActiveBoost,
    formattedAmountStaked,
    formattedRewards,
    formattedTotalStaked,
    formattedBaseApy,
    stake,
    withdraw,
    claimRewards,
    isLoading,
    error,
    clearError,
    loadData
  } = useStaking()

  const [amount, setAmount] = useState("")
  const [isStaking, setIsStaking] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  const availableBalance = stakerData ? Number(stakerData.amountStaked) / 1e6 : 0

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

  // Check if user has USDC tokens before staking
  const checkUsdtBalance = async () => {
    try {
      // This would need to be implemented to check USDT balance
      // For now, we'll just show a warning
      return true
    } catch (error) {
      console.error('Failed to check USDT balance:', error)
      return false
    }
  }

  // Show warning about high gas fees
  const showGasWarning = () => {
    toast({
      title: "High Gas Fees Detected",
      description: "If you see extremely high gas fees (>100 KAIA), the contract may not be properly deployed or you may not have USDC tokens.",
      variant: "destructive",
    })
  }

  // Check for high gas fees and warn user
  const checkGasFees = (gasEstimate: bigint) => {
    const gasInKaia = Number(gasEstimate) / 1e18 // Convert wei to KAIA
    if (gasInKaia > 100) {
      toast({
        title: "⚠️ HIGH GAS FEES WARNING",
        description: `Gas estimate: ${gasInKaia.toFixed(2)} KAIA. This is too high! The contract may not be properly configured. DO NOT approve this transaction.`,
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const handleStake = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    // Validate amount is reasonable (not more than 1 million USDC)
    const amountNum = parseFloat(amount)
    if (amountNum > 1000000) {
      toast({
        title: "Amount Too Large",
        description: "Please enter an amount less than 1,000,000 USDC",
        variant: "destructive",
      })
      return
    }

    // Show confirmation before staking
    const confirmed = window.confirm(
      `Are you sure you want to stake ${amount} USDC?\n\n` +
      `This will transfer ${amount} USDC from your wallet to the staking contract.\n` +
      `MetaMask will open for you to approve the transaction.\n\n` +
      `⚠️ IMPORTANT: If you see gas fees > 100 KAIA, DO NOT approve the transaction!\n` +
      `This indicates a contract configuration issue.`
    )

    if (!confirmed) {
      return
    }

    setIsStaking(true)
    
    // Show helpful loading message
    toast({
      title: "Staking in Progress",
      description: "Please approve the transaction in MetaMask to complete the staking process.",
    })
    
    try {
      const txHash = await stake(amount)
      if (txHash) {
        toast({
          title: "Stake Successful",
          description: `Successfully staked ${amount} USDC. Transaction: ${txHash.slice(0, 10)}...`,
        })
        setAmount("")
        await loadData() // Refresh data
      }
    } catch (error) {
      console.error('Staking error:', error)
      
      let errorMessage = "Failed to stake USDC"
      if (error instanceof Error) {
        if (error.message.includes('Transaction cancelled by user') || error.message.includes('User rejected') || error.message.includes('User denied')) {
          errorMessage = "Transaction cancelled. Please try again when you're ready to stake."
        } else if (error.message.includes('Contract not deployed')) {
          errorMessage = "Contract not deployed. Please deploy the Social Yield Protocol contract to Kairos."
        } else if (error.message.includes('Insufficient funds')) {
          errorMessage = "Insufficient USDC balance. Please ensure you have enough USDC tokens."
        } else if (error.message.includes('USDT transfer failed') || error.message.includes('USDC transfer failed')) {
          errorMessage = "USDC transfer failed. Please check your USDC balance and approve the contract."
        } else if (error.message.includes('gas')) {
          errorMessage = "Transaction failed due to gas issues. Please try again."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Stake Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsStaking(false)
    }
  }

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
        description: `You can only withdraw up to ${availableBalance.toFixed(2)} USDC`,
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
          description: `Successfully withdrew ${amount} USDC. Transaction: ${txHash.slice(0, 10)}...`,
      })
      setAmount("")
        await loadData() // Refresh data
      }
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to withdraw USDC",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleClaimRewards = async () => {
    setIsClaiming(true)
    try {
      const txHash = await claimRewards()
      if (txHash) {
        toast({
          title: "Rewards Claimed",
          description: `Successfully claimed ${formattedRewards} USDT rewards. Transaction: ${txHash.slice(0, 10)}...`,
        })
        await loadData() // Refresh data
      }
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim rewards",
        variant: "destructive",
      })
    } finally {
      setIsClaiming(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
              <p className="text-muted-foreground">Please connect your wallet to stake USDC</p>
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
            <h1 className="text-2xl font-bold text-foreground">Stake USDC</h1>
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
                  <h3 className="font-medium text-foreground">To deploy the contracts:</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open a terminal in the project root</li>
                    <li>Run: <code className="bg-background px-1 rounded">cd contracts</code></li>
                    <li>Run: <code className="bg-background px-1 rounded">forge script script/Deploy.s.sol --rpc-url https://public-en-kairos.node.kaia.io --broadcast</code></li>
                    <li>Update the protocol address in <code className="bg-background px-1 rounded">lib/social/address.ts</code></li>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Stake USDC</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Staking Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Staking Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {formattedAmountStaked} USDC
                </div>
                <p className="text-sm text-muted-foreground">Staked Amount</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {formattedRewards} USDC
                </div>
                <p className="text-sm text-muted-foreground">Pending Rewards</p>
              </div>
            </div>

            {hasActiveBoost && (
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Active Yield Boost!</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Your yield is currently boosted
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {hasRewards && (
                <Button
                  onClick={handleClaimRewards}
                  disabled={isClaiming || isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isClaiming ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Claiming...</>
                  ) : (
                    <>Claim Rewards</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Protocol Stats */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Protocol Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">
                  {formattedTotalStaked} USDC
                </div>
                <p className="text-sm text-muted-foreground">Total Staked</p>
              </div>
            <div className="text-center">
                <div className="text-xl font-bold text-foreground">
                  {formattedBaseApy}
                </div>
                <p className="text-sm text-muted-foreground">Base APY</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stake/Withdraw Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Stake or Withdraw</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ You need USDC tokens in your wallet to stake. When MetaMask opens, you'll first approve the protocol to spend USDC, then confirm the stake.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showGasWarning}
                  className="text-xs"
                >
                  Check Contract Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://explorer.kairos.kaia.io/address/0x54a658539952a41e8C00e1c7B6b1E678B1c08647', '_blank')}
                  className="text-xs"
                >
                  View Contract
                </Button>
              </div>
            </div>

              <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleStake}
                disabled={isStaking || isLoading || !amount || parseFloat(amount) <= 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isStaking ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Staking...</>
                ) : (
                  <>Stake USDC</>
                )}
                </Button>

              <Button
                onClick={handleWithdraw}
                disabled={isWithdrawing || isLoading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
                variant="outline"
              >
                {isWithdrawing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Withdrawing...</>
                ) : (
                  <>Withdraw</>
                )}
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50 border-border">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <h4 className="font-medium text-foreground">How it works:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Stake USDC to earn {formattedBaseApy} base APY</li>
                <li>• Complete missions to get yield boosts</li>
                <li>• Withdraw your stake anytime</li>
                <li>• Claim rewards when available</li>
                <li>• No minimum stake required</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}