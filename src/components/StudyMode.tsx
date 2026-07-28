import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { FlashCard } from './FlashCard'
import type { AppStore } from '../hooks/useAppStore'
import type { SwipeDirection } from '../hooks/useSwipe'
import { buildRound, easeWeight, hardenWeight, randomShowFront } from '../queue'
import { langLabel } from '../translate'
import type { WordCard } from '../types'

type Props = {
  setIds: string[]
  store: AppStore
  onExit: () => void
}

type QueueItem = {
  card: WordCard
  showFrontFirst: boolean
  sourceLang: string
  targetLang: string
}

export function StudyMode({ setIds, store, onExit }: Props) {
  const studyCards = useMemo(() => {
    const selected = store.sets.filter((s) => setIds.includes(s.id))
    return selected.flatMap((s) =>
      s.cards.map((card) => ({
        card,
        sourceLang: s.sourceLang,
        targetLang: s.targetLang,
      })),
    )
  }, [store.sets, setIds])

  const cards = useMemo(() => studyCards.map((c) => c.card), [studyCards])
  const metaById = useMemo(() => {
    const map = new Map<string, { sourceLang: string; targetLang: string }>()
    for (const item of studyCards) {
      map.set(item.card.id, {
        sourceLang: item.sourceLang,
        targetLang: item.targetLang,
      })
    }
    return map
  }, [studyCards])

  const [queue, setQueue] = useState<QueueItem[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [animating, setAnimating] = useState<SwipeDirection | null>(null)
  const [hint, setHint] = useState<SwipeDirection | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const dragRef = useRef({ x: 0, y: 0 })
  const busyRef = useRef(false)
  const weightsRef = useRef<Map<string, number>>(new Map())
  const indexRef = useRef(0)
  const queueRef = useRef<QueueItem[]>([])
  const sessionStartedAt = useRef(Date.now())
  const endedRef = useRef(false)

  const finishSession = useCallback(() => {
    if (endedRef.current) return
    endedRef.current = true
    store.recordSessionEnd(Date.now() - sessionStartedAt.current)
  }, [store])

  const exitStudy = useCallback(() => {
    finishSession()
    onExit()
  }, [finishSession, onExit])

  const rebuild = useCallback(
    (source: WordCard[]) => {
      const withWeights = source.map((c) => ({
        ...c,
        weight: weightsRef.current.get(c.id) ?? c.weight,
      }))
      const round = buildRound(withWeights)
      return round.map((card) => {
        const meta = metaById.get(card.id)
        return {
          card,
          showFrontFirst: randomShowFront(),
          sourceLang: meta?.sourceLang ?? 'en',
          targetLang: meta?.targetLang ?? 'ru',
        }
      })
    },
    [metaById],
  )

  useEffect(() => {
    weightsRef.current = new Map(cards.map((c) => [c.id, c.weight]))
    const next = rebuild(cards)
    queueRef.current = next
    indexRef.current = 0
    setQueue(next)
    setIndex(0)
    setFlipped(false)
    if (cards.length > 0) store.recordSessionStart()
    sessionStartedAt.current = Date.now()
    return () => {
      finishSession()
    }
    // intentionally only on mount with initial cards snapshot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    indexRef.current = index
  }, [index])

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  const current = queue[index] ?? null
  const progress = queue.length ? ((index % queue.length) + 1) / queue.length : 0

  const goTo = useCallback(
    (nextIndex: number) => {
      const q = queueRef.current
      if (q.length === 0) return
      let i = nextIndex
      if (i >= q.length) {
        const built = rebuild(
          cards.map((c) => ({
            ...c,
            weight: weightsRef.current.get(c.id) ?? c.weight,
          })),
        )
        queueRef.current = built
        setQueue(built)
        i = 0
      } else if (i < 0) {
        i = q.length - 1
      }
      indexRef.current = i
      setIndex(i)
      setFlipped(false)
      setDrag({ x: 0, y: 0 })
      setAnimating(null)
      busyRef.current = false
    },
    [rebuild, cards],
  )

  const applySwipe = useCallback(
    (direction: SwipeDirection) => {
      const item = queueRef.current[indexRef.current]
      if (busyRef.current || !item) return
      busyRef.current = true
      setAnimating(direction)
      setHint(direction)

      if (direction === 'up' || direction === 'down') {
        const nextWeight =
          direction === 'up'
            ? easeWeight(weightsRef.current.get(item.card.id) ?? item.card.weight)
            : hardenWeight(weightsRef.current.get(item.card.id) ?? item.card.weight)
        weightsRef.current.set(item.card.id, nextWeight)
        store.updateCardWeight(item.card.id, nextWeight)
        store.recordReview(direction === 'up' ? 'easy' : 'hard')
      } else {
        store.recordReview('nav')
      }

      window.setTimeout(() => {
        if (direction === 'right') {
          goTo(indexRef.current - 1)
        } else {
          goTo(indexRef.current + 1)
        }
        setHint(null)
      }, 280)
    },
    [goTo, store],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        applySwipe('up')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        applySwipe('down')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        applySwipe('left')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        applySwipe('right')
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!busyRef.current) setFlipped((f) => !f)
      } else if (e.key === 'Escape') {
        exitStudy()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [applySwipe, exitStudy])

  const onTouchStart = (e: TouchEvent) => {
    if (busyRef.current) return
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY }
    dragRef.current = { x: 0, y: 0 }
    setDrag({ x: 0, y: 0 })
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!startRef.current || busyRef.current) return
    const t = e.touches[0]
    const dx = t.clientX - startRef.current.x
    const dy = t.clientY - startRef.current.y
    dragRef.current = { x: dx, y: dy }
    setDrag({ x: dx, y: dy })

    const absX = Math.abs(dx)
    const absY = Math.abs(dy)
    if (Math.max(absX, absY) > 40) {
      setHint(absY > absX ? (dy < 0 ? 'up' : 'down') : dx < 0 ? 'left' : 'right')
    } else {
      setHint(null)
    }
  }

  const onTouchEnd = () => {
    if (!startRef.current || busyRef.current) {
      startRef.current = null
      return
    }
    const { x, y } = dragRef.current
    const absX = Math.abs(x)
    const absY = Math.abs(y)
    const threshold = 56
    startRef.current = null

    if (Math.max(absX, absY) < threshold) {
      dragRef.current = { x: 0, y: 0 }
      setDrag({ x: 0, y: 0 })
      setHint(null)
      return
    }

    const direction: SwipeDirection =
      absY > absX ? (y < 0 ? 'up' : 'down') : x < 0 ? 'left' : 'right'
    applySwipe(direction)
  }

  if (cards.length === 0) {
    return (
      <div className="screen study-screen">
        <header className="top-bar">
          <button type="button" className="back-btn" onClick={exitStudy} aria-label="Закрыть">
            <span aria-hidden>‹</span>
            Закрыть
          </button>
          <h1>Обучение</h1>
          <span className="top-spacer" />
        </header>
        <div className="empty-state">
          <p>В выбранных сетах нет карточек.</p>
          <button type="button" className="primary-btn" onClick={exitStudy}>
            Назад
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="screen study-screen"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <header className="top-bar">
        <button type="button" className="back-btn" onClick={exitStudy} aria-label="Выйти">
          <span aria-hidden>‹</span>
          Выйти
        </button>
        <h1>Обучение</h1>
        <span className="top-spacer" />
      </header>

      <div className="study-progress" aria-hidden>
        <div className="study-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <p className="study-meta">
        <span className="study-meta-badge">
          {index + 1} / {queue.length}
        </span>
        <span className="study-meta-sep">·</span>
        раунд зациклен
      </p>

      {current && (
        <FlashCard
          front={current.card.front}
          back={current.card.back}
          showFrontFirst={current.showFrontFirst}
          flipped={flipped}
          onFlip={() => {
            if (!busyRef.current && Math.hypot(drag.x, drag.y) < 8) {
              setFlipped((f) => !f)
            }
          }}
          drag={drag}
          animating={animating}
          hint={hint}
          frontLabel={langLabel(current.sourceLang)}
          backLabel={langLabel(current.targetLang)}
          sourceLang={current.sourceLang}
          targetLang={current.targetLang}
        />
      )}

      <div className="study-legend">
        <span className="legend-pill legend-easy">↑ проще</span>
        <span className="legend-pill">← → листать</span>
        <span className="legend-pill legend-hard">↓ сложнее</span>
      </div>
    </div>
  )
}
