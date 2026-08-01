import { useState, type FormEvent } from 'react'
import type { AppStore } from '../../hooks/useAppStore'
import type { AddCardResult } from '../../types'
import { langLabel, translateText } from '../../translate'

export type TranslateDir = 'to-known' | 'to-learning'

type Options = {
  store: AppStore
  setId: string
}

export function useAddCard({ store, setId }: Options) {
  const set = store.getSet(setId)
  const sourceLang = set?.sourceLang ?? 'en'
  const targetLang = set?.targetLang ?? 'ru'

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [translating, setTranslating] = useState<TranslateDir | null>(null)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const runTranslate = async (dir: TranslateDir) => {
    setTranslateError(null)
    const text = dir === 'to-known' ? front : back
    if (!text.trim()) {
      setTranslateError(
        dir === 'to-known'
          ? 'Сначала введите слово на изучаемом языке'
          : 'Сначала введите слово на известном языке',
      )
      return
    }

    setTranslating(dir)
    try {
      const from = dir === 'to-known' ? sourceLang : targetLang
      const to = dir === 'to-known' ? targetLang : sourceLang
      const result = await translateText(text, from, to)
      if (dir === 'to-known') setBack(result)
      else setFront(result)
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Ошибка перевода')
    } finally {
      setTranslating(null)
    }
  }

  const messageFor = (result: AddCardResult): string | null => {
    if (result.status === 'linked') {
      return 'Слово уже было в библиотеке — добавлено в этот сет без дубликата'
    }
    if (result.status === 'exists') {
      return 'Это слово уже есть в этом сете'
    }
    return null
  }

  const submit = (e: FormEvent): boolean => {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return false
    const result = store.addCard(setId, front, back)
    setTranslateError(null)
    if (result.status === 'exists') {
      setStatusMessage(messageFor(result))
      return false
    }
    setFront('')
    setBack('')
    setStatusMessage(messageFor(result))
    return result.status === 'created' || result.status === 'linked'
  }

  return {
    setName: set?.name ?? 'Сет',
    sourceLang,
    targetLang,
    sourceName: langLabel(sourceLang),
    targetName: langLabel(targetLang),
    front,
    setFront,
    back,
    setBack,
    translating,
    translateError,
    statusMessage,
    clearTranslateError: () => setTranslateError(null),
    clearStatusMessage: () => setStatusMessage(null),
    runTranslate,
    submit,
  }
}
