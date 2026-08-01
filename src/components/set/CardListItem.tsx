import type { WordCard } from '../../types'

type Props = {
  card: WordCard
  sourceName: string
  targetName: string
  isEditing: boolean
  editFront: string
  editBack: string
  onEditFrontChange: (value: string) => void
  onEditBackChange: (value: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
}

export function CardListItem({
  card,
  sourceName,
  targetName,
  isEditing,
  editFront,
  editBack,
  onEditFrontChange,
  onEditBackChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: Props) {
  if (isEditing) {
    return (
      <li className="card-tile is-editing">
        <div className="card-edit">
          <label className="field">
            <span>{sourceName}</span>
            <input
              value={editFront}
              onChange={(e) => onEditFrontChange(e.target.value)}
              aria-label={sourceName}
            />
          </label>
          <label className="field">
            <span>{targetName}</span>
            <input
              value={editBack}
              onChange={(e) => onEditBackChange(e.target.value)}
              aria-label={targetName}
            />
          </label>
          <div className="row-actions">
            <button type="button" className="accent-btn compact" onClick={onSaveEdit}>
              Сохранить
            </button>
            <button type="button" className="ghost-btn" onClick={onCancelEdit}>
              Отмена
            </button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li className="card-tile">
      <button type="button" className="card-row-main" onClick={onStartEdit}>
        <strong>{card.front}</strong>
        <span>{card.back}</span>
      </button>
      <button
        type="button"
        className="icon-btn danger"
        aria-label="Убрать из сета"
        onClick={onDelete}
      >
        ×
      </button>
    </li>
  )
}
