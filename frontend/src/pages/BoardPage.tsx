import { useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGroupedTasks } from '../api/boards'
import { getColumns } from '../api/columns'
import { useBoardSocket } from '../hooks/useBoardSocket'
import BoardView from '../components/Board/BoardView'
import type { BoardEvent, Task } from '../types'

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const queryClient = useQueryClient()

  const { data: groupedTasks = {}, isLoading: loadingTasks } = useQuery({
    queryKey: ['grouped-tasks', boardId],
    queryFn: () => getGroupedTasks(boardId!),
    enabled: !!boardId,
  })

  const { data: columns = [], isLoading: loadingColumns } = useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => getColumns(boardId!),
    enabled: !!boardId,
  })

  const handleEvent = useCallback(
    (event: BoardEvent) => {
      const { type, payload: task } = event
      queryClient.setQueryData<Record<string, Task[]>>(
        ['grouped-tasks', boardId],
        (old = {}) => {
          const next: Record<string, Task[]> = {}
          // Copy all columns, removing the affected task from wherever it was
          for (const [colId, tasks] of Object.entries(old)) {
            next[colId] = tasks.filter((t) => t.id !== task.id)
          }
          if (type !== 'TASK_DELETED') {
            const colId = task.columnId ?? '__unassigned__'
            next[colId] = [...(next[colId] ?? []), task]
          }
          return next
        }
      )
    },
    [boardId, queryClient]
  )

  useBoardSocket(boardId ?? '', handleEvent)

  const isLoading = loadingTasks || loadingColumns

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-blue-600 hover:underline">
          ← Boards
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Board</h1>
      </header>

      <main className="p-6 flex-1">
        {isLoading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <BoardView
            boardId={boardId!}
            columns={columns}
            groupedTasks={groupedTasks}
          />
        )}
      </main>
    </div>
  )
}
