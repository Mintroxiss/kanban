import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getBoards, archiveBoard, deleteBoard } from '../api/boards'
import { getDirections } from '../api/directions'
import { getTeamById } from '../api/teams'
import { getMyTeamBoardIds } from '../api/epics'
import { useAuthStore } from '../store/authStore'
import { useWebSocket } from '../hooks/useWebSocket'
import CreateBoardModal from '../components/CreateBoardModal'
import type { Board } from '../types'

export default function BoardsListPage() {
  const logout = useAuthStore((s) => s.logout)
  const role = useAuthStore((s) => s.role)
  const teamId = useAuthStore((s) => s.teamId)
  const [showCreate, setShowCreate] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [nameFilter, setNameFilter] = useState('')
  const [dirFilter, setDirFilter] = useState('')
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()

  const isTeamMember = (role === 'DEVELOPER' || role === 'TEAM_LEAD') && !!teamId

  const { data: boards = [], isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

  const { data: directions = [] } = useQuery({
    queryKey: ['directions'],
    queryFn: getDirections,
  })

  const { data: myTeam } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeamById(teamId!),
    enabled: isTeamMember,
  })

  const { data: myTeamBoardIds = [] } = useQuery({
    queryKey: ['my-team-board-ids', teamId],
    queryFn: () => getMyTeamBoardIds(teamId!),
    enabled: isTeamMember,
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveBoard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      queryClient.invalidateQueries({ queryKey: ['boards-archived'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBoard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      queryClient.invalidateQueries({ queryKey: ['boards-archived'] })
    },
  })

  const handleBoardEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['boards'] })
    queryClient.invalidateQueries({ queryKey: ['boards-archived'] })
    queryClient.invalidateQueries({ queryKey: ['my-team-board-ids', teamId] })
  }, [queryClient, teamId])

  useEffect(() => {
    return subscribe('/topic/boards', handleBoardEvent)
  }, [subscribe, handleBoardEvent])

  const directionMap = useMemo(
    () => Object.fromEntries(directions.map((d) => [d.id, d.name])),
    [directions]
  )

  const myDirectionId = myTeam?.directionId
  const myTeamBoardIdSet = useMemo(() => new Set(myTeamBoardIds), [myTeamBoardIds])

  const filteredBoards = useMemo(() => {
    if (role !== 'ADMIN') return boards
    return boards.filter((b) => {
      const matchesName = !nameFilter || b.name.toLowerCase().includes(nameFilter.toLowerCase())
      const matchesDir = !dirFilter || b.directionId === dirFilter
      return matchesName && matchesDir
    })
  }, [boards, role, nameFilter, dirFilter])

  // Для тимлида и разраба — 3 группы, для остальных — плоский список
  const groups = useMemo<Array<{ label: string; boards: Board[] }>>(() => {
    const source = role === 'ADMIN' ? filteredBoards : boards
    if (!isTeamMember || !myDirectionId) {
      return [{ label: '', boards: source }]
    }
    const tier1: Board[] = []
    const tier2: Board[] = []
    const tier3: Board[] = []
    for (const board of source) {
      if (myTeamBoardIdSet.has(board.id)) {
        tier1.push(board)
      } else if (board.directionId === myDirectionId) {
        tier2.push(board)
      } else {
        tier3.push(board)
      }
    }
    return [
      { label: 'Мои эпики', boards: tier1 },
      { label: 'Моё направление', boards: tier2 },
      { label: 'Другие направления', boards: tier3 },
    ].filter((g) => g.boards.length > 0)
  }, [boards, filteredBoards, role, isTeamMember, myDirectionId, myTeamBoardIdSet])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Загрузка…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">Не удалось загрузить доски.</p>
        <button
          onClick={() => { if (confirm('Выйти из аккаунта?')) logout() }}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Выйти
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {openMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-gray-800 shrink-0">Доски</h1>
        {role === 'ADMIN' && (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="search"
              placeholder="Поиск по названию…"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={dirFilter}
              onChange={(e) => setDirFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="">Все направления</option>
              {directions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {(role === 'ADMIN' || role === 'TEAM_LEAD') && (
            <Link
              to="/teams"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Команды
            </Link>
          )}
          {role === 'ADMIN' && (
            <>
              <Link
                to="/boards/archived"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Архив
              </Link>
              <Link
                to="/directions"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Направления
              </Link>
              <Link
                to="/users"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Пользователи
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Новая доска
              </button>
            </>
          )}
          <button
            onClick={() => { if (confirm('Выйти из аккаунта?')) logout() }}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="p-6 flex flex-col gap-6">
        {groups.every((g) => g.boards.length === 0) ? (
          <p className="text-gray-400">Доски не найдены.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label || 'all'}>
              {group.label && (
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  {group.label}
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.boards.map((board) => (
                  <div key={board.id} className="relative">
                    <Link
                      to={`/boards/${board.id}`}
                      className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 pr-10 hover:shadow-md transition-shadow"
                    >
                      <h2 className="font-semibold text-gray-800">{board.name}</h2>
                      {directionMap[board.directionId] && (
                        <p className="text-xs text-gray-400 mt-1">
                          {directionMap[board.directionId]}
                        </p>
                      )}
                    </Link>

                    {role === 'ADMIN' && (
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            setOpenMenuId(openMenuId === board.id ? null : board.id)
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-lg leading-none"
                          title="Действия"
                        >
                          ···
                        </button>

                        {openMenuId === board.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                if (confirm(`Архивировать доску «${board.name}»?`)) {
                                  archiveMutation.mutate(board.id)
                                }
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              В архив
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null)
                                if (confirm(`Удалить доску «${board.name}» навсегда? Это действие необратимо.`)) {
                                  deleteMutation.mutate(board.id)
                                }
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Удалить навсегда
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
