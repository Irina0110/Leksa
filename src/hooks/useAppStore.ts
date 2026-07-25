import { useCallback, useEffect, useState } from 'react'
import { loadData, saveData } from '../storage'
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
      setData((prev) => ({ sets: [set, ...prev.sets] }))
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
        sets: prev.sets.map((s) =>
          s.id === setId ? { ...s, ...patch, updatedAt: Date.now() } : s,
        ),
      }))
    },
    [],
  )

  const deleteSet = useCallback((setId: string) => {
    setData((prev) => ({ sets: prev.sets.filter((s) => s.id !== setId) }))
  }, [])

  const addCard = useCallback((setId: string, front: string, back: string) => {
    const card: WordCard = {
      id: uid(),
      front: front.trim(),
      back: back.trim(),
      weight: DEFAULT_WEIGHT,
    }
    setData((prev) => ({
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
      sets: prev.sets.map((s) => ({
        ...s,
        cards: s.cards.map((c) => (c.id === cardId ? { ...c, weight } : c)),
      })),
    }))
  }, [])

  const getSet = useCallback(
    (setId: string) => data.sets.find((s) => s.id === setId),
    [data.sets],
  )

  return {
    sets: data.sets,
    createSet,
    updateSet,
    deleteSet,
    addCard,
    updateCard,
    deleteCard,
    updateCardWeight,
    getSet,
  }
}

export type AppStore = ReturnType<typeof useAppStore>
