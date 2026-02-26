import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateTask } from '../api/tasks'
import { getAssignableUsers } from '../api/epics'
import type { Epic, Task } from '../types'

interface Props {
  task: Task
  boardId: string
  epics: Epic[]
  onClose: () => void
}

const STATUSES = [
  { value: 'TO_DO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'DONE', label: 'Готово' },
]

export default function EditTaskModal({ task, boardId, epics, onClose }: Props) {
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState(task.status)
  const [epicId, setEpicId] = useState(task.epicId)
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? '')
  const [deadline, setDeadline] = useState(task.deadline)

  const { data: users = [] } = useQuery({
    queryKey: ['assignable-users', epicId],
    queryFn: () => getAssignableUsers(epicId),
    enabled: !!epicId,
  })

  const today = new Date().toISOString().split('T')[0]

  const mutation = useMutation({
    mutationFn: () =>
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        deadline,
        epicId,
        columnId: task.columnId,
        assigneeId: assigneeId || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueriesData<Record<string, Task[]>>(
        { queryKey: ['grouped-tasks', boardId] },
        (old) => {
          if (!old) return old
          const next: Record<string, Task[]> = {}
          for (const [colId, tasks] of Object.entries(old)) {
            next[colId] = tasks.map((t) => (t.id === updated.id ? updated : t))
          }
          return next
        }
      )
      onClose()
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !epicId || !deadline) return
    if (deadline < today) return
    mutation.mutate()
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">Редактировать задачу</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Название</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Описание <span className="text-gray-400 font-normal">(необязательно)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Task['status'])}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Epic */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Эпик</label>
            <select
              value={epicId}
              onChange={(e) => setEpicId(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {epics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.title}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Исполнитель <span className="text-gray-400 font-normal">(необязательно)</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Не назначен —</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Дедлайн</label>
            <input
              type="date"
              value={deadline}
              min={today}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm">Не удалось сохранить. Попробуйте снова.</p>
          )}

          <div className="flex gap-3 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {mutation.isPending ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
