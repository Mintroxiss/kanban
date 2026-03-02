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
import ConfirmDialog from '../components/ConfirmDialog'
import type { Board } from '../types'

export default function BoardsListPage() {
  const logout = useAuthStore((s) => s.logout)
  const role = useAuthStore((s) => s.role)
  const teamId = useAuthStore((s) => s.teamId)
  const [showCreate, setShowCreate] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'archive' | 'delete'; board: Board } | null>(null)
  const [nameFilter, setNameFilter] = useState('')
  const [dirFilter, setDirFilter] = useState('')
  const [dirDropdownOpen, setDirDropdownOpen] = useState(false)
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()

  const isTeamMember = (role === 'DEVELOPER' || role === 'TEAM_LEAD') && !!teamId

  const { data: boards = [], isLoading, error } = useQuery({ queryKey: ['boards'], queryFn: getBoards })
  const { data: directions = [] } = useQuery({ queryKey: ['directions'], queryFn: getDirections })
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

  useEffect(() => { return subscribe('/topic/boards', handleBoardEvent) }, [subscribe, handleBoardEvent])

  const directionMap = useMemo(() => Object.fromEntries(directions.map((d) => [d.id, d.name])), [directions])
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

  const groups = useMemo<Array<{ label: string; boards: Board[] }>>(() => {
    const source = role === 'ADMIN' ? filteredBoards : boards
    if (!isTeamMember || !myDirectionId) return [{ label: '', boards: source }]
    const tier1: Board[] = [], tier2: Board[] = [], tier3: Board[] = []
    for (const board of source) {
      if (myTeamBoardIdSet.has(board.id)) tier1.push(board)
      else if (board.directionId === myDirectionId) tier2.push(board)
      else tier3.push(board)
    }
    return [
      { label: 'Мои эпики', boards: tier1 },
      { label: 'Моё направление', boards: tier2 },
      { label: 'Другие направления', boards: tier3 },
    ].filter((g) => g.boards.length > 0)
  }, [boards, filteredBoards, role, isTeamMember, myDirectionId, myTeamBoardIdSet])

  if (isLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center z-10">
        <p className="text-white/40 text-sm">Загрузка…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center gap-4 z-10">
        <p className="text-red-300/80">Не удалось загрузить доски.</p>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          Выйти
        </button>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen z-10">
      {openMenuId && <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.11] border-b border-white/[0.23] px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-white/95 shrink-0">Доски</h1>

        {role === 'ADMIN' && (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="search"
              placeholder="Поиск по названию…"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="flex-1 text-sm bg-white/[0.19] border border-white/[0.18] rounded-xl px-3 py-1.5 text-white/85 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50 transition-all"
            />
            <div className="relative">
              <button
                onClick={() => setDirDropdownOpen((v) => !v)}
                className="text-sm backdrop-blur-md bg-white/[0.19] border border-white/[0.18] rounded-xl px-3 py-1.5 text-white/85 hover:bg-white/[0.14] hover:border-indigo-400/50 focus:outline-none transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <span>{dirFilter ? (directions.find((d) => d.id === dirFilter)?.name ?? 'Все направления') : 'Все направления'}</span>
                <span className="text-white/30 text-xs">▾</span>
              </button>
              {dirDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDirDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 backdrop-blur-xl bg-white/[0.14] border border-white/[0.22] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 min-w-full w-max">
                    <button
                      onClick={() => { setDirFilter(''); setDirDropdownOpen(false) }}
                      className={`w-full text-left text-sm px-3 py-2 transition-colors ${!dirFilter ? 'text-indigo-300 font-medium bg-indigo-500/10' : 'text-white/70 hover:bg-white/[0.11] hover:text-white/90'}`}
                    >
                      Все направления
                    </button>
                    {directions.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { setDirFilter(d.id); setDirDropdownOpen(false) }}
                        className={`w-full text-left text-sm px-3 py-2 transition-colors ${dirFilter === d.id ? 'text-indigo-300 font-medium bg-indigo-500/10' : 'text-white/70 hover:bg-white/[0.11] hover:text-white/90'}`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          {(role === 'ADMIN' || role === 'TEAM_LEAD') && (
            <Link to="/teams" className="text-sm text-white/55 hover:text-white/85 transition-colors font-medium">
              Команды
            </Link>
          )}
          {role === 'ADMIN' && (
            <>
              <Link to="/boards/archived" className="text-sm text-white/55 hover:text-white/85 transition-colors font-medium">
                Архив
              </Link>
              <Link to="/directions" className="text-sm text-white/55 hover:text-white/85 transition-colors font-medium">
                Направления
              </Link>
              <Link to="/users" className="text-sm text-white/55 hover:text-white/85 transition-colors font-medium">
                Пользователи
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-4 py-1.5 rounded-xl font-medium transition-all border border-indigo-400/30 shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
              >
                + Новая доска
              </button>
            </>
          )}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="p-6 flex flex-col gap-8">
        {groups.every((g) => g.boards.length === 0) ? (
          <p className="text-white/35 text-sm">Доски не найдены.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label || 'all'}>
              {group.label && (
                <h2 className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-4">
                  {group.label}
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.boards.map((board) => (
                  <div key={board.id} className="relative group">
                    <Link
                      to={`/boards/${board.id}`}
                      className="block backdrop-blur-md bg-white/[0.11] border border-white/[0.23] rounded-2xl p-5 pr-10 hover:bg-white/[0.17] hover:border-white/[0.23] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-200"
                    >
                      <h2 className="font-semibold text-white/90">{board.name}</h2>
                      {directionMap[board.directionId] && (
                        <p className="text-xs text-white/40 mt-1">{directionMap[board.directionId]}</p>
                      )}
                    </Link>

                    {role === 'ADMIN' && (
                      <div className="absolute top-3 right-3 z-10">
                        <button
                          onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === board.id ? null : board.id) }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.17] transition-colors text-lg leading-none"
                        >
                          ···
                        </button>
                        {openMenuId === board.id && (
                          <div className="absolute right-0 mt-1 w-44 backdrop-blur-xl bg-white/[0.17] border border-white/[0.22] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 z-20">
                            <button
                              onClick={() => { setOpenMenuId(null); setConfirmAction({ type: 'archive', board }) }}
                              className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/[0.17] hover:text-white/95 transition-colors"
                            >
                              В архив
                            </button>
                            <button
                              onClick={() => { setOpenMenuId(null); setConfirmAction({ type: 'delete', board }) }}
                              className="w-full text-left px-3 py-2 text-sm text-red-300/80 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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

      {showLogoutConfirm && (
        <ConfirmDialog
          title="Выйти из аккаунта?"
          description="Вы будете перенаправлены на страницу входа."
          confirmLabel="Выйти"
          danger
          onConfirm={logout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.type === 'archive' ? `Архивировать доску «${confirmAction.board.name}»?` : `Удалить доску «${confirmAction.board.name}» навсегда?`}
          description={confirmAction.type === 'delete' ? 'Это действие необратимо.' : undefined}
          confirmLabel={confirmAction.type === 'archive' ? 'В архив' : 'Удалить'}
          danger={confirmAction.type === 'delete'}
          onConfirm={() => {
            if (confirmAction.type === 'archive') archiveMutation.mutate(confirmAction.board.id)
            else deleteMutation.mutate(confirmAction.board.id)
            setConfirmAction(null)
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
