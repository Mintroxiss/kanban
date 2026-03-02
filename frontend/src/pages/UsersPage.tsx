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
  ADMIN: 'bg-purple-400/[0.15] text-purple-200 border border-purple-400/20',
  TEAM_LEAD: 'bg-blue-400/[0.15] text-blue-200 border border-blue-400/20',
  DEVELOPER: 'bg-slate-400/[0.12] text-slate-200 border border-slate-400/20',
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const filtered = search.trim()
    ? users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()))
    : users

  return (
    <div className="relative min-h-screen z-10">
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.11] border-b border-white/[0.23] px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors">← Доски</Link>
        <h1 className="text-lg font-semibold text-white/95">Пользователи</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени…"
          className="ml-auto bg-white/[0.19] border border-white/[0.18] rounded-xl px-3 py-1.5 text-sm text-white/85 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 transition-all w-56"
        />
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        {isLoading ? (
          <p className="text-white/35 text-sm">Загрузка…</p>
        ) : (
          <div className="backdrop-blur-md bg-white/[0.05] border border-white/[0.09] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {filtered.length === 0 && (
              <p className="px-5 py-4 text-sm text-white/35">Пользователи не найдены.</p>
            )}
            {filtered.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-4 gap-4 hover:bg-white/[0.04] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white/88">{user.fullName}</p>
                  <p className="text-sm text-white/40">{user.email}</p>
                </div>
                <div className="text-sm shrink-0">
                  {user.teamName ? (
                    <Link to="/teams" state={{ search: user.teamName }} className="text-indigo-300/80 hover:text-indigo-200 transition-colors">
                      {user.teamName}
                    </Link>
                  ) : (
                    <span className="text-white/25">—</span>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[user.role] ?? 'bg-slate-400/[0.12] text-slate-200'}`}>
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
