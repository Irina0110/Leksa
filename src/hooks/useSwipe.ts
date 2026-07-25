import { useCallback, useRef, type TouchEvent } from 'react'

export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

type Options = {
  onSwipe: (direction: SwipeDirection) => void
  threshold?: number
  /** Блокирует свайп, пока жест не завершён */
  disabled?: boolean
}

export function useSwipe({ onSwipe, threshold = 56, disabled = false }: Options) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const locked = useRef(false)

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return
      locked.current = false
      const t = e.touches[0]
      start.current = { x: t.clientX, y: t.clientY }
    },
    [disabled],
  )

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || !start.current || locked.current) return
      const t = e.touches[0]
      const dx = t.clientX - start.current.x
      const dy = t.clientY - start.current.y
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)

      if (Math.max(absX, absY) < threshold) return

      locked.current = true
      start.current = null

      if (absY > absX) {
        onSwipe(dy < 0 ? 'up' : 'down')
      } else {
        onSwipe(dx < 0 ? 'left' : 'right')
      }
    },
    [disabled, onSwipe, threshold],
  )

  const onTouchEnd = useCallback(() => {
    start.current = null
    locked.current = false
  }, [])

  return { onTouchStart, onTouchMove, onTouchEnd }
}

export function useSwipeOffset(threshold = 56) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const offset = useRef({ x: 0, y: 0 })

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0]
    start.current = { x: t.clientX, y: t.clientY }
    offset.current = { x: 0, y: 0 }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!start.current) return
    const t = e.touches[0]
    offset.current = {
      x: t.clientX - start.current.x,
      y: t.clientY - start.current.y,
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    start.current = null
  }, [])

  return { onTouchStart, onTouchMove, onTouchEnd, offset, threshold, start }
}
