import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getArchivedBoards, unarchiveBoard, deleteBoard } from '../api/boards'
import { useWebSocket } from '../hooks/useWebSocket'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Board } from '../types'

export default function ArchivedBoardsPage() {
  const queryClient = useQueryClient()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Board | null>(null)
  const { subscribe } = useWebSocket()

  const handleBoardEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['boards-archived'] })
    queryClient.invalidateQueries({ queryKey: ['boards'] })
  }, [queryClient])

  useEffect(() => { return subscribe('/topic/boards', handleBoardEvent) }, [subscribe, handleBoardEvent])

  const { data: boards = [], isLoading } = useQuery({
    queryKey: ['boards-archived'],
    queryFn: getArchivedBoards,
  })

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => unarchiveBoard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards-archived'] })
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBoard(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards-archived'] }),
  })

  return (
    <div className="relative min-h-screen z-10">
      {openMenuId && <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />}

      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/[0.06] border-b border-white/[0.10] px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-indigo-300/80 hover:text-indigo-200 transition-colors">← Доски</Link>
        <h1 className="text-lg font-semibold text-white/95">Архивные доски</h1>
      </header>

      <main className="p-6">
        {isLoading ? (
          <p className="text-white/35 text-sm">Загрузка…</p>
        ) : boards.length === 0 ? (
          <p className="text-white/35 text-sm">Архив пуст.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div key={board.id} className="relative group">
                <Link
                  to={`/boards/${board.id}`}
                  className="block backdrop-blur-md bg-white/[0.06] border border-white/[0.10] rounded-2xl p-5 pr-10 hover:bg-white/[0.10] hover:border-white/[0.16] transition-all duration-200"
                >
                  <h2 className="font-semibold text-white/80">{board.name}</h2>
                  <span className="text-xs text-white/35">Архивирована</span>
                </Link>

                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === board.id ? null : board.id) }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.10] transition-colors text-lg leading-none"
                  >
                    ···
                  </button>
                  {openMenuId === board.id && (
                    <div className="absolute right-0 mt-1 w-44 backdrop-blur-xl bg-white/[0.10] border border-white/[0.15] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 z-20">
                      <button
                        disabled={unarchiveMutation.isPending}
                        onClick={() => { setOpenMenuId(null); unarchiveMutation.mutate(board.id) }}
                        className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/[0.10] hover:text-white/95 disabled:opacity-50 transition-colors"
                      >
                        Восстановить
                      </button>
                      <button
                        disabled={deleteMutation.isPending}
                        onClick={() => { setOpenMenuId(null); setConfirmDelete(board) }}
                        className="w-full text-left px-3 py-2 text-sm text-red-300/80 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50 transition-colors"
                      >
                        Удалить навсегда
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {confirmDelete && (
        <ConfirmDialog
          title={`Удалить доску «${confirmDelete.name}» навсегда?`}
          description="Это действие необратимо."
          confirmLabel="Удалить"
          danger
          onConfirm={() => { deleteMutation.mutate(confirmDelete.id); setConfirmDelete(null) }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
