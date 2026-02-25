import client from './client'
import type { Epic } from '../types'

interface Page<T> {
  content: T[]
}

export async function getEpicsByBoard(boardId: string): Promise<Epic[]> {
  const { data } = await client.get<Page<Epic>>('/epics', { params: { size: 200 } })
  return data.content.filter((e) => e.boardId === boardId)
}

export async function createEpic(payload: {
  title: string
  description?: string
  boardId: string
  teamId?: string
}): Promise<Epic> {
  const { data } = await client.post<Epic>('/epics', payload)
  return data
}

export async function claimEpic(epicId: string): Promise<Epic> {
  const { data } = await client.patch<Epic>(`/epics/${epicId}/claim`)
  return data
}

export async function deleteEpic(id: string): Promise<void> {
  await client.delete(`/epics/${id}`)
}
