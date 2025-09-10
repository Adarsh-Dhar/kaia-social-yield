import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const missions = await prisma.mission.findMany({
      include: { 
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
            contractCampaignId: true,
            minReward: true,
            maxReward: true
          }
        }
      }
    });

    return NextResponse.json({ 
      missions: missions.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        hasCampaign: !!m.campaign,
        campaign: m.campaign ? {
          id: m.campaign.id,
          name: m.campaign.name,
          status: m.campaign.status,
          contractCampaignId: m.campaign.contractCampaignId,
          minReward: m.campaign.minReward,
          maxReward: m.campaign.maxReward
        } : null
      }))
    });
  } catch (error) {
    console.error("Debug missions error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch missions",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
