import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask } from '../api/tasks'
import { getAssignableUsers } from '../api/epics'
import type { Epic } from '../types'

interface Props {
  boardId: string
  columnId: string
  epics: Epic[]
  defaultEpicId?: string
  onClose: () => void
}

const STATUSES = [
  { value: 'TO_DO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'DONE', label: 'Готово' },
]

export default function CreateTaskModal({ boardId, columnId, epics, defaultEpicId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [epicId, setEpicId] = useState(defaultEpicId ?? epics[0]?.id ?? '')

  function handleEpicChange(newEpicId: string) {
    setEpicId(newEpicId)
    setAssigneeId('')
  }
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState('TO_DO')
  const [assigneeId, setAssigneeId] = useState('')

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['assignable-users', epicId],
    queryFn: () => getAssignableUsers(epicId),
    enabled: !!epicId,
  })

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
      onClose()
    },
  })

  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !epicId || !deadline) return
    if (deadline < today) return
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      deadline,
      epicId,
      columnId,
      assigneeId: assigneeId || undefined,
    })
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
          <h2 className="text-lg font-semibold text-gray-800">Новая задача</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {epics.length === 0 ? (
          <p className="text-sm text-gray-500">
            Эпиков не найдено. Сначала создайте эпик.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Название */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="напр. Реализовать форму входа"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Описание */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Описание <span className="text-gray-400 font-normal">(необязательно)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Описание задачи…"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Статус */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Эпик */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Эпик</label>
              <select
                value={epicId}
                onChange={(e) => handleEpicChange(e.target.value)}
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

            {/* Исполнитель */}
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
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Дедлайн */}
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
              <p className="text-red-500 text-sm">Не удалось создать задачу. Попробуйте снова.</p>
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
                {mutation.isPending ? 'Создание…' : 'Создать'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
