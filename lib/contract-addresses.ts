// Contract Addresses Configuration
// Update these addresses with your deployed contract addresses on Kairos Testnet

export const CONTRACT_ADDRESSES: {
  CAMPAIGN_MANAGER: string
  COUPON_NFT: string
  MOCK_USDT: string
} = {
  // Campaign Manager Contract
  CAMPAIGN_MANAGER: "0x50e9Ca374279a600819e5b4444D9132cFC9b1c45",
  
  // Coupon NFT Contract  
  COUPON_NFT: "0x84859a29725E4EDF8cc18a856253FD5f5d581D14",
  
  // Mock USDT Contract
  MOCK_USDT: "0x50DBbF87a5aED08BCACa0f9579494A7f74cc3fd2",
}

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
