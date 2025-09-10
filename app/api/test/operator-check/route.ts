import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
    
    return NextResponse.json({
      hasOperatorKey: !!operatorPrivateKey,
      keyLength: operatorPrivateKey?.length || 0,
      keyPrefix: operatorPrivateKey?.substring(0, 10) || 'none',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Failed to check operator",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
