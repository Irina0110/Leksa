import type { WordCard } from '../../types'
import { CardListItem } from './CardListItem'

type Props = {
  cards: WordCard[]
  sourceName: string
  targetName: string
  editingId: string | null
  editFront: string
  editBack: string
  onEditFrontChange: (value: string) => void
  onEditBackChange: (value: string) => void
  onStartEdit: (card: WordCard) => void
  onCancelEdit: () => void
  onSaveEdit: (cardId: string) => void
  onDelete: (cardId: string) => void
}

export function CardsList({
  cards,
  sourceName,
  targetName,
  editingId,
  editFront,
  editBack,
  onEditFrontChange,
  onEditBackChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
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
              onEditFrontChange={onEditFrontChange}
              onEditBackChange={onEditBackChange}
              onStartEdit={() => onStartEdit(card)}
              onCancelEdit={onCancelEdit}
              onSaveEdit={() => onSaveEdit(card.id)}
              onDelete={() => onDelete(card.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
