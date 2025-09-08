import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { companyName, contactEmail, walletAddress } = await req.json();
    if (!companyName || !contactEmail || !walletAddress) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const advertiser = await prisma.advertiser.create({
      data: { companyName, contactEmail, walletAddress },
    });

    return NextResponse.json({ id: advertiser.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to signup advertiser" }, { status: 500 });
  }
}


