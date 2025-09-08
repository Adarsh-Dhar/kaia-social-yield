"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, LogOut, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { useRole } from "@/hooks/use-role"
import Link from "next/link"

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  const { role, isLoading } = useRole()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet disconnected",
      description: "You have been disconnected from your wallet.",
    })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 max-w-3xl mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">SY</span>
          </div>
          <span className="font-semibold text-foreground">Social Yield</span>
        </div>

        {/* Role-based CTA + Wallet Connection */}
        <div className="flex items-center gap-3">
          {!isLoading && (
            role === 'user' ? (
              <Link href="/advertiser/auth" className="hidden sm:inline-flex">
                <Button className="h-9 px-3 bg-amber-500 hover:bg-amber-500/90 text-white">Advertise your product</Button>
              </Link>
            ) : role === 'advertiser' ? (
              <Link href="/missions" className="hidden sm:inline-flex">
                <Button variant="secondary" className="h-9 px-3">Earn yield</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth" className="hidden sm:inline-flex">
                  <Button variant="ghost" className="h-9 px-3">Become a user</Button>
                </Link>
                <Link href="/advertiser/auth" className="hidden sm:inline-flex">
                  <Button className="h-9 px-3 bg-amber-500 hover:bg-amber-500/90 text-white">Become an advertiser</Button>
                </Link>
              </>
            )
          )}

          {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 px-3 border-border bg-card hover:bg-muted">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {address?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{formatAddress(address!)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Address
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={handleConnect} 
              disabled={isPending}
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPending ? (
                <>
                  <Wallet className="mr-2 h-4 w-4 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
