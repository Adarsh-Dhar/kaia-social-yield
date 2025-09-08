import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { verifyPassword } from "@/lib/password";

const ADV_JWT_SECRET = process.env.ADV_JWT_SECRET || "dev-adv-secret";

export async function POST(req: NextRequest) {
  try {
    const { contactEmail, walletAddress, password } = await req.json();
    if (!contactEmail || !walletAddress || !password || 
        contactEmail.trim() === "" || walletAddress.trim() === "" || password.trim() === "") {
      return NextResponse.json({ error: "Email, wallet, and password are required" }, { status: 400 });
    }

    const normalizedEmail = String(contactEmail).toLowerCase();
    const normalizedWallet = String(walletAddress).toLowerCase();

    // Try to find an existing advertiser using raw SQL to avoid relying on generated model
    let advertiser: any | null = null;
    try {
      let results: any[] = [];
      results = await prisma.$queryRaw<any[]>`
        SELECT * FROM "Advertiser"
        WHERE LOWER("contactEmail") = ${normalizedEmail} AND LOWER("walletAddress") = ${normalizedWallet}
        LIMIT 1
      `;
      advertiser = results?.[0] ?? null;
    } catch (dbErr: any) {
      return NextResponse.json({ error: "Database query failed", detail: dbErr?.message || String(dbErr) }, { status: 500 });
    }

    if (!advertiser) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!advertiser.passwordHash || !verifyPassword(password, advertiser.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

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


