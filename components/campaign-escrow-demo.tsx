'use client'

import { useState } from 'react'
import { useCampaignEscrow } from '@/hooks/use-campaign-escrow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Plus, DollarSign, Send, Shield } from 'lucide-react'

export function CampaignEscrowDemo() {
  const {
    isLoading,
    error,
    getCampaign,
    getDepositAmount,
    getOwner,
    createCampaign,
    addFunds,
    deposit,
    releaseFunds,
    formatEther,
    clearError
  } = useCampaignEscrow()

  // Form states
  const [campaignId, setCampaignId] = useState('')
  const [initialFunding, setInitialFunding] = useState('')
  const [fundAmount, setFundAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  
  // Display states
  const [campaign, setCampaign] = useState<any>(null)
  const [depositBalance, setDepositBalance] = useState<string>('')
  const [contractOwner, setContractOwner] = useState<string>('')
  const [lastTxHash, setLastTxHash] = useState<string>('')

  const handleGetCampaign = async () => {
    if (!campaignId) return
    
    const result = await getCampaign(campaignId as `0x${string}`)
    if (result) {
      setCampaign({
        ...result,
        totalFunding: formatEther(result.totalFunding),
        createdAt: new Date(Number(result.createdAt) * 1000).toLocaleString()
      })
    }
  }

  const handleGetDepositAmount = async () => {
    if (!campaignId) return
    
    const result = await getDepositAmount(campaignId as `0x${string}`)
    if (result !== null) {
      setDepositBalance(formatEther(result))
    }
  }

  const handleGetOwner = async () => {
    const result = await getOwner()
    if (result) {
      setContractOwner(result)
    }
  }

  const handleCreateCampaign = async () => {
    if (!initialFunding) return
    
    const result = await createCampaign(initialFunding)
    if (result) {
      setLastTxHash(result)
      setInitialFunding('')
    }
  }

  const handleAddFunds = async () => {
    if (!campaignId || !fundAmount) return
    
    const result = await addFunds(campaignId as `0x${string}`, fundAmount)
    if (result) {
      setLastTxHash(result)
      setFundAmount('')
    }
  }

  const handleDeposit = async () => {
    if (!campaignId || !depositAmount) return
    
    const result = await deposit(campaignId as `0x${string}`, depositAmount)
    if (result) {
      setLastTxHash(result)
      setDepositAmount('')
    }
  }

  const handleReleaseFunds = async () => {
    if (!campaignId || !recipient) return
    
    const result = await releaseFunds(campaignId as `0x${string}`, recipient)
    if (result) {
      setLastTxHash(result)
      setRecipient('')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Campaign Escrow Demo</h1>
        <p className="text-muted-foreground mt-2">
          Interact with the CampaignEscrow smart contract
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError}
              className="ml-2"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Read Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Read Operations
            </CardTitle>
            <CardDescription>
              View campaign data and contract information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign ID</label>
              <div className="flex gap-2">
                <Input
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="0x..."
                />
                <Button 
                  onClick={handleGetCampaign}
                  disabled={isLoading || !campaignId}
                  size="sm"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get'}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGetDepositAmount}
                disabled={isLoading || !campaignId}
                variant="outline"
                size="sm"
              >
                Get Deposit Amount
              </Button>
              <Button 
                onClick={handleGetOwner}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                Get Owner
              </Button>
            </div>

            {campaign && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold">Campaign Details</h4>
                <div className="text-sm space-y-1">
                  <p><strong>ID:</strong> {campaign.id}</p>
                  <p><strong>Creator:</strong> {campaign.creator}</p>
                  <p><strong>Total Funding:</strong> {campaign.totalFunding} ETH</p>
                  <p><strong>Active:</strong> 
                    <Badge variant={campaign.isActive ? "default" : "secondary"} className="ml-2">
                      {campaign.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                  <p><strong>Created:</strong> {campaign.createdAt}</p>
                </div>
              </div>
            )}

            {depositBalance && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Deposit Balance:</strong> {depositBalance} ETH
                </p>
              </div>
            )}

            {contractOwner && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Contract Owner:</strong> {contractOwner}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Write Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Write Operations
            </CardTitle>
            <CardDescription>
              Create campaigns and manage funds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create Campaign */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Create Campaign</label>
              <div className="flex gap-2">
                <Input
                  value={initialFunding}
                  onChange={(e) => setInitialFunding(e.target.value)}
                  placeholder="Initial funding (ETH)"
                  type="number"
                  step="0.001"
                />
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={isLoading || !initialFunding}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </div>
            </div>

            <Separator />

            {/* Add Funds */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Funds to Campaign</label>
              <div className="space-y-2">
                <Input
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="Amount to add (ETH)"
                  type="number"
                  step="0.001"
                />
                <Button 
                  onClick={handleAddFunds}
                  disabled={isLoading || !campaignId || !fundAmount}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Add Funds
                </Button>
              </div>
            </div>

            <Separator />

            {/* Deposit */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Deposit to Campaign</label>
              <div className="space-y-2">
                <Input
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount to deposit (ETH)"
                  type="number"
                  step="0.001"
                />
                <Button 
                  onClick={handleDeposit}
                  disabled={isLoading || !campaignId || !depositAmount}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Deposit
                </Button>
              </div>
            </div>

            <Separator />

            {/* Release Funds */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Release Funds (Owner Only)</label>
              <div className="space-y-2">
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Recipient address"
                />
                <Button 
                  onClick={handleReleaseFunds}
                  disabled={isLoading || !campaignId || !recipient}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Release Funds
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {lastTxHash && (
        <Card>
          <CardHeader>
            <CardTitle>Last Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono break-all">
              <strong>Transaction Hash:</strong> {lastTxHash}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
