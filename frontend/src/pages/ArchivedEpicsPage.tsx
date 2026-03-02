import { useState, useCallback } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
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
    queryClient.setQueryData<Epic[]>(['epics-archived', boardId], (old = []) => old.filter((e) => e.id !== epicId))
    queryClient.invalidateQueries({ queryKey: ['epics', boardId] })
    queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
  }

  function handleDeleted(epicId: string) {
    queryClient.setQueryData<Epic[]>(['epics-archived', boardId], (old = []) => old.filter((e) => e.id !== epicId))
  }

  return (
    <div className="relative min-h-screen z-10">
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.11] border-b border-white/[0.23] px-6 py-4 flex items-center gap-4">
        <Link to={`/boards/${boardId}`} className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors">← Доска</Link>
        <h1 className="text-lg font-semibold text-white/95">
          Архив эпиков{board ? ` · ${board.name}` : ''}
        </h1>
      </header>

      <main className="p-6 flex flex-col gap-4">
        {isLoading ? (
          <p className="text-white/35 text-sm">Загрузка…</p>
        ) : epics.length === 0 ? (
          <p className="text-white/35 text-sm">Архив эпиков пуст.</p>
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
  epic, columns, onRestored, onDeleted,
}: {
  epic: Epic; columns: Column[]; onRestored: (id: string) => void; onDeleted: (id: string) => void
}) {
  const [showReassign, setShowReassign] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['epic-tasks', epic.id],
    queryFn: () => getEpicTasks(epic.id),
  })

  const columnMap: Record<string, string> = Object.fromEntries(columns.map((c: Column) => [c.id, c.title]))
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
    if (orphaned.length > 0) setShowReassign(true)
    else restoreMutation.mutate()
  }

  async function handleReassignConfirm(assignments: Record<string, string>) {
    await Promise.all(Object.entries(assignments).map(([taskId, colId]) => moveTask(taskId, colId)))
    await restoreEpic(epic.id)
    onRestored(epic.id)
    setShowReassign(false)
  }

  const grouped: Record<string, Task[]> = {}
  for (const task of tasks) {
    const key = task.columnId && columnMap[task.columnId] ? task.columnId : '__deleted__'
    grouped[key] = [...(grouped[key] ?? []), task]
  }

  return (
    <>
      <div className="backdrop-blur-md bg-white/[0.11] border border-white/[0.23] rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="font-semibold text-white/90">{epic.title}</h2>
            {epic.description && <p className="text-sm text-white/50 mt-0.5">{epic.description}</p>}
            {orphaned.length > 0 && (
              <p className="text-xs text-amber-300/70 mt-1">
                {orphaned.length} {orphaned.length === 1 ? 'задача без колонки' : 'задачи без колонки'} — потребуется распределение
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={restoreMutation.isPending || loadingTasks}
              onClick={handleRestoreClick}
              className="text-sm bg-emerald-500/70 hover:bg-emerald-500/90 text-white px-3 py-1.5 rounded-xl font-medium disabled:opacity-50 transition-all border border-emerald-400/30"
            >
              {restoreMutation.isPending ? 'Восстанавливаем…' : 'Восстановить'}
            </button>
            <button
              disabled={deleteMutation.isPending}
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm bg-red-500/60 hover:bg-red-500/80 text-white px-3 py-1.5 rounded-xl font-medium disabled:opacity-50 transition-all border border-red-400/25"
            >
              Удалить
            </button>
          </div>
        </div>

        {loadingTasks ? (
          <p className="text-sm text-white/35">Загрузка задач…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-white/35">Нет задач.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(grouped).map(([colId, colTasks]) => (
              <div key={colId}>
                <span className={`text-xs font-medium uppercase tracking-wide ${colId === '__deleted__' ? 'text-amber-300/70' : 'text-white/40'}`}>
                  {colId === '__deleted__' ? 'Колонка удалена' : columnMap[colId]}
                </span>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {colTasks.map((task) => (
                    <li key={task.id} className={`text-sm rounded-xl px-2.5 py-1 ${
                      colId === '__deleted__'
                        ? 'bg-amber-400/[0.10] border border-amber-400/20 text-amber-200/80'
                        : 'bg-white/[0.11] border border-white/[0.23] text-white/65'
                    }`}>
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

      {showDeleteConfirm && (
        <ConfirmDialog
          title={`Удалить эпик «${epic.title}» навсегда?`}
          description="Все задачи эпика будут удалены безвозвратно."
          confirmLabel="Удалить"
          danger
          onConfirm={() => { deleteMutation.mutate(); setShowDeleteConfirm(false) }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
