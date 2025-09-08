import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AdvertiserAuthForm from "./_components/auth-form"

const ADV_JWT_SECRET = process.env.ADV_JWT_SECRET || "dev-adv-secret"

export default async function AdvertiserAuthPage() {
  const session = cookies().get("adv_session")?.value || null
  let payload: { advertiserId: string } | null = null
  if (session) {
    try {
      payload = jwt.verify(session, ADV_JWT_SECRET) as { advertiserId: string }
    } catch {
      payload = null
    }
  }

  if (!payload?.advertiserId) {
    return <AdvertiserAuthForm />
  }

  const advResults = await prisma.$queryRaw<any[]>`
    SELECT * FROM "Advertiser" WHERE "id" = ${payload.advertiserId} LIMIT 1
  `
  const advertiser = advResults?.[0] ?? null

  if (!advertiser) {
    return <AdvertiserAuthForm />
  }

  const initials = (advertiser.companyName || "Advertiser").split(" ").map((w: string) => w[0]).slice(0, 2).join("")
  const joinedIso = advertiser.createdAt.toISOString()

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Card className="border border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={undefined} alt={advertiser.companyName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{advertiser.companyName}</CardTitle>
            <p className="text-sm text-muted-foreground">Wallet: {advertiser.walletAddress}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Advertiser ID</p>
              <p className="font-mono break-all text-sm">{advertiser.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Joined</p>
              <time className="text-sm" dateTime={joinedIso} suppressHydrationWarning>{joinedIso}</time>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Contact Email</p>
              <p className="text-sm">{advertiser.contactEmail}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




