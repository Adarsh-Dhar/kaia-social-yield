import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { getKaiaUserFinancials } from "@/lib/kaia";

export async function GET(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { activeBoost: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const financials = await getKaiaUserFinancials(user.walletAddress);

  // Sum of active boost multiplier; treat expired as none
  const now = new Date();
  const activeBoostMultiplier = user.activeBoost && user.activeBoost.expiresAt > now ? user.activeBoost.boostMultiplier : 1;

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    },
    financials,
    boost: {
      multiplier: activeBoostMultiplier,
      expiresAt: user.activeBoost?.expiresAt ?? null,
    },
  });
}


