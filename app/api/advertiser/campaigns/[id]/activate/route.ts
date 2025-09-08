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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getAdvToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let payload: any;
  try {
    payload = jwt.verify(token, ADV_JWT_SECRET) as { advertiserId: string };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  try {
    const campaign = await prisma.campaign.findFirst({ where: { id, advertiserId: payload.advertiserId } });
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (campaign.status !== "DRAFT") return NextResponse.json({ error: "Only draft campaigns can be activated" }, { status: 400 });

    // TODO: verify funding on-chain; for now require remainingBudget > 0
    if (campaign.remainingBudget <= 0) return NextResponse.json({ error: "Campaign not funded" }, { status: 400 });

    await prisma.campaign.update({ where: { id }, data: { status: "ACTIVE" } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to activate" }, { status: 500 });
  }
}


