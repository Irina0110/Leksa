import { useState } from 'react'
import type { WordSet } from '../types'

type Props = {
  title: string
  sets: WordSet[]
  /** Уже выбранные сеты */
  initialSelected: string[]
  /** Один выбор — для перемещения; несколько — для назначения */
  mode: 'single' | 'multi'
  /** Сет, который нельзя выбрать (например текущий при перемещении) */
  excludeSetId?: string
  confirmLabel?: string
  onConfirm: (setIds: string[]) => void
  onClose: () => void
}

export function SetPickerSheet({
  title,
  sets,
  initialSelected,
  mode,
  excludeSetId,
  confirmLabel = 'Готово',
  onConfirm,
  onClose,
}: Props) {
  const options = sets.filter((s) => s.id !== excludeSetId)
  const [selected, setSelected] = useState<string[]>(
    initialSelected.filter((id) => id !== excludeSetId),
  )

  const toggle = (id: string) => {
    if (mode === 'single') {
      setSelected([id])
      return
    }
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const canConfirm = mode === 'single' ? selected.length === 1 : true

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden />
        <h2 className="sheet-title">{title}</h2>

        {options.length === 0 ? (
          <p className="muted sheet-empty">Нет других сетов</p>
        ) : (
          <ul className="sheet-list">
            {options.map((set) => {
              const on = selected.includes(set.id)
              return (
                <li key={set.id}>
                  <button
                    type="button"
                    className={`sheet-option ${on ? 'is-on' : ''}`}
                    onClick={() => toggle(set.id)}
                  >
                    <span className="sheet-check" aria-hidden>
                      {on ? '✓' : ''}
                    </span>
                    <span className="sheet-option-body">
                      <strong>{set.name}</strong>
                      <span className="muted">
                        {set.sourceLang.toUpperCase()} → {set.targetLang.toUpperCase()}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="sheet-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="accent-btn compact"
            disabled={!canConfirm || options.length === 0}
            onClick={() => onConfirm(selected)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
