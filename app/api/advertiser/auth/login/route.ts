import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";

const ADV_JWT_SECRET = process.env.ADV_JWT_SECRET || "dev-adv-secret";

export async function POST(req: NextRequest) {
  try {
    const { contactEmail, walletAddress, companyName } = await req.json();
    if (!contactEmail && !walletAddress) {
      return NextResponse.json({ error: "Provide email or wallet" }, { status: 400 });
    }

    // Try to find an existing advertiser using raw SQL to avoid relying on generated model
    let advertiser: any | null = null;
    try {
      let results: any[] = [];
      if (contactEmail && walletAddress) {
        results = await prisma.$queryRaw<any[]>`
          SELECT * FROM "Advertiser"
          WHERE "contactEmail" = ${contactEmail} OR "walletAddress" = ${walletAddress}
          LIMIT 1
        `;
      } else if (contactEmail) {
        results = await prisma.$queryRaw<any[]>`
          SELECT * FROM "Advertiser" WHERE "contactEmail" = ${contactEmail} LIMIT 1
        `;
      } else if (walletAddress) {
        results = await prisma.$queryRaw<any[]>`
          SELECT * FROM "Advertiser" WHERE "walletAddress" = ${walletAddress} LIMIT 1
        `;
      }
      advertiser = results?.[0] ?? null;
    } catch (dbErr: any) {
      return NextResponse.json({ error: "Database query failed", detail: dbErr?.message || String(dbErr) }, { status: 500 });
    }

    // Create one if not found — only if both required unique fields are provided
    if (!advertiser) {
      if (!contactEmail || !walletAddress) {
        return NextResponse.json({ error: "Advertiser not found" }, { status: 404 });
      }

      const inferredCompany =
        companyName || contactEmail.split("@")[0] || `Advertiser ${walletAddress.slice(0, 6)}`;

      try {
        const newId = randomUUID();
        const inserted = await prisma.$queryRaw<any[]>`
          INSERT INTO "Advertiser" ("id", "companyName", "contactEmail", "walletAddress", "createdAt", "updatedAt")
          VALUES (${newId}, ${inferredCompany}, ${contactEmail}, ${walletAddress}, NOW(), NOW())
          RETURNING *
        `;
        advertiser = inserted?.[0] ?? null;
      } catch (dbErr: any) {
        return NextResponse.json({ error: "Failed to create advertiser", detail: dbErr?.message || String(dbErr) }, { status: 500 });
      }
    } else {
      // Ensure we persist any newly provided identifiers on existing record
      try {
        const newEmail = contactEmail && !advertiser.contactEmail ? contactEmail : advertiser.contactEmail;
        const newWallet = walletAddress && !advertiser.walletAddress ? walletAddress : advertiser.walletAddress;
        const newCompany = companyName ? companyName : advertiser.companyName;
        const updated = await prisma.$queryRaw<any[]>`
          UPDATE "Advertiser"
          SET "contactEmail" = ${newEmail},
              "walletAddress" = ${newWallet},
              "companyName" = ${newCompany},
              "updatedAt" = NOW()
          WHERE "id" = ${advertiser.id}
          RETURNING *
        `;
        advertiser = updated?.[0] ?? advertiser;
      } catch (dbErr: any) {
        return NextResponse.json({ error: "Failed to update advertiser", detail: dbErr?.message || String(dbErr) }, { status: 500 });
      }
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


