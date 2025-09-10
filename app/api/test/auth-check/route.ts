import { NextRequest, NextResponse } from "next/server";
import { getAuthTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getAuthTokenFromRequest(req);
    const payload = verifyAuthToken(token || "");
    
    return NextResponse.json({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      payload: payload,
      headers: Object.fromEntries(req.headers.entries())
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to check auth",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
