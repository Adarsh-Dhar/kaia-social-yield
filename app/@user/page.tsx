"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRole } from "@/hooks/use-role"

export default function HomePage() {
  const { role, isLoading } = useRole()

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="mx-auto max-w-3xl w-full px-6 py-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Welcome to Social Yield</h1>
        <p className="text-muted-foreground mb-8">Choose how you want to participate.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          <Link href="/auth/choose" className="block">
            <Button className="w-full h-12 bg-amber-500 hover:bg-amber-500/90 text-white">Advertise</Button>
          </Link>
          <Link href="/auth/choose" className="block">
            <Button variant="secondary" className="w-full h-12">Earn Yield</Button>
          </Link>
        </div>

        {!isLoading && role && (
          <div className="mt-8 text-sm text-muted-foreground">
            {role === 'user' ? (
              <span>You're signed in as a user. Explore <Link href="/missions" className="underline">missions</Link>.</span>
            ) : (
              <span>You're signed in as an advertiser. Manage <Link href="/dashboard" className="underline">campaigns</Link>.</span>
            )}
          </div>
        )}
      </div>
    </main>
  )
}


