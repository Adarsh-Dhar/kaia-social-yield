'use client'

import { createConfig, http, WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected } from 'wagmi/connectors'
import { anvil } from 'viem/chains'

const config = createConfig({
  chains: [anvil],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545'),
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