import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getDirections } from '../api/directions'
import { getUserById } from '../api/users'
import {
  getTeams, getTeamById, createTeam, updateTeam, deleteTeam,
  getTeamUsers, addUserToTeam, removeUserFromTeam, assignTeamLead, getAvailableUsers,
} from '../api/teams'
import type { Team, UserRole } from '../types'

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

const inputCls = 'bg-white/[0.14] border border-white/[0.20] rounded-2xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/35 focus:outline-none focus:border-indigo-400/50 transition-all'

function TeamMembersPanel({ team, canManage }: { team: Team; canManage: boolean }) {
  const queryClient = useQueryClient()
  const [addUserId, setAddUserId] = useState('')
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-users', team.id],
    queryFn: () => getTeamUsers(team.id),
  })
  const { data: nonMembers = [] } = useQuery({
    queryKey: ['available-users', team.id],
    queryFn: () => getAvailableUsers(team.id),
    enabled: canManage,
  })

  const addMember = useMutation({
    mutationFn: (userId: string) => addUserToTeam(team.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users', team.id] })
      queryClient.invalidateQueries({ queryKey: ['available-users', team.id] })
      setAddUserId('')
    },
  })
  const removeMember = useMutation({
    mutationFn: (userId: string) => removeUserFromTeam(team.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-users', team.id] })
      queryClient.invalidateQueries({ queryKey: ['available-users', team.id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setConfirmRemoveId(null)
    },
  })
  const setLead = useMutation({
    mutationFn: (userId: string) => assignTeamLead(team.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', team.id] })
      queryClient.invalidateQueries({ queryKey: ['team-users', team.id] })
    },
  })

  if (isLoading) return <p className="px-5 py-3 text-sm text-white/35">Загрузка...</p>

  return (
    <div className="px-5 pb-4 pt-3 bg-white/[0.03] border-t border-white/[0.06]">
      {members.length === 0 ? (
        <p className="text-sm text-white/35 py-2">Нет участников</p>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.05]">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white/85">{member.fullName}</span>
                {member.id === team.teamLeadId ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/[0.15] text-blue-200 border border-blue-400/20 font-medium">Тимлид</span>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[member.role]}`}>
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
              </div>
              {canManage && (
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {member.id !== team.teamLeadId && (
                    <button
                      onClick={() => setLead.mutate(member.id)}
                      disabled={setLead.isPending}
                      className="text-xs text-indigo-300/70 hover:text-indigo-200 disabled:opacity-50 transition-colors"
                    >
                      Назначить тимлидом
                    </button>
                  )}
                  {confirmRemoveId === member.id ? (
                    <>
                      <button
                        onClick={() => removeMember.mutate(member.id)}
                        disabled={removeMember.isPending}
                        className="text-xs bg-red-500/70 text-white px-2.5 py-1 rounded-xl hover:bg-red-500/90 disabled:opacity-50 transition-colors"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="text-xs bg-white/[0.14] text-white/60 px-2.5 py-1 rounded-xl hover:bg-white/[0.14] transition-colors"
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveId(member.id)}
                      className="text-xs text-red-300/60 hover:text-red-300 px-1 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {canManage && nonMembers.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            className="text-sm bg-white/[0.19] border border-white/[0.18] rounded-xl px-2.5 py-1.5 text-white/80 focus:outline-none focus:border-indigo-400/50 flex-1 transition-all"
          >
            <option value="">Добавить участника...</option>
            {nonMembers.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({ROLE_LABELS[u.role]})</option>)}
          </select>
          <button
            disabled={!addUserId || addMember.isPending}
            onClick={() => addUserId && addMember.mutate(addUserId)}
            className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-3 py-1.5 rounded-xl disabled:opacity-40 transition-all border border-indigo-400/30"
          >
            Добавить
          </button>
        </div>
      )}
    </div>
  )
}

export default function TeamsPage() {
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const location = useLocation()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState<string>((location.state as { search?: string })?.search ?? '')
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDirectionId, setCreateDirectionId] = useState('')
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editName, setEditName] = useState('')
  const [editDirectionId, setEditDirectionId] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const isAdmin = role === 'ADMIN'

  const { data: directions = [] } = useQuery({ queryKey: ['directions'], queryFn: getDirections })
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'], queryFn: getTeams, enabled: isAdmin,
  })
  const { data: myUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId!),
    enabled: role === 'TEAM_LEAD' && !!userId,
  })
  const { data: myTeam, isLoading: myTeamLoading } = useQuery({
    queryKey: ['team', myUser?.teamId],
    queryFn: () => getTeamById(myUser!.teamId!),
    enabled: role === 'TEAM_LEAD' && !!myUser?.teamId,
  })

  const dirMap = Object.fromEntries(directions.map((d) => [d.id, d.name]))

  const createMutation = useMutation({
    mutationFn: () => createTeam(createName.trim(), createDirectionId),
    onSuccess: () => {
      const name = createName.trim()
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setShowCreate(false); setSearch(name); setCreateName(''); setCreateDirectionId('')
    },
  })
  const updateMutation = useMutation({
    mutationFn: () => updateTeam(editingTeam!.id, editName.trim(), editDirectionId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Team[]>(['teams'], (old = []) => old.map((t) => (t.id === updated.id ? updated : t)))
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setEditingTeam(null)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Team[]>(['teams'], (old = []) => old.filter((t) => t.id !== id))
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setConfirmDeleteId(null)
      if (expandedId === id) setExpandedId(null)
    },
  })

  function startEdit(team: Team) {
    setEditingTeam(team); setEditName(team.name); setEditDirectionId(team.directionId); setShowCreate(false)
  }

  if (role === 'DEVELOPER') return <Navigate to="/boards" replace />

  // Team Lead view
  if (role === 'TEAM_LEAD') {
    const loading = !myUser || (!!myUser.teamId && myTeamLoading)
    return (
      <div className="relative min-h-screen z-10">
        <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.11] border-b border-white/[0.23] px-6 py-4 flex items-center gap-4">
          <Link to="/boards" className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors">← Доски</Link>
          <h1 className="text-lg font-semibold text-white/95">Моя команда</h1>
        </header>
        <main className="p-6 max-w-2xl mx-auto">
          {loading ? (
            <p className="text-white/35 text-sm">Загрузка...</p>
          ) : !myUser?.teamId ? (
            <div className="backdrop-blur-md bg-white/[0.05] border border-white/[0.09] rounded-2xl p-8 text-center">
              <p className="text-white/40">Вы не состоите ни в одной команде</p>
            </div>
          ) : myTeam ? (
            <div className="backdrop-blur-md bg-white/[0.05] border border-white/[0.09] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-bold text-white/90">{myTeam.name}</h2>
                <p className="text-sm text-white/40">Направление: {dirMap[myTeam.directionId] ?? myTeam.directionId}</p>
              </div>
              <TeamMembersPanel team={myTeam} canManage={true} />
            </div>
          ) : null}
        </main>
      </div>
    )
  }

  // Admin view
  return (
    <div className="relative min-h-screen z-10">
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.11] border-b border-white/[0.23] px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors">← Доски</Link>
        <h1 className="text-lg font-semibold text-white/95">Команды</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию…"
          className="ml-auto bg-white/[0.19] border border-white/[0.18] rounded-xl px-3 py-1.5 text-sm text-white/85 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 transition-all w-52"
        />
        <button
          onClick={() => { setShowCreate(true); setEditingTeam(null) }}
          className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-4 py-2 rounded-xl font-medium transition-all border border-indigo-400/30 shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
        >
          + Новая команда
        </button>
      </header>

      <main className="p-6 max-w-3xl mx-auto flex flex-col gap-4">
        {showCreate && (
          <div className="backdrop-blur-md bg-white/[0.19] border border-indigo-400/20 rounded-2xl p-5">
            <h2 className="font-semibold text-white/90 mb-4">Новая команда</h2>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Название команды" value={createName} onChange={(e) => setCreateName(e.target.value)} className={inputCls} />
              <select value={createDirectionId} onChange={(e) => setCreateDirectionId(e.target.value)} className={inputCls}>
                <option value="">Выберите направление</option>
                {directions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button
                  disabled={!createName.trim() || !createDirectionId || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-40 transition-all border border-indigo-400/30"
                >
                  Создать
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateName(''); setCreateDirectionId('') }}
                  className="text-sm bg-white/[0.19] text-white/60 px-4 py-2 rounded-xl font-medium hover:bg-white/[0.19] transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {teamsLoading ? (
          <p className="text-white/35 text-sm">Загрузка...</p>
        ) : teams.length === 0 ? (
          <div className="backdrop-blur-md bg-white/[0.05] border border-white/[0.09] rounded-2xl p-8 text-center">
            <p className="text-white/40">Команд пока нет. Создайте первую.</p>
          </div>
        ) : (
          <div className="backdrop-blur-md bg-white/[0.05] border border-white/[0.09] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
            {teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <p className="px-5 py-4 text-sm text-white/35">Команды не найдены.</p>
            )}
            {teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).map((team) => {
              const isExpanded = expandedId === team.id
              const isEditing = editingTeam?.id === team.id
              return (
                <div key={team.id}>
                  {isEditing ? (
                    <div className="px-5 py-4 bg-indigo-500/[0.06]">
                      <div className="flex flex-col gap-3">
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                        <select value={editDirectionId} onChange={(e) => setEditDirectionId(e.target.value)} className={inputCls}>
                          {directions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <div className="flex gap-2">
                          <button
                            disabled={!editName.trim() || !editDirectionId || updateMutation.isPending}
                            onClick={() => updateMutation.mutate()}
                            className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-4 py-2 rounded-xl font-medium disabled:opacity-40 transition-all border border-indigo-400/30"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingTeam(null)}
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
                        <p className="font-medium text-white/88">{team.name}</p>
                        <p className="text-sm text-white/40">
                          {dirMap[team.directionId] ?? '—'}
                          {team.teamLeadName && <> · Тимлид: {team.teamLeadName}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {confirmDeleteId === team.id ? (
                          <>
                            <span className="text-xs text-white/50">Удалить команду?</span>
                            <button
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(team.id)}
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
                              onClick={() => setExpandedId(isExpanded ? null : team.id)}
                              className="text-xs bg-white/[0.19] text-white/60 px-3 py-1.5 rounded-xl hover:bg-white/[0.13] transition-colors"
                            >
                              {isExpanded ? 'Скрыть ▲' : 'Участники ▼'}
                            </button>
                            <button
                              onClick={() => startEdit(team)}
                              className="text-xs bg-white/[0.19] text-white/60 px-3 py-1.5 rounded-xl hover:bg-white/[0.13] transition-colors"
                            >
                              Изменить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(team.id)}
                              className="text-xs bg-red-500/10 text-red-300/80 px-3 py-1.5 rounded-xl hover:bg-red-500/20 transition-colors"
                            >
                              Удалить
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {isExpanded && <TeamMembersPanel team={team} canManage={true} />}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
