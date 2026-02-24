import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUserRole } from '../api/users'
import type { User, UserRole } from '../types'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  TEAM_LEAD: 'Team Lead',
  DEVELOPER: 'Developer',
}

const ROLE_BADGE: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  TEAM_LEAD: 'bg-blue-100 text-blue-700',
  DEVELOPER: 'bg-gray-100 text-gray-600',
}

type Pending = {
  userId: string
  role: UserRole
  label: string
  action: 'promote' | 'demote'
}

type Toast = { id: number; message: string; action: 'promote' | 'demote' }

let toastCounter = 0

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<Pending | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  function showToast(message: string, action: 'promote' | 'demote') {
    const id = ++toastCounter
    setToasts((prev) => [...prev, { id, message, action }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const { mutate: changeRole, isPending } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      updateUserRole(id, role),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<User[]>(['users'], (old = []) =>
        old.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      )
      queryClient.invalidateQueries({ queryKey: ['users'] })
      if (pending) {
        const verb = pending.action === 'promote' ? 'promoted to Team Lead' : 'demoted to Developer'
        showToast(`${updatedUser.fullName} ${verb}`, pending.action)
      }
      setPending(null)
    },
  })

  function requestChange(userId: string, role: UserRole, action: 'promote' | 'demote', label: string) {
    setPending({ userId, role, action, label })
  }

  function confirm() {
    if (pending) changeRole({ id: pending.userId, role: pending.role })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-blue-600 hover:underline">
          ← Доски
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Пользователи</h1>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        {isLoading ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-800">{user.fullName}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>

                  {pending?.userId === user.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{pending.label}?</span>
                      <button
                        disabled={isPending}
                        onClick={confirm}
                        className={`text-xs text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          pending.action === 'promote'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        Подтвердить
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => setPending(null)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          pending.action === 'promote'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <>
                      {user.role === 'DEVELOPER' && (
                        <button
                          onClick={() => requestChange(user.id, 'TEAM_LEAD', 'promote', 'Повысить до тимлида')}
                          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          Повысить до тимлида
                        </button>
                      )}
                      {user.role === 'TEAM_LEAD' && (
                        <button
                          onClick={() => requestChange(user.id, 'DEVELOPER', 'demote', 'Понизить до разработчика')}
                          className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                          Понизить до разработчика
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all animate-in ${
              toast.action === 'promote' ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
