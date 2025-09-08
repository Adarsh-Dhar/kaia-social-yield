import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Format: scrypt$v=1$n=16384$r=8$p=1$salt$hash
const SCRYPT_N = 16384; // cost
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return [
    "scrypt",
    "v=1",
    `n=${SCRYPT_N}`,
    `r=${SCRYPT_R}`,
    `p=${SCRYPT_P}`,
    salt.toString("base64"),
    Buffer.from(hash).toString("base64"),
  ].join("$");
}

export function verifyPassword(plain: string, stored: string): boolean {
  try {
    const parts = stored.split("$");
    if (parts.length !== 7 || parts[0] !== "scrypt") return false;
    const n = parseInt(parts[2].split("=")[1]!, 10);
    const r = parseInt(parts[3].split("=")[1]!, 10);
    const p = parseInt(parts[4].split("=")[1]!, 10);
    const salt = Buffer.from(parts[5]!, "base64");
    const hash = Buffer.from(parts[6]!, "base64");
    const computed = scryptSync(plain, salt, hash.length, { N: n, r, p });
    return timingSafeEqual(hash, computed);
  } catch {
    return false;
  }
}


