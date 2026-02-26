import client from './client'
import type { Task } from '../types'

export async function createTask(payload: {
  title: string
  description?: string
  status: string
  deadline: string
  epicId: string
  columnId?: string
  assigneeId?: string
}): Promise<Task> {
  const { data } = await client.post<Task>('/tasks', payload)
  return data
}

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

export async function updateTask(
  id: string,
  payload: {
    title: string
    description?: string
    status: string
    deadline: string
    epicId: string
    columnId?: string
    assigneeId?: string
  }
): Promise<Task> {
  const { data } = await client.put<Task>(`/tasks/${id}`, payload)
  return data
}

export async function takeTask(id: string): Promise<Task> {
  const { data } = await client.patch<Task>(`/tasks/${id}/take`)
  return data
}

export async function releaseTask(id: string): Promise<Task> {
  const { data } = await client.patch<Task>(`/tasks/${id}/release`)
  return data
}

export async function deleteTask(id: string): Promise<void> {
  await client.delete(`/tasks/${id}`)
}
