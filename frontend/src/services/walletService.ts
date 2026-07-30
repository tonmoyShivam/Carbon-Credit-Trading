import api from './api'

export interface Wallet {
  organizationId: string
  balance: number
  updatedAt?: string
}

export const walletService = {
  async getBalance(): Promise<Wallet> {
    const { data } = await api.get('/wallet')
    return data
  },
}
