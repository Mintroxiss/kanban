import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getBoards } from '../api/boards'
import { useAuthStore } from '../store/authStore'

export default function BoardsListPage() {
  const logout = useAuthStore((s) => s.logout)
  const { data: boards = [], isLoading, error } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

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
        <button
          onClick={logout}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Sign out
        </button>
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
    </div>
  )
}
