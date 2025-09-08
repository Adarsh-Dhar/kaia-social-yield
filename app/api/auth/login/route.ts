import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signAuthToken } from "@/lib/auth";
import { verifyLineAccessToken } from "@/lib/line";

export async function POST(req: NextRequest) {
  try {
    const { lineAccessToken, walletAddress, displayName, pictureUrl } = await req.json();

    if (!lineAccessToken || !walletAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lineProfile = await verifyLineAccessToken(lineAccessToken);
    if (!lineProfile) {
      return NextResponse.json({ error: "Invalid LINE token" }, { status: 401 });
    }

    const user = await prisma.user.upsert({
      where: { lineUserId: lineProfile.lineUserId },
      update: {
        walletAddress,
        displayName: displayName ?? lineProfile.displayName ?? undefined,
        pictureUrl: pictureUrl ?? lineProfile.pictureUrl ?? undefined,
      },
      create: {
        lineUserId: lineProfile.lineUserId,
        walletAddress,
        displayName: displayName ?? lineProfile.displayName ?? undefined,
        pictureUrl: pictureUrl ?? lineProfile.pictureUrl ?? undefined,
      },
    });

    const token = signAuthToken({ userId: user.id });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}

 
