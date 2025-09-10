import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { missionId, userId } = await req.json();
    if (!missionId) return NextResponse.json({ error: "missionId is required" }, { status: 400 });
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    console.log("Test mission completion request for missionId:", missionId, "userId:", userId);

    const mission = await prisma.mission.findUnique({ 
      where: { id: missionId },
      include: { campaign: true }
    });
    if (!mission) {
      console.log("Mission not found:", missionId);
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    console.log("Mission found:", { 
      id: mission.id, 
      title: mission.title, 
      hasCampaign: !!mission.campaign,
      campaignStatus: mission.campaign?.status 
    });

    // Check if mission has an associated campaign
    if (!mission.campaign) {
      console.log("Mission has no associated campaign:", missionId);
      return NextResponse.json({ 
        error: "Mission does not have an associated campaign" 
      }, { status: 400 });
    }

    // Check if campaign is active
    if (mission.campaign.status !== 'ACTIVE') {
      console.log("Campaign is not active:", { 
        campaignId: mission.campaign.id, 
        status: mission.campaign.status 
      });
      return NextResponse.json({ 
        error: `Campaign is not active (status: ${mission.campaign.status})` 
      }, { status: 400 });
    }

    // Get user's wallet address
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { walletAddress: true }
    });
    
    if (!user?.walletAddress) {
      return NextResponse.json({ 
        error: "User wallet address not found" 
      }, { status: 400 });
    }

    console.log("User wallet address:", user.walletAddress);

    // Generate random coupon value within campaign bounds
    const minReward = mission.campaign.minReward;
    const maxReward = mission.campaign.maxReward;
    const randomValue = Math.random() * (maxReward - minReward) + minReward;
    const couponValue = Math.round(randomValue * 100) / 100; // Round to 2 decimal places

    console.log("Generated coupon value:", couponValue, "within bounds:", minReward, "-", maxReward);

    // For testing, we'll skip the actual blockchain transaction and just return success
    // In production, this would call the award-coupon endpoint
    
    // Mark mission as completed in database
    await prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      update: { 
        status: "COMPLETED", 
        completedAt: new Date()
      },
      create: { 
        userId, 
        missionId, 
        status: "COMPLETED", 
        completedAt: new Date()
      },
    });

    // Apply boost if mission has boost properties
    if (mission.boostMultiplier > 0) {
      const now = new Date();
      const existing = await prisma.activeBoost.findFirst({
        where: { userId, expiresAt: { gt: now } },
        orderBy: { expiresAt: "desc" },
      });

      const baseExpiry = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
      const newExpiry = new Date(baseExpiry.getTime() + mission.boostDuration * 60 * 60 * 1000);

      await prisma.activeBoost.create({
        data: {
          userId,
          boostMultiplier: mission.boostMultiplier,
          expiresAt: newExpiry,
        },
      });
    }

    return NextResponse.json({ 
      ok: true, 
      txHash: "test-tx-hash-12345",
      couponValue: couponValue,
      message: "Mission completed and coupon awarded successfully (test mode)"
    });
  } catch (e) {
    console.error("Test mission completion error:", e);
    return NextResponse.json({ 
      error: "Failed to complete mission",
      details: e instanceof Error ? e.message : "Unknown error"
    }, { status: 500 });
  }
}
