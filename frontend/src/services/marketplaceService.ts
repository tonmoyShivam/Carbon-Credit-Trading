import api from './api'

export interface Listing {
  id: string
  creditId: string
  sellerId: string
  askPrice: number
  listedAt: string
  credit: {
    id: string
    ownerId: string
    amount: number
    sourceProject: string
    status: string
    verificationStatus: string
  }
  seller: {
    id: string
    name: string
  }
}

export interface PurchaseRequestItem {
  id: string
  listingId: string
  buyerId: string
  status: string
  requestedAt: string
  listing: {
    creditId: string
    askPrice: number
    credit: { sourceProject: string; amount: number }
  }
  buyer: { id: string; name: string }
}

export const marketplaceService = {
  async listActive(): Promise<Listing[]> {
    const { data } = await api.get('/listings')
    return data
  },

  async create(creditId: string, askPrice: number) {
    const { data } = await api.post('/listings', { creditId, askPrice })
    return data
  },

  async cancel(listingId: string) {
    const { data } = await api.delete(`/listings/${listingId}`)
    return data
  },

  async requestPurchase(listingId: string) {
    const { data } = await api.post(`/listings/${listingId}/request`)
    return data
  },

  async incomingRequests(): Promise<PurchaseRequestItem[]> {
    const { data } = await api.get('/listings/requests')
    return data
  },

  async accept(requestId: string) {
    const { data } = await api.post(`/listings/requests/${requestId}/accept`)
    return data
  },

  async reject(requestId: string) {
    const { data } = await api.post(`/listings/requests/${requestId}/reject`)
    return data
  },
}
