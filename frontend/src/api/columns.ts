import client from './client'
import type { Column } from '../types'

interface Page<T> {
  content: T[]
}

export async function getColumns(boardId: string): Promise<Column[]> {
  const { data } = await client.get<Page<Column>>('/columns', { params: { size: 200 } })
  return data.content.filter((c) => c.boardId === boardId)
}

export async function createColumn(payload: {
  title: string
  boardId: string
  order: number
}): Promise<Column> {
  const { data } = await client.post<Column>('/columns', payload)
  return data
}

export async function updateColumn(id: string, payload: {
  title: string
  boardId: string
  order: number
}): Promise<Column> {
  const { data } = await client.put<Column>(`/columns/${id}`, payload)
  return data
}

export async function deleteColumn(id: string): Promise<void> {
  await client.delete(`/columns/${id}`)
}
