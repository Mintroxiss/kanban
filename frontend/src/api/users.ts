import client from './client'
import type { User, UserRole } from '../types'

interface Page<T> {
  content: T[]
}

export async function getUsers(): Promise<User[]> {
  const { data } = await client.get<Page<User>>('/users', { params: { size: 200, sort: 'fullName' } })
  return data.content
}

export async function getUserById(id: string): Promise<User> {
  const { data } = await client.get<User>(`/users/${id}`)
  return data
}

export async function updateUserRole(id: string, role: UserRole): Promise<User> {
  const { data } = await client.patch<User>(`/users/${id}/role`, { role })
  return data
}
