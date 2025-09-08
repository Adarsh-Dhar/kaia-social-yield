"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAccount, useConnect } from 'wagmi'

export default function AdvertiserAuthPage() {
  const router = useRouter()
  const [contactEmail, setContactEmail] = useState("")
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/advertiser/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contactEmail: contactEmail || undefined, walletAddress: address || undefined })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to sign in')
      }
      router.push('/advertiser')
    } catch (e: any) {
      setError(e.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="border border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Advertiser Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Contact email</label>
              <Input type="email" placeholder="you@company.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Wallet</label>
              {isConnected && address ? (
                <div className="flex items-center justify-between rounded-md border border-zinc-200 dark:border-zinc-800 bg-muted/40 px-3 py-2">
                  <span className="text-sm text-foreground/80">{address}</span>
                  <span className="rounded bg-muted px-2 py-1 text-xs">Connected</span>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => connectors[0] && connect({ connector: connectors[0] })}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || (!contactEmail && !isConnected)}>
              {loading ? 'Signing in...' : (contactEmail || isConnected ? 'Sign in' : 'Enter email or connect wallet')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


