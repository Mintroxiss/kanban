import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthTokens, UserRole } from '../types'

interface AuthState {
  token: string | null
  refreshToken: string | null
  role: UserRole | null
  userId: string | null
  teamId: string | null
  login: (tokens: AuthTokens) => void
  logout: () => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      role: null,
      userId: null,
      teamId: null,
      login: (tokens) =>
        set({
          token: tokens.token,
          refreshToken: tokens.refreshToken,
          role: (tokens.role as UserRole) ?? null,
          userId: tokens.userId ?? null,
          teamId: tokens.teamId ?? null,
        }),
      logout: () => set({ token: null, refreshToken: null, role: null, userId: null, teamId: null }),
      setToken: (token) => set({ token }),
    }),
    { name: 'kanban-auth' }
  )
)
