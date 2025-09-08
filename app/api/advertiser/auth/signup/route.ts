import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { companyName, contactEmail, walletAddress, password } = await req.json();
    if (!companyName || !contactEmail || !walletAddress || !password ||
        companyName.trim() === "" || contactEmail.trim() === "" || 
        walletAddress.trim() === "" || password.trim() === "") {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const normalizedEmail = String(contactEmail).toLowerCase();
    const normalizedWallet = String(walletAddress).toLowerCase();

    // Check if advertiser already exists
    const existingAdvertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [
          { contactEmail: normalizedEmail },
          { walletAddress: normalizedWallet }
        ]
      }
    });

    if (existingAdvertiser) {
      if (existingAdvertiser.contactEmail === normalizedEmail) {
        return NextResponse.json({ error: "An advertiser with this email already exists" }, { status: 409 });
      }
      if (existingAdvertiser.walletAddress === normalizedWallet) {
        return NextResponse.json({ error: "An advertiser with this wallet address already exists" }, { status: 409 });
      }
    }

    const advertiser = await prisma.advertiser.create({
      data: { companyName, contactEmail: normalizedEmail, walletAddress: normalizedWallet, passwordHash },
    });

    return NextResponse.json({ id: advertiser.id });
  } catch (e: any) {
    console.error("Signup error:", e);
    return NextResponse.json({ 
      error: "Failed to signup advertiser", 
      detail: e?.message || String(e) 
    }, { status: 500 });
  }
}


