import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createEpic } from '../api/epics'
import { getTeams } from '../api/teams'

interface Props { boardId: string; onClose: () => void }

const inputCls = 'bg-white/[0.14] border border-white/[0.20] rounded-2xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-violet-400/50 focus:bg-white/[0.11] transition-all'
const labelCls = 'text-sm font-medium text-white/60'

export default function CreateEpicModal({ boardId, onClose }: Props) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [teamId, setTeamId] = useState('')

  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: getTeams })

  const mutation = useMutation({
    mutationFn: createEpic,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['epics', boardId] }); onClose() },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    mutation.mutate({ title: title.trim(), description: description.trim() || undefined, boardId, teamId: teamId || undefined })
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="backdrop-blur-2xl bg-white/[0.17] border border-white/[0.22] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white/95">Новый эпик</h2>
          <button onClick={onClose} className="text-white/35 hover:text-white/70 text-xl leading-none transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Название</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="напр. Аутентификация пользователей" className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Описание <span className="text-white/30 font-normal">(необязательно)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Описание эпика…" className={`${inputCls} resize-none`} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Команда <span className="text-white/30 font-normal">(необязательно)</span></label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inputCls}>
              <option value="">— Назначить позже —</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </div>

          {mutation.isError && (
            <p className="text-red-300/80 text-sm bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
              Не удалось создать эпик. Попробуйте снова.
            </p>
          )}

          <div className="flex gap-3 justify-end mt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors">
              Отмена
            </button>
            <button type="submit" disabled={mutation.isPending}
              className="px-5 py-2 text-sm bg-violet-500/80 hover:bg-violet-500/95 text-white rounded-2xl font-medium disabled:opacity-50 transition-all border border-violet-400/30 shadow-[0_4px_16px_rgba(139,92,246,0.3)]">
              {mutation.isPending ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
