import { useEffect, useState } from 'react'
import type { AppStore } from '../../hooks/useAppStore'
import { langLabel } from '../../translate'
import {
  DEFAULT_SOURCE_LANG,
  DEFAULT_TARGET_LANG,
} from '../../types'

type Options = {
  store: AppStore
  setId: string | null
  onCreated: (setId: string) => void
}

export function useSetEditor({ store, setId, onCreated }: Options) {
  const existing = setId ? store.getSet(setId) : undefined
  const [name, setName] = useState(existing?.name ?? '')
  const [sourceLang, setSourceLang] = useState(
    existing?.sourceLang ?? DEFAULT_SOURCE_LANG,
  )
  const [targetLang, setTargetLang] = useState(
    existing?.targetLang ?? DEFAULT_TARGET_LANG,
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')

  useEffect(() => {
    if (!existing) return
    setSourceLang(existing.sourceLang)
    setTargetLang(existing.targetLang)
  }, [existing?.id, existing?.sourceLang, existing?.targetLang])

  const ensureSet = (): string => {
    if (setId && existing) {
      if (name.trim() && name.trim() !== existing.name) {
        store.updateSet(setId, { name: name.trim() })
      }
      return setId
    }
    const created = store.createSet(name.trim() || 'Новый сет', sourceLang, targetLang)
    onCreated(created.id)
    return created.id
  }

  const persistLangs = (nextSource: string, nextTarget: string) => {
    setSourceLang(nextSource)
    setTargetLang(nextTarget)
    if (setId) {
      store.updateSet(setId, { sourceLang: nextSource, targetLang: nextTarget })
    }
  }

  const saveName = () => {
    const id = ensureSet()
    if (name.trim()) store.updateSet(id, { name: name.trim() })
    store.updateSet(id, { sourceLang, targetLang })
  }

  const swapLanguages = () => {
    persistLangs(targetLang, sourceLang)
  }

  const startEditCard = (cardId: string, cardFront: string, cardBack: string) => {
    setEditingId(cardId)
    setEditFront(cardFront)
    setEditBack(cardBack)
  }

  const cancelEditCard = () => setEditingId(null)

  const saveEditCard = (cardId: string) => {
    if (!setId || !editFront.trim() || !editBack.trim()) return
    store.updateCard(setId, cardId, {
      front: editFront.trim(),
      back: editBack.trim(),
    })
    setEditingId(null)
  }

  const deleteCard = (cardId: string) => {
    if (setId) store.deleteCard(setId, cardId)
  }

  const deleteSet = () => {
    if (!setId) return false
    if (!window.confirm('Удалить этот сет со всеми карточками?')) return false
    store.deleteSet(setId)
    return true
  }

  /** Гарантирует существование сета и возвращает его id — для перехода к добавлению карточки */
  const prepareForAddCard = (): string => {
    const id = ensureSet()
    store.updateSet(id, {
      name: name.trim() || 'Новый сет',
      sourceLang,
      targetLang,
    })
    return id
  }

  const cards = (setId ? store.getSet(setId)?.cards : existing?.cards) ?? []

  return {
    title: setId ? 'Сет' : 'Новый сет',
    canDeleteSet: Boolean(setId),
    name,
    setName,
    saveName,
    sourceLang,
    targetLang,
    sourceName: langLabel(sourceLang),
    targetName: langLabel(targetLang),
    persistLangs,
    swapLanguages,
    cards,
    editingId,
    editFront,
    setEditFront,
    editBack,
    setEditBack,
    startEditCard,
    cancelEditCard,
    saveEditCard,
    deleteCard,
    deleteSet,
    prepareForAddCard,
  }
}

export type SetEditorModel = ReturnType<typeof useSetEditor>
