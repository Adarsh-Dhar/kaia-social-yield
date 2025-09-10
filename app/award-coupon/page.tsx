"use client";

import { AwardCouponDemo } from '@/components/award-coupon-demo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, ExternalLink } from 'lucide-react';

export default function AwardCouponPage() {
  return (
    <div className="container mx-auto max-w-4xl px-6 py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Award Coupon Demo</h1>
          <p className="text-muted-foreground">
            Demonstrate how to use the awardCoupon function to award coupons to connected wallets
          </p>
        </div>

        {/* Demo Component */}
        <AwardCouponDemo />

        {/* Code Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Code Examples
            </CardTitle>
            <CardDescription>
              How to use the awardCoupon function in your own components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Usage */}
            <div>
              <h4 className="font-semibold mb-2">Basic Usage with useCampaignManager</h4>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`import { useCampaignManager } from '@/hooks/use-campaign-manager';

function MyComponent() {
  const { awardCoupon, isLoading, error } = useCampaignManager();
  
  const handleAwardCoupon = async () => {
    const hash = await awardCoupon(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // user address
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', // campaign ID
      '10.50' // coupon value in USDT
    );
    
    if (hash) {
      console.log('Coupon awarded:', hash);
    }
  };
  
  return (
    <button onClick={handleAwardCoupon} disabled={isLoading}>
      Award Coupon
    </button>
  );
}`}
                </pre>
              </div>
            </div>

            {/* Simplified Usage */}
            <div>
              <h4 className="font-semibold mb-2">Simplified Usage with useAwardCoupon</h4>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`import { useAwardCoupon } from '@/hooks/use-award-coupon';

function MyComponent() {
  const { awardCoupon, isLoading, error, isConnected } = useAwardCoupon();
  
  const handleAwardCoupon = async () => {
    try {
      const hash = await awardCoupon({
        user: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        campaignId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        randomCouponValue: '10.50'
      });
      
      if (hash) {
        console.log('Coupon awarded:', hash);
      }
    } catch (err) {
      console.error('Failed to award coupon:', err);
    }
  };
  
  return (
    <button onClick={handleAwardCoupon} disabled={isLoading || !isConnected}>
      Award Coupon
    </button>
  );
}`}
                </pre>
              </div>
            </div>

            {/* Direct Service Usage */}
            <div>
              <h4 className="font-semibold mb-2">Direct Service Usage</h4>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`import { createCampaignManagerService } from '@/lib/campaign_manager';
import { useWalletClient } from 'wagmi';

function MyComponent() {
  const { data: walletClient } = useWalletClient();
  
  const handleAwardCoupon = async () => {
    if (!walletClient) return;
    
    const service = await createCampaignManagerService(walletClient);
    const hash = await service.awardCoupon(
      '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // user address
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12', // campaign ID
      '10.50' // coupon value in USDT
    );
    
    console.log('Coupon awarded:', hash);
  };
  
  return (
    <button onClick={handleAwardCoupon}>
      Award Coupon
    </button>
  );
}`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">Prerequisites</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Wallet must be connected</li>
                <li>Connected wallet must be the operator address</li>
                <li>Campaign must exist and be active</li>
                <li>Campaign must have remaining budget and participants</li>
                <li>Coupon value must be within campaign's min/max reward range</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Error Handling</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><Badge variant="outline">NotOperator</Badge> - Only the operator can award coupons</li>
                <li><Badge variant="outline">CampaignInactiveOrFull</Badge> - Campaign is inactive or has reached max participants</li>
                <li><Badge variant="outline">ValueOutOfBounds</Badge> - Coupon value is outside the campaign's reward range</li>
                <li><Badge variant="outline">NftContractNotSet</Badge> - Coupon NFT contract is not set</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Contract Function</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono">
                awardCoupon(address user, bytes32 campaignId, uint256 randomCouponValue)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>Related Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a 
              href="/advertiser" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
              Advertiser Dashboard
            </a>
            <a 
              href="/user/dashboard" 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
              User Dashboard
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
