import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthTokens } from '../types'

interface AuthState {
  token: string | null
  refreshToken: string | null
  login: (tokens: AuthTokens) => void
  logout: () => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      login: (tokens) => set({ token: tokens.token, refreshToken: tokens.refreshToken }),
      logout: () => set({ token: null, refreshToken: null }),
      setToken: (token) => set({ token }),
    }),
    { name: 'kanban-auth' }
  )
)
