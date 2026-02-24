import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './store/authStore'
import { useNotificationStore } from './store/notificationStore'
import { useUserNotifications } from './hooks/useUserNotifications'
import { WebSocketProvider } from './context/WebSocketContext'
import LoginPage from './pages/LoginPage'
import BoardsListPage from './pages/BoardsListPage'
import BoardPage from './pages/BoardPage'
import UsersPage from './pages/UsersPage'
import TeamsPage from './pages/TeamsPage'
import DirectionsPage from './pages/DirectionsPage'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GlobalNotifications() {
  useUserNotifications()
  const notifications = useNotificationStore((s) => s.notifications)

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="bg-gray-800 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg"
        >
          {n.message}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
      <BrowserRouter>
        <GlobalNotifications />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/boards"
            element={
              <ProtectedRoute>
                <BoardsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:boardId"
            element={
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/directions"
            element={
              <ProtectedRoute>
                <DirectionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>
      </BrowserRouter>
      </WebSocketProvider>
    </QueryClientProvider>
  )
}
