import { useCallback, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGroupedTasks } from '../api/boards'
import { getColumns } from '../api/columns'
import { getEpicsByBoard } from '../api/epics'
import { useBoardSocket } from '../hooks/useBoardSocket'
import { useAuthStore } from '../store/authStore'
import BoardView from '../components/Board/BoardView'
import CreateEpicModal from '../components/CreateEpicModal'
import type { BoardEvent, Task } from '../types'

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const [selectedEpicId, setSelectedEpicId] = useState<string>('')
  const [showCreateEpic, setShowCreateEpic] = useState(false)

  const { data: groupedTasks = {}, isLoading: loadingTasks } = useQuery({
    queryKey: ['grouped-tasks', boardId, selectedEpicId || undefined],
    queryFn: () => getGroupedTasks(boardId!, selectedEpicId || undefined),
    enabled: !!boardId,
  })

  const { data: columns = [], isLoading: loadingColumns } = useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => getColumns(boardId!),
    enabled: !!boardId,
  })

  const { data: epics = [], isLoading: loadingEpics } = useQuery({
    queryKey: ['epics', boardId],
    queryFn: () => getEpicsByBoard(boardId!),
    enabled: !!boardId,
  })

  const handleEvent = useCallback(
    (event: BoardEvent) => {
      const { type, payload: task } = event
      queryClient.setQueryData<Record<string, Task[]>>(
        ['grouped-tasks', boardId, selectedEpicId || undefined],
        (old = {}) => {
          const next: Record<string, Task[]> = {}
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
    [boardId, queryClient, selectedEpicId]
  )

  useBoardSocket(boardId ?? '', handleEvent)

  const isLoading = loadingTasks || loadingColumns || loadingEpics
  const canManage = role === 'ADMIN' || role === 'TEAM_LEAD'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 flex-wrap">
        <Link to="/boards" className="text-sm text-blue-600 hover:underline">
          ← Boards
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mr-auto">Board</h1>

        {!loadingEpics && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Epic:</label>
            <select
              value={selectedEpicId}
              onChange={(e) => setSelectedEpicId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All epics</option>
              {epics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateEpic(true)}
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            + New Epic
          </button>
        )}
      </header>

      <main className="p-6 flex-1">
        {isLoading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <BoardView
            boardId={boardId!}
            columns={columns}
            groupedTasks={groupedTasks}
            epics={epics}
            selectedEpicId={selectedEpicId}
            canManage={canManage}
            isAdmin={role === 'ADMIN'}
          />
        )}
      </main>

      {showCreateEpic && boardId && (
        <CreateEpicModal boardId={boardId} onClose={() => setShowCreateEpic(false)} />
      )}
    </div>
  )
}
