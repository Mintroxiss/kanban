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
    mutationFn: (name: string) =>
      updateBoard(boardId!, { name, directionId: board!.directionId }),
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

  // Fallback redirect: board deleted (404), or board archived for non-admins
  useEffect(() => {
    if (boardError || (board?.archived && role !== 'ADMIN')) {
      navigate('/boards', { replace: true })
    }
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

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  })

  // teamId → name для отображения
  const teamMap = useMemo(
    () => Object.fromEntries(teams.map((t) => [t.id, t.name])),
    [teams]
  )

  // epicId → teamName (только в режиме "all epics")
  const epicTeamNameMap = useMemo(
    () =>
      !selectedEpicId
        ? Object.fromEntries(
            epics
              .filter((e) => e.teamId && teamMap[e.teamId])
              .map((e) => [e.id, teamMap[e.teamId!]])
          )
        : {},
    [epics, teamMap, selectedEpicId]
  )

  const claimMutation = useMutation({
    mutationFn: (epicId: string) => claimEpic(epicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epics', boardId] })
    },
    onError: () => {
      addNotification(
        'Не удалось взять эпик. Убедитесь, что ваша команда принадлежит тому же направлению.'
      )
    },
  })

  const archiveEpicMutation = useMutation({
    mutationFn: (epicId: string) => archiveEpic(epicId),
    onSuccess: (_, epicId) => {
      queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
        old.filter((e) => e.id !== epicId)
      )
      if (selectedEpicId === epicId) setSelectedEpicId('')
      queryClient.invalidateQueries({ queryKey: ['epics-archived', boardId] })
    },
  })

  const deleteEpicMutation = useMutation({
    mutationFn: (epicId: string) => deleteEpic(epicId),
    onSuccess: (_, epicId) => {
      queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
        old.filter((e) => e.id !== epicId)
      )
      if (selectedEpicId === epicId) setSelectedEpicId('')
    },
  })

  const handleEvent = useCallback(
    (event: BoardEvent) => {
      const { type, payload } = event

      // --- Доска удалена / заархивирована ---
      if (type === 'BOARD_ARCHIVED' || type === 'BOARD_DELETED') {
        addNotification(
          type === 'BOARD_DELETED'
            ? 'Доска была удалена администратором'
            : 'Доска была архивирована администратором'
        )
        queryClient.invalidateQueries({ queryKey: ['boards'] })
        navigate('/boards')
        return
      }

      // --- Эпики: прямое обновление кэша без сетевого запроса ---
      if (type === 'EPIC_CREATED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
          old.some((e) => e.id === epic.id) ? old : [...old, epic]
        )
        if (role === 'TEAM_LEAD' && !epic.teamId) {
          addNotification(`Новый эпик "${epic.title}" доступен для взятия в работу`)
        }
        return
      }
      if (type === 'EPIC_UPDATED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
          old.map((e) => (e.id === epic.id ? epic : e))
        )
        return
      }
      if (type === 'EPIC_DELETED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
          old.filter((e) => e.id !== epic.id)
        )
        queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
        return
      }
      if (type === 'EPIC_ARCHIVED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
          old.filter((e) => e.id !== epic.id)
        )
        if (selectedEpicId === epic.id) {
          setSelectedEpicId('')
        }
        queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
        return
      }
      if (type === 'EPIC_RESTORED') {
        const epic = payload as Epic
        queryClient.setQueryData<Epic[]>(['epics', boardId], (old = []) =>
          old.some((e) => e.id === epic.id) ? old : [...old, epic]
        )
        queryClient.invalidateQueries({ queryKey: ['grouped-tasks', boardId] })
        return
      }

      // --- Колонки: прямое обновление кэша ---
      if (type === 'COLUMN_CREATED') {
        const col = payload as Column
        queryClient.setQueryData<Column[]>(['columns', boardId], (old = []) =>
          old.some((c) => c.id === col.id) ? old : [...old, col]
        )
        return
      }
      if (type === 'COLUMN_UPDATED') {
        const col = payload as Column
        queryClient.setQueryData<Column[]>(['columns', boardId], (old = []) =>
          old.map((c) => (c.id === col.id ? col : c))
        )
        return
      }
      if (type === 'COLUMN_DELETED') {
        const col = payload as Column
        queryClient.setQueryData<Column[]>(['columns', boardId], (old = []) =>
          old.filter((c) => c.id !== col.id)
        )
        return
      }

      // --- Задачи ---
      const task = payload as Task
      queryClient.setQueryData<Record<string, Task[]>>(
        ['grouped-tasks', boardId, selectedEpicId || undefined],
        (old = {}) => {
          const next: Record<string, Task[]> = {}
          for (const [colId, tasks] of Object.entries(old)) {
            next[colId] = tasks.filter((t) => t.id !== task.id)
          }
          if (type !== 'TASK_DELETED') {
            const colId = task.columnId ?? '__unassigned__'
            next[colId] = [...(next[colId] ?? []), task]
          }
          return next
        }
      )
    },
    [boardId, queryClient, selectedEpicId, addNotification, navigate]
  )

  useBoardSocket(boardId ?? '', handleEvent)

  const isLoading = loadingTasks || loadingColumns || loadingEpics
  const canManage = role === 'ADMIN'
  const isAdmin = role === 'ADMIN'

  const selectedEpic: Epic | undefined = epics.find((e) => e.id === selectedEpicId)

  // Сбросить выбранный эпик если его больше нет в списке (удалён/заархивирован)
  useEffect(() => {
    if (selectedEpicId && !loadingEpics && !epics.some((e) => e.id === selectedEpicId)) {
      setSelectedEpicId('')
    }
  }, [epics, selectedEpicId, loadingEpics])

  // Закрывать попап при смене эпика
  useEffect(() => {
    setEpicPopoverOpen(false)
    setEditingEpic(null)
    setEpicTooltipVisible(false)
  }, [selectedEpicId])

  // Тимлид может взять эпик если выбран существующий эпик без команды
  // (teamId из store — подсказка для UI, бэкенд всё равно валидирует)
  const canClaimEpic =
    role === 'TEAM_LEAD' &&
    !!selectedEpicId &&
    selectedEpic != null &&
    selectedEpic.teamId == null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 flex-wrap">
        <Link to={board?.archived ? '/boards/archived' : '/boards'} className="text-sm text-blue-600 hover:underline">
          ← {board?.archived ? 'Архив' : 'Доски'}
        </Link>
        {isAdmin && editingName !== null ? (
          <input
            autoFocus
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') setEditingName(null)
            }}
            disabled={renameMutation.isPending}
            className="text-xl font-bold text-gray-800 mr-auto bg-transparent border-b-2 border-blue-500 outline-none px-0"
          />
        ) : (
          <h1
            className={`text-xl font-bold text-gray-800 mr-auto ${isAdmin ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
            onClick={() => isAdmin && setEditingName(board?.name ?? '')}
            title={isAdmin ? 'Нажмите для редактирования' : undefined}
          >
            {board?.name ?? '…'}
          </h1>
        )}

        {!loadingEpics && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-gray-500">Эпик:</label>
            <div className="relative">
              <button
                onClick={() => setEpicDropdownOpen((v) => !v)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 min-w-[140px]"
              >
                <span className="flex-1 text-left">
                  {selectedEpicId ? (epics.find((e) => e.id === selectedEpicId)?.title ?? 'Все эпики') : 'Все эпики'}
                </span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>

              {epicDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setEpicDropdownOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-full w-max max-w-xs">
                    <button
                      onClick={() => { setSelectedEpicId(''); setEpicDropdownOpen(false) }}
                      className={`w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 transition-colors ${!selectedEpicId ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                    >
                      Все эпики
                    </button>
                    {epics.map((epic) => (
                      <button
                        key={epic.id}
                        onClick={() => { setSelectedEpicId(epic.id); setEpicDropdownOpen(false) }}
                        className={`w-full text-left text-sm px-3 py-1.5 hover:bg-gray-50 transition-colors ${selectedEpicId === epic.id ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                      >
                        {epic.title}
                        {epic.teamId
                          ? teamMap[epic.teamId] ? <span className="text-gray-400"> — {teamMap[epic.teamId]}</span> : null
                          : <span className="text-gray-400"> (без команды)</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Иконка-инфо с описанием эпика */}
            {selectedEpicId && selectedEpic && (
              <div className="relative" ref={epicPopoverRef}>
                {/* Hover-обёртка: покрывает кнопку + тултип без зазора */}
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
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isAdmin ? 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer' : 'text-gray-400 cursor-default'}`}
                  >
                    ℹ
                  </button>

                  {epicTooltipVisible && !epicPopoverOpen && (
                    <div className="absolute right-0 top-full z-30 pt-1">
                      <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-64 max-h-40 overflow-y-auto shadow-xl break-words whitespace-pre-wrap">
                        {selectedEpic.description
                          ? selectedEpic.description
                          : isAdmin ? 'Нажмите для добавления описания' : 'Нет описания'}
                      </div>
                    </div>
                  )}
                </div>

                {epicPopoverOpen && editingEpic && (
                  <div className="absolute left-0 top-full mt-2 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-80">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Редактирование эпика</p>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm mb-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editingEpic.title}
                      onChange={(e) => setEditingEpic({ ...editingEpic, title: e.target.value })}
                      placeholder="Название"
                    />
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      value={editingEpic.description}
                      onChange={(e) => setEditingEpic({ ...editingEpic, description: e.target.value })}
                      placeholder="Описание (необязательно)"
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => { setEpicPopoverOpen(false); setEditingEpic(null) }}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Отмена
                      </button>
                      <button
                        disabled={!editingEpic.title.trim() || updateEpicMutation.isPending}
                        onClick={() => updateEpicMutation.mutate({ id: selectedEpicId, ...editingEpic })}
                        className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {updateEpicMutation.isPending ? 'Сохранение…' : 'Сохранить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Бейдж команды выбранного эпика */}
            {selectedEpic?.teamId && teamMap[selectedEpic.teamId] && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                Команда: {teamMap[selectedEpic.teamId]}
              </span>
            )}

            {/* Тимлид берёт эпик */}
            {canClaimEpic && (
              <button
                disabled={claimMutation.isPending}
                onClick={() => claimMutation.mutate(selectedEpicId)}
                className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {claimMutation.isPending ? '…' : 'Взять эпик'}
              </button>
            )}

            {/* Действия с эпиком — только для админа при выбранном эпике */}
            {isAdmin && selectedEpicId && (
              <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                <button
                  disabled={archiveEpicMutation.isPending}
                  onClick={() => {
                    if (confirm(`Архивировать эпик «${selectedEpic?.title}»? Его задачи исчезнут с доски.`)) {
                      archiveEpicMutation.mutate(selectedEpicId)
                    }
                  }}
                  className="text-xs text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors disabled:opacity-50"
                >
                  Архивировать
                </button>
                <button
                  disabled={deleteEpicMutation.isPending}
                  onClick={() => {
                    const epic = epics.find((e) => e.id === selectedEpicId)
                    if (confirm(`Удалить эпик «${epic?.title}» и все его задачи? Это действие необратимо.`)) {
                      deleteEpicMutation.mutate(selectedEpicId)
                    }
                  }}
                  className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
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
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Архив эпиков →
            </Link>
            <button
              onClick={() => setShowCreateEpic(true)}
              className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              + Новый эпик
            </button>
          </div>
        )}
      </header>


      <main className="p-6 flex-1">
        {isLoading ? (
          <p className="text-gray-400">Загрузка…</p>
        ) : (
          <BoardView
            boardId={boardId!}
            columns={columns}
            groupedTasks={groupedTasks}
            epics={epics}
            selectedEpicId={selectedEpicId}
            canManage={canManage}
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
    </div>
  )
}
