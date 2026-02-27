import axios from 'axios'
import { useEffect } from 'react'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import type { AuthTokens, UserRole } from '../types'

export function useUserNotifications() {
  const { subscribe } = useWebSocket()
  const userId = useAuthStore((s) => s.userId)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  useEffect(() => {
    if (!userId) return
    const unsubscribe = subscribe(`/topic/user/${userId}`, async (body) => {
      const payload = body as { type?: string; message?: string; role?: string; teamId?: string | null }

      if (payload.message) addNotification(payload.message)

      // PROFILE_UPDATE: обновляем role и teamId в authStore без перелогина
      if (payload.type === 'PROFILE_UPDATE') {
        const update: { role?: UserRole; teamId?: string | null } = {}
        if (payload.role) update.role = payload.role as UserRole
        // teamId может быть null (вышли из команды) или UUID-строкой
        if ('teamId' in payload) update.teamId = payload.teamId ?? null
        updateProfile(update)

        // Обновляем JWT-токен: бэкенд вернёт токен с актуальной ролью из БД,
        // чтобы авторизация (например, «Взять эпик») работала без перелогина
        const rt = useAuthStore.getState().refreshToken
        if (rt) {
          try {
            const { data } = await axios.post<AuthTokens>('/api/auth/refresh', { refreshToken: rt })
            useAuthStore.getState().login(data)
          } catch {
            // Если обновление токена не удалось — UI всё равно обновлён через WS
          }
        }
      }
    })
    return unsubscribe
  }, [userId, subscribe, addNotification, updateProfile])
}
