import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import axios from 'axios'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
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

/** Decorative ambient orbs — fixed behind all content */
function GlobalBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 65%)' }} />
      <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)' }} />
      <div className="absolute -bottom-48 left-1/3 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 65%)' }} />
    </div>
  )
}

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
    <div className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-xl bg-red-500/80 border-b border-red-400/30 text-white text-sm text-center py-2.5 shadow-lg">
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
          className="backdrop-blur-xl bg-white/[0.19] border border-white/[0.18] text-white/95 text-sm font-medium px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          {n.message}
        </div>
      ))}
    </div>
  )
}

function ButtonSpotlight() {
  useEffect(() => {
    function track(e: MouseEvent) {
      const btn = (e.target as Element).closest('button') as HTMLElement | null
      if (!btn) return
      const r = btn.getBoundingClientRect()
      btn.style.setProperty('--gx', `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`)
      btn.style.setProperty('--gy', `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`)
    }
    window.addEventListener('mousemove', track, { passive: true })
    return () => window.removeEventListener('mousemove', track)
  }, [])
  return null
}

function ThemeSync() {
  const isDark = useThemeStore((s) => s.isDark)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
  }, [isDark])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <BrowserRouter>
          <ThemeSync />
          <GlobalBackground />
          <ButtonSpotlight />
          <OfflineBanner />
          <GlobalNotifications />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/boards" element={<ProtectedRoute><BoardsListPage /></ProtectedRoute>} />
            <Route path="/boards/archived" element={<ProtectedRoute><ArchivedBoardsPage /></ProtectedRoute>} />
            <Route path="/boards/:boardId/epics/archived" element={<ProtectedRoute><ArchivedEpicsPage /></ProtectedRoute>} />
            <Route path="/boards/:boardId" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
            <Route path="/teams" element={<ProtectedRoute><TeamsPage /></ProtectedRoute>} />
            <Route path="/directions" element={<ProtectedRoute><DirectionsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/boards" replace />} />
          </Routes>
        </BrowserRouter>
      </WebSocketProvider>
    </QueryClientProvider>
  )
}
