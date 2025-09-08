import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Protect with advertiser API key per-campaign
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 401 });

  try {
    const { advertiserId, userId, missionId } = await req.json();
    if (!advertiserId || !userId || !missionId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate API key belongs to advertiser (stub: use ADV_JWT_SECRET-style env or a table)
    const expected = process.env[`ADVERTISER_${advertiserId}_API_KEY`];
    if (!expected || expected !== apiKey) return NextResponse.json({ error: "Invalid API key" }, { status: 403 });

    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const campaign = await prisma.campaign.findFirst({ where: { missionId: missionId, advertiserId } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.remainingBudget <= 0) return NextResponse.json({ error: "Insufficient campaign budget" }, { status: 400 });

    // Mark completion
    await prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: { userId, missionId, status: "COMPLETED", completedAt: new Date() },
    });

    // Apply boost and deduct budget (simple flat cost example)
    const cost = 1; // TODO: compute cost per completion
    const expiresAt = new Date(Date.now() + mission.boostDuration * 60 * 60 * 1000);
    await Promise.all([
      prisma.activeBoost.create({
        data: {
          userId,
          boostMultiplier: mission.boostMultiplier,
          expiresAt,
          campaign: { connect: { id: campaign.id } },
        },
      }),
      prisma.campaign.update({
        where: { id: campaign.id },
        data: { remainingBudget: Math.max(0, campaign.remainingBudget - cost) },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}


