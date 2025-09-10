"use client";

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Gift, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Mission {
  id: string;
  title: string;
  type: string;
  description: string;
  boostMultiplier: number;
  boostDuration: number;
  targetCompletions: number;
  completions: number;
  status: 'PENDING' | 'COMPLETED';
}

interface MissionCompletionWithCouponProps {
  mission: Mission;
  campaignId: string;
  onComplete?: (missionId: string, txHash?: string) => void;
  className?: string;
}

export function MissionCompletionWithCoupon({ 
  mission, 
  campaignId, 
  onComplete,
  className 
}: MissionCompletionWithCouponProps) {
  const { address, isConnected } = useAccount();
  const [isCompleting, setIsCompleting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteMission = useCallback(async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to complete missions and receive coupons.",
        variant: "destructive",
      });
      return;
    }

    if (mission.status === 'COMPLETED') {
      toast({
        title: "Mission Already Completed",
        description: "This mission has already been completed.",
        variant: "destructive",
      });
      return;
    }

    setIsCompleting(true);
    setError(null);

    try {
      // Generate a random coupon value (in a real app, this would be more sophisticated)
      const minValue = 1.0;
      const maxValue = 50.0;
      const randomValue = (Math.random() * (maxValue - minValue) + minValue).toFixed(2);

      const response = await fetch('/api/missions/award-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` // Adjust based on your auth implementation
        },
        body: JSON.stringify({
          missionId: mission.id,
          campaignId: campaignId,
          couponValue: randomValue
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete mission');
      }

      setTxHash(result.txHash);
      
      toast({
        title: "Mission Completed! 🎉",
        description: `You've earned a ${randomValue} USDT coupon! Check your dashboard to redeem it.`,
      });

      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(mission.id, result.txHash);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete mission';
      setError(errorMessage);
      
      toast({
        title: "Mission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  }, [isConnected, mission, campaignId, onComplete]);

  const getMissionIcon = (type: string) => {
    switch (type) {
      case 'INVITE': return Gift;
      case 'FOLLOW': return ExternalLink;
      case 'STREAK': return CheckCircle;
      default: return Gift;
    }
  };

  const MissionIcon = getMissionIcon(mission.type);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MissionIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{mission.title}</CardTitle>
              <CardDescription className="mt-1">
                {mission.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant={mission.status === 'COMPLETED' ? 'default' : 'secondary'}>
            {mission.status === 'COMPLETED' ? 'Completed' : 'Available'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mission Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Boost Multiplier:</span>
            <br />
            <span className="text-lg font-semibold">{mission.boostMultiplier}x</span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Duration:</span>
            <br />
            <span className="text-lg font-semibold">{mission.boostDuration}h</span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Completions:</span>
            <br />
            <span className="text-lg font-semibold">
              {mission.completions}/{mission.targetCompletions}
            </span>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Reward:</span>
            <br />
            <span className="text-lg font-semibold text-green-600">
              Random USDT Coupon
            </span>
          </div>
        </div>

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

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {txHash && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Mission completed! Coupon awarded. Transaction: {txHash}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        <Button
          onClick={handleCompleteMission}
          disabled={isCompleting || mission.status === 'COMPLETED' || !isConnected}
          className="w-full"
        >
          {isCompleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Mission...
            </>
          ) : mission.status === 'COMPLETED' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Mission Completed
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Complete Mission & Earn Coupon
            </>
          )}
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Completing this mission will award you a random USDT coupon</p>
          <p>• The coupon value will be between $1.00 - $50.00 USDT</p>
          <p>• You can redeem the coupon in your dashboard</p>
          <p>• Your yield boost will also be activated</p>
        </div>
      </CardContent>
    </Card>
  );
}
