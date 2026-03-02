import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateTask } from '../api/tasks'
import { getAssignableUsers } from '../api/epics'
import type { Epic, Task } from '../types'

interface Props { task: Task; boardId: string; epics: Epic[]; onClose: () => void }

const STATUSES = [
  { value: 'TO_DO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'DONE', label: 'Готово' },
]

const inputCls = 'bg-white/[0.14] border border-white/[0.20] rounded-2xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:bg-white/[0.11] transition-all'
const labelCls = 'text-sm font-medium text-white/60'

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
        title: title.trim(), description: description.trim() || undefined,
        status, deadline, epicId, columnId: task.columnId,
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
    if (!title.trim() || !epicId || !deadline || deadline < today) return
    mutation.mutate()
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="backdrop-blur-2xl bg-white/[0.17] border border-white/[0.22] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white/95">Редактировать задачу</h2>
          <button onClick={onClose} className="text-white/35 hover:text-white/70 text-xl leading-none transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Название</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Описание <span className="text-white/30 font-normal">(необязательно)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])} className={inputCls}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Эпик</label>
            <select value={epicId} onChange={(e) => setEpicId(e.target.value)} required className={inputCls}>
              {epics.map((epic) => <option key={epic.id} value={epic.id}>{epic.title}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Исполнитель <span className="text-white/30 font-normal">(необязательно)</span></label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputCls}>
              <option value="">— Не назначен —</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Дедлайн</label>
            <input type="date" value={deadline} min={today} onChange={(e) => setDeadline(e.target.value)} required className={inputCls} />
          </div>

          {mutation.isError && (
            <p className="text-red-300/80 text-sm bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
              Не удалось сохранить. Попробуйте снова.
            </p>
          )}

          <div className="flex gap-3 justify-end mt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2 text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white rounded-2xl font-medium disabled:opacity-50 transition-all border border-indigo-400/30 shadow-[0_4px_16px_rgba(99,102,241,0.3)]">
              {mutation.isPending ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
