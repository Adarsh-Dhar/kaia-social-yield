import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { missionId } = body ?? {};
  if (!missionId) return NextResponse.json({ error: "Missing missionId" }, { status: 400 });

  const mission = await prisma.mission.findUnique({ where: { id: missionId } });
  if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

  const existing = await prisma.userMission.findUnique({ where: { userId_missionId: { userId: payload.userId, missionId } } });
  if (existing?.status === "COMPLETED" && !mission.isRepeatable) {
    return NextResponse.json({ error: "Mission already completed" }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + mission.boostDuration * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    await tx.userMission.upsert({
      where: { userId_missionId: { userId: payload.userId, missionId } },
      create: { userId: payload.userId, missionId, status: "COMPLETED", completedAt: now },
      update: { status: "COMPLETED", completedAt: now },
    });

    // Upsert ActiveBoost: if existing boost exists, take the higher multiplier and latest expiration
    const prev = await tx.activeBoost.findUnique({ where: { userId: payload.userId } });
    const newMultiplier = prev ? Math.max(prev.boostMultiplier, mission.boostMultiplier) : mission.boostMultiplier;
    const newExpiresAt = prev && prev.expiresAt > expiresAt ? prev.expiresAt : expiresAt;

    const boost = await tx.activeBoost.upsert({
      where: { userId: payload.userId },
      create: { userId: payload.userId, boostMultiplier: newMultiplier, expiresAt: newExpiresAt },
      update: { boostMultiplier: newMultiplier, expiresAt: newExpiresAt },
    });

    return { boost };
  });

  return NextResponse.json({ status: "COMPLETED", activeBoost: result.boost });
}


