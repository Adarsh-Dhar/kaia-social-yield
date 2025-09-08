"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useRole } from "@/hooks/use-role"

export default function HomePage() {
  const router = useRouter()
  const { role, isLoading } = useRole()

  useEffect(() => {
    if (!isLoading && !role) {
      router.replace("/user/auth?redirectTo=/user")
    }
  }, [isLoading, role, router])

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="mx-auto max-w-3xl w-full px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Welcome to Social Yield</h1>
        <p className="text-muted-foreground mb-8">Grow your product reach.</p>

        <div className="max-w-xl mx-auto">
          <Button asChild className="w-full h-12 bg-amber-500 hover:bg-amber-500/90 text-white">
            <Link href="/advertiser">Advertise product</Link>
          </Button>
        </div>

        {!isLoading && role && (
          <div className="mt-8 text-sm text-muted-foreground">
            {role === 'user' ? (
              <span>You're signed in as a user. Explore <Link href="/user/missions" className="underline">missions</Link>.</span>
            ) : (
              <span>You're signed in as an advertiser. Manage <Link href="/user/dashboard" className="underline">campaigns</Link>.</span>
            )}
          </div>
        )}
      </div>
    </main>
  )
}




