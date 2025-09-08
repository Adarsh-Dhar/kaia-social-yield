import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { getKaiaUserFinancials } from "@/lib/kaia";

export async function GET(req: NextRequest) {
  const token = getAuthTokenFromRequest(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyAuthToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const financials = await getKaiaUserFinancials(user.walletAddress);

    const now = new Date();
    const activeBoost = await prisma.activeBoost.findFirst({
      where: { userId: user.id, expiresAt: { gt: now } },
      orderBy: { boostMultiplier: "desc" },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        displayName: user.displayName ?? null,
        pictureUrl: user.pictureUrl ?? null,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt.toISOString(),
      },
      financials,
      boost: {
        multiplier: activeBoost?.boostMultiplier ?? 1,
        expiresAt: activeBoost?.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load user" }, { status: 500 });
  }
}

 
