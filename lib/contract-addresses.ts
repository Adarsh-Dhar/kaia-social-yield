// Contract Addresses Configuration
// Update these addresses with your deployed contract addresses on Kairos Testnet

export const CONTRACT_ADDRESSES = {
  // Campaign Manager Contract
  CAMPAIGN_MANAGER: "0xBDc85FDE8A360013594Af89484D625D62bE4860c" as const,
  
  // Coupon NFT Contract  
  COUPON_NFT: "0x1AF0BaD3C852a601B243d942737A526B823C5E1b" as const,
  
  // Mock USDT Contract
  MOCK_USDT: "0x15bbf3994a491D6A2ff1e7BA3953A3C3de382Cee" as const,
} as const

// Helper function to check if addresses are configured
export function areContractsConfigured(): boolean {
  return Object.values(CONTRACT_ADDRESSES).every(
    address => address !== "0x0000000000000000000000000000000000000000"
  )
}

// Helper function to get contract address with validation
export function getContractAddress(contract: keyof typeof CONTRACT_ADDRESSES): string {
  const address = CONTRACT_ADDRESSES[contract]
  if (address === "0x0000000000000000000000000000000000000000") {
    throw new Error(`${contract} contract address not configured. Please update lib/contract-addresses.ts`)
  }
  return address
}
