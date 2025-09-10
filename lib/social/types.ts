// Types for Social Yield Protocol

export type Address = `0x${string}`
export type Hash = `0x${string}`

export interface Staker {
  amountStaked: bigint
  lastRewardUpdateTime: bigint
  accumulatedRewards: bigint
  rewards: bigint
  boostMultiplier: bigint
  boostExpiresAt: bigint
}

export interface Campaign {
  creator: Address
  budget: bigint
  spent: bigint
  isActive: boolean
  nftTokenURI: string
}

// Error classes
export class SocialProtocolError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SocialProtocolError'
  }
}

export class NotOperatorError extends SocialProtocolError {
  constructor() {
    super('Only the operator can perform this action')
    this.name = 'NotOperatorError'
  }
}

export class CampaignNotFoundError extends SocialProtocolError {
  constructor() {
    super('Campaign not found')
    this.name = 'CampaignNotFoundError'
  }
}

export class CampaignInactiveError extends SocialProtocolError {
  constructor() {
    super('Campaign is inactive')
    this.name = 'CampaignInactiveError'
  }
}

export class InsufficientCampaignBudgetError extends SocialProtocolError {
  constructor() {
    super('Insufficient campaign budget')
    this.name = 'InsufficientCampaignBudgetError'
  }
}

export class NoStakeError extends SocialProtocolError {
  constructor() {
    super('User has no stake')
    this.name = 'NoStakeError'
  }
}

export class InsufficientFundsError extends SocialProtocolError {
  constructor() {
    super('Insufficient funds for transaction')
    this.name = 'InsufficientFundsError'
  }
}

export class InvalidAmountError extends SocialProtocolError {
  constructor() {
    super('Invalid amount provided')
    this.name = 'InvalidAmountError'
  }
}

export class ContractNotDeployedError extends SocialProtocolError {
  constructor() {
    super('Contract not deployed')
    this.name = 'ContractNotDeployedError'
  }
}
