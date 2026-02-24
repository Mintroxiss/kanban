import { useEffect } from 'react'
import { useWebSocket } from './useWebSocket'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'

export function useUserNotifications() {
  const { subscribe } = useWebSocket()
  const userId = useAuthStore((s) => s.userId)
  const addNotification = useNotificationStore((s) => s.addNotification)

  useEffect(() => {
    if (!userId) return
    const unsubscribe = subscribe(`/topic/user/${userId}`, (body) => {
      const msg = (body as { message: string }).message
      if (msg) addNotification(msg)
    })
    return unsubscribe
  }, [userId, subscribe, addNotification])
}
