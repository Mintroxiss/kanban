import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask } from '../api/tasks'
import { getAssignableUsers } from '../api/epics'
import type { Epic } from '../types'
import GlassSelect from './GlassSelect'

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

const inputCls = 'bg-white/[0.14] border border-white/[0.20] rounded-2xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:bg-white/[0.11] transition-all'
const labelCls = 'text-sm font-medium text-white/60'

export default function CreateTaskModal({ boardId, columnId, epics, defaultEpicId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [epicId, setEpicId] = useState(defaultEpicId ?? epics[0]?.id ?? '')
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState('TO_DO')
  const [assigneeId, setAssigneeId] = useState('')

  function handleEpicChange(newEpicId: string) { setEpicId(newEpicId); setAssigneeId('') }

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['assignable-users', epicId],
    queryFn: () => getAssignableUsers(epicId),
    enabled: !!epicId,
  })

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] }); onClose() },
  })

  const today = new Date().toISOString().split('T')[0]

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !epicId || !deadline || deadline < today) return
    mutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      status, deadline, epicId, columnId,
      assigneeId: assigneeId || undefined,
    })
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="backdrop-blur-2xl bg-white/[0.17] border border-white/[0.22] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white/95">Новая задача</h2>
          <button onClick={onClose} className="text-white/35 hover:text-white/70 text-xl leading-none transition-colors">×</button>
        </div>

        {epics.length === 0 ? (
          <p className="text-sm text-white/50">Эпиков не найдено. Сначала создайте эпик.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Название</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                placeholder="напр. Реализовать форму входа" className={inputCls} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Описание <span className="text-white/30 font-normal">(необязательно)</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                placeholder="Описание задачи…" className={`${inputCls} resize-none`} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Статус</label>
              <GlassSelect
                value={status}
                onChange={setStatus}
                options={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Эпик</label>
              <GlassSelect
                value={epicId}
                onChange={handleEpicChange}
                options={epics.map((epic) => ({ value: epic.id, label: epic.title }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Исполнитель <span className="text-white/30 font-normal">(необязательно)</span></label>
              <GlassSelect
                value={assigneeId}
                onChange={setAssigneeId}
                placeholder="— Не назначен —"
                options={assignableUsers.map((user) => ({ value: user.id, label: user.fullName }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Дедлайн</label>
              <input type="date" value={deadline} min={today} onChange={(e) => setDeadline(e.target.value)} required className={inputCls} />
            </div>

            {mutation.isError && (
              <p className="text-red-300/80 text-sm bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
                Не удалось создать задачу. Попробуйте снова.
              </p>
            )}

            <div className="flex gap-3 justify-end mt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors">
                Отмена
              </button>
              <button type="submit" disabled={mutation.isPending}
                className="px-5 py-2 text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white rounded-2xl font-medium disabled:opacity-50 transition-all border border-indigo-400/30 shadow-[0_4px_16px_rgba(99,102,241,0.3)]">
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
