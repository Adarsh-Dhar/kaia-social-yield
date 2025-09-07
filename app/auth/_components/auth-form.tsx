"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import liff from "@line/liff"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuthForm() {
  const router = useRouter()

  const [lineAccessToken, setLineAccessToken] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [pictureUrl, setPictureUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoggedInWithLine, setIsLoggedInWithLine] = useState(false)

  const liffId = useMemo(() => process.env.NEXT_PUBLIC_LIFF_ID ?? "", [])

  useEffect(() => {
    let cancelled = false

    async function initLiff() {
      try {
        if (!liffId) {
          setError("Missing NEXT_PUBLIC_LIFF_ID. Set it in your environment.")
          return
        }
        await liff.init({ liffId })

        if (cancelled) return

        if (!liff.isLoggedIn()) {
          // Trigger LINE login; this will redirect and come back
          liff.login()
          return
        }

        setIsLoggedInWithLine(true)

        const token = liff.getAccessToken() || ""
        setLineAccessToken(token)

        // Prefill user profile details if available
        try {
          const profile = await liff.getProfile()
          if (cancelled) return
          setDisplayName(profile?.displayName || "")
          setPictureUrl(profile?.pictureUrl || "")
        } catch {
          // ignore profile errors; token is enough
        }
      } catch (e) {
        setError("LIFF initialization/login failed. Please try again.")
      } finally {
        if (!cancelled) setIsInitializing(false)
      }
    }

    void initLiff()
    return () => {
      cancelled = true
    }
  }, [liffId])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (!isLoggedInWithLine || !lineAccessToken) {
        throw new Error("Please sign in with LINE first.")
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineAccessToken, walletAddress, displayName: displayName || undefined, pictureUrl: pictureUrl || undefined }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Login failed")
      }

      router.replace("/")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-zinc-100">
      <div className="mx-auto flex w-full max-w-md flex-col px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-zinc-800 ring-1 ring-zinc-700">
            <Image src="/placeholder-logo.svg" alt="Logo" fill className="object-contain p-1.5" />
          </div>
          <div className="text-lg font-semibold tracking-tight">Social Yield Protocol</div>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Authenticate with LINE, then link your wallet.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoggedInWithLine && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    className="w-full bg-green-500 text-zinc-950 hover:bg-green-400"
                    onClick={() => liff.login()}
                    disabled={isInitializing}
                  >
                    {isInitializing ? "Initializing LINE..." : "Sign in with LINE"}
                  </Button>
                  {error && (
                    <p className="text-sm text-red-400">{error}</p>
                  )}
                </div>
              )}

              {isLoggedInWithLine && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">LINE Display Name</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="bg-zinc-950/60 border-zinc-800 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-zinc-300">Picture URL</label>
                    <Input
                      value={pictureUrl}
                      onChange={(e) => setPictureUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-zinc-950/60 border-zinc-800 placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-zinc-300">Wallet Address</label>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x... or kaia:..."
                  className="bg-zinc-950/60 border-zinc-800 placeholder:text-zinc-500"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-zinc-200 text-zinc-950 hover:bg-white"
                disabled={loading || !isLoggedInWithLine}
              >
                {loading ? "Continuing..." : isLoggedInWithLine ? "Continue" : "Sign in with LINE first"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-zinc-400">
          By continuing you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </main>
  )
}


