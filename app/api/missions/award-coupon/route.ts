import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { createCampaignManagerService } from "@/lib/campaign_manager";
import { createWalletClient, http } from "viem";
import { kairos } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// This would be the operator's private key (in production, use environment variables)
const OPERATOR_PRIVATE_KEY = process.env.OPERATOR_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Test key for development
if (!OPERATOR_PRIVATE_KEY) {
  console.error("OPERATOR_PRIVATE_KEY environment variable is required");
  throw new Error("OPERATOR_PRIVATE_KEY environment variable is required");
}

// Create operator wallet client
const operatorAccount = privateKeyToAccount(OPERATOR_PRIVATE_KEY as `0x${string}`);
const operatorWalletClient = createWalletClient({
  account: operatorAccount,
  chain: kairos,
  transport: http('https://public-en-kairos.node.kaia.io')
});

/**
 * Award a coupon to a user after mission completion
 * This endpoint should be called by the backend when a user completes a mission
 */
export async function POST(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { missionId, campaignId, couponValue } = await req.json();
    
    console.log("Award coupon request:", { missionId, campaignId, couponValue });
    
    if (!missionId || !campaignId || !couponValue) {
      console.log("Missing required fields:", { missionId, campaignId, couponValue });
      return NextResponse.json({ 
        error: "Missing required fields: missionId, campaignId, couponValue" 
      }, { status: 400 });
    }

    // Validate mission exists
    const mission = await prisma.mission.findUnique({ 
      where: { id: missionId } 
    });
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Validate campaign exists and is active
    // Note: campaignId here is actually the contractCampaignId from the mission completion
    const campaign = await prisma.campaign.findFirst({ 
      where: { 
        contractCampaignId: campaignId,
        status: 'ACTIVE'
      } 
    });
    console.log("Campaign lookup result:", { 
      campaignId, 
      found: !!campaign, 
      status: campaign?.status 
    });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found or inactive" }, { status: 404 });
    }

    // Check if user has already completed this mission
    const existingCompletion = await prisma.userMission.findUnique({
      where: { 
        userId_missionId: { 
          userId: payload.userId, 
          missionId 
        } 
      }
    });

    if (existingCompletion?.status === 'COMPLETED') {
      return NextResponse.json({ 
        error: "Mission already completed" 
      }, { status: 400 });
    }

    // Get user's wallet address
    const user = await prisma.user.findUnique({ 
      where: { id: payload.userId },
      select: { walletAddress: true }
    });
    
    if (!user?.walletAddress) {
      return NextResponse.json({ 
        error: "User wallet address not found" 
      }, { status: 400 });
    }

    // Award coupon using the CampaignManager contract
    try {
      const service = await createCampaignManagerService(operatorWalletClient);
      const txHash = await service.awardCoupon(
        user.walletAddress as `0x${string}`,
        campaignId as `0x${string}`,
        couponValue.toString()
      );

      if (!txHash) {
        throw new Error("Failed to award coupon");
      }

      // Mark mission as completed in database
      await prisma.userMission.upsert({
        where: { userId_missionId: { userId: payload.userId, missionId } },
        update: { 
          status: "COMPLETED", 
          completedAt: new Date()
        },
        create: { 
          userId: payload.userId, 
          missionId, 
          status: "COMPLETED", 
          completedAt: new Date()
        },
      });

      // Apply boost if mission has boost properties
      if (mission.boostMultiplier > 0) {
        const now = new Date();
        const existing = await prisma.activeBoost.findFirst({
          where: { userId: payload.userId, expiresAt: { gt: now } },
          orderBy: { expiresAt: "desc" },
        });

        const baseExpiry = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
        const newExpiry = new Date(baseExpiry.getTime() + mission.boostDuration * 60 * 60 * 1000);

        await prisma.activeBoost.create({
          data: {
            userId: payload.userId,
            boostMultiplier: mission.boostMultiplier,
            expiresAt: newExpiry,
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        txHash,
        message: "Coupon awarded successfully" 
      });

    } catch (contractError) {
      console.error("Contract error:", contractError);
      return NextResponse.json({ 
        error: "Failed to award coupon on blockchain",
        details: contractError instanceof Error ? contractError.message : "Unknown error"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Award coupon error:", error);
    return NextResponse.json({ 
      error: "Failed to award coupon",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

/**
 * Get coupon award history for a user
 */
export async function GET(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userMissions = await prisma.userMission.findMany({
      where: { 
        userId: payload.userId,
        status: 'COMPLETED',
        metadata: {
          path: ['txHash'],
          not: null
        }
      },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            type: true,
            boostMultiplier: true,
            boostDuration: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    const couponHistory = userMissions.map(um => ({
      missionId: um.missionId,
      missionTitle: um.mission.title,
      missionType: um.mission.type,
      completedAt: um.completedAt,
      txHash: um.metadata?.txHash,
      boostMultiplier: um.mission.boostMultiplier,
      boostDuration: um.mission.boostDuration
    }));

    return NextResponse.json({ couponHistory });

  } catch (error) {
    console.error("Get coupon history error:", error);
    return NextResponse.json({ 
      error: "Failed to get coupon history",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
