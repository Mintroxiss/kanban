import { useState, useEffect } from 'react'

function msUntilMidnight(): number {
  const now = new Date()
  const next = new Date(now)
  next.setDate(next.getDate() + 1)
  next.setHours(0, 0, 0, 100) // 100ms buffer after midnight
  return next.getTime() - now.getTime()
}

export function useMidnightTick(): string {
  const [today, setToday] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>

    function tick() {
      setToday(new Date().toISOString().split('T')[0])
      id = setTimeout(tick, msUntilMidnight())
    }

    id = setTimeout(tick, msUntilMidnight())
    return () => clearTimeout(id)
  }, [])

  return today
}
