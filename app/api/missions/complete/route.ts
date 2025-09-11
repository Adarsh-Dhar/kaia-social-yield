import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { missionId } = await req.json();
    if (!missionId) return NextResponse.json({ error: "missionId is required" }, { status: 400 });

    const mission = await prisma.mission.findUnique({ 
      where: { id: missionId },
      include: { campaign: true }
    });
    if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

    // Check if mission has an associated campaign
    if (!mission.campaign) {
      return NextResponse.json({ 
        error: "This mission is not available for completion",
        details: "Mission does not have an associated campaign"
      }, { status: 400 });
    }

    // Check if campaign is active
    if (mission.campaign.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: "This mission is not available for completion",
        details: `Campaign is not active (status: ${mission.campaign.status})`
      }, { status: 400 });
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

    // Generate random coupon value within campaign bounds
    const minReward = mission.campaign.minReward;
    const maxReward = mission.campaign.maxReward;
    const randomValue = Math.random() * (maxReward - minReward) + minReward;
    const couponValue = Math.round(randomValue * 100) / 100; // Round to 2 decimal places

    // Update the mission completion in the database
    await prisma.userMission.upsert({
      where: {
        userId_missionId: {
          userId: payload.userId,
          missionId: missionId
        }
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        couponValue: couponValue
      } as any,
      create: {
        userId: payload.userId,
        missionId: missionId,
        status: 'COMPLETED',
        completedAt: new Date(),
        couponValue: couponValue
      } as any
    });

    return NextResponse.json({ 
      ok: true, 
      couponValue: couponValue,
      campaignId: mission.campaign.contractCampaignId,
      message: "Mission completed successfully. Please claim your coupon on-chain."
    });
  } catch (e) {
    console.error("Mission completion error:", e);
    return NextResponse.json({ 
      error: "Failed to complete mission",
      details: e instanceof Error ? e.message : "Unknown error"
    }, { status: 500 });
  }
}

 
