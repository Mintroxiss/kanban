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
  role?: string
  userId?: string
  epicTeamNameMap?: Record<string, string>
}

export default function KanbanColumn({
  column, tasks, boardId, epics, defaultEpicId,
  canManage, isAdmin, role, userId, epicTeamNameMap,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['columns', boardId] }),
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
      {/* Header */}
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
            className="flex-1 bg-white/[0.14] border border-indigo-400/50 rounded-lg px-2 py-0.5 text-sm font-semibold text-white/90 uppercase tracking-wide focus:outline-none"
          />
        ) : (
          <>
            <h3 className="font-semibold text-xs text-white/50 uppercase tracking-widest flex-1 truncate">
              {column.title}
            </h3>
            <span className="text-xs text-white/30 bg-white/[0.11] border border-white/[0.13] rounded-full px-2 py-0.5 shrink-0">
              {tasks.length}
            </span>
            {isAdmin && !confirmDelete && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => { setEditTitle(column.title); setEditing(true) }}
                  title="Переименовать"
                  className="text-white/25 hover:text-white/70 text-xs px-1 transition-colors"
                >
                  ✎
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={tasks.length > 0}
                  title={tasks.length > 0 ? 'Сначала удалите все задачи из столбца' : 'Удалить'}
                  className="text-white/25 hover:text-red-300/80 text-xs px-1 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </>
        )}

        {confirmDelete && (
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-white/40">Удалить?</span>
            <button
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
              className="text-xs bg-red-500/70 text-white px-2 py-0.5 rounded-lg hover:bg-red-500/90 disabled:opacity-50 transition-colors"
            >
              Да
            </button>
            <button
              disabled={deleteMutation.isPending}
              onClick={() => setConfirmDelete(false)}
              className="text-xs bg-white/[0.14] text-white/60 px-2 py-0.5 rounded-lg hover:bg-white/[0.14] disabled:opacity-50 transition-colors"
            >
              Нет
            </button>
          </div>
        )}
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-24 rounded-2xl p-2 transition-all duration-200 ${
            isOver
              ? 'bg-indigo-500/[0.12] border-2 border-dashed border-indigo-400/40'
              : 'bg-white/[0.04] border border-white/[0.07]'
          }`}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              boardId={boardId}
              epics={epics}
              isAdmin={isAdmin}
              canDrag={isAdmin || role === 'TEAM_LEAD' || task.assigneeId === userId}
              isMyTask={!!userId && task.assigneeId === userId}
              teamName={epicTeamNameMap?.[task.epicId]}
              canTake={!isAdmin && !task.assigneeId && epics.some((e) => e.id === task.epicId)}
              canRelease={!isAdmin && !!task.assigneeId && (role === 'TEAM_LEAD' || task.assigneeId === userId)}
              canChangeStatus={!isAdmin && !!task.assigneeId && (role === 'TEAM_LEAD' || task.assigneeId === userId)}
              showDeadlineCountdown={!!task.deadline}
            />
          ))}
        </div>
      </SortableContext>

      {canManage && (
        <button
          onClick={() => setShowCreate(true)}
          className="mt-2 text-sm text-white/30 hover:text-white/60 hover:bg-white/[0.11] rounded-xl px-2 py-1.5 text-left transition-colors"
        >
          + Добавить задачу
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
