import type { WordCard } from '../../types'
import { CardListItem } from './CardListItem'

type Props = {
  cards: WordCard[]
  sourceName: string
  targetName: string
  editingId: string | null
  editFront: string
  editBack: string
  canMove?: boolean
  canAssign?: boolean
  onEditFrontChange: (value: string) => void
  onEditBackChange: (value: string) => void
  onStartEdit: (card: WordCard) => void
  onCancelEdit: () => void
  onSaveEdit: (cardId: string) => void
  onMove?: (cardId: string) => void
  onAssign?: (cardId: string) => void
  onDelete: (cardId: string) => void
}

export function CardsList({
  cards,
  sourceName,
  targetName,
  editingId,
  editFront,
  editBack,
  canMove = false,
  canAssign = false,
  onEditFrontChange,
  onEditBackChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onMove,
  onAssign,
  onDelete,
}: Props) {
  return (
    <section className="cards-section">
      <div className="section-head">
        <h2>Карточки</h2>
        <span className="section-count">{cards.length}</span>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state compact-empty">
          <div className="empty-icon" aria-hidden>
            ▢
          </div>
          <p className="empty-title">Нет карточек</p>
          <p>Добавьте первую пару слов с переводом</p>
        </div>
      ) : (
        <ul className="cards-grid">
          {cards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              sourceName={sourceName}
              targetName={targetName}
              isEditing={editingId === card.id}
              editFront={editFront}
              editBack={editBack}
              canMove={canMove}
              canAssign={canAssign}
              onEditFrontChange={onEditFrontChange}
              onEditBackChange={onEditBackChange}
              onStartEdit={() => onStartEdit(card)}
              onCancelEdit={onCancelEdit}
              onSaveEdit={() => onSaveEdit(card.id)}
              onMove={onMove ? () => onMove(card.id) : undefined}
              onAssign={onAssign ? () => onAssign(card.id) : undefined}
              onDelete={() => onDelete(card.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
