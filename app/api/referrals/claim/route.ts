import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { referrerCode } = await req.json();
    if (!referrerCode) return NextResponse.json({ error: "referrerCode is required" }, { status: 400 });

    const referee = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!referee) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Interpret referrerCode as the referrer's wallet or ID for simplicity
    const referrer = await prisma.user.findFirst({
      where: { OR: [{ id: referrerCode }, { walletAddress: referrerCode }] },
    });
    if (!referrer) return NextResponse.json({ error: "Invalid referrer code" }, { status: 404 });
    if (referrer.id === referee.id) return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });

    // Ensure no existing referral used by this referee
    const existing = await prisma.referral.findUnique({ where: { refereeId: referee.id } });
    if (existing) return NextResponse.json({ error: "Referral already claimed" }, { status: 400 });

    // Create referral
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: referee.id,
        status: "COMPLETED",
      },
    });

    // Reward both users with a modest boost (example: 1.2x for 48h)
    const hours = 48;
    const boostMultiplier = 1.2;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    await prisma.activeBoost.createMany({
      data: [
        { userId: referrer.id, boostMultiplier, expiresAt },
        { userId: referee.id, boostMultiplier, expiresAt },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true, referralId: referral.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to claim referral" }, { status: 500 });
  }
}


