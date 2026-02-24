import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { Client } from '@stomp/stompjs'
import type { StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'

type Callback = (body: unknown) => void

interface WebSocketContextValue {
  subscribe: (destination: string, callback: Callback) => () => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)

  // destination → set of callbacks
  const callbacksRef = useRef<Map<string, Set<Callback>>>(new Map())
  // destination → active STOMP subscription
  const stompSubsRef = useRef<Map<string, StompSubscription>>(new Map())
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!token) return

    const stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // Re-subscribe to every destination that has active callbacks.
        // This runs on every connect/reconnect, ensuring subscriptions survive
        // network drops.
        stompSubsRef.current.clear()
        for (const [dest, callbacks] of callbacksRef.current) {
          if (callbacks.size === 0) continue
          const sub = stompClient.subscribe(dest, (frame) => {
            const body = JSON.parse(frame.body)
            callbacksRef.current.get(dest)?.forEach((cb) => cb(body))
          })
          stompSubsRef.current.set(dest, sub)
        }
      },
      onDisconnect: () => {
        stompSubsRef.current.clear()
      },
    })

    stompClient.activate()
    clientRef.current = stompClient

    return () => {
      stompClient.deactivate()
      clientRef.current = null
      stompSubsRef.current.clear()
    }
  }, [token])

  const subscribe = useCallback((destination: string, callback: Callback): (() => void) => {
    // Register callback
    if (!callbacksRef.current.has(destination)) {
      callbacksRef.current.set(destination, new Set())
    }
    callbacksRef.current.get(destination)!.add(callback)

    // If already connected and no STOMP sub yet for this destination, create one
    const client = clientRef.current
    if (client?.connected && !stompSubsRef.current.has(destination)) {
      const sub = client.subscribe(destination, (frame) => {
        const body = JSON.parse(frame.body)
        callbacksRef.current.get(destination)?.forEach((cb) => cb(body))
      })
      stompSubsRef.current.set(destination, sub)
    }

    return () => {
      const callbacks = callbacksRef.current.get(destination)
      if (!callbacks) return
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        callbacksRef.current.delete(destination)
        const sub = stompSubsRef.current.get(destination)
        if (sub) {
          sub.unsubscribe()
          stompSubsRef.current.delete(destination)
        }
      }
    }
  }, [])

  return (
    <WebSocketContext.Provider value={{ subscribe }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocketContext must be used inside WebSocketProvider')
  return ctx
}
