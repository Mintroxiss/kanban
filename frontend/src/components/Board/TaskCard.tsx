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

const STATUS_GLASS: Record<string, string> = {
  TO_DO: 'bg-slate-400/[0.12] text-slate-200 border border-slate-400/20',
  IN_PROGRESS: 'bg-blue-400/[0.15] text-blue-200 border border-blue-400/25',
  DONE: 'bg-emerald-400/[0.15] text-emerald-200 border border-emerald-400/25',
}

const STATUS_ACCENT: Record<string, string> = {
  TO_DO: 'border-l-slate-400/60',
  IN_PROGRESS: 'border-l-blue-400/80',
  DONE: 'border-l-emerald-400/80',
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
      mutationFn: (newStatus: string) => changeStatus(task.id, newStatus, task.columnId!),
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [task.assigneeId])

    function closeModal() { setOpen(false); setConfirmDelete(false) }

    return (
      <>
        <div
          ref={ref}
          {...props}
          onClick={() => setOpen(true)}
          className={`relative rounded-xl border-l-4 border border-white/[0.13] p-3 shadow-sm hover:shadow-md transition-all select-none
            ${STATUS_ACCENT[task.status] ?? 'border-l-white/20'}
            ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
            ${isMyTask ? 'backdrop-blur-md bg-indigo-500/[0.28] border-indigo-400/50 shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_4px_16px_rgba(99,102,241,0.20)]' : 'backdrop-blur-md bg-white/[0.11] hover:bg-white/[0.15]'}`}
        >
          <div className="flex items-start gap-1 mb-2">
            <p className="font-medium text-sm text-white/88 flex-1 min-w-0">{task.title}</p>
            {canRelease && (
              <div className="relative shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="text-white/25 hover:text-white/65 text-sm leading-none px-1 rounded-lg hover:bg-white/[0.14] transition-colors"
                >
                  ···
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false) }} />
                    <div className="absolute right-0 top-6 z-20 backdrop-blur-xl bg-white/[0.17] border border-white/[0.22] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 min-w-[160px]">
                      <button
                        disabled={releaseMutation.isPending}
                        onClick={(e) => { e.stopPropagation(); releaseMutation.mutate() }}
                        className="w-full text-left text-xs px-3 py-1.5 text-white/60 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50"
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
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_GLASS[task.status] ?? ''}`}>
              {STATUS_LABELS[task.status] ?? task.status}
            </span>
            {task.deadline && (
              showDeadlineCountdown ? (() => {
                const d = calcDaysLeft(task.deadline, todayStr)
                const cls =
                  d <= 0 ? 'text-red-300 font-semibold' :
                  d <= 2 ? 'text-orange-300 font-semibold' :
                  d <= 5 ? 'text-amber-300' :
                  'text-white/30'
                return <span className={`text-xs ${cls}`}>{d <= 0 ? 'Просрочено' : `${d} дн.`}</span>
              })() : (
                <span className="text-xs text-white/30">{task.deadline}</span>
              )
            )}
          </div>

          {task.assigneeName && <p className="mt-1.5 text-xs text-white/40 truncate">{task.assigneeName}</p>}
          {teamName && <p className="mt-0.5 text-xs text-white/25 truncate">{teamName}</p>}

          {canTake && !confirmTake && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmTake(true) }}
              className="mt-2 w-full text-xs text-indigo-300/80 hover:text-indigo-200 hover:bg-indigo-500/10 rounded-lg py-0.5 text-left px-1 transition-colors"
            >
              + Взять задачу
            </button>
          )}
          {canTake && confirmTake && (
            <div onClick={(e) => e.stopPropagation()} className="mt-2 flex items-center gap-1">
              <span className="text-xs text-white/50 flex-1">Взять задачу?</span>
              <button
                disabled={takeMutation.isPending}
                onClick={(e) => { e.stopPropagation(); takeMutation.mutate() }}
                className="text-xs bg-indigo-500/80 text-white px-2 py-0.5 rounded-lg hover:bg-indigo-500/95 disabled:opacity-50 transition-colors"
              >
                {takeMutation.isPending ? '…' : 'Да'}
              </button>
              <button
                disabled={takeMutation.isPending}
                onClick={(e) => { e.stopPropagation(); setConfirmTake(false) }}
                className="text-xs bg-white/[0.14] text-white/60 px-2 py-0.5 rounded-lg hover:bg-white/[0.14] disabled:opacity-50 transition-colors"
              >
                Нет
              </button>
            </div>
          )}
        </div>

        {open && createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeModal}>
            <div
              className="backdrop-blur-2xl bg-white/[0.17] border border-white/[0.22] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-white/95">{task.title}</h2>
                <button onClick={closeModal} className="text-white/35 hover:text-white/70 text-xl leading-none transition-colors">×</button>
              </div>

              {task.description && <p className="text-sm text-white/60 mb-4">{task.description}</p>}

              <div className="flex flex-col gap-2.5 text-sm text-white/55">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white/75">Статус:</span>
                  {canChangeStatus ? (
                    <div className="flex gap-1.5 flex-wrap">
                      {(['TO_DO', 'IN_PROGRESS', 'DONE'] as const).map((s) => (
                        <button
                          key={s}
                          disabled={statusMutation.isPending}
                          onClick={() => { setModalStatus(s); if (task.columnId) statusMutation.mutate(s) }}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border transition-all disabled:opacity-50 ${
                            modalStatus === s
                              ? STATUS_GLASS[s]
                              : 'bg-white/[0.06] text-white/35 border-white/[0.10] hover:bg-white/[0.12] hover:text-white/60'
                          }`}
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_GLASS[task.status] ?? ''}`}>
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  )}
                </div>
                {task.deadline && (
                  <div className="flex gap-2">
                    <span className="font-medium text-white/75">Дедлайн:</span>
                    <span>{task.deadline}</span>
                  </div>
                )}
                {task.assigneeName && (
                  <div className="flex gap-2">
                    <span className="font-medium text-white/75">Исполнитель:</span>
                    <span>{task.assigneeName}</span>
                  </div>
                )}
                {!task.assigneeId && task.lastAssigneeName && (
                  <div className="flex gap-2">
                    <span className="font-medium text-white/75">Последний исполнитель:</span>
                    <span className="text-white/35">{task.lastAssigneeName}</span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="mt-5 pt-4 border-t border-white/[0.13] flex items-center justify-between gap-4">
                  <button
                    onClick={() => { setOpen(false); setEditing(true) }}
                    className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors"
                  >
                    Редактировать
                  </button>
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)} className="text-sm text-red-300/70 hover:text-red-300 transition-colors">
                      Удалить
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/50">Удалить?</span>
                      <button
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate()}
                        className="text-xs bg-red-500/70 text-white px-3 py-1 rounded-xl hover:bg-red-500/90 disabled:opacity-50 transition-colors"
                      >
                        {deleteMutation.isPending ? '…' : 'Да'}
                      </button>
                      <button
                        disabled={deleteMutation.isPending}
                        onClick={() => setConfirmDelete(false)}
                        className="text-xs bg-white/[0.14] text-white/60 px-3 py-1 rounded-xl hover:bg-white/[0.14] disabled:opacity-50 transition-colors"
                      >
                        Нет
                      </button>
                      {deleteMutation.isError && <span className="text-xs text-red-300/70">Ошибка</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

        {editing && boardId && (
          <EditTaskModal task={task} boardId={boardId} epics={epics} onClose={() => setEditing(false)} />
        )}
      </>
    )
  }
)

export default function TaskCard({
  task, boardId, epics, isAdmin, isMyTask, canTake,
  canRelease, canChangeStatus, canDrag = true, teamName, showDeadlineCountdown,
}: {
  task: Task; boardId?: string; epics?: Epic[]; isAdmin?: boolean; isMyTask?: boolean
  canTake?: boolean; canRelease?: boolean; canChangeStatus?: boolean; canDrag?: boolean
  teamName?: string; showDeadlineCountdown?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !canDrag })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
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
