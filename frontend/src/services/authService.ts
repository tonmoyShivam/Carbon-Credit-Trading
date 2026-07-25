import api from './api'

export interface RegisterPayload {
  email: string
  password: string
  organizationId: string
  fabricRole: string
}

export const authService = {
  async register(payload: RegisterPayload): Promise<{ id: string; email: string }> {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  async login(email: string, password: string): Promise<{ token: string }> {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  async uploadKyc(file: File) {
    const formData = new FormData()
    formData.append('document', file)
    const { data } = await api.post('/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
