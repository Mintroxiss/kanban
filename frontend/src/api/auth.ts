import axios from 'axios'
import type { AuthTokens } from '../types'

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await axios.post<AuthTokens>('/api/auth/login', { email, password })
  return data
}

export async function register(
  email: string,
  password: string,
  fullName: string
): Promise<AuthTokens> {
  const { data } = await axios.post<AuthTokens>('/api/auth/register', {
    email,
    password,
    fullName,
  })
  return data
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const { data } = await axios.post<AuthTokens>('/api/auth/refresh', { refreshToken })
  return data
}
