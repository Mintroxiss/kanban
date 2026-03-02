import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      {...listeners}
      {...attributes}
      className={`backdrop-blur-md bg-white/[0.08] border rounded-xl px-3 py-1.5 text-sm text-white/80 cursor-grab select-none transition-all ${
        isDragging
          ? 'opacity-40 border-indigo-400/60 shadow-lg'
          : 'border-white/[0.14] hover:border-indigo-400/40 hover:bg-white/[0.12]'
      }`}
    >
      {task.title}
    </div>
  )
}

function DropZone({ id, label, tasks, variant }: { id: string; label: string; tasks: Task[]; variant: 'orphaned' | 'column' }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const baseBg = variant === 'orphaned'
    ? 'bg-amber-400/[0.06] border-amber-400/20'
    : 'bg-white/[0.04] border-white/[0.10]'
  const hoverBg = variant === 'orphaned'
    ? 'bg-amber-400/[0.12] border-amber-400/40'
    : 'bg-indigo-400/[0.10] border-indigo-400/40'

  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{label}</p>
      <div
        ref={setNodeRef}
        className={`min-h-16 rounded-2xl p-2 flex flex-wrap gap-1.5 border-2 border-dashed transition-colors ${isOver ? hoverBg : baseBg}`}
      >
        {tasks.map((t) => <DraggableTaskChip key={t.id} task={t} />)}
        {tasks.length === 0 && (
          <p className="text-xs text-white/20 w-full text-center py-2">
            {variant === 'orphaned' ? 'Все задачи распределены' : 'Перетащите сюда'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function EpicReassignModal({ epicTitle, orphanedTasks, columns, onConfirm, onCancel }: Props) {
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
    setPlacements((prev) => ({ ...prev, [taskId]: overId === '__orphaned__' ? null : overId }))
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="backdrop-blur-2xl bg-white/[0.09] border border-white/[0.14] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.08] shrink-0">
          <h2 className="text-lg font-semibold text-white/95">Восстановление эпика «{epicTitle}»</h2>
          <p className="text-sm text-white/50 mt-1">
            Часть задач осталась без колонки. Перетащите каждую задачу в одну из текущих колонок, затем нажмите «Восстановить».
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-4">
              <DropZone id="__orphaned__" label="Без колонки" tasks={stillOrphaned} variant="orphaned" />
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
                <div className="backdrop-blur-xl bg-white/[0.15] border border-indigo-400/50 rounded-xl px-3 py-1.5 text-sm text-white shadow-xl cursor-grabbing">
                  {activeTask.title}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] shrink-0 flex items-center justify-between gap-4">
          <p className={`text-sm ${allAssigned ? 'text-emerald-300/80' : 'text-amber-300/80'}`}>
            {allAssigned
              ? 'Все задачи распределены — можно восстановить эпик.'
              : `Осталось распределить: ${remainingCount}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={confirming}
              className="text-sm text-white/50 hover:text-white/80 px-4 py-2 rounded-xl border border-white/[0.12] hover:bg-white/[0.08] disabled:opacity-50 transition-all"
            >
              Отмена
            </button>
            <button
              disabled={!allAssigned || confirming}
              onClick={handleConfirm}
              className="text-sm bg-emerald-500/70 hover:bg-emerald-500/90 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-50 transition-all border border-emerald-400/30 shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
            >
              {confirming ? 'Восстанавливаем…' : 'Восстановить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
