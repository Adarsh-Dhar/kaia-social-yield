import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLineAccessToken } from "@/lib/line";
import { signAuthToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lineAccessToken, walletAddress, displayName, pictureUrl } = body ?? {};

    if (!lineAccessToken || !walletAddress) {
      return NextResponse.json({ error: "Missing lineAccessToken or walletAddress" }, { status: 400 });
    }

    const profile = await verifyLineAccessToken(lineAccessToken);
    if (!profile?.lineUserId) {
      return NextResponse.json({ error: "Invalid LINE access token" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { lineUserId: profile.lineUserId },
      create: {
        lineUserId: profile.lineUserId,
        walletAddress,
        displayName: displayName ?? profile.displayName ?? null,
        pictureUrl: pictureUrl ?? profile.pictureUrl ?? null,
      },
      update: {
        walletAddress,
        displayName: displayName ?? profile.displayName ?? null,
        pictureUrl: pictureUrl ?? profile.pictureUrl ?? null,
      },
    });

    const token = signAuthToken({ userId: user.id });

    const res = NextResponse.json({ token, user: { id: user.id, displayName: user.displayName, pictureUrl: user.pictureUrl, walletAddress: user.walletAddress } }, { status: 200 });
    res.cookies.set("session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


