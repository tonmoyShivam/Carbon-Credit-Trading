export interface User {
  id: string
  email: string
  organizationId: string
  fabricRole: string
}

export interface Organization {
  id: string
  name: string
  role: string
  kycStatus: string
  kycDocumentCid: string | null
  createdAt: string
}

export interface CarbonCredit {
  id: string
  ownerId: string
  amount: number
  sourceProject: string
  verificationStatus: string
  status: string
  issueDate: string
  expiryDate: string
  contentHash: string
  updatedAt: string
}

export interface MarketplaceListing {
  id: string
  creditId: string
  sellerId: string
  askPrice: number
  listedAt: string
}

export interface Transaction {
  id: string
  txType: string
  creditId: string
  fromOrg: string | null
  toOrg: string | null
  price: number | null
  fabricTxId: string
  timestamp: string
}

export interface Wallet {
  organizationId: string
  balance: number
  updatedAt: string
}
