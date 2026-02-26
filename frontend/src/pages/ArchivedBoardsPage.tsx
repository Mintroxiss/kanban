import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getArchivedBoards, unarchiveBoard, deleteBoard } from '../api/boards'
import { useWebSocket } from '../hooks/useWebSocket'

export default function ArchivedBoardsPage() {
  const queryClient = useQueryClient()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const { subscribe } = useWebSocket()

  const handleBoardEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['boards-archived'] })
    queryClient.invalidateQueries({ queryKey: ['boards'] })
  }, [queryClient])

  useEffect(() => {
    return subscribe('/topic/boards', handleBoardEvent)
  }, [subscribe, handleBoardEvent])

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards-archived'] })
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {openMenuId && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />
      )}

      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link to="/boards" className="text-sm text-blue-600 hover:underline">
          ← Boards
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Архивные доски</h1>
      </header>

      <main className="p-6">
        {isLoading ? (
          <p className="text-gray-400">Загрузка…</p>
        ) : boards.length === 0 ? (
          <p className="text-gray-400">Архив пуст.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div key={board.id} className="relative">
                <Link
                  to={`/boards/${board.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 pr-10 hover:shadow-md transition-shadow"
                >
                  <h2 className="font-semibold text-gray-800">{board.name}</h2>
                  <span className="text-xs text-gray-400">Архивирована</span>
                </Link>

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
                        disabled={unarchiveMutation.isPending}
                        onClick={() => {
                          setOpenMenuId(null)
                          unarchiveMutation.mutate(board.id)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        Восстановить
                      </button>
                      <button
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          setOpenMenuId(null)
                          if (confirm(`Удалить доску «${board.name}» навсегда? Это действие необратимо.`)) {
                            deleteMutation.mutate(board.id)
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
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
    </div>
  )
}
