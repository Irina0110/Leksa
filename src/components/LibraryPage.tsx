import { useMemo, useState } from 'react'
import type { AppStore } from '../hooks/useAppStore'
import type { WordCard } from '../types'
import { SetPickerSheet } from './SetPickerSheet'
import { SetTopBar } from './set/SetTopBar'

type Props = {
  store: AppStore
  onBack: () => void
}

export function LibraryPage({ store, onBack }: Props) {
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [assignCardId, setAssignCardId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = [...store.cards].sort((a, b) =>
      a.front.localeCompare(b.front, undefined, { sensitivity: 'base' }),
    )
    if (!q) return list
    return list.filter(
      (c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q),
    )
  }, [store.cards, query])

  const assignCard = assignCardId ? store.getCard(assignCardId) : undefined
  const assignSets = assignCardId ? store.getSetsForCard(assignCardId).map((s) => s.id) : []

  const startEdit = (card: WordCard) => {
    setEditingId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
  }

  const saveEdit = (cardId: string) => {
    if (!editFront.trim() || !editBack.trim()) return
    store.updateCard(cardId, { front: editFront.trim(), back: editBack.trim() })
    setEditingId(null)
  }

  const removeForever = (card: WordCard) => {
    if (
      !window.confirm(
        `Удалить «${card.front}» полностью из библиотеки и всех сетов?`,
      )
    )
      return
    store.deleteCardForever(card.id)
  }

  return (
    <div className="screen library-screen">
      <SetTopBar title="Все слова" onBack={onBack} />

      <label className="field library-search">
        <span className="sr-only">Поиск</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по словам…"
          enterKeyHint="search"
        />
      </label>

      <div className="section-head">
        <h2>Библиотека</h2>
        <span className="section-count">{filtered.length}</span>
      </div>

      {store.cards.length === 0 ? (
        <div className="empty-state compact-empty">
          <p className="empty-title">Пока нет слов</p>
          <p>Добавьте карточки в любом сете — они появятся здесь.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state compact-empty">
          <p className="empty-title">Ничего не найдено</p>
          <p>Попробуйте другой запрос</p>
        </div>
      ) : (
        <ul className="library-list">
          {filtered.map((card) => {
            const sets = store.getSetsForCard(card.id)
            const isEditing = editingId === card.id

            if (isEditing) {
              return (
                <li key={card.id} className="library-item is-editing">
                  <label className="field">
                    <span>Слово</span>
                    <input
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Перевод</span>
                    <input
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                    />
                  </label>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="accent-btn compact"
                      onClick={() => saveEdit(card.id)}
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setEditingId(null)}
                    >
                      Отмена
                    </button>
                  </div>
                </li>
              )
            }

            return (
              <li key={card.id} className="library-item">
                <button
                  type="button"
                  className="library-main"
                  onClick={() => startEdit(card)}
                >
                  <strong>{card.front}</strong>
                  <span>{card.back}</span>
                </button>

                <div className="library-sets">
                  {sets.length === 0 ? (
                    <span className="muted library-no-set">Не в сетах</span>
                  ) : (
                    sets.map((s) => (
                      <span key={s.id} className="set-chip">
                        {s.name}
                      </span>
                    ))
                  )}
                </div>

                <div className="library-actions">
                  <button
                    type="button"
                    className="ghost-btn compact"
                    onClick={() => setAssignCardId(card.id)}
                    disabled={store.sets.length === 0}
                  >
                    Сеты
                  </button>
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label="Удалить слово"
                    onClick={() => removeForever(card)}
                  >
                    ×
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {assignCard && (
        <SetPickerSheet
          title={`Сеты для «${assignCard.front}»`}
          sets={store.sets}
          initialSelected={assignSets}
          mode="multi"
          confirmLabel="Сохранить"
          onClose={() => setAssignCardId(null)}
          onConfirm={(setIds) => {
            store.setCardMembership(assignCard.id, setIds)
            setAssignCardId(null)
          }}
        />
      )}
    </div>
  )
}
