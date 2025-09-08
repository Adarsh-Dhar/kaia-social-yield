import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Basic webhook stub. In production, verify the X-Line-Signature header.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Example: if event is "follow" then mark a corresponding mission complete for that user
    const events = body?.events ?? [];
    for (const evt of events) {
      if (evt.type === "follow" && evt.source?.userId) {
        const user = await prisma.user.findFirst({ where: { lineUserId: evt.source.userId } });
        if (!user) continue;
        const mission = await prisma.mission.findFirst({ where: { type: "INTERNAL_SOCIAL" } });
        if (!mission) continue;
        await prisma.userMission.upsert({
          where: { userId_missionId: { userId: user.id, missionId: mission.id } },
          update: { status: "COMPLETED", completedAt: new Date() },
          create: { userId: user.id, missionId: mission.id, status: "COMPLETED", completedAt: new Date() },
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}


