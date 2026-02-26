import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { Column, Task } from '../types'

interface Props {
  epicTitle: string
  orphanedTasks: Task[]
  columns: Column[]
  onConfirm: (assignments: Record<string, string>) => Promise<void>
  onCancel: () => void
}

function DraggableTaskChip({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      {...listeners}
      {...attributes}
      className={`bg-white border rounded-lg px-3 py-1.5 text-sm cursor-grab select-none transition-all ${
        isDragging
          ? 'opacity-40 border-blue-400 shadow-md'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      {task.title}
    </div>
  )
}

function DropZone({
  id,
  label,
  tasks,
  variant,
}: {
  id: string
  label: string
  tasks: Task[]
  variant: 'orphaned' | 'column'
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const baseBg = variant === 'orphaned' ? 'bg-amber-50/60 border-amber-200' : 'bg-gray-50 border-gray-200'
  const hoverBg = variant === 'orphaned' ? 'bg-amber-100 border-amber-400' : 'bg-blue-50 border-blue-400'

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <div
        ref={setNodeRef}
        className={`min-h-16 rounded-xl p-2 flex flex-wrap gap-1.5 border-2 border-dashed transition-colors ${
          isOver ? hoverBg : baseBg
        }`}
      >
        {tasks.map((t) => (
          <DraggableTaskChip key={t.id} task={t} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-gray-300 w-full text-center py-2">
            {variant === 'orphaned' ? 'Все задачи распределены' : 'Перетащите сюда'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function EpicReassignModal({
  epicTitle,
  orphanedTasks,
  columns,
  onConfirm,
  onCancel,
}: Props) {
  // taskId → columnId | null  (null = ещё не назначена)
  const [placements, setPlacements] = useState<Record<string, string | null>>(
    Object.fromEntries(orphanedTasks.map((t) => [t.id, null]))
  )
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [confirming, setConfirming] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const remainingCount = Object.values(placements).filter((v) => v === null).length
  const allAssigned = remainingCount === 0

  function handleDragStart(e: DragStartEvent) {
    setActiveTask(orphanedTasks.find((t) => t.id === String(e.active.id)) ?? null)
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveTask(null)
    if (!e.over) return
    const taskId = String(e.active.id)
    const overId = String(e.over.id)
    const newColId = overId === '__orphaned__' ? null : overId
    setPlacements((prev) => ({ ...prev, [taskId]: newColId }))
  }

  async function handleConfirm() {
    setConfirming(true)
    try {
      const assignments: Record<string, string> = {}
      for (const [taskId, colId] of Object.entries(placements)) {
        if (colId) assignments[taskId] = colId
      }
      await onConfirm(assignments)
    } finally {
      setConfirming(false)
    }
  }

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)
  const stillOrphaned = orphanedTasks.filter((t) => placements[t.id] === null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Шапка */}
        <div className="px-6 py-5 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">
            Восстановление эпика «{epicTitle}»
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Часть задач осталась без колонки — их колонки были удалены.
            Перетащите каждую задачу в одну из текущих колонок, затем нажмите «Восстановить».
          </p>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-4">
              <DropZone
                id="__orphaned__"
                label="Без колонки"
                tasks={stillOrphaned}
                variant="orphaned"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sortedColumns.map((col) => (
                  <DropZone
                    key={col.id}
                    id={col.id}
                    label={col.title}
                    tasks={orphanedTasks.filter((t) => placements[t.id] === col.id)}
                    variant="column"
                  />
                ))}
              </div>
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="bg-white border border-blue-400 rounded-lg px-3 py-1.5 text-sm shadow-xl cursor-grabbing">
                  {activeTask.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Подвал */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between gap-4">
          <p className={`text-sm ${allAssigned ? 'text-green-600' : 'text-amber-600'}`}>
            {allAssigned
              ? 'Все задачи распределены — можно восстановить эпик.'
              : `Осталось распределить: ${remainingCount}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={confirming}
              className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Отмена
            </button>
            <button
              disabled={!allAssigned || confirming}
              onClick={handleConfirm}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {confirming ? 'Восстанавливаем…' : 'Восстановить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
