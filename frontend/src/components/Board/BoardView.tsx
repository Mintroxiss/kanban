import { useQueryClient, useMutation } from '@tanstack/react-query'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
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
}: Props) {
  const queryClient = useQueryClient()
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

    // Optimistic update
    const queryKey = ['grouped-tasks', boardId, selectedEpicId || undefined]
    const previous = queryClient.getQueryData<Record<string, Task[]>>(queryKey)

    queryClient.setQueryData<Record<string, Task[]>>(queryKey, (old = {}) => {
      const next = { ...old }
      next[sourceColumnId] = next[sourceColumnId].filter((t) => t.id !== taskId)
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

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {sortedColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={groupedTasks[col.id] ?? []}
            boardId={boardId}
            epics={epics}
            defaultEpicId={selectedEpicId || undefined}
            canManage={canManage}
            isAdmin={isAdmin}
          />
        ))}
        {isAdmin && (
          <AddColumnPanel boardId={boardId} nextOrder={sortedColumns.length + 1} />
        )}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCardDisplay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
