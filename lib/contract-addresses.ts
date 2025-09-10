// Contract Addresses Configuration
// Update these addresses with your deployed contract addresses on Kairos Testnet

export const CONTRACT_ADDRESSES = {
  // Campaign Manager Contract
  CAMPAIGN_MANAGER: "0x15bdf06a6D9731346ADfb3C2Ac9dDeb83AE73BB8" as const,
  
  // Coupon NFT Contract  
  COUPON_NFT: "0x33E5355C3107eFec2786828FE45D2628D1B20438" as const,
  
  // Mock USDT Contract
  MOCK_USDT: "0x3e07f227F06DCF931DdE90d3B59EE3612632d58F" as const,
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
