import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const jwtSecret = process.env.JWT_SECRET || "dev-secret-change-me";
    
    return NextResponse.json({
      jwtSecret: jwtSecret,
      secretLength: jwtSecret.length,
      secretPrefix: jwtSecret.substring(0, 10)
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to get JWT secret",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
