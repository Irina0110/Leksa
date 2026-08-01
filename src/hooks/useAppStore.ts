import { useCallback, useEffect, useRef, useState } from 'react'
import { loadData, saveData, upsertDay } from '../storage'
import type { AddCardResult, AppData, WordCard, WordSet } from '../types'
import {
  DEFAULT_SOURCE_LANG,
  DEFAULT_TARGET_LANG,
  DEFAULT_WEIGHT,
  cardKey,
} from '../types'

function uid(): string {
  return crypto.randomUUID()
}

export function useAppStore() {
  const [data, setData] = useState<AppData>(() => loadData())
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    saveData(data)
  }, [data])

  const getSet = useCallback(
    (setId: string) => data.sets.find((s) => s.id === setId),
    [data.sets],
  )

  const getCard = useCallback(
    (cardId: string) => data.cards.find((c) => c.id === cardId),
    [data.cards],
  )

  const getCardsForSet = useCallback(
    (setId: string): WordCard[] => {
      const set = data.sets.find((s) => s.id === setId)
      if (!set) return []
      return set.cardIds
        .map((id) => data.cards.find((c) => c.id === id))
        .filter((c): c is WordCard => Boolean(c))
    },
    [data.sets, data.cards],
  )

  const createSet = useCallback(
    (
      name: string,
      sourceLang: string = DEFAULT_SOURCE_LANG,
      targetLang: string = DEFAULT_TARGET_LANG,
    ): WordSet => {
      const set: WordSet = {
        id: uid(),
        name: name.trim() || 'Новый сет',
        sourceLang,
        targetLang,
        cardIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setData((prev) => ({ ...prev, sets: [set, ...prev.sets] }))
      return set
    },
    [],
  )

  const updateSet = useCallback(
    (
      setId: string,
      patch: Partial<Pick<WordSet, 'name' | 'cardIds' | 'sourceLang' | 'targetLang'>>,
    ) => {
      setData((prev) => ({
        ...prev,
        sets: prev.sets.map((s) =>
          s.id === setId ? { ...s, ...patch, updatedAt: Date.now() } : s,
        ),
      }))
    },
    [],
  )

  const deleteSet = useCallback((setId: string) => {
    setData((prev) => ({
      ...prev,
      sets: prev.sets.filter((s) => s.id !== setId),
      // Слова остаются в библиотеке даже без сетов
    }))
  }, [])

  const addCard = useCallback((setId: string, front: string, back: string): AddCardResult => {
    const f = front.trim()
    const b = back.trim()
    const prev = dataRef.current
    const set = prev.sets.find((s) => s.id === setId)
    if (!set) return { status: 'exists', cardId: '' }

    const key = cardKey(f, b)
    const existing = prev.cards.find((c) => cardKey(c.front, c.back) === key)

    if (existing) {
      if (set.cardIds.includes(existing.id)) {
        return { status: 'exists', cardId: existing.id }
      }
      setData({
        ...prev,
        sets: prev.sets.map((s) =>
          s.id === setId
            ? {
                ...s,
                cardIds: [...s.cardIds, existing.id],
                updatedAt: Date.now(),
              }
            : s,
        ),
      })
      return { status: 'linked', cardId: existing.id }
    }

    const card: WordCard = {
      id: uid(),
      front: f,
      back: b,
      weight: DEFAULT_WEIGHT,
    }
    setData({
      ...prev,
      cards: [...prev.cards, card],
      sets: prev.sets.map((s) =>
        s.id === setId
          ? {
              ...s,
              cardIds: [...s.cardIds, card.id],
              updatedAt: Date.now(),
            }
          : s,
      ),
    })
    return { status: 'created', cardId: card.id }
  }, [])

  const updateCard = useCallback(
    (cardId: string, patch: Partial<Pick<WordCard, 'front' | 'back'>>) => {
      setData((prev) => {
        const nextFront = patch.front?.trim()
        const nextBack = patch.back?.trim()
        const current = prev.cards.find((c) => c.id === cardId)
        if (!current) return prev

        const front = nextFront ?? current.front
        const back = nextBack ?? current.back
        const key = cardKey(front, back)
        const clash = prev.cards.find((c) => c.id !== cardId && cardKey(c.front, c.back) === key)

        // Если совпало с другой карточкой — сливаем: ссылки → clash, удаляем текущую
        if (clash) {
          return {
            ...prev,
            cards: prev.cards.filter((c) => c.id !== cardId),
            sets: prev.sets.map((s) => ({
              ...s,
              cardIds: s.cardIds
                .map((id) => (id === cardId ? clash.id : id))
                .filter((id, i, arr) => arr.indexOf(id) === i),
              updatedAt: Date.now(),
            })),
          }
        }

        return {
          ...prev,
          cards: prev.cards.map((c) =>
            c.id === cardId ? { ...c, front, back } : c,
          ),
        }
      })
    },
    [],
  )

  const getSetsForCard = useCallback(
    (cardId: string): WordSet[] => data.sets.filter((s) => s.cardIds.includes(cardId)),
    [data.sets],
  )

  /** Добавить существующее слово в сет (без дубликата) */
  const linkCardToSet = useCallback((cardId: string, setId: string): boolean => {
    const prev = dataRef.current
    const set = prev.sets.find((s) => s.id === setId)
    if (!set || !prev.cards.some((c) => c.id === cardId)) return false
    if (set.cardIds.includes(cardId)) return false
    setData({
      ...prev,
      sets: prev.sets.map((s) =>
        s.id === setId
          ? { ...s, cardIds: [...s.cardIds, cardId], updatedAt: Date.now() }
          : s,
      ),
    })
    return true
  }, [])

  /** Убрать карточку из сета (слово остаётся в библиотеке) */
  const deleteCard = useCallback((setId: string, cardId: string) => {
    setData((prev) => ({
      ...prev,
      sets: prev.sets.map((s) =>
        s.id !== setId
          ? s
          : {
              ...s,
              updatedAt: Date.now(),
              cardIds: s.cardIds.filter((id) => id !== cardId),
            },
      ),
    }))
  }, [])

  /** Переместить слово из одного сета в другой */
  const moveCard = useCallback((cardId: string, fromSetId: string, toSetId: string): boolean => {
    if (fromSetId === toSetId) return false
    const prev = dataRef.current
    const from = prev.sets.find((s) => s.id === fromSetId)
    const to = prev.sets.find((s) => s.id === toSetId)
    if (!from || !to || !from.cardIds.includes(cardId)) return false

    setData({
      ...prev,
      sets: prev.sets.map((s) => {
        if (s.id === fromSetId) {
          return {
            ...s,
            cardIds: s.cardIds.filter((id) => id !== cardId),
            updatedAt: Date.now(),
          }
        }
        if (s.id === toSetId) {
          if (s.cardIds.includes(cardId)) return s
          return {
            ...s,
            cardIds: [...s.cardIds, cardId],
            updatedAt: Date.now(),
          }
        }
        return s
      }),
    })
    return true
  }, [])

  /** Удалить слово из библиотеки и из всех сетов */
  const deleteCardForever = useCallback((cardId: string) => {
    setData((prev) => ({
      ...prev,
      cards: prev.cards.filter((c) => c.id !== cardId),
      sets: prev.sets.map((s) =>
        s.cardIds.includes(cardId)
          ? {
              ...s,
              cardIds: s.cardIds.filter((id) => id !== cardId),
              updatedAt: Date.now(),
            }
          : s,
      ),
    }))
  }, [])

  /** Синхронизировать членство слова в сетах */
  const setCardMembership = useCallback((cardId: string, setIds: string[]) => {
    const wanted = new Set(setIds)
    setData((prev) => {
      if (!prev.cards.some((c) => c.id === cardId)) return prev
      return {
        ...prev,
        sets: prev.sets.map((s) => {
          const has = s.cardIds.includes(cardId)
          const should = wanted.has(s.id)
          if (has === should) return s
          return {
            ...s,
            updatedAt: Date.now(),
            cardIds: should
              ? [...s.cardIds, cardId]
              : s.cardIds.filter((id) => id !== cardId),
          }
        }),
      }
    })
  }, [])

  const updateCardWeight = useCallback((cardId: string, weight: number) => {
    setData((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === cardId ? { ...c, weight } : c)),
    }))
  }, [])

  const recordSessionStart = useCallback(() => {
    setData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        sessions: prev.stats.sessions + 1,
      },
    }))
  }, [])

  const recordSessionEnd = useCallback((durationMs: number) => {
    const ms = Math.max(0, Math.round(durationMs))
    if (ms < 1000) return
    setData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalMs: prev.stats.totalMs + ms,
      },
    }))
  }, [])

  const recordReview = useCallback((kind: 'nav' | 'easy' | 'hard') => {
    setData((prev) => {
      const stats = { ...prev.stats }
      stats.reviews += 1
      if (kind === 'easy') stats.easyMarks += 1
      if (kind === 'hard') stats.hardMarks += 1
      stats.days = upsertDay(stats.days, {
        reviews: 1,
        easy: kind === 'easy' ? 1 : 0,
        hard: kind === 'hard' ? 1 : 0,
      })
      return { ...prev, stats }
    })
  }, [])

  const resetStats = useCallback(() => {
    setData((prev) => ({
      ...prev,
      stats: {
        sessions: 0,
        reviews: 0,
        easyMarks: 0,
        hardMarks: 0,
        totalMs: 0,
        days: [],
      },
    }))
  }, [])

  const findCardByText = useCallback(
    (front: string, back: string) => {
      const key = cardKey(front, back)
      return data.cards.find((c) => cardKey(c.front, c.back) === key)
    },
    [data.cards],
  )

  return {
    sets: data.sets,
    cards: data.cards,
    stats: data.stats,
    createSet,
    updateSet,
    deleteSet,
    addCard,
    updateCard,
    deleteCard,
    deleteCardForever,
    linkCardToSet,
    moveCard,
    setCardMembership,
    updateCardWeight,
    recordSessionStart,
    recordSessionEnd,
    recordReview,
    resetStats,
    getSet,
    getCard,
    getCardsForSet,
    getSetsForCard,
    findCardByText,
  }
}

export type AppStore = ReturnType<typeof useAppStore>
