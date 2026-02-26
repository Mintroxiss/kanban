import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getBoards, archiveBoard, deleteBoard } from '../api/boards'
import { useAuthStore } from '../store/authStore'
import { useWebSocket } from '../hooks/useWebSocket'
import CreateBoardModal from '../components/CreateBoardModal'

export default function BoardsListPage() {
  const logout = useAuthStore((s) => s.logout)
  const role = useAuthStore((s) => s.role)
  const [showCreate, setShowCreate] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()

  const { data: boards = [], isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
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
  }, [queryClient])

  useEffect(() => {
    return subscribe('/topic/boards', handleBoardEvent)
  }, [subscribe, handleBoardEvent])

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

      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Доски</h1>
        <div className="flex items-center gap-3">
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

      <main className="p-6">
        {boards.length === 0 ? (
          <p className="text-gray-400">Доски не найдены.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div key={board.id} className="relative">
                <Link
                  to={`/boards/${board.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 pr-10 hover:shadow-md transition-shadow"
                >
                  <h2 className="font-semibold text-gray-800">{board.name}</h2>
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
        )}
      </main>

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
