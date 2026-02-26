import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../api/users'
import type { UserRole } from '../types'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Администратор',
  TEAM_LEAD: 'Тимлид',
  DEVELOPER: 'Разработчик',
}

const ROLE_BADGE: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  TEAM_LEAD: 'bg-blue-100 text-blue-700',
  DEVELOPER: 'bg-gray-100 text-gray-600',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const filtered = search.trim()
    ? users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()))
    : users

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-blue-600 hover:underline">
          ← Доски
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Пользователи</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени…"
          className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
        />
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        {isLoading ? (
          <p className="text-gray-400">Загрузка…</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filtered.length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400">Пользователи не найдены.</p>
            )}
            {filtered.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800">{user.fullName}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>

                <div className="text-sm shrink-0">
                  {user.teamName ? (
                    <Link
                      to="/teams"
                      state={{ search: user.teamName }}
                      className="text-blue-600 hover:underline"
                    >
                      {user.teamName}
                    </Link>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>

                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
