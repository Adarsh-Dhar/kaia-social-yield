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

    const mission = await prisma.mission.findUnique({ where: { id: missionId } });
    if (!mission) return NextResponse.json({ error: "Mission not found" }, { status: 404 });

    const userMission = await prisma.userMission.upsert({
      where: { userId_missionId: { userId: payload.userId, missionId } },
      update: { status: "COMPLETED", completedAt: new Date() },
      create: { userId: payload.userId, missionId, status: "COMPLETED", completedAt: new Date() },
    });

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

    return NextResponse.json({ ok: true, userMissionId: userMission.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to complete mission" }, { status: 500 });
  }
}

 
