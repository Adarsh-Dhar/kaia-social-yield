import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const ADV_JWT_SECRET = process.env.ADV_JWT_SECRET || "dev-adv-secret";

function getAdvToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookie = req.cookies.get("adv_session")?.value;
  return cookie ?? null;
}

export async function GET(req: NextRequest) {
  const token = getAdvToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let payload: any;
  try {
    payload = jwt.verify(token, ADV_JWT_SECRET) as { advertiserId: string };
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Advertiser" WHERE "id" = ${payload.advertiserId} LIMIT 1
    `;
    const advertiser = rows?.[0] ?? null;
    if (!advertiser) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: advertiser.id,
      companyName: advertiser.companyName,
      contactEmail: advertiser.contactEmail,
      walletAddress: advertiser.walletAddress,
      createdAt: new Date(advertiser.createdAt).toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Database query failed", detail: e?.message || String(e) }, { status: 500 });
  }
}


