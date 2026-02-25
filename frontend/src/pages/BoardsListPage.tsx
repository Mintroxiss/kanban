import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getBoards } from '../api/boards'
import { useAuthStore } from '../store/authStore'
import { useWebSocket } from '../hooks/useWebSocket'
import CreateBoardModal from '../components/CreateBoardModal'

export default function BoardsListPage() {
  const logout = useAuthStore((s) => s.logout)
  const role = useAuthStore((s) => s.role)
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()
  const { subscribe } = useWebSocket()

  const { data: boards = [], isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

  const handleBoardEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['boards'] })
  }, [queryClient])

  useEffect(() => {
    return subscribe('/topic/boards', handleBoardEvent)
  }, [subscribe, handleBoardEvent])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading boards…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Failed to load boards.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Boards</h1>
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
            onClick={logout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6">
        {boards.length === 0 ? (
          <p className="text-gray-400">No boards found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Link
                key={board.id}
                to={`/boards/${board.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <h2 className="font-semibold text-gray-800">{board.name}</h2>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateBoardModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
