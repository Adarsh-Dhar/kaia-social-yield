import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const ADV_JWT_SECRET = process.env.ADV_JWT_SECRET || "dev-adv-secret";

export async function POST(req: NextRequest) {
  try {
    const { contactEmail, walletAddress } = await req.json();
    if (!contactEmail && !walletAddress) {
      return NextResponse.json({ error: "Provide email or wallet" }, { status: 400 });
    }
    const advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [
          contactEmail ? { contactEmail } : undefined,
          walletAddress ? { walletAddress } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (!advertiser) return NextResponse.json({ error: "Advertiser not found" }, { status: 404 });

    const token = jwt.sign({ advertiserId: advertiser.id }, ADV_JWT_SECRET, { expiresIn: "7d" });
    const res = NextResponse.json({ ok: true });
    res.cookies.set("adv_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Failed to login advertiser" }, { status: 500 });
  }
}


