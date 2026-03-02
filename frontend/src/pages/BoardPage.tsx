import { useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getGroupedTasks, getBoard, updateBoard } from '../api/boards'
import { getColumns } from '../api/columns'
import { getEpicsByBoard, claimEpic, archiveEpic, deleteEpic, updateEpic } from '../api/epics'
import { getTeams } from '../api/teams'
import { useBoardSocket } from '../hooks/useBoardSocket'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import BoardView from '../components/Board/BoardView'
import CreateEpicModal from '../components/CreateEpicModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Board, BoardEvent, Column, Epic, Task } from '../types'

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = useAuthStore((s) => s.role)
  const teamId = useAuthStore((s) => s.teamId)
  const userId = useAuthStore((s) => s.userId)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const { subscribe } = useWebSocket()
  const [selectedEpicId, setSelectedEpicId] = useState<string>('')
  const [epicDropdownOpen, setEpicDropdownOpen] = useState(false)
  const [showCreateEpic, setShowCreateEpic] = useState(false)
  const [confirmEpicAction, setConfirmEpicAction] = useState<{ type: 'archive' | 'delete'; epicId: string; title: string } | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [epicPopoverOpen, setEpicPopoverOpen] = useState(false)
  const [epicTooltipVisible, setEpicTooltipVisible] = useState(false)
  const [editingEpic, setEditingEpic] = useState<{ title: string; description: string } | null>(null)
  const epicPopoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return subscribe('/topic/boards', (body) => {
      const event = body as BoardEvent
      if (event.type === 'BOARD_UPDATED') {
        const updated = event.payload as Board
        if (updated.id === boardId) {
          queryClient.setQueryData(['board', boardId], updated)
          queryClient.invalidateQueries({ queryKey: ['boards'] })
        }
      }
    })
  }, [subscribe, boardId, queryClient])

  useEffect(() => {
    if (!epicPopoverOpen) return
    function handle(e: MouseEvent) {
      if (epicPopoverRef.current && !epicPopoverRef.current.contains(e.target as Node)) {
        setEpicPopoverOpen(false)
        setEditingEpic(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [epicPopoverOpen])

  const updateEpicMutation = useMutation({
    mutationFn: ({ id, title, description }: { id: string; title: string; description: string }) =>
      updateEpic(id, { title, description, boardId: boardId!, teamId: selectedEpic?.teamId }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
        old.map((e) => (e.id === updated.id ? updated : e))
      )
      setEpicPopoverOpen(false)
      setEditingEpic(null)
    },
  })

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateBoard(boardId!, { name, directionId: board!.directionId }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['board', boardId], updated)
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      setEditingName(null)
    },
  })

  function submitRename() {
    const name = editingName?.trim()
    if (!name || name === board?.name) { setEditingName(null); return }
    renameMutation.mutate(name)
  }

  const { data: board, isError: boardError } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoard(boardId!),
    enabled: !!boardId,
    retry: 1,
  })

  useEffect(() => {
    if (boardError || (board?.archived && role !== 'ADMIN')) navigate('/boards', { replace: true })
  }, [boardError, board, role, navigate])

  const { data: groupedTasks = {}, isLoading: loadingTasks } = useQuery({
    queryKey: ['grouped-tasks', boardId, selectedEpicId || undefined],
    queryFn: () => getGroupedTasks(boardId!, selectedEpicId || undefined),
    enabled: !!boardId,
  })
  const { data: columns = [], isLoading: loadingColumns } = useQuery({
    queryKey: ['columns', boardId],
    queryFn: () => getColumns(boardId!),
    enabled: !!boardId,
  })
  const { data: epics = [], isLoading: loadingEpics } = useQuery({
    queryKey: ['epics', boardId],
    queryFn: () => getEpicsByBoard(boardId!),
    enabled: !!boardId,
  })
  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: getTeams })

  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t.name])), [teams])

  const epicTeamNameMap = useMemo(
    () => !selectedEpicId
      ? Object.fromEntries(epics.filter((e) => e.teamId && teamMap[e.teamId]).map((e) => [e.id, teamMap[e.teamId!]]))
      : {},
    [epics, teamMap, selectedEpicId]
  )

  const claimMutation = useMutation({
    mutationFn: (epicId: string) => claimEpic(epicId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['epics', boardId] }),
    onError: () => addNotification('Не удалось взять эпик. Убедитесь, что ваша команда принадлежит тому же направлению.'),
  })

  const archiveEpicMutation = useMutation({
    mutationFn: (epicId: string) => archiveEpic(epicId),
    onSuccess: (_, epicId) => {
      queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) => old.filter((e) => e.id !== epicId))
      if (selectedEpicId === epicId) setSelectedEpicId('')
      queryClient.invalidateQueries({ queryKey: ['epics-archived', boardId] })
    },
  })

  const deleteEpicMutation = useMutation({
    mutationFn: (epicId: string) => deleteEpic(epicId),
    onSuccess: (_, epicId) => {
      queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) => old.filter((e) => e.id !== epicId))
      if (selectedEpicId === epicId) setSelectedEpicId('')
    },
  })

  const handleEvent = useCallback(
    (event: BoardEvent) => {
      const { type, payload } = event
      if (type === 'BOARD_ARCHIVED' || type === 'BOARD_DELETED') {
        addNotification(type === 'BOARD_DELETED' ? 'Доска была удалена администратором' : 'Доска была архивирована администратором')
        queryClient.invalidateQueries({ queryKey: ['boards'] })
        navigate('/boards')
        return
      }
      if (type === 'EPIC_CREATED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) => old.some((e) => e.id === epic.id) ? old : [...old, epic])
        if (role === 'TEAM_LEAD' && !epic.teamId) addNotification(`Новый эпик "${epic.title}" доступен для взятия в работу`)
        return
      }
      if (type === 'EPIC_UPDATED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) => old.map((e) => (e.id === epic.id ? epic : e)))
        return
      }
      if (type === 'EPIC_DELETED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) => old.filter((e) => e.id !== epic.id))
        queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
        return
      }
      if (type === 'EPIC_ARCHIVED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) => old.filter((e) => e.id !== epic.id))
        if (selectedEpicId === epic.id) setSelectedEpicId('')
        queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
        return
      }
      if (type === 'EPIC_RESTORED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) => old.some((e) => e.id === epic.id) ? old : [...old, epic])
        queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
        return
      }
      if (type === 'COLUMN_CREATED') {
        const col = payload as Column
        queryClient.setQueryData<Column[]>(['columns', boardId], (old = []) => old.some((c) => c.id === col.id) ? old : [...old, col])
        return
      }
      if (type === 'COLUMN_UPDATED') {
        const col = payload as Column
        queryClient.setQueryData<Column[]>(['columns', boardId], (old = []) => old.map((c) => (c.id === col.id ? col : c)))
        return
      }
      if (type === 'COLUMN_DELETED') {
        const col = payload as Column
        queryClient.setQueryData<Column[]>(['columns', boardId], (old = []) => old.filter((c) => c.id !== col.id))
        return
      }
      const task = payload as Task
      queryClient.setQueryData<Record<string, Task[]>>(
        ['grouped-tasks', boardId, selectedEpicId || undefined],
        (old = {}) => {
          const next: Record<string, Task[]> = {}
          for (const [colId, tasks] of Object.entries(old)) {
            next[colId] = tasks.filter((t) => t.id !== task.id)
          }
          if (type !== 'TASK_DELETED') {
            if (!selectedEpicId || task.epicId === selectedEpicId) {
              const colId = task.columnId ?? '__unassigned__'
              next[colId] = [...(next[colId] ?? []), task]
            }
          }
          return next
        }
      )
    },
    [boardId, queryClient, selectedEpicId, addNotification, navigate]
  )

  useBoardSocket(boardId ?? '', handleEvent)

  const isLoading = loadingTasks || loadingColumns || loadingEpics
  const isAdmin = role === 'ADMIN'
  const selectedEpic: Epic | undefined = epics.find((e) => e.id === selectedEpicId)

  useEffect(() => {
    if (selectedEpicId && !loadingEpics && !epics.some((e) => e.id === selectedEpicId)) setSelectedEpicId('')
  }, [epics, selectedEpicId, loadingEpics])

  useEffect(() => {
    setEpicPopoverOpen(false)
    setEditingEpic(null)
    setEpicTooltipVisible(false)
  }, [selectedEpicId])

  const canClaimEpic = role === 'TEAM_LEAD' && !!selectedEpicId && selectedEpic != null && selectedEpic.teamId == null

  return (
    <div className="relative min-h-screen flex flex-col z-10">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.06] border-b border-white/[0.10] px-6 py-4 flex items-center gap-4 flex-wrap">
        <Link
          to={board?.archived ? '/boards/archived' : '/boards'}
          className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors"
        >
          ← {board?.archived ? 'Архив' : 'Доски'}
        </Link>

        {isAdmin && editingName !== null ? (
          <input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setEditingName(null) }}
            disabled={renameMutation.isPending}
            className="text-lg font-semibold text-white/95 mr-auto bg-transparent border-b-2 border-indigo-400/70 outline-none px-0"
          />
        ) : (
          <h1
            className={`text-lg font-semibold text-white/95 mr-auto ${isAdmin ? 'cursor-pointer hover:text-indigo-200 transition-colors' : ''}`}
            onClick={() => isAdmin && setEditingName(board?.name ?? '')}
            title={isAdmin ? 'Нажмите для редактирования' : undefined}
          >
            {board?.name ?? '…'}
          </h1>
        )}

        {!loadingEpics && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-white/40">Эпик:</label>
            <div className="relative">
              <button
                onClick={() => setEpicDropdownOpen((v) => !v)}
                className="backdrop-blur-md bg-white/[0.07] border border-white/[0.12] rounded-xl px-3 py-1.5 text-sm text-white/80 hover:bg-white/[0.11] hover:border-white/[0.18] focus:outline-none transition-all flex items-center gap-2 min-w-[140px]"
              >
                <span className="flex-1 text-left">
                  {selectedEpicId ? (epics.find((e) => e.id === selectedEpicId)?.title ?? 'Все эпики') : 'Все эпики'}
                </span>
                <span className="text-white/30 text-xs">▾</span>
              </button>

              {epicDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setEpicDropdownOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-20 backdrop-blur-xl bg-white/[0.10] border border-white/[0.15] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 min-w-full w-max max-w-xs">
                    <button
                      onClick={() => { setSelectedEpicId(''); setEpicDropdownOpen(false) }}
                      className={`w-full text-left text-sm px-3 py-2 transition-colors rounded-lg mx-0.5 ${!selectedEpicId ? 'text-indigo-300 font-medium bg-indigo-500/10' : 'text-white/70 hover:bg-white/[0.08] hover:text-white/90'}`}
                    >
                      Все эпики
                    </button>
                    {epics.map((epic) => (
                      <button
                        key={epic.id}
                        onClick={() => { setSelectedEpicId(epic.id); setEpicDropdownOpen(false) }}
                        className={`w-full text-left text-sm px-3 py-2 transition-colors rounded-lg mx-0.5 ${selectedEpicId === epic.id ? 'text-indigo-300 font-medium bg-indigo-500/10' : 'text-white/70 hover:bg-white/[0.08] hover:text-white/90'}`}
                      >
                        {epic.title}
                        {epic.teamId
                          ? teamMap[epic.teamId] ? <span className="text-white/35"> — {teamMap[epic.teamId]}</span> : null
                          : <span className="text-white/35"> (без команды)</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {selectedEpicId && selectedEpic && (
              <div className="relative" ref={epicPopoverRef}>
                <div
                  onMouseEnter={() => !epicPopoverOpen && setEpicTooltipVisible(true)}
                  onMouseLeave={() => setEpicTooltipVisible(false)}
                  className="relative inline-block"
                >
                  <button
                    onClick={() => {
                      if (isAdmin) {
                        setEditingEpic({ title: selectedEpic.title, description: selectedEpic.description ?? '' })
                        setEpicPopoverOpen(true)
                        setEpicTooltipVisible(false)
                      }
                    }}
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isAdmin ? 'text-white/30 hover:text-indigo-300 hover:bg-indigo-500/20 cursor-pointer' : 'text-white/30 cursor-default'}`}
                  >
                    ℹ
                  </button>

                  {epicTooltipVisible && !epicPopoverOpen && (
                    <div className="absolute right-0 top-full z-30 pt-1">
                      <div className="backdrop-blur-xl bg-black/70 border border-white/[0.10] text-white/80 text-xs rounded-xl px-3 py-2 w-64 max-h-40 overflow-y-auto shadow-xl break-words whitespace-pre-wrap">
                        {selectedEpic.description ? selectedEpic.description : isAdmin ? 'Нажмите для добавления описания' : 'Нет описания'}
                      </div>
                    </div>
                  )}
                </div>

                {epicPopoverOpen && editingEpic && (
                  <div className="absolute left-0 top-full mt-2 z-30 backdrop-blur-2xl bg-white/[0.10] border border-white/[0.15] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] p-4 w-80">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-3">Редактирование эпика</p>
                    <input
                      className="w-full bg-white/[0.08] border border-white/[0.14] rounded-xl px-3 py-2 text-sm text-white/90 placeholder:text-white/30 mb-2 outline-none focus:border-indigo-400/50 transition-all"
                      value={editingEpic.title}
                      onChange={(e) => setEditingEpic({ ...editingEpic, title: e.target.value })}
                      placeholder="Название"
                    />
                    <textarea
                      className="w-full bg-white/[0.08] border border-white/[0.14] rounded-xl px-3 py-2 text-sm text-white/90 placeholder:text-white/30 resize-none outline-none focus:border-indigo-400/50 transition-all"
                      rows={3}
                      value={editingEpic.description}
                      onChange={(e) => setEditingEpic({ ...editingEpic, description: e.target.value })}
                      placeholder="Описание (необязательно)"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => { setEpicPopoverOpen(false); setEditingEpic(null) }}
                        className="text-sm text-white/50 hover:text-white/80 px-3 py-1.5 rounded-xl hover:bg-white/[0.08] transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        disabled={!editingEpic.title.trim() || updateEpicMutation.isPending}
                        onClick={() => updateEpicMutation.mutate({ id: selectedEpicId, ...editingEpic })}
                        className="text-sm bg-indigo-500/80 hover:bg-indigo-500/95 text-white px-3 py-1.5 rounded-xl font-medium disabled:opacity-50 transition-all border border-indigo-400/30"
                      >
                        {updateEpicMutation.isPending ? 'Сохранение…' : 'Сохранить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedEpic?.teamId && teamMap[selectedEpic.teamId] && (
              <span className="text-xs bg-blue-400/15 text-blue-200 border border-blue-400/20 px-2 py-0.5 rounded-full">
                {teamMap[selectedEpic.teamId]}
              </span>
            )}

            {canClaimEpic && (
              <button
                disabled={claimMutation.isPending}
                onClick={() => claimMutation.mutate(selectedEpicId)}
                className="text-sm bg-emerald-500/70 hover:bg-emerald-500/90 text-white px-3 py-1.5 rounded-xl font-medium disabled:opacity-50 transition-all border border-emerald-400/30"
              >
                {claimMutation.isPending ? '…' : 'Взять эпик'}
              </button>
            )}

            {isAdmin && selectedEpicId && (
              <div className="flex items-center gap-1 border-l border-white/[0.10] pl-2">
                <button
                  disabled={archiveEpicMutation.isPending}
                  onClick={() => setConfirmEpicAction({ type: 'archive', epicId: selectedEpicId, title: selectedEpic?.title ?? '' })}
                  className="text-xs text-amber-300/70 hover:text-amber-200 hover:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-400/20 transition-colors disabled:opacity-50"
                >
                  Архивировать
                </button>
                <button
                  disabled={deleteEpicMutation.isPending}
                  onClick={() => setConfirmEpicAction({ type: 'delete', epicId: selectedEpicId, title: selectedEpic?.title ?? '' })}
                  className="text-xs text-red-300/70 hover:text-red-200 hover:bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-400/20 transition-colors disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link
              to={`/boards/${boardId}/epics/archived`}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Архив эпиков →
            </Link>
            <button
              onClick={() => setShowCreateEpic(true)}
              className="text-sm bg-violet-500/70 hover:bg-violet-500/90 text-white px-4 py-1.5 rounded-xl font-medium transition-all border border-violet-400/30 shadow-[0_2px_12px_rgba(139,92,246,0.25)]"
            >
              + Новый эпик
            </button>
          </div>
        )}
      </header>

      <main className="p-6 flex-1">
        {isLoading ? (
          <p className="text-white/35 text-sm">Загрузка…</p>
        ) : (
          <BoardView
            boardId={boardId!}
            columns={columns}
            groupedTasks={groupedTasks}
            epics={epics}
            selectedEpicId={selectedEpicId}
            canManage={isAdmin}
            isAdmin={isAdmin}
            teamId={teamId ?? undefined}
            role={role ?? undefined}
            userId={userId ?? undefined}
            epicTeamNameMap={epicTeamNameMap}
          />
        )}
      </main>

      {showCreateEpic && boardId && (
        <CreateEpicModal boardId={boardId} onClose={() => setShowCreateEpic(false)} />
      )}

      {confirmEpicAction && (
        <ConfirmDialog
          title={confirmEpicAction.type === 'archive' ? `Архивировать эпик «${confirmEpicAction.title}»?` : `Удалить эпик «${confirmEpicAction.title}» навсегда?`}
          description={confirmEpicAction.type === 'delete' ? 'Все задачи эпика будут удалены безвозвратно.' : undefined}
          confirmLabel={confirmEpicAction.type === 'archive' ? 'В архив' : 'Удалить'}
          danger={confirmEpicAction.type === 'delete'}
          onConfirm={() => {
            if (confirmEpicAction.type === 'archive') archiveEpicMutation.mutate(confirmEpicAction.epicId)
            else deleteEpicMutation.mutate(confirmEpicAction.epicId)
            setConfirmEpicAction(null)
          }}
          onCancel={() => setConfirmEpicAction(null)}
        />
      )}
    </div>
  )
}
