#!/usr/bin/env bash
set -euo pipefail
COOKA="/Users/adarsh/Documents/social-yield-protocol/cookieA.txt"
COOKB="/Users/adarsh/Documents/social-yield-protocol/cookieB.txt"
rm -f "$COOKA" "$COOKB"

echo "--- Login User A ---"
curl -sS -i -c "$COOKA" -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/auth/login \
  --data '{"lineAccessToken":"tokenA","walletAddress":"0xA111","displayName":"Alice"}' | head -n 20

echo "--- /api/user/me (A) ---"
curl -sS -b "$COOKA" -H 'Accept: application/json' http://localhost:3000/api/user/me

echo "--- /api/missions (A) ---"
curl -sS -b "$COOKA" -H 'Accept: application/json' http://localhost:3000/api/missions

MID=$(node /Users/adarsh/Documents/social-yield-protocol/scripts-get-mission.js)

echo "--- Complete mission (A) ---"
curl -sS -b "$COOKA" -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/missions/complete \
  --data "{\"missionId\":\"$MID\"}"

echo "--- Login User B ---"
curl -sS -i -c "$COOKB" -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/auth/login \
  --data '{"lineAccessToken":"tokenB","walletAddress":"0xB222","displayName":"Bob"}' | head -n 20

AID=$(node /Users/adarsh/Documents/social-yield-protocol/scripts-get-user-id.js "$COOKA")

echo "--- Claim referral (B uses A's code) ---"
curl -sS -b "$COOKB" -H 'Content-Type: application/json' \
  -X POST http://localhost:3000/api/referrals/claim \
  --data "{\"referrerCode\":\"$AID\"}"
