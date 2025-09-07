import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev-secret-change-me";

export type AuthTokenPayload = {
  userId: string;
};

export function signAuthToken(
  payload: AuthTokenPayload,
  expiresIn: SignOptions["expiresIn"] = "7d"
): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getAuthTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  const cookie = req.cookies.get("session")?.value;
  return cookie ?? null;
}


