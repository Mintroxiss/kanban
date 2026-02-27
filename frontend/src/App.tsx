import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import axios from 'axios'
import { useAuthStore } from './store/authStore'
import { useNotificationStore } from './store/notificationStore'
import { useUserNotifications } from './hooks/useUserNotifications'
import { useWebSocket } from './hooks/useWebSocket'
import type { AuthTokens } from './types'
import { WebSocketProvider } from './context/WebSocketContext'
import LoginPage from './pages/LoginPage'
import BoardsListPage from './pages/BoardsListPage'
import BoardPage from './pages/BoardPage'
import ArchivedBoardsPage from './pages/ArchivedBoardsPage'
import ArchivedEpicsPage from './pages/ArchivedEpicsPage'
import UsersPage from './pages/UsersPage'
import TeamsPage from './pages/TeamsPage'
import DirectionsPage from './pages/DirectionsPage'
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function OfflineBanner() {
  const { isConnected } = useWebSocket()
  const token = useAuthStore((s) => s.token)
  const wasConnectedRef = useRef(false)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true
      setShow(false)
    } else if (wasConnectedRef.current) {
      setShow(true)
    }
  }, [isConnected])

  if (!show || !token) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-sm text-center py-2 shadow-md">
      Соединение с сервером потеряно. Данные могут быть устаревшими.
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GlobalNotifications() {
  useUserNotifications()

  // При старте подтягиваем актуальные role и teamId из БД через refresh —
  // это исправляет устаревшую роль в localStorage без перелогина
  useEffect(() => {
    const { refreshToken } = useAuthStore.getState()
    if (!refreshToken) return
    axios
      .post<AuthTokens>('/api/auth/refresh', { refreshToken })
      .then(({ data }) => useAuthStore.getState().login(data))
      .catch(() => {})
  }, [])

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
        <OfflineBanner />
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
            path="/boards/archived"
            element={
              <ProtectedRoute>
                <ArchivedBoardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:boardId/epics/archived"
            element={
              <ProtectedRoute>
                <ArchivedEpicsPage />
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
