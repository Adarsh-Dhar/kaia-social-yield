"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRole } from "@/hooks/use-role"

export default function ChooseRolePage() {
  const { role, isLoading } = useRole()

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="mx-auto max-w-3xl w-full px-6 py-16">
        <h1 className="text-center text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
          Choose how you want to continue
        </h1>
        <p className="text-center text-muted-foreground mb-10">
          Authenticate first, then we’ll take you to the right experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Earn Yield (User)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Deposit, earn, and complete missions for boosts.
              </p>
              <Button asChild className="w-full bg-amber-500 hover:bg-amber-500/90 text-white">
                <Link href="/auth">Continue as User</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Advertise (Brand/Partner)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create campaigns and fund user rewards.
              </p>
              <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-500/90 text-white">
                <Link href="/advertiser/auth">Continue as Advertiser</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {!isLoading && role && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            {role === 'user' ? (
              <span>
                You’re already signed in as a user. Visit <Link href="/dashboard" className="underline">your dashboard</Link>.
              </span>
            ) : (
              <span>
                You’re signed in as an advertiser. Continue to <Link href="/advertiser/auth" className="underline">advertiser console</Link>.
              </span>
            )}
          </div>
        )}
      </div>
    </main>
  )
}


