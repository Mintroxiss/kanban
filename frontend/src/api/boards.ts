import client from './client'
import type { Board, Task } from '../types'

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
