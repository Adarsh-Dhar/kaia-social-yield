import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const ADV_JWT_SECRET = process.env.ADV_JWT_SECRET || "dev-adv-secret";

function getAdvToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookie = req.cookies.get("adv_session")?.value;
  return cookie ?? null;
}

function requireAdvertiser(req: NextRequest): { advertiserId: string } | null {
  const token = getAdvToken(req);
  if (!token) return null;
  try {
    return jwt.verify(token, ADV_JWT_SECRET) as { advertiserId: string };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAdvertiser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { 
      name, 
      description, 
      budget, 
      startDate, 
      endDate, 
      mission, 
      contractCampaignId,
      maxParticipants,
      minReward,
      maxReward,
      nftTokenURI
    } = await req.json();
    if (!name || !description || !budget || !startDate || !endDate || !mission) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate that contract campaign ID is provided for new campaigns
    if (!contractCampaignId) {
      return NextResponse.json({ error: "Contract campaign ID is required" }, { status: 400 });
    }

    const createdMission = await prisma.mission.create({
      data: {
        title: mission.title,
        description: mission.description,
        type: mission.type ?? "SPONSORED_TASK",
        boostMultiplier: mission.boostMultiplier,
        boostDuration: mission.boostDuration,
        targetCompletions: mission.targetCompletions ?? 0,
        isRepeatable: mission.isRepeatable ?? false,
        verificationUrl: mission.verificationUrl ?? null,
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        status: "ACTIVE", // Set campaigns as ACTIVE by default
        budget: Number(budget),
        remainingBudget: Number(budget),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        contractCampaignId, // Store the contract campaign ID
        maxParticipants: Number(maxParticipants) || 100,
        minReward: Number(minReward) || 1.0,
        maxReward: Number(maxReward) || 50.0,
        nftTokenURI: nftTokenURI || "https://example.com/nft-metadata.json",
        advertiser: { connect: { id: auth.advertiserId } },
        mission: { connect: { id: createdMission.id } },
      },
    });

    return NextResponse.json({ id: campaign.id });
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to create campaign", detail: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAdvertiser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId: auth.advertiserId },
      include: {
        mission: { include: { userMissions: true } },
        activeBoosts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = campaigns.map((c) => {
      const completions = c.mission.userMissions.filter((um) => um.status === "COMPLETED").length;
      const target = (c.mission as any).targetCompletions ?? 0;
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        budget: c.budget,
        remainingBudget: c.remainingBudget,
        period: { startDate: c.startDate.toISOString(), endDate: c.endDate.toISOString() },
        // CampaignManager contract fields
        maxParticipants: c.maxParticipants,
        minReward: c.minReward,
        maxReward: c.maxReward,
        nftTokenURI: c.nftTokenURI,
        mission: {
          id: c.mission.id,
          title: c.mission.title,
          type: c.mission.type,
          boostMultiplier: c.mission.boostMultiplier,
          boostDuration: c.mission.boostDuration,
          description: c.mission.description,
          targetCompletions: target,
          completions,
        },
        boostsActive: c.activeBoosts.length,
        actions: {
          canView: true,
          canEdit: c.status === "DRAFT", // Still allow editing DRAFT campaigns
          canDelete: c.status === "DRAFT", // Still allow deleting DRAFT campaigns
          canPause: c.status === "ACTIVE",
          canResume: c.status === "PAUSED",
          canViewReport: c.status === "ACTIVE" || c.status === "COMPLETED" || c.status === "PAUSED",
        },
      };
    });
    return NextResponse.json({ campaigns: formatted });
  } catch (e) {
    return NextResponse.json({ error: "Failed to list campaigns" }, { status: 500 });
  }
}


