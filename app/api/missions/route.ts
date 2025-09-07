import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [missions, userMissions] = await Promise.all([
    prisma.mission.findMany({ orderBy: { title: "asc" } }),
    prisma.userMission.findMany({ where: { userId: payload.userId } }),
  ]);

  const statusByMissionId = new Map(userMissions.map((um) => [um.missionId, um.status]));

  const result = missions.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    type: m.type,
    boostMultiplier: m.boostMultiplier,
    boostDuration: m.boostDuration,
    isRepeatable: m.isRepeatable,
    status: statusByMissionId.get(m.id) ?? "PENDING",
  }));

  return NextResponse.json({ missions: result });
}


