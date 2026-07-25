import { useMemo, useState } from 'react'
import type { AppStore } from '../hooks/useAppStore'

type Props = {
  store: AppStore
  onCreateSet: () => void
  onEditSet: (setId: string) => void
  onStartStudy: (setIds: string[]) => void
}

export function Home({ store, onCreateSet, onEditSet, onStartStudy }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  const totalSelectedCards = useMemo(() => {
    return store.sets
      .filter((s) => selected.includes(s.id))
      .reduce((sum, s) => sum + s.cards.length, 0)
  }, [store.sets, selected])

  const canStudy = selected.length > 0 && totalSelectedCards > 0

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="screen home-screen">
      <header className="hero">
        <p className="brand">Лекса</p>
        <h1>Ваши сеты</h1>
        <p className="hero-sub">Учите слова карточками — в своём темпе</p>
      </header>

      <div className="home-toolbar">
        <button type="button" className="primary-btn" onClick={onCreateSet}>
          <span className="btn-plus" aria-hidden>
            +
          </span>
          Новый сет
        </button>
      </div>

      {store.sets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden>
            +
          </div>
          <p className="empty-title">Пока пусто</p>
          <p>Создайте первый сет и добавьте пару слов с автопереводом.</p>
          <button type="button" className="accent-btn" onClick={onCreateSet}>
            Создать сет
          </button>
        </div>
      ) : (
        <>
          <div className="section-head">
            <h2>Сеты</h2>
            <span className="section-count">{store.sets.length}</span>
          </div>

          <ul className="set-list">
            {store.sets.map((set) => {
              const isOn = selected.includes(set.id)
              return (
                <li key={set.id} className={`set-item ${isOn ? 'is-selected' : ''}`}>
                  <label className="set-check">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggle(set.id)}
                      disabled={set.cards.length === 0}
                    />
                    <span className="checkmark" />
                  </label>
                  <button type="button" className="set-body" onClick={() => onEditSet(set.id)}>
                    <strong>{set.name}</strong>
                    <span className="set-meta">
                      <span className="lang-chip">
                        {set.sourceLang.toUpperCase()} → {set.targetLang.toUpperCase()}
                      </span>
                      <span className="dot" aria-hidden>
                        ·
                      </span>
                      <span>
                        {set.cards.length === 0
                          ? 'нет карточек'
                          : `${set.cards.length} ${pluralCards(set.cards.length)}`}
                      </span>
                    </span>
                  </button>
                  <span className="set-chevron" aria-hidden>
                    ›
                  </span>
                </li>
              )
            })}
          </ul>

          <p className="hint-text">Отметьте сеты слева, затем нажмите «Учить»</p>
        </>
      )}

      {store.sets.length > 0 && (
        <div className="home-dock">
          <button
            type="button"
            className="accent-btn study-dock-btn"
            disabled={!canStudy}
            onClick={() => onStartStudy(selected)}
          >
            {canStudy
              ? `Учить · ${totalSelectedCards} ${pluralCards(totalSelectedCards)}`
              : 'Выберите сет для обучения'}
          </button>
        </div>
      )}
    </div>
  )
}

function pluralCards(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'карточка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'карточки'
  return 'карточек'
}
