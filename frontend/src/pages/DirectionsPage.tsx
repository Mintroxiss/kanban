import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getDirections, createDirection, updateDirection, deleteDirection } from '../api/directions'
import type { Direction } from '../types'

const inputCls = 'bg-white/[0.14] border border-white/[0.20] rounded-2xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/35 focus:outline-none focus:border-indigo-400/50 transition-all'

export default function DirectionsPage() {
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [editingDir, setEditingDir] = useState<Direction | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (role !== 'ADMIN') return <Navigate to="/boards" replace />

  const { data: directions = [], isLoading } = useQuery({ queryKey: ['directions'], queryFn: getDirections })

  const createMutation = useMutation({
    mutationFn: () => createDirection(createName.trim(), createDesc.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directions'] })
      setShowCreate(false); setCreateName(''); setCreateDesc('')
    },
  })
  const updateMutation = useMutation({
    mutationFn: () => updateDirection(editingDir!.id, editName.trim(), editDesc.trim() || undefined),
    onSuccess: (updated) => {
      queryClient.setQueryData<Direction[]>(['directions'], (old = []) => old.map((d) => (d.id === updated.id ? updated : d)))
      queryClient.invalidateQueries({ queryKey: ['directions'] })
      setEditingDir(null)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDirection(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Direction[]>(['directions'], (old = []) => old.filter((d) => d.id !== id))
      setConfirmDeleteId(null)
    },
  })

  function startEdit(dir: Direction) {
    setEditingDir(dir); setEditName(dir.name); setEditDesc(dir.description ?? ''); setShowCreate(false)
  }

  return (
    <div className="relative min-h-screen z-10">
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.11] border-b border-white/[0.23] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/boards" className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors">← Доски</Link>
          <h1 className="text-lg font-semibold text-white/95">Направления</h1>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingDir(null) }}
          className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-4 py-2 rounded-xl font-medium transition-all border border-indigo-400/30 shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
        >
          + Новое направление
        </button>
      </header>

      <main className="p-6 max-w-2xl mx-auto flex flex-col gap-4">
        {showCreate && (
          <div className="backdrop-blur-md bg-white/[0.19] border border-indigo-400/20 rounded-2xl p-5">
            <h2 className="font-semibold text-white/90 mb-4">Новое направление</h2>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Название" value={createName} onChange={(e) => setCreateName(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Описание (необязательно)" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button
                  disabled={!createName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-40 transition-all border border-indigo-400/30"
                >
                  Создать
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateName(''); setCreateDesc('') }}
                  className="text-sm bg-white/[0.19] text-white/60 px-4 py-2 rounded-xl font-medium hover:bg-white/[0.19] transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-white/35 text-sm">Загрузка...</p>
        ) : directions.length === 0 ? (
          <div className="backdrop-blur-md bg-white/[0.05] border border-white/[0.09] rounded-2xl p-8 text-center">
            <p className="text-white/40">Направлений пока нет. Создайте первое.</p>
          </div>
        ) : (
          <div className="backdrop-blur-md bg-white/[0.05] border border-white/[0.09] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {directions.map((dir) => {
              const isEditing = editingDir?.id === dir.id
              return (
                <div key={dir.id}>
                  {isEditing ? (
                    <div className="px-5 py-4 bg-indigo-500/[0.06]">
                      <div className="flex flex-col gap-3">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                        <input type="text" placeholder="Описание (необязательно)" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className={inputCls} />
                        <div className="flex gap-2">
                          <button
                            disabled={!editName.trim() || updateMutation.isPending}
                            onClick={() => updateMutation.mutate()}
                            className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-40 transition-all border border-indigo-400/30"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingDir(null)}
                            className="text-sm bg-white/[0.19] text-white/60 px-4 py-2 rounded-xl font-medium hover:bg-white/[0.19] transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors">
                      <div>
                        <p className="font-medium text-white/88">{dir.name}</p>
                        {dir.description && <p className="text-sm text-white/40">{dir.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {confirmDeleteId === dir.id ? (
                          <>
                            <span className="text-xs text-white/50">Удалить?</span>
                            <button
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(dir.id)}
                              className="text-xs bg-red-500/70 text-white px-3 py-1.5 rounded-xl hover:bg-red-500/90 disabled:opacity-50 transition-colors"
                            >
                              Удалить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs bg-white/[0.14] text-white/60 px-3 py-1.5 rounded-xl hover:bg-white/[0.14] transition-colors"
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(dir)}
                              className="text-xs bg-white/[0.19] text-white/65 px-3 py-1.5 rounded-xl hover:bg-white/[0.13] transition-colors"
                            >
                              Изменить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(dir.id)}
                              className="text-xs bg-red-500/10 text-red-300/80 px-3 py-1.5 rounded-xl hover:bg-red-500/20 transition-colors"
                            >
                              Удалить
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
