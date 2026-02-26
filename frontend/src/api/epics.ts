import client from './client'
import type { Epic, Task } from '../types'

export async function getEpicsByBoard(boardId: string): Promise<Epic[]> {
  const { data } = await client.get<Epic[]>(`/epics/board/${boardId}`)
  return data
}

export async function getArchivedEpics(boardId: string): Promise<Epic[]> {
  const { data } = await client.get<Epic[]>(`/epics/board/${boardId}/archived`)
  return data
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

export async function archiveEpic(id: string): Promise<Epic> {
  const { data } = await client.patch<Epic>(`/epics/${id}/archive`)
  return data
}

export async function restoreEpic(id: string): Promise<Epic> {
  const { data } = await client.patch<Epic>(`/epics/${id}/restore`)
  return data
}

export async function getEpicTasks(epicId: string): Promise<Task[]> {
  const { data } = await client.get<Task[]>(`/epics/${epicId}/tasks`)
  return data
}

export async function updateEpic(
  id: string,
  payload: { title: string; description?: string; boardId: string; teamId?: string }
): Promise<Epic> {
  const { data } = await client.put<Epic>(`/epics/${id}`, payload)
  return data
}

export async function deleteEpic(id: string): Promise<void> {
  await client.delete(`/epics/${id}`)
}
