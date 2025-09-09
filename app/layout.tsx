import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "./providers"
import "./globals.css"
import { Header } from "@/components/header"

export const metadata: Metadata = {
  title: "Social Yield Protocol",
  description: "Gamified DeFi savings application",
  generator: "v0.app",
  other: {
    "wallet-extension": "disabled"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress wallet extension warnings
              window.addEventListener('error', function(e) {
                if (e.message && e.message.includes('wallet')) {
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>
          <Header />
          <div className="min-h-[calc(100vh-4rem)]">
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}
