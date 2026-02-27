import { useQueryClient, useMutation } from '@tanstack/react-query'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { useMidnightTick } from '../../hooks/useMidnightTick'
import type { Column, Epic, Task } from '../../types'
import KanbanColumn from './KanbanColumn'
import { TaskCardDisplay } from './TaskCard'
import { moveTask } from '../../api/tasks'
import { createColumn } from '../../api/columns'

interface Props {
  boardId: string
  columns: Column[]
  groupedTasks: Record<string, Task[]>
  epics: Epic[]
  selectedEpicId: string
  canManage: boolean
  isAdmin: boolean
  teamId?: string
  role?: string
  userId?: string
  epicTeamNameMap?: Record<string, string>
}

function daysLeft(deadline: string, todayStr: string): number {
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const [dy, dm, dd] = deadline.split('T')[0].split('-').map(Number)
  return Math.round(
    (new Date(dy, dm - 1, dd).getTime() - new Date(ty, tm - 1, td).getTime()) / 86_400_000
  )
}

function AddColumnPanel({ boardId, nextOrder }: { boardId: string; nextOrder: number }) {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')

  const mutation = useMutation({
    mutationFn: () => createColumn({ title: title.trim(), boardId, order: nextOrder }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', boardId] })
      setIsOpen(false)
      setTitle('')
    },
  })

  if (!isOpen) {
    return (
      <div className="flex flex-col w-72 shrink-0">
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl px-4 py-3 text-left transition-colors bg-gray-100"
        >
          + Добавить колонку
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="bg-gray-100 rounded-xl p-3 flex flex-col gap-2">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) mutation.mutate()
            if (e.key === 'Escape') { setIsOpen(false); setTitle('') }
          }}
          placeholder="Название колонки"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            disabled={!title.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Добавить
          </button>
          <button
            onClick={() => { setIsOpen(false); setTitle('') }}
            className="text-sm text-gray-500 hover:text-gray-700 px-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BoardView({
  boardId,
  columns,
  groupedTasks,
  epics,
  selectedEpicId,
  canManage,
  isAdmin,
  teamId,
  role,
  userId,
  epicTeamNameMap,
}: Props) {
  const queryClient = useQueryClient()
  const todayStr = useMidnightTick()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const columnIds = columns.map((c) => c.id)

  function findTaskColumn(taskId: string): string | undefined {
    return Object.entries(groupedTasks).find(([, tasks]) =>
      tasks.some((t) => t.id === taskId)
    )?.[0]
  }

  function findTask(taskId: string): Task | undefined {
    for (const tasks of Object.values(groupedTasks)) {
      const found = tasks.find((t) => t.id === taskId)
      if (found) return found
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(findTask(String(event.active.id)) ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)

    const targetColumnId = columnIds.includes(overId)
      ? overId
      : findTaskColumn(overId)

    if (!targetColumnId) return

    const sourceColumnId = findTaskColumn(taskId)
    if (!sourceColumnId || sourceColumnId === targetColumnId) return

    const task = findTask(taskId)
    if (!task) return

    // Оптимистичное обновление кэша: перемещаем задачу локально до ответа сервера
    const queryKey = ['grouped-tasks', boardId, selectedEpicId || undefined]
    const previous = queryClient.getQueryData<Record<string, Task[]>>(queryKey)

    queryClient.setQueryData<Record<string, Task[]>>(queryKey, (old = {}) => {
      const next = { ...old }
      next[sourceColumnId] = (next[sourceColumnId] ?? []).filter((t) => t.id !== taskId)
      next[targetColumnId] = [
        ...(next[targetColumnId] ?? []),
        { ...task, columnId: targetColumnId },
      ]
      return next
    })

    moveTask(taskId, targetColumnId).catch(() => {
      if (previous) {
        queryClient.setQueryData(queryKey, previous)
      }
    })
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  // TEAM_LEAD видит в форме создания задачи только эпики своей команды
  const manageableEpics = isAdmin
    ? epics
    : epics.filter((e) => e.teamId != null && e.teamId === teamId)

  // Показываем "Add card" только если есть доступные эпики (для TEAM_LEAD)
  const effectiveCanManage = isAdmin ? canManage : canManage && manageableEpics.length > 0

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {sortedColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={[...(groupedTasks[col.id] ?? [])].sort((a, b) => {
              const da = a.deadline ? daysLeft(a.deadline, todayStr) : Infinity
              const db = b.deadline ? daysLeft(b.deadline, todayStr) : Infinity
              return da - db
            })}
            boardId={boardId}
            epics={manageableEpics}
            defaultEpicId={selectedEpicId && manageableEpics.some(e => e.id === selectedEpicId)
              ? selectedEpicId
              : undefined}
            canManage={effectiveCanManage}
            isAdmin={isAdmin}
            role={role}
            userId={userId}
            epicTeamNameMap={epicTeamNameMap}
          />
        ))}
        {isAdmin && (
          <AddColumnPanel boardId={boardId} nextOrder={sortedColumns.length > 0 ? Math.max(...sortedColumns.map(c => c.order)) + 1 : 1} />
        )}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCardDisplay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
