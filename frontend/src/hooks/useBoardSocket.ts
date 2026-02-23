import { useEffect, useRef } from 'react'
import { useWebSocket } from './useWebSocket'
import type { BoardEvent } from '../types'

export function useBoardSocket(boardId: string, onEvent: (event: BoardEvent) => void) {
  const { subscribe } = useWebSocket()
  const onEventRef = useRef(onEvent)

  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!boardId) return
    const unsubscribe = subscribe(`/topic/board/${boardId}`, (body) => {
      onEventRef.current(body as BoardEvent)
    })
    return unsubscribe
  }, [boardId, subscribe])
}
