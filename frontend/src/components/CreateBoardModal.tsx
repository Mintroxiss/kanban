import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDirections } from '../api/directions'
import { createBoard } from '../api/boards'
import GlassSelect from './GlassSelect'

interface Props { onClose: () => void }

export default function CreateBoardModal({ onClose }: Props) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [directionId, setDirectionId] = useState('')

  const { data: directions = [] } = useQuery({ queryKey: ['directions'], queryFn: getDirections })

  const mutation = useMutation({
    mutationFn: createBoard,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['boards'] }); onClose() },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !directionId) return
    mutation.mutate({ name: name.trim(), directionId })
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="backdrop-blur-2xl bg-white/[0.17] border border-white/[0.22] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white/95">Новая доска</h2>
          <button onClick={onClose} className="text-white/35 hover:text-white/70 text-xl leading-none transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/60">Название доски</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="напр. Разработка Q3"
              className="bg-white/[0.14] border border-white/[0.20] rounded-2xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 focus:bg-white/[0.11] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/60">Направление</label>
            <GlassSelect
              value={directionId}
              onChange={setDirectionId}
              placeholder="Выберите направление…"
              options={directions.map((d) => ({ value: d.id, label: d.name }))}
            />
          </div>

          {mutation.isError && (
            <p className="text-red-300/80 text-sm bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
              Не удалось создать доску. Попробуйте снова.
            </p>
          )}

          <div className="flex gap-3 justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white rounded-2xl font-medium disabled:opacity-50 transition-all border border-indigo-400/30 shadow-[0_4px_16px_rgba(99,102,241,0.3)]"
            >
              {mutation.isPending ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
