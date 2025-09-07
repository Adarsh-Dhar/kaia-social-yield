// Minimal LINE token verification stub. Replace with real LIFF/LINE verify call.
export type LineProfile = {
  lineUserId: string;
  displayName?: string | null;
  pictureUrl?: string | null;
};

export async function verifyLineAccessToken(token: string): Promise<LineProfile | null> {
  if (!token) return null;
  // TODO: Call LINE verify endpoint. For now, accept any non-empty token and derive a fake id.
  const fakeId = `line_${Buffer.from(token).toString("hex").slice(0, 24)}`;
  return { lineUserId: fakeId, displayName: null, pictureUrl: null };
}


