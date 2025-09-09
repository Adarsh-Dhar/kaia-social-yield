'use client'

import { createConfig, http, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'
import { kairos } from 'viem/chains'

const config = createConfig({
  chains: [kairos],
  transports: {
    [kairos.id]: http('https://public-en-kairos.node.kaia.io'),
  },
  connectors: [
    injected({
      target: 'metaMask',
      shimDisconnect: true,
    }),
    injected({
      target: 'coinbaseWallet',
      shimDisconnect: true,
    }),
    injected({
      target: 'tokenPocket',
      shimDisconnect: true,
    }),
    injected({
      target: 'trust',
      shimDisconnect: true,
    }),
    // Generic injected connector as fallback
    injected({
      shimDisconnect: true,
    }),
  ],
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}