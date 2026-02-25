import { useCallback, useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getGroupedTasks, getBoard, updateBoard } from '../api/boards'
import { getColumns } from '../api/columns'
import { getEpicsByBoard, claimEpic } from '../api/epics'
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
  const addNotification = useNotificationStore((s) => s.addNotification)
  const { subscribe } = useWebSocket()
  const [selectedEpicId, setSelectedEpicId] = useState<string>('')
  const [showCreateEpic, setShowCreateEpic] = useState(false)
  const [editingName, setEditingName] = useState<string | null>(null)

  useEffect(() => {
    return subscribe('/topic/boards', (body) => {
      const event = body as BoardEvent
      if (event.type === 'BOARD_UPDATED') {
        const updated = event.payload as Board
        if (updated.id === boardId) {
          queryClient.setQueryData(['board', boardId], updated)
          queryClient.invalidateQueries({ queryKey: ['boards'] })
        }
        return
      }
      if (event.type === 'BOARD_ARCHIVED' || event.type === 'BOARD_DELETED') {
        const board = event.payload as Board
        if (board.id === boardId) {
          addNotification(
            event.type === 'BOARD_DELETED'
              ? 'Доска была удалена администратором'
              : 'Доска была архивирована администратором'
          )
          queryClient.invalidateQueries({ queryKey: ['boards'] })
          navigate('/boards')
        }
      }
    })
  }, [subscribe, boardId, navigate, addNotification, queryClient])

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

  const { data: board } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => getBoard(boardId!),
    enabled: !!boardId,
  })

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

  const handleEvent = useCallback(
    (event: BoardEvent) => {
      const { type, payload } = event

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
    [boardId, queryClient, selectedEpicId]
  )

  useBoardSocket(boardId ?? '', handleEvent)

  const isLoading = loadingTasks || loadingColumns || loadingEpics
  const canManage = role === 'ADMIN'
  const isAdmin = role === 'ADMIN'

  const selectedEpic: Epic | undefined = epics.find((e) => e.id === selectedEpicId)

  // Тимлид может взять эпик если выбран эпик без команды
  // (teamId из store — подсказка для UI, бэкенд всё равно валидирует)
  const canClaimEpic =
    role === 'TEAM_LEAD' &&
    !!selectedEpicId &&
    selectedEpic?.teamId == null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 flex-wrap">
        <Link to="/boards" className="text-sm text-blue-600 hover:underline">
          ← Boards
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
            <label className="text-sm text-gray-500">Epic:</label>
            <select
              value={selectedEpicId}
              onChange={(e) => setSelectedEpicId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All epics</option>
              {epics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.title}
                  {epic.teamId
                    ? teamMap[epic.teamId] ? ` — ${teamMap[epic.teamId]}` : ''
                    : ' (без команды)'}
                </option>
              ))}
            </select>

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
          </div>
        )}

        {isAdmin && (
          <button
            onClick={() => setShowCreateEpic(true)}
            className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            + New Epic
          </button>
        )}
      </header>

      <main className="p-6 flex-1">
        {isLoading ? (
          <p className="text-gray-400">Loading…</p>
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
          />
        )}
      </main>

      {showCreateEpic && boardId && (
        <CreateEpicModal boardId={boardId} onClose={() => setShowCreateEpic(false)} />
      )}
    </div>
  )
}
