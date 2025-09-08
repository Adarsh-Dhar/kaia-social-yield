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
    const { name, description, budget, startDate, endDate, mission } = await req.json();
    if (!name || !description || !budget || !startDate || !endDate || !mission) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const createdMission = await prisma.mission.create({
      data: {
        title: mission.title,
        description: mission.description,
        type: mission.type ?? "SPONSORED_TASK",
        boostMultiplier: mission.boostMultiplier,
        boostDuration: mission.boostDuration,
        isRepeatable: mission.isRepeatable ?? false,
        verificationUrl: mission.verificationUrl ?? null,
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        status: "DRAFT",
        budget: Number(budget),
        remainingBudget: Number(budget),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        advertiser: { connect: { id: auth.advertiserId } },
        mission: { connect: { id: createdMission.id } },
      },
    });

    return NextResponse.json({ id: campaign.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAdvertiser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId: auth.advertiserId },
      include: {
        mission: true,
        activeBoosts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      remainingBudget: c.remainingBudget,
      missionTitle: c.mission.title,
      boostsActive: c.activeBoosts.length,
    }));
    return NextResponse.json({ campaigns: formatted });
  } catch (e) {
    return NextResponse.json({ error: "Failed to list campaigns" }, { status: 500 });
  }
}


