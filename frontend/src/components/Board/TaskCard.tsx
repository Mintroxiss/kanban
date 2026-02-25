import { useState, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation } from '@tanstack/react-query'
import type { Epic, Task } from '../../types'
import { deleteTask } from '../../api/tasks'
import EditTaskModal from '../EditTaskModal'

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

type DisplayProps = React.HTMLAttributes<HTMLDivElement> & {
  task: Task
  boardId?: string
  epics?: Epic[]
  isAdmin?: boolean
}

// Pure visual component — no dnd hooks. Used both in the column list (via
// TaskCard) and directly in DragOverlay so the floating clone always renders
// at full opacity without double-transforms.
export const TaskCardDisplay = forwardRef<HTMLDivElement, DisplayProps>(
  function TaskCardDisplay({ task, boardId, epics = [], isAdmin = false, ...props }, ref) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const deleteMutation = useMutation({
      mutationFn: () => deleteTask(task.id),
      onSuccess: () => {
        setOpen(false)
        // Cache update comes via WebSocket TASK_DELETED event
      },
    })

    function closeModal() {
      setOpen(false)
      setConfirmDelete(false)
    }

    return (
      <>
        <div
          ref={ref}
          {...props}
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
              onClick={closeModal}
            >
              <div
                className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">{task.title}</h2>
                  <button
                    onClick={closeModal}
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

                {isAdmin && (
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                    <button
                      onClick={() => { setOpen(false); setEditing(true) }}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Редактировать
                    </button>

                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      >
                        Удалить
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Удалить?</span>
                        <button
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate()}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {deleteMutation.isPending ? '…' : 'Да'}
                        </button>
                        <button
                          disabled={deleteMutation.isPending}
                          onClick={() => setConfirmDelete(false)}
                          className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                        >
                          Нет
                        </button>
                        {deleteMutation.isError && (
                          <span className="text-xs text-red-500">Ошибка</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

        {editing && boardId && (
          <EditTaskModal
            task={task}
            boardId={boardId}
            epics={epics}
            onClose={() => setEditing(false)}
          />
        )}
      </>
    )
  }
)

// Sortable wrapper — used in the column list.
export default function TaskCard({
  task,
  boardId,
  epics,
  isAdmin,
}: {
  task: Task
  boardId?: string
  epics?: Epic[]
  isAdmin?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <TaskCardDisplay
      ref={setNodeRef}
      task={task}
      boardId={boardId}
      epics={epics}
      isAdmin={isAdmin}
      style={style}
      {...attributes}
      {...listeners}
    />
  )
}
