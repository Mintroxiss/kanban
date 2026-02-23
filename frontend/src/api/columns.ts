import client from './client'
import type { Column } from '../types'

interface Page<T> {
  content: T[]
}

export async function getColumns(boardId: string): Promise<Column[]> {
  const { data } = await client.get<Page<Column>>('/columns', { params: { size: 200 } })
  return data.content.filter((c) => c.boardId === boardId)
}
