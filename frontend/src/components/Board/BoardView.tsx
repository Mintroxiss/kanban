import { useQueryClient } from '@tanstack/react-query'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import type { Column, Task } from '../../types'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { moveTask } from '../../api/tasks'

interface Props {
  boardId: string
  columns: Column[]
  groupedTasks: Record<string, Task[]>
}

export default function BoardView({ boardId, columns, groupedTasks }: Props) {
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
    const queryKey = ['grouped-tasks', boardId]
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
      // Rollback on error
      if (previous) {
        queryClient.setQueryData(queryKey, previous)
      }
    })
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sortedColumns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={groupedTasks[col.id] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
