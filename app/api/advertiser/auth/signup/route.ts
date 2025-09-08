import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { companyName, contactEmail, walletAddress, password } = await req.json();
    if (!companyName || !contactEmail || !walletAddress || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const normalizedEmail = String(contactEmail).toLowerCase();
    const normalizedWallet = String(walletAddress).toLowerCase();

    const advertiser = await prisma.advertiser.create({
      data: { companyName, contactEmail: normalizedEmail, walletAddress: normalizedWallet, passwordHash },
    });

    return NextResponse.json({ id: advertiser.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to signup advertiser" }, { status: 500 });
  }
}


