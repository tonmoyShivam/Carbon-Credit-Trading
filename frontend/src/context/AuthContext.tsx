import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authService, type RegisterPayload } from '../services/authService'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// The JWT payload carries userId/organizationId/fabricRole (see auth.ts) —
// there's no /auth/me endpoint, so this is how the frontend gets user info back.
function decodeToken(token: string): { userId: string; organizationId: string; fabricRole: string } {
  const payload = token.split('.')[1]
  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cct_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('cct_user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const persist = (nextToken: string, nextUser: User) => {
    localStorage.setItem('cct_token', nextToken)
    localStorage.setItem('cct_user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  const login = async (email: string, password: string) => {
    const { token: newToken } = await authService.login(email, password)
    const decoded = decodeToken(newToken)
    const nextUser: User = {
      id: decoded.userId,
      email,
      organizationId: decoded.organizationId,
      fabricRole: decoded.fabricRole,
    }
    persist(newToken, nextUser)
  }

  // Register only creates the row — it returns { id, email }, no token.
  // Log in right after so the app-level behavior (submit → land on dashboard) stays the same.
  const register = async (payload: RegisterPayload) => {
    await authService.register(payload)
    await login(payload.email, payload.password)
  }

  const logout = () => {
    localStorage.removeItem('cct_token')
    localStorage.removeItem('cct_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
