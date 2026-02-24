import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getDirections, createDirection, updateDirection, deleteDirection } from '../api/directions'
import type { Direction } from '../types'

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

  const { data: directions = [], isLoading } = useQuery({
    queryKey: ['directions'],
    queryFn: getDirections,
  })

  const createMutation = useMutation({
    mutationFn: () => createDirection(createName.trim(), createDesc.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directions'] })
      setShowCreate(false)
      setCreateName('')
      setCreateDesc('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateDirection(editingDir!.id, editName.trim(), editDesc.trim() || undefined),
    onSuccess: (updated) => {
      queryClient.setQueryData<Direction[]>(['directions'], (old = []) =>
        old.map((d) => (d.id === updated.id ? updated : d)),
      )
      queryClient.invalidateQueries({ queryKey: ['directions'] })
      setEditingDir(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDirection(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Direction[]>(['directions'], (old = []) =>
        old.filter((d) => d.id !== id),
      )
      setConfirmDeleteId(null)
    },
  })

  function startEdit(dir: Direction) {
    setEditingDir(dir)
    setEditName(dir.name)
    setEditDesc(dir.description ?? '')
    setShowCreate(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/boards" className="text-sm text-blue-600 hover:underline">
            ← Доски
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Направления</h1>
        </div>
        <button
          onClick={() => {
            setShowCreate(true)
            setEditingDir(null)
          }}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Новое направление
        </button>
      </header>

      <main className="p-6 max-w-2xl mx-auto flex flex-col gap-4">
        {showCreate && (
          <div className="bg-white rounded-xl border border-blue-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Новое направление</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Название"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Описание (необязательно)"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  disabled={!createName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  Создать
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false)
                    setCreateName('')
                    setCreateDesc('')
                  }}
                  className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-400">Загрузка...</p>
        ) : directions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Направлений пока нет. Создайте первое.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {directions.map((dir) => {
              const isEditing = editingDir?.id === dir.id

              return (
                <div key={dir.id}>
                  {isEditing ? (
                    <div className="px-5 py-4 bg-blue-50">
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Описание (необязательно)"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={!editName.trim() || updateMutation.isPending}
                            onClick={() => updateMutation.mutate()}
                            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingDir(null)}
                            className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{dir.name}</p>
                        {dir.description && (
                          <p className="text-sm text-gray-400">{dir.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {confirmDeleteId === dir.id ? (
                          <>
                            <span className="text-xs text-gray-600">Удалить направление?</span>
                            <button
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(dir.id)}
                              className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                              Удалить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300"
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(dir)}
                              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Изменить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(dir.id)}
                              className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
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
