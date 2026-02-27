import { useState, forwardRef, useEffect } from 'react'
import { useMidnightTick } from '../../hooks/useMidnightTick'
import { createPortal } from 'react-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Epic, Task } from '../../types'
import { deleteTask, takeTask, releaseTask, changeStatus } from '../../api/tasks'
import EditTaskModal from '../EditTaskModal'

function calcDaysLeft(deadline: string, todayStr: string): number {
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const [dy, dm, dd] = deadline.split('T')[0].split('-').map(Number)
  return Math.round(
    (new Date(dy, dm - 1, dd).getTime() - new Date(ty, tm - 1, td).getTime()) / 86_400_000
  )
}

const STATUS_STYLES: Record<string, string> = {
  TO_DO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
}

const STATUS_ACCENT: Record<string, string> = {
  TO_DO: 'border-l-slate-400',
  IN_PROGRESS: 'border-l-blue-500',
  DONE: 'border-l-emerald-500',
}

const STATUS_LABELS: Record<string, string> = {
  TO_DO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  DONE: 'Готово',
}

type DisplayProps = React.HTMLAttributes<HTMLDivElement> & {
  task: Task
  boardId?: string
  epics?: Epic[]
  isAdmin?: boolean
  isMyTask?: boolean
  canTake?: boolean
  canRelease?: boolean
  canChangeStatus?: boolean
  canDrag?: boolean
  teamName?: string
  showDeadlineCountdown?: boolean
}

