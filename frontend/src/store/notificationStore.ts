import { create } from 'zustand'

export type Notification = { id: number; message: string }

let counter = 0

interface NotificationState {
  notifications: Notification[]
  addNotification: (message: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (message) => {
    const id = ++counter
    set((s) => ({ notifications: [...s.notifications, { id, message }] }))
    setTimeout(
      () => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      4000,
    )
  },
}))
