import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

// Assumes referrerCode maps to a referrer's User.id or some code stored elsewhere.
function normalizeReferrerCode(referrerCode: string): string {
  return referrerCode.trim();
}

export async function POST(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { referrerCode } = body ?? {};
  if (!referrerCode) return NextResponse.json({ error: "Missing referrerCode" }, { status: 400 });

  const normalized = normalizeReferrerCode(referrerCode);

  // For now, interpret code as the referrer's user ID. Replace with proper code lookup if needed.
  const referrer = await prisma.user.findUnique({ where: { id: normalized } });
  if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });

  if (referrer.id === payload.userId) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Ensure the referee does not already have a referral
  const existingReferral = await prisma.referral.findUnique({ where: { refereeId: payload.userId } });
  if (existingReferral) return NextResponse.json({ error: "Referral already claimed" }, { status: 400 });

  const boostMultiplier = 1.2; // example value
  const boostHours = 72; // example duration in hours
  const now = new Date();
  const expiresAt = new Date(now.getTime() + boostHours * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    const referral = await tx.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: payload.userId,
        status: "PENDING_DEPOSIT",
      },
    });

    // Upsert boosts for both users; take max multiplier and furthest expiration when merging
    const upsertBoost = async (userId: string) => {
      const prev = await tx.activeBoost.findUnique({ where: { userId } });
      const newMultiplier = prev ? Math.max(prev.boostMultiplier, boostMultiplier) : boostMultiplier;
      const newExpiresAt = prev && prev.expiresAt > expiresAt ? prev.expiresAt : expiresAt;
      return tx.activeBoost.upsert({
        where: { userId },
        create: { userId, boostMultiplier: newMultiplier, expiresAt: newExpiresAt },
        update: { boostMultiplier: newMultiplier, expiresAt: newExpiresAt },
      });
    };

    const [refereeBoost, referrerBoost] = await Promise.all([
      upsertBoost(payload.userId),
      upsertBoost(referrer.id),
    ]);

    return { referral, refereeBoost, referrerBoost };
  });

  return NextResponse.json({
    referral: result.referral,
    refereeBoost: result.refereeBoost,
    referrerBoost: result.referrerBoost,
  });
}


