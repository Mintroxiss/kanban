import client from './client'
import type { Board, Task } from '../types'

export async function createBoard(payload: { name: string; directionId: string }): Promise<Board> {
  const { data } = await client.post<Board>('/boards', payload)
  return data
}

interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
}

export async function getBoards(): Promise<Board[]> {
  const { data } = await client.get<Page<Board>>('/boards')
  return data.content
}

export async function getBoard(id: string): Promise<Board> {
  const { data } = await client.get<Board>(`/boards/${id}`)
  return data
}

export async function getGroupedTasks(
  boardId: string,
  epicId?: string
): Promise<Record<string, Task[]>> {
  const params = epicId ? { epicId } : {}
  const { data } = await client.get<Record<string, Task[]>>(
    `/boards/${boardId}/tasks/grouped`,
    { params }
  )
  return data
}

export async function updateBoard(id: string, payload: { name: string; directionId: string }): Promise<Board> {
  const { data } = await client.put<Board>(`/boards/${id}`, payload)
  return data
}

export async function archiveBoard(id: string): Promise<void> {
  await client.delete(`/boards/${id}`)
}

export async function unarchiveBoard(id: string): Promise<void> {
  await client.patch(`/boards/${id}/unarchive`)
}

export async function deleteBoard(id: string): Promise<void> {
  await client.delete(`/boards/${id}/permanent`)
}

export async function getArchivedBoards(): Promise<Board[]> {
  const { data } = await client.get<Page<Board>>('/boards/archived')
  return data.content
}
