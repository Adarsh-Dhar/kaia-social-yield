"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCouponNFT } from "@/hooks/use-coupon-nft"
import { Loader2, Gift, DollarSign, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"

interface CouponDisplayProps {
  className?: string
}

export function CouponDisplay({ className }: CouponDisplayProps) {
  const { 
    coupons, 
    usdtBalance, 
    isLoading, 
    error, 
    redeemCoupon, 
    formatUsdt, 
    clearError 
  } = useCouponNFT()
  
  const [redeemingTokenId, setRedeemingTokenId] = useState<string | null>(null)

  const handleRedeem = async (tokenId: string) => {
    setRedeemingTokenId(tokenId)
    try {
      const hash = await redeemCoupon(tokenId)
      if (hash) {
        // Success - the hook will reload data automatically
        console.log('Coupon redeemed successfully:', hash)
      }
    } catch (err) {
      console.error('Failed to redeem coupon:', err)
    } finally {
      setRedeemingTokenId(null)
    }
  }

  const totalCouponValue = coupons.reduce((sum, coupon) => sum + coupon.value, BigInt(0))

  if (isLoading && coupons.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Coupons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading coupons...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* USDT Balance Card */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            USDT Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {formatUsdt(usdtBalance)} USDT
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Available for redemption
          </p>
        </CardContent>
      </Card>

      {/* Coupons Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Coupons
            {coupons.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {coupons.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={clearError}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {coupons.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No coupons yet</p>
              <p className="text-sm text-muted-foreground">
                Complete missions to earn reward coupons!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Total Value Summary */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total Coupon Value:
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatUsdt(totalCouponValue)} USDT
                  </span>
                </div>
              </div>

              {/* Individual Coupons */}
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <Card key={coupon.tokenId.toString()} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Token #{coupon.tokenId.toString()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Value: {formatUsdt(coupon.value)} USDT
                            </span>
                          </div>
                          {coupon.tokenURI && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <ExternalLink className="h-3 w-3" />
                              <a 
                                href={coupon.tokenURI} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors"
                              >
                                View NFT
                              </a>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRedeem(coupon.tokenId.toString())}
                          disabled={isLoading || redeemingTokenId === coupon.tokenId.toString()}
                          className="ml-4"
                        >
                          {redeemingTokenId === coupon.tokenId.toString() ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Redeeming...
                            </>
                          ) : (
                            'Redeem'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
