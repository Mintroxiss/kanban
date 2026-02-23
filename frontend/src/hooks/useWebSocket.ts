import { useCallback, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'

type Callback = (body: unknown) => void

export function useWebSocket() {
  const clientRef = useRef<Client | null>(null)
  const pendingRef = useRef<Map<string, Callback>>(new Map())
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        for (const [dest, cb] of pendingRef.current) {
          stompClient.subscribe(dest, (frame) => cb(JSON.parse(frame.body)))
        }
        pendingRef.current.clear()
      },
    })
    stompClient.activate()
    clientRef.current = stompClient

    return () => {
      stompClient.deactivate()
      clientRef.current = null
    }
  }, [token])

  const subscribe = useCallback((destination: string, callback: Callback) => {
    const client = clientRef.current
    if (!client || !client.connected) {
      pendingRef.current.set(destination, callback)
      return () => {
        pendingRef.current.delete(destination)
      }
    }

    const sub = client.subscribe(destination, (frame) =>
      callback(JSON.parse(frame.body))
    )
    return () => sub.unsubscribe()
  }, [])

  return { subscribe }
}
