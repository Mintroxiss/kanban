import client from './client'
import type { User } from '../types'

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
