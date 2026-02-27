import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getArchivedEpics, restoreEpic, deleteEpic, getEpicTasks } from '../api/epics'
import { getColumns } from '../api/columns'
import { getBoard } from '../api/boards'
import { moveTask } from '../api/tasks'
import { useBoardSocket } from '../hooks/useBoardSocket'
import EpicReassignModal from '../components/EpicReassignModal'
import type { BoardEvent, Column, Epic, Task } from '../types'

export default function ArchivedEpicsPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const queryClient = useQueryClient()

  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoard(boardId!),
    enabled: !!boardId,
  })

  const { data: epics = [], isLoading } = useQuery({
    queryKey: ['epics-archived', boardId],
    queryFn: () => getArchivedEpics(boardId!),
    enabled: !!boardId,
  })

  const { data: columns = [] } = useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => getColumns(boardId!),
    enabled: !!boardId,
  })

  const handleEvent = useCallback(
    (event: BoardEvent) => {
      if (event.type === 'EPIC_ARCHIVED') {
        const epic = event.payload as Epic
        queryClient.setQueryData<Epic[]>(['epics-archived', boardId], (old = []) =>
          old.some((e) => e.id === epic.id) ? old : [...old, epic]
        )
      }
      if (event.type === 'EPIC_RESTORED' || event.type === 'EPIC_DELETED') {
        const epic = event.payload as Epic
        queryClient.setQueryData<Epic[]>(['epics-archived', boardId], (old = []) =>
          old.filter((e) => e.id !== epic.id)
        )
      }
    },
    [boardId, queryClient]
  )

  useBoardSocket(boardId ?? '', handleEvent)

  function handleRestored(epicId: string) {
    queryClient.setQueryData<Epic[]>(['epics-archived', boardId], (old = []) =>
      old.filter((e) => e.id !== epicId)
    )
    queryClient.invalidateQueries({ queryKey: ['epics', boardId] })
    queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
  }

  function handleDeleted(epicId: string) {
    queryClient.setQueryData<Epic[]>(['epics-archived', boardId], (old = []) =>
      old.filter((e) => e.id !== epicId)
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to={`/boards/${boardId}`} className="text-sm text-blue-600 hover:underline">
          ← Доска
        </Link>
        <h1 className="text-xl font-bold text-gray-800">
          Архив эпиков{board ? ` доски «${board.name}»` : ''}
        </h1>
      </header>

      <main className="p-6 flex flex-col gap-6">
        {isLoading ? (
          <p className="text-gray-400">Загрузка…</p>
        ) : epics.length === 0 ? (
          <p className="text-gray-400">Архив эпиков пуст.</p>
        ) : (
          epics.map((epic) => (
            <EpicCard
              key={epic.id}
              epic={epic}
              columns={columns}
              onRestored={handleRestored}
              onDeleted={handleDeleted}
            />
          ))
        )}
      </main>
    </div>
  )
}

function EpicCard({
  epic,
  columns,
  onRestored,
  onDeleted,
}: {
  epic: Epic
  columns: Column[]
  onRestored: (id: string) => void
  onDeleted: (id: string) => void
}) {
  const [showReassign, setShowReassign] = useState(false)

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['epic-tasks', epic.id],
    queryFn: () => getEpicTasks(epic.id),
  })

  const columnMap: Record<string, string> = Object.fromEntries(
    columns.map((c: Column) => [c.id, c.title])
  )

  // Задачи без актуальной колонки: columnId null ИЛИ колонка уже удалена (stale cache)
  const orphaned = tasks.filter((t) => !t.columnId || !columnMap[t.columnId])

  const restoreMutation = useMutation({
    mutationFn: () => restoreEpic(epic.id),
    onSuccess: () => onRestored(epic.id),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteEpic(epic.id),
    onSuccess: () => onDeleted(epic.id),
  })

  function handleRestoreClick() {
    if (orphaned.length > 0) {
      setShowReassign(true)
    } else {
      restoreMutation.mutate()
    }
  }

  async function handleReassignConfirm(assignments: Record<string, string>) {
    await Promise.all(
      Object.entries(assignments).map(([taskId, colId]) => moveTask(taskId, colId))
    )
    await restoreEpic(epic.id)
    onRestored(epic.id)
    setShowReassign(false)
  }

  // Группировка задач по колонкам для отображения
  const grouped: Record<string, Task[]> = {}
  for (const task of tasks) {
    const key = task.columnId && columnMap[task.columnId] ? task.columnId : '__deleted__'
    grouped[key] = [...(grouped[key] ?? []), task]
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="font-semibold text-gray-800">{epic.title}</h2>
            {epic.description && (
              <p className="text-sm text-gray-500 mt-0.5">{epic.description}</p>
            )}
            {orphaned.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {orphaned.length} {orphaned.length === 1 ? 'задача без колонки' : 'задачи без колонки'} — потребуется распределение
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={restoreMutation.isPending || loadingTasks}
              onClick={handleRestoreClick}
              className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {restoreMutation.isPending ? 'Восстанавливаем…' : 'Восстановить'}
            </button>
            <button
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm(`Удалить эпик «${epic.title}» и все его задачи навсегда?`)) {
                  deleteMutation.mutate()
                }
              }}
              className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Удалить
            </button>
          </div>
        </div>

        {loadingTasks ? (
          <p className="text-sm text-gray-400">Загрузка задач…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-400">Нет задач.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(grouped).map(([colId, colTasks]) => (
              <div key={colId}>
                <span className={`text-xs font-medium uppercase tracking-wide ${colId === '__deleted__' ? 'text-amber-500' : 'text-gray-500'}`}>
                  {colId === '__deleted__' ? 'Колонка удалена' : columnMap[colId]}
                </span>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {colTasks.map((task) => (
                    <li
                      key={task.id}
                      className={`text-sm rounded-lg px-2.5 py-1 ${
                        colId === '__deleted__'
                          ? 'bg-amber-50 border border-amber-200 text-amber-800'
                          : 'bg-gray-50 border border-gray-200 text-gray-700'
                      }`}
                    >
                      {task.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {showReassign && (
        <EpicReassignModal
          epicTitle={epic.title}
          orphanedTasks={orphaned}
          columns={columns}
          onConfirm={handleReassignConfirm}
          onCancel={() => setShowReassign(false)}
        />
      )}
    </>
  )
}
