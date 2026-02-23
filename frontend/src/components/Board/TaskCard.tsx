import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types'

const STATUS_STYLES: Record<string, string> = {
  TO_DO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<string, string> = {
  TO_DO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

interface Props {
  task: Task
}

export default function TaskCard({ task }: Props) {
  const [open, setOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setOpen(true)}
        className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
      >
        <p className="font-medium text-sm text-gray-800 mb-2">{task.title}</p>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status] ?? ''}`}
          >
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
          {task.deadline && (
            <span className="text-xs text-gray-400">{task.deadline}</span>
          )}
        </div>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{task.title}</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {task.description && (
                <p className="text-sm text-gray-600 mb-4">{task.description}</p>
              )}

              <div className="flex flex-col gap-2 text-sm text-gray-500">
                <div className="flex gap-2">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[task.status] ?? ''}`}
                  >
                    {STATUS_LABELS[task.status] ?? task.status}
                  </span>
                </div>
                {task.deadline && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-700">Deadline:</span>
                    <span>{task.deadline}</span>
                  </div>
                )}
                {task.assigneeId && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-700">Assignee:</span>
                    <span className="font-mono text-xs">{task.assigneeId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
