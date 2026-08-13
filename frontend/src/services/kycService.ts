import api from './api'

export interface KycStatus {
  kycStatus: string
  kycDocumentCid: string | null
}

export interface PendingOrg {
  id: string
  name: string
  role: string
  kycStatus: string
  kycDocumentCid: string | null
  createdAt: string
}

export const kycService = {
  async getStatus(): Promise<KycStatus> {
    const { data } = await api.get('/kyc/status')
    return data
  },

  async upload(file: File) {
    const formData = new FormData()
    formData.append('document', file)
    const { data } = await api.post('/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async listPending(): Promise<PendingOrg[]> {
    const { data } = await api.get('/kyc/pending')
    return data
  },

  async approve(orgId: string) {
    const { data } = await api.post(`/kyc/${orgId}/approve`)
    return data
  },

  async reject(orgId: string) {
    const { data } = await api.post(`/kyc/${orgId}/reject`)
    return data
  },
}
