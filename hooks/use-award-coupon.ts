import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useCampaignManager } from './use-campaign-manager';
import type { Address, Hash } from 'viem';

export interface AwardCouponParams {
  user: Address;
  campaignId: `0x${string}`;
  randomCouponValue: string;
}

export interface UseAwardCouponReturn {
  awardCoupon: (params: AwardCouponParams) => Promise<Hash | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isConnected: boolean;
  address: Address | undefined;
}

/**
 * Hook for awarding coupons to users
 * Provides a simplified interface for the awardCoupon function
 */
export function useAwardCoupon(): UseAwardCouponReturn {
  const { address, isConnected } = useAccount();
  const {
    awardCoupon: awardCouponFromManager,
    isLoading,
    error,
    clearError
  } = useCampaignManager();

  const awardCoupon = useCallback(async (params: AwardCouponParams): Promise<Hash | null> => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!params.user || !params.campaignId || !params.randomCouponValue) {
      throw new Error('Missing required parameters');
    }

    // Validate address format
    if (!params.user.startsWith('0x') || params.user.length !== 42) {
      throw new Error('Invalid user address format');
    }

    // Validate campaign ID format
    if (!params.campaignId.startsWith('0x') || params.campaignId.length !== 66) {
      throw new Error('Invalid campaign ID format');
    }

    // Validate coupon value
    const value = parseFloat(params.randomCouponValue);
    if (isNaN(value) || value <= 0) {
      throw new Error('Invalid coupon value');
    }

    return await awardCouponFromManager(
      params.user,
      params.campaignId,
      params.randomCouponValue
    );
  }, [isConnected, awardCouponFromManager]);

  return {
    awardCoupon,
    isLoading,
    error,
    clearError,
    isConnected,
    address
  };
}
