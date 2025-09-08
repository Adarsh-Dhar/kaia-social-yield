import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ADV_JWT_SECRET = process.env.ADV_JWT_SECRET || "dev-adv-secret";

function getAdvToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookie = req.cookies.get("adv_session")?.value;
  return cookie ?? null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = getAdvToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    jwt.verify(token, ADV_JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Stub: return transaction params for funding USDT to protocol treasury
  const { id } = params;
  const tx = {
    chainId: 8217, // Kaia Mainnet example
    to: "0xProtocolTreasuryAddress",
    value: "0x0",
    data: "0xa9059cbb" /* transfer() selector */,
    // ... more encoded params in a real implementation
    memo: `Fund campaign ${id}`,
  };
  return NextResponse.json({ tx });
}