export const TaskCardDisplay = forwardRef<HTMLDivElement, DisplayProps>(
  function TaskCardDisplay(
    { task, boardId, epics = [], isAdmin = false, isMyTask = false, canTake = false, canRelease = false, canChangeStatus = false, canDrag = true, teamName, showDeadlineCountdown = false, ...props },
    ref
  ) {
    const todayStr = useMidnightTick()

    const queryClient = useQueryClient()

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [confirmTake, setConfirmTake] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [modalStatus, setModalStatus] = useState(task.status)

    const deleteMutation = useMutation({
      mutationFn: () => deleteTask(task.id),
      onSuccess: () => setOpen(false),
    })

    const takeMutation = useMutation({
      mutationFn: () => takeTask(task.id),
      onSuccess: () => setConfirmTake(false),
    })

    const statusMutation = useMutation({
      mutationFn: (newStatus: string) =>
        changeStatus(task.id, newStatus, task.columnId!),
      onSuccess: (updated) => {
        if (boardId) {
          queryClient.setQueriesData<Record<string, Task[]>>(
            { queryKey: ['grouped-tasks', boardId] },
            (old) => {
              if (!old) return old
              const next: Record<string, Task[]> = {}
              for (const [colId, tasks] of Object.entries(old)) {
                next[colId] = tasks.map((t) => (t.id === updated.id ? updated : t))
              }
              return next
            }
          )
        }
        setOpen(false)
      },
    })

    const releaseMutation = useMutation({
      mutationFn: () => releaseTask(task.id),
      onSuccess: () => setMenuOpen(false),
    })

    useEffect(() => {
      takeMutation.reset()
      releaseMutation.reset()
      setConfirmTake(false)
      setMenuOpen(false)
      // Намеренно не добавляем мутации в deps: нужно сбрасывать состояние только при смене исполнителя
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task.assigneeId])

    function closeModal() {
      setOpen(false)
      setConfirmDelete(false)
    }

    return (
      <>
        <div
          ref={ref}
          {...props}
          onClick={() => setOpen(true)}
          className={`relative rounded-lg border border-l-4 p-3 shadow-sm hover:shadow-md transition-shadow select-none
            ${STATUS_ACCENT[task.status] ?? 'border-l-gray-300'}
            ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
            ${isMyTask ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
        >
          {/* Заголовок задачи и кнопка меню (отпустить) */}
          <div className="flex items-start gap-1 mb-2">
            <p className="font-medium text-sm text-gray-800 flex-1 min-w-0">{task.title}</p>

            {canRelease && (
              <div className="relative shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-gray-700 text-sm leading-none px-1 rounded hover:bg-gray-100 transition-colors"
                >
                  ···
                </button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }}
                    />
                    <div className="absolute right-0 top-6 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                      <button
                        disabled={releaseMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation()
                          releaseMutation.mutate()
                        }}
                        className="w-full text-left text-xs px-3 py-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        {releaseMutation.isPending ? '…' : 'Отпустить задачу'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status] ?? ''}`}
            >
              {STATUS_LABELS[task.status] ?? task.status}
            </span>
            {task.deadline && (
              showDeadlineCountdown ? (() => {
                const d = calcDaysLeft(task.deadline, todayStr)
                const cls =
                  d <= 0 ? 'text-red-600 font-semibold' :
                  d <= 2 ? 'text-orange-500 font-semibold' :
                  d <= 5 ? 'text-amber-500' :
                  'text-gray-400'
                return (
                  <span className={`text-xs ${cls}`}>
                    {d <= 0 ? 'Просрочено' : `${d} дн.`}
                  </span>
                )
              })() : (
                <span className="text-xs text-gray-400">{task.deadline}</span>
              )
            )}
          </div>

          {task.assigneeName && (
            <p className="mt-1.5 text-xs text-gray-500 truncate">{task.assigneeName}</p>
          )}
          {teamName && (
            <p className="mt-0.5 text-xs text-gray-400 truncate">{teamName}</p>
          )}

          {canTake && !confirmTake && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmTake(true) }}
              className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded py-0.5 text-left px-1 transition-colors"
            >
              + Взять задачу
            </button>
          )}
          {canTake && confirmTake && (
            <div onClick={(e) => e.stopPropagation()} className="mt-2 flex items-center gap-1">
              <span className="text-xs text-gray-600 flex-1">Взять задачу?</span>
              <button
                disabled={takeMutation.isPending}
                onClick={(e) => { e.stopPropagation(); takeMutation.mutate() }}
                className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {takeMutation.isPending ? '…' : 'Да'}
              </button>
              <button
                disabled={takeMutation.isPending}
                onClick={(e) => { e.stopPropagation(); setConfirmTake(false) }}
                className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Нет
              </button>
            </div>
          )}
        </div>

        {open &&
          createPortal(
            <div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
              onClick={closeModal}
            >
              <div
                className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">{task.title}</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-4">{task.description}</p>
                )}

                <div className="flex flex-col gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Статус:</span>
                    {canChangeStatus ? (
                      <select
                        value={modalStatus}
                        onChange={(e) => {
                          const val = e.target.value as Task['status']
                          setModalStatus(val)
                          if (task.columnId) statusMutation.mutate(val)
                        }}
                        disabled={statusMutation.isPending}
                        className="text-xs border border-gray-200 rounded px-2 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
                      >
                        <option value="TO_DO">К выполнению</option>
                        <option value="IN_PROGRESS">В работе</option>
                        <option value="DONE">Готово</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[task.status] ?? ''}`}
                      >
                        {STATUS_LABELS[task.status] ?? task.status}
                      </span>
                    )}
                  </div>
                  {task.deadline && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-700">Дедлайн:</span>
                      <span>{task.deadline}</span>
                    </div>
                  )}
                  {task.assigneeName && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-700">Исполнитель:</span>
                      <span>{task.assigneeName}</span>
                    </div>
                  )}
                  {!task.assigneeId && task.lastAssigneeName && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-700">Последний исполнитель:</span>
                      <span className="text-gray-400">{task.lastAssigneeName}</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                    <button
                      onClick={() => { setOpen(false); setEditing(true) }}
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Редактировать
                    </button>

                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                      >
                        Удалить
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Удалить?</span>
                        <button
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate()}
                          className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {deleteMutation.isPending ? '…' : 'Да'}
                        </button>
                        <button
                          disabled={deleteMutation.isPending}
                          onClick={() => setConfirmDelete(false)}
                          className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                        >
                          Нет
                        </button>
                        {deleteMutation.isError && (
                          <span className="text-xs text-red-500">Ошибка</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}

        {editing && boardId && (
          <EditTaskModal
            task={task}
            boardId={boardId}
            epics={epics}
            onClose={() => setEditing(false)}
          />
        )}
      </>
    )
  }
)

export default function TaskCard({
  task,
  boardId,
  epics,
  isAdmin,
  isMyTask,
  canTake,
  canRelease,
  canChangeStatus,
  canDrag = true,
  teamName,
  showDeadlineCountdown,
}: {
  task: Task
  boardId?: string
  epics?: Epic[]
  isAdmin?: boolean
  isMyTask?: boolean
  canTake?: boolean
  canRelease?: boolean
  canChangeStatus?: boolean
  canDrag?: boolean
  teamName?: string
  showDeadlineCountdown?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !canDrag })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <TaskCardDisplay
      ref={setNodeRef}
      task={task}
      boardId={boardId}
      epics={epics}
      isAdmin={isAdmin}
      isMyTask={isMyTask}
      canTake={canTake}
      canRelease={canRelease}
      canChangeStatus={canChangeStatus}
      canDrag={canDrag}
      teamName={teamName}
      showDeadlineCountdown={showDeadlineCountdown}
      style={style}
      {...attributes}
      {...listeners}
    />
  )
}
