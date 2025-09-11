// Contract Addresses Configuration
// Update these addresses with your deployed contract addresses on Kairos Testnet

export const CONTRACT_ADDRESSES: {
  CAMPAIGN_MANAGER: string
  COUPON_NFT: string
  MOCK_USDT: string
} = {
  // Campaign Manager Contract
  CAMPAIGN_MANAGER: "0x8FeBDD58787e6c32F7E07F27489a12F61F30bd95",
  
  // Coupon NFT Contract  
  COUPON_NFT: "0xe2325191c40428753A36FB7949ae9Dd5a8A22694",
  
  // Mock USDT Contract
  MOCK_USDT: "0xf2D5fa936a01b11b72032Cc1D37e0998BE5cC65c",
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
