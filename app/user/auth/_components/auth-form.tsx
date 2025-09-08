"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuthForm() {
  const [lineAccessToken, setLineAccessToken] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [pictureUrl, setPictureUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ lineAccessToken, walletAddress, displayName: displayName || undefined, pictureUrl: pictureUrl || undefined })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to sign in')
      }
      window.location.href = '/user/dashboard'
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
          <CardTitle>User Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">LINE Access Token</label>
              <Input type="text" placeholder="Paste LINE access token" value={lineAccessToken} onChange={(e) => setLineAccessToken(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Wallet Address</label>
              <Input type="text" placeholder="0x..." value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Display Name (optional)</label>
              <Input type="text" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Picture URL (optional)</label>
              <Input type="url" placeholder="https://..." value={pictureUrl} onChange={(e) => setPictureUrl(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !lineAccessToken || !walletAddress}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


