import api from './api'

export interface IssuePayload {
  creditId: string
  owner: string
  amount: number
  sourceProject: string
  issueDate: string
  expiryDate: string
  contentHash: string
}

export const creditsService = {
  async verify(creditId: string) {
    const { data } = await api.get(`/credits/${creditId}/verify`)
    return data
  },

  async getHistory(creditId: string) {
    const { data } = await api.get(`/credits/${creditId}/history`)
    return data
  },

  async getBalance(ownerId: string) {
    const { data } = await api.get(`/credits/balance/${ownerId}`)
    return data
  },

  async transfer(creditId: string, newOwner: string, price: number) {
    const { data } = await api.post(`/credits/${creditId}/transfer`, { newOwner, price })
    return data
  },

  async retire(creditId: string) {
    const { data } = await api.post(`/credits/${creditId}/retire`, {})
    return data
  },

  async issue(payload: IssuePayload) {
    const { data } = await api.post('/credits/issue', payload)
    return data
  },
}
