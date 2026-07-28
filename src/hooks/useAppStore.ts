import { useCallback, useEffect, useState } from 'react'
import { loadData, saveData, upsertDay } from '../storage'
import type { AppData, WordCard, WordSet } from '../types'
import {
  DEFAULT_SOURCE_LANG,
  DEFAULT_TARGET_LANG,
  DEFAULT_WEIGHT,
} from '../types'

function uid(): string {
  return crypto.randomUUID()
}

export function useAppStore() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

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
        cards: [],
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
      patch: Partial<Pick<WordSet, 'name' | 'cards' | 'sourceLang' | 'targetLang'>>,
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
    setData((prev) => ({ ...prev, sets: prev.sets.filter((s) => s.id !== setId) }))
  }, [])

  const addCard = useCallback((setId: string, front: string, back: string) => {
    const card: WordCard = {
      id: uid(),
      front: front.trim(),
      back: back.trim(),
      weight: DEFAULT_WEIGHT,
    }
    setData((prev) => ({
      ...prev,
      sets: prev.sets.map((s) =>
        s.id === setId
          ? { ...s, cards: [...s.cards, card], updatedAt: Date.now() }
          : s,
      ),
    }))
  }, [])

  const updateCard = useCallback(
    (setId: string, cardId: string, patch: Partial<Pick<WordCard, 'front' | 'back'>>) => {
      setData((prev) => ({
        ...prev,
        sets: prev.sets.map((s) =>
          s.id !== setId
            ? s
            : {
                ...s,
                updatedAt: Date.now(),
                cards: s.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
              },
        ),
      }))
    },
    [],
  )

  const deleteCard = useCallback((setId: string, cardId: string) => {
    setData((prev) => ({
      ...prev,
      sets: prev.sets.map((s) =>
        s.id !== setId
          ? s
          : {
              ...s,
              updatedAt: Date.now(),
              cards: s.cards.filter((c) => c.id !== cardId),
            },
      ),
    }))
  }, [])

  const updateCardWeight = useCallback((cardId: string, weight: number) => {
    setData((prev) => ({
      ...prev,
      sets: prev.sets.map((s) => ({
        ...s,
        cards: s.cards.map((c) => (c.id === cardId ? { ...c, weight } : c)),
      })),
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

  const getSet = useCallback(
    (setId: string) => data.sets.find((s) => s.id === setId),
    [data.sets],
  )

  return {
    sets: data.sets,
    stats: data.stats,
    createSet,
    updateSet,
    deleteSet,
    addCard,
    updateCard,
    deleteCard,
    updateCardWeight,
    recordSessionStart,
    recordSessionEnd,
    recordReview,
    resetStats,
    getSet,
  }
}

export type AppStore = ReturnType<typeof useAppStore>
