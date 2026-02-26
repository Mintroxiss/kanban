import axios, { isAxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'

/** True when the backend is unreachable — either direct network error or Vite proxy 502/503/504 */
export function isServerUnavailable(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  return !error.response || [502, 503, 504].includes(error.response.status)
}

const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let _lastNetworkErrorAt = 0

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Network error — backend unreachable (direct or via Vite proxy 502/503/504)
    if (isServerUnavailable(error)) {
      const now = Date.now()
      if (now - _lastNetworkErrorAt > 10_000) {
        _lastNetworkErrorAt = now
        useNotificationStore.getState().addNotification(
          'Сервер недоступен. Проверьте соединение.'
        )
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 403) {
      const url: string = error.config?.url ?? ''
      if (url.startsWith('/tasks/')) {
        useNotificationStore.getState().addNotification(
          'Взаимодействие с задачами этого эпика недоступно вашей команде.'
        )
      }
    }

    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true
      isRefreshing = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        useAuthStore.getState().setToken(data.token)
        original.headers.Authorization = `Bearer ${data.token}`
        return client(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default client
