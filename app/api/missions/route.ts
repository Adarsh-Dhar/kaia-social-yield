import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const missions = await prisma.mission.findMany({
      include: {
        userMissions: {
          where: { userId: payload.userId },
          select: { status: true },
        },
      },
      orderBy: { title: "asc" },
    });

    const formatted = missions.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      type: m.type,
      boostMultiplier: m.boostMultiplier,
      boostDuration: m.boostDuration,
      isRepeatable: m.isRepeatable,
      status: (m.userMissions[0]?.status as "PENDING" | "COMPLETED") ?? "PENDING",
    }));

    return NextResponse.json({ missions: formatted });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load missions" }, { status: 500 });
  }
}

 
