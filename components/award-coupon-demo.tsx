"use client";

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useCampaignManager } from '@/hooks/use-campaign-manager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Gift } from 'lucide-react';
import { formatUnits } from 'viem';

interface AwardCouponDemoProps {
  campaignId?: `0x${string}`;
  className?: string;
}

export function AwardCouponDemo({ campaignId, className }: AwardCouponDemoProps) {
  const { address, isConnected } = useAccount();
  const {
    awardCoupon,
    getCampaign,
    formatUsdt,
    isLoading,
    error,
    clearError
  } = useCampaignManager();

  // State for the form
  const [targetUser, setTargetUser] = useState<string>('');
  const [couponValue, setCouponValue] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaignId || '');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<any>(null);

  // Load campaign data when campaign ID changes
  const loadCampaignData = useCallback(async (id: `0x${string}`) => {
    if (!id) return;
    
    try {
      const campaign = await getCampaign(id);
      if (campaign) {
        setCampaignData(campaign);
      }
    } catch (err) {
      console.error('Failed to load campaign:', err);
    }
  }, [getCampaign]);

  // Handle campaign ID input change
  const handleCampaignIdChange = useCallback((value: string) => {
    setSelectedCampaignId(value);
    if (value.startsWith('0x') && value.length === 66) {
      loadCampaignData(value as `0x${string}`);
    } else {
      setCampaignData(null);
    }
  }, [loadCampaignData]);

  // Handle awarding coupon
  const handleAwardCoupon = useCallback(async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!targetUser || !couponValue || !selectedCampaignId) {
      alert('Please fill in all fields');
      return;
    }

    if (!selectedCampaignId.startsWith('0x') || selectedCampaignId.length !== 66) {
      alert('Please enter a valid campaign ID (0x...)');
      return;
    }

    if (!targetUser.startsWith('0x') || targetUser.length !== 42) {
      alert('Please enter a valid user address (0x...)');
      return;
    }

    const value = parseFloat(couponValue);
    if (isNaN(value) || value <= 0) {
      alert('Please enter a valid coupon value');
      return;
    }

    try {
      clearError();
      setTxHash(null);
      
      const hash = await awardCoupon(
        targetUser as `0x${string}`,
        selectedCampaignId as `0x${string}`,
        couponValue
      );

      if (hash) {
        setTxHash(hash);
        // Reset form
        setTargetUser('');
        setCouponValue('');
        // Reload campaign data to show updated stats
        loadCampaignData(selectedCampaignId as `0x${string}`);
      }
    } catch (err) {
      console.error('Failed to award coupon:', err);
    }
  }, [
    isConnected,
    address,
    targetUser,
    couponValue,
    selectedCampaignId,
    awardCoupon,
    clearError,
    loadCampaignData
  ]);

  // Auto-fill with connected wallet address
  const fillWithConnectedWallet = useCallback(() => {
    if (address) {
      setTargetUser(address);
    }
  }, [address]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Award Coupon to Wallet
          </CardTitle>
          <CardDescription>
            Award a coupon NFT to a user's wallet address. This function can only be called by the operator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Connection Status */}
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Wallet Connected" : "Wallet Not Connected"}
            </Badge>
            {isConnected && address && (
              <span className="text-sm text-muted-foreground">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}
          </div>

          {/* Campaign ID Input */}
          <div className="space-y-2">
            <Label htmlFor="campaignId">Campaign ID</Label>
            <Input
              id="campaignId"
              type="text"
              placeholder="0x..."
              value={selectedCampaignId}
              onChange={(e) => handleCampaignIdChange(e.target.value)}
              className="font-mono"
            />
            {campaignData && (
              <div className="text-sm text-green-600">
                ✓ Campaign found: {formatUsdt(campaignData.totalBudget)} USDT budget
              </div>
            )}
          </div>

          {/* Target User Input */}
          <div className="space-y-2">
            <Label htmlFor="targetUser">Target User Address</Label>
            <div className="flex gap-2">
              <Input
                id="targetUser"
                type="text"
                placeholder="0x..."
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="font-mono"
              />
              {isConnected && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillWithConnectedWallet}
                >
                  Use My Wallet
                </Button>
              )}
            </div>
          </div>

          {/* Coupon Value Input */}
          <div className="space-y-2">
            <Label htmlFor="couponValue">Coupon Value (USDT)</Label>
            <Input
              id="couponValue"
              type="number"
              step="0.01"
              placeholder="10.50"
              value={couponValue}
              onChange={(e) => setCouponValue(e.target.value)}
            />
            {campaignData && (
              <div className="text-sm text-muted-foreground">
                Range: {formatUsdt(campaignData.minReward)} - {formatUsdt(campaignData.maxReward)} USDT
              </div>
            )}
          </div>

          {/* Award Button */}
          <Button
            onClick={handleAwardCoupon}
            disabled={isLoading || !isConnected || !targetUser || !couponValue || !selectedCampaignId}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Awarding Coupon...
              </>
            ) : (
              <>
                <Gift className="mr-2 h-4 w-4" />
                Award Coupon
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {txHash && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Coupon awarded successfully! Transaction hash: {txHash}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Campaign Information */}
      {campaignData && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Budget:</span>
                <br />
                {formatUsdt(campaignData.totalBudget)} USDT
              </div>
              <div>
                <span className="font-medium">Spent:</span>
                <br />
                {formatUsdt(campaignData.spent)} USDT
              </div>
              <div>
                <span className="font-medium">Max Participants:</span>
                <br />
                {campaignData.maxParticipants.toString()}
              </div>
              <div>
                <span className="font-medium">Current Participants:</span>
                <br />
                {campaignData.participantsCount.toString()}
              </div>
              <div>
                <span className="font-medium">Min Reward:</span>
                <br />
                {formatUsdt(campaignData.minReward)} USDT
              </div>
              <div>
                <span className="font-medium">Max Reward:</span>
                <br />
                {formatUsdt(campaignData.maxReward)} USDT
              </div>
            </div>
            <div className="pt-2">
              <Badge variant={campaignData.isActive ? "default" : "secondary"}>
                {campaignData.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Connect your wallet (must be the operator)</p>
          <p>2. Enter a valid campaign ID (0x...)</p>
          <p>3. Enter the target user's wallet address</p>
          <p>4. Enter the coupon value in USDT</p>
          <p>5. Click "Award Coupon" to execute the transaction</p>
          <p className="text-orange-600 font-medium">
            Note: Only the operator address can award coupons. Make sure your connected wallet is the operator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
