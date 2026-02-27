import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getDirections } from '../api/directions'
import { getUserById } from '../api/users'
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamUsers,
  addUserToTeam,
  removeUserFromTeam,
  assignTeamLead,
  getAvailableUsers,
} from '../api/teams'
import type { Team, UserRole } from '../types'

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

function TeamMembersPanel({
  team,
  canManage,
}: {
  team: Team
  canManage: boolean
}) {
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

  if (isLoading) {
    return <p className="px-5 py-3 text-sm text-gray-400">Загрузка...</p>
  }

  return (
    <div className="px-5 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
      {members.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">Нет участников</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800">{member.fullName}</span>
                {member.id === team.teamLeadId ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    Тимлид команды
                  </span>
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
                      className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      Назначить тимлидом
                    </button>
                  )}
                  {confirmRemoveId === member.id ? (
                    <>
                      <button
                        onClick={() => removeMember.mutate(member.id)}
                        disabled={removeMember.isPending}
                        className="text-xs text-white bg-red-600 px-2.5 py-1 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={() => setConfirmRemoveId(null)}
                        className="text-xs bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-300"
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmRemoveId(member.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-1"
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
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          <select
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          >
            <option value="">Добавить участника...</option>
            {nonMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({ROLE_LABELS[u.role]})
              </option>
            ))}
          </select>
          <button
            disabled={!addUserId || addMember.isPending}
            onClick={() => addUserId && addMember.mutate(addUserId)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
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

  const { data: directions = [] } = useQuery({
    queryKey: ['directions'],
    queryFn: getDirections,
  })

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    enabled: isAdmin,
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
      setShowCreate(false)
      setSearch(name)
      setCreateName('')
      setCreateDirectionId('')
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => updateTeam(editingTeam!.id, editName.trim(), editDirectionId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Team[]>(['teams'], (old = []) =>
        old.map((t) => (t.id === updated.id ? updated : t)),
      )
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
    setEditingTeam(team)
    setEditName(team.name)
    setEditDirectionId(team.directionId)
    setShowCreate(false)
  }

  if (role === 'DEVELOPER') return <Navigate to="/boards" replace />

  // ── Представление тимлида: только его собственная команда ──────────────────
  if (role === 'TEAM_LEAD') {
    const loading = !myUser || (!!myUser.teamId && myTeamLoading)
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
          <Link to="/boards" className="text-sm text-blue-600 hover:underline">
            ← Доски
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Моя команда</h1>
        </header>
        <main className="p-6 max-w-2xl mx-auto">
          {loading ? (
            <p className="text-gray-400">Загрузка...</p>
          ) : !myUser?.teamId ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-500">Вы не состоите ни в одной команде</p>
            </div>
          ) : myTeam ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">{myTeam.name}</h2>
                <p className="text-sm text-gray-400">
                  Направление: {dirMap[myTeam.directionId] ?? myTeam.directionId}
                </p>
              </div>
              <TeamMembersPanel team={myTeam} canManage={true} />
            </div>
          ) : null}
        </main>
      </div>
    )
  }

  // ── Представление администратора: все команды с управлением ─────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-blue-600 hover:underline">
          ← Доски
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Команды</h1>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по названию…"
          className="ml-auto border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
        />
        <button
          onClick={() => {
            setShowCreate(true)
            setEditingTeam(null)
          }}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Новая команда
        </button>
      </header>

      <main className="p-6 max-w-3xl mx-auto flex flex-col gap-4">
        {showCreate && (
          <div className="bg-white rounded-xl border border-blue-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Новая команда</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Название команды"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={createDirectionId}
                onChange={(e) => setCreateDirectionId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите направление</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  disabled={!createName.trim() || !createDirectionId || createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  Создать
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false)
                    setCreateName('')
                    setCreateDirectionId('')
                  }}
                  className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {teamsLoading ? (
          <p className="text-gray-400">Загрузка...</p>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Команд пока нет. Создайте первую.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
              <p className="px-5 py-4 text-sm text-gray-400">Команды не найдены.</p>
            )}
            {teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).map((team) => {
              const isExpanded = expandedId === team.id
              const isEditing = editingTeam?.id === team.id

              return (
                <div key={team.id}>
                  {isEditing ? (
                    <div className="px-5 py-4 bg-blue-50">
                      <div className="flex flex-col gap-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={editDirectionId}
                          onChange={(e) => setEditDirectionId(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {directions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            disabled={!editName.trim() || !editDirectionId || updateMutation.isPending}
                            onClick={() => updateMutation.mutate()}
                            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingTeam(null)}
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
                        <p className="font-medium text-gray-800">{team.name}</p>
                        <p className="text-sm text-gray-400">
                          {dirMap[team.directionId] ?? '—'}
                          {team.teamLeadName && <> · Тимлид: {team.teamLeadName}</>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {confirmDeleteId === team.id ? (
                          <>
                            <span className="text-xs text-gray-600">Удалить команду?</span>
                            <button
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(team.id)}
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
                              onClick={() => setExpandedId(isExpanded ? null : team.id)}
                              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {isExpanded ? 'Скрыть ▲' : 'Участники ▼'}
                            </button>
                            <button
                              onClick={() => startEdit(team)}
                              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Изменить
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(team.id)}
                              className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              Удалить
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {isExpanded && (
                    <TeamMembersPanel team={team} canManage={true} />
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
