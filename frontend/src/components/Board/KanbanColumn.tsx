import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column, Epic, Task } from '../../types'
import TaskCard from './TaskCard'
import CreateTaskModal from '../CreateTaskModal'
import { updateColumn, deleteColumn } from '../../api/columns'

interface Props {
  column: Column
  tasks: Task[]
  boardId: string
  epics: Epic[]
  defaultEpicId?: string
  canManage: boolean
  isAdmin: boolean
}

export default function KanbanColumn({
  column,
  tasks,
  boardId,
  epics,
  defaultEpicId,
  canManage,
  isAdmin,
}: Props) {
  const queryClient = useQueryClient()
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = tasks.map((t) => t.id)

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const renameMutation = useMutation({
    mutationFn: (title: string) =>
      updateColumn(column.id, { title, boardId: column.boardId, order: column.order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', boardId] })
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteColumn(column.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns', boardId] })
    },
  })

  function commitRename() {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== column.title) {
      renameMutation.mutate(trimmed)
    } else {
      setEditing(false)
      setEditTitle(column.title)
    }
  }

  return (
    <div className="flex flex-col w-72 shrink-0 group">
      {/* Заголовок */}
      <div className="mb-3 flex items-center gap-2 min-h-[28px]">
        {editing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') { setEditing(false); setEditTitle(column.title) }
            }}
            onBlur={commitRename}
            className="flex-1 border border-blue-400 rounded px-2 py-0.5 text-sm font-semibold text-gray-700 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <>
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide flex-1 truncate">
              {column.title}
            </h3>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 shrink-0">
              {tasks.length}
            </span>
            {isAdmin && !confirmDelete && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => { setEditTitle(column.title); setEditing(true) }}
                  title="Переименовать"
                  className="text-gray-400 hover:text-gray-700 text-xs px-1"
                >
                  ✎
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={tasks.length > 0}
                  title={tasks.length > 0 ? 'Сначала удалите все задачи из столбца' : 'Удалить'}
                  className="text-gray-400 hover:text-red-500 text-xs px-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-400"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}

        {confirmDelete && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-gray-500">Удалить?</span>
            <button
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Да
            </button>
            <button
              disabled={deleteMutation.isPending}
              onClick={() => setConfirmDelete(false)}
              className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Нет
            </button>
          </div>
        )}
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-colors ${
            isOver ? 'bg-blue-50' : 'bg-gray-100'
          }`}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      {canManage && (
        <button
          onClick={() => setShowCreate(true)}
          className="mt-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg px-2 py-1.5 text-left transition-colors"
        >
          + Add card
        </button>
      )}

      {showCreate && (
        <CreateTaskModal
          boardId={boardId}
          columnId={column.id}
          epics={epics}
          defaultEpicId={defaultEpicId}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
