"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAccount, useConnect } from 'wagmi'
import Link from "next/link"

export default function AdvertiserAuthForm({ callback }: { callback?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [companyName, setCompanyName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [password, setPassword] = useState("")
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === "signup") {
        const signupRes = await fetch('/api/advertiser/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ companyName: companyName || undefined, contactEmail: contactEmail || undefined, walletAddress: address || undefined, password: password || undefined })
        })
        if (!signupRes.ok) {
          const data = await signupRes.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to sign up')
        }

        const loginRes = await fetch('/api/advertiser/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ contactEmail: contactEmail || undefined, walletAddress: address || undefined, password: password || undefined })
        })
        if (!loginRes.ok) {
          const data = await loginRes.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to sign in after signup')
        }
      } else {
        const res = await fetch('/api/advertiser/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ contactEmail: contactEmail || undefined, walletAddress: address || undefined, password: password || undefined })
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to sign in')
        }
      }
      router.push(callback || '/advertiser')
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
          <CardTitle>{mode === 'signin' ? 'Advertiser Sign In' : 'Advertiser Sign Up'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === 'signin' ? "default" : "outline"} onClick={() => setMode('signin')} className="w-full">
              Sign in
            </Button>
            <Button type="button" variant={mode === 'signup' ? "default" : "outline"} onClick={() => setMode('signup')} className="w-full">
              Sign up
            </Button>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Company name</label>
                <Input type="text" placeholder="Acme Inc." value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Contact email</label>
              <Input type="email" placeholder="you@company.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
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
            <Button type="submit" className="w-full" disabled={loading || !contactEmail || !password || !isConnected || (mode === 'signup' && !companyName)}>
              {loading ? (mode === 'signup' ? 'Signing up...' : 'Signing in...') : (mode === 'signup' ? 'Sign up' : 'Sign in')}
            </Button>
          </form>
          <div className="mt-4">
            <Link href="/user" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full text-center">
              Earn Yield
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


