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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdvertiser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId: auth.advertiserId },
      include: {
        mission: { include: { userMissions: true } },
      },
    });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const completions = campaign.mission.userMissions.filter((um) => um.status === "COMPLETED").length;
    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      remainingBudget: campaign.remainingBudget,
      period: { startDate: campaign.startDate.toISOString(), endDate: campaign.endDate.toISOString() },
      mission: {
        id: campaign.mission.id,
        title: campaign.mission.title,
        boostMultiplier: campaign.mission.boostMultiplier,
        boostDuration: campaign.mission.boostDuration,
        completions,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load campaign" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAdvertiser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = params.id;
  try {
    const body = await req.json();
    const existing = await prisma.campaign.findFirst({ where: { id, advertiserId: auth.advertiserId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "DRAFT") return NextResponse.json({ error: "Only draft campaigns can be edited" }, { status: 400 });

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        budget: body.budget != null ? Number(body.budget) : existing.budget,
        remainingBudget: body.budget != null ? Number(body.budget) : existing.remainingBudget,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
      },
    });

    if (body.mission) {
      await prisma.mission.update({
        where: { id: existing.missionId },
        data: {
          title: body.mission.title ?? undefined,
          description: body.mission.description ?? undefined,
          boostMultiplier: body.mission.boostMultiplier ?? undefined,
          boostDuration: body.mission.boostDuration ?? undefined,
          isRepeatable: body.mission.isRepeatable ?? undefined,
          verificationUrl: body.mission.verificationUrl ?? undefined,
        },
      });
    }

    return NextResponse.json({ id: updated.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}


