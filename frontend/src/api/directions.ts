import client from './client'
import type { Direction } from '../types'

interface Page<T> {
  content: T[]
}

export async function getDirections(): Promise<Direction[]> {
  const { data } = await client.get<Page<Direction>>('/directions', { params: { size: 200 } })
  return data.content
}

export async function createDirection(name: string, description?: string): Promise<Direction> {
  const { data } = await client.post<Direction>('/directions', { name, description })
  return data
}

export async function updateDirection(id: string, name: string, description?: string): Promise<Direction> {
  const { data } = await client.put<Direction>(`/directions/${id}`, { id, name, description })
  return data
}

export async function deleteDirection(id: string): Promise<void> {
  await client.delete(`/directions/${id}`)
}
