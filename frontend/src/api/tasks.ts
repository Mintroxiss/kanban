import client from './client'
import type { Task } from '../types'

export async function moveTask(id: string, columnId: string): Promise<Task> {
  const { data } = await client.patch<Task>(`/tasks/${id}/move`, { columnId })
  return data
}

export async function assignTask(id: string, assigneeId: string): Promise<Task> {
  const { data } = await client.patch<Task>(`/tasks/${id}/assign`, { assigneeId })
  return data
}

export async function changeStatus(
  id: string,
  status: string,
  columnId: string
): Promise<Task> {
  const { data } = await client.patch<Task>(`/tasks/${id}/status`, { status, columnId })
  return data
}
