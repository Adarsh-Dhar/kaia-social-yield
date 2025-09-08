import { cookies } from "next/headers"
import { verifyAuthToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AuthForm from "./_components/auth-form"

export default async function AuthPage() {
  const session = cookies().get("session")?.value || null
  const payload = session ? verifyAuthToken(session) : null

  if (!payload?.userId) {
    return <AuthForm />
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  })

  if (!user) {
    return <AuthForm />
  }

  const initials = (user.displayName || "User").split(" ").map(w => w[0]).slice(0, 2).join("")
  const joinedIso = user.createdAt.toISOString()

  return (
    <div className="container mx-auto max-w-2xl py-10">
      <Card className="border border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.pictureUrl || undefined} alt={user.displayName || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{user.displayName || "Unnamed User"}</CardTitle>
            <p className="text-sm text-muted-foreground">Wallet: {user.walletAddress}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">User ID</p>
              <p className="font-mono break-all text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Joined</p>
              <time className="text-sm" dateTime={joinedIso} suppressHydrationWarning>{joinedIso}</time>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




