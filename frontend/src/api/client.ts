import axios, { isAxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'

/** Возвращает true, если бэкенд недоступен: сетевая ошибка или ответ 502/503/504 от прокси Vite */
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

    // Бэкенд недоступен: показываем уведомление не чаще раза в 10 секунд
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

    // 401: пробуем обновить токен через refresh endpoint; при неудаче — разлогиниваем
    if (error.response?.status === 401 && !original._retry && !isRefreshing) {
      original._retry = true
      isRefreshing = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        // login() обновляет токен, роль и teamId из свежего ответа бэкенда
        useAuthStore.getState().login(data)
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
