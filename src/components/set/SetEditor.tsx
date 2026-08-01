import { useState } from 'react'
import type { AppStore } from '../../hooks/useAppStore'
import { SetPickerSheet } from '../SetPickerSheet'
import { CardsList } from './CardsList'
import { DeleteSetPanel } from './DeleteSetPanel'
import { SetSettingsPanel } from './SetSettingsPanel'
import { SetTopBar } from './SetTopBar'
import { useSetEditor } from './useSetEditor'

type Props = {
  store: AppStore
  setId: string | null
  onBack: () => void
  onCreated: (setId: string) => void
  onAddCard: (setId: string) => void
}

export function SetEditor({ store, setId, onBack, onCreated, onAddCard }: Props) {
  const editor = useSetEditor({ store, setId, onCreated })
  const [moveCardId, setMoveCardId] = useState<string | null>(null)
  const [setsCardId, setSetsCardId] = useState<string | null>(null)

  const moveCard = moveCardId ? store.getCard(moveCardId) : undefined
  const setsCard = setsCardId ? store.getCard(setsCardId) : undefined
  const otherSetsCount = store.sets.filter((s) => s.id !== setId).length
  const canManageSets = Boolean(setId) && store.sets.length > 0

  return (
    <div className="screen set-screen">
      <SetTopBar title={editor.title} onBack={onBack} />

      <SetSettingsPanel
        name={editor.name}
        sourceLang={editor.sourceLang}
        targetLang={editor.targetLang}
        onNameChange={editor.setName}
        onNameBlur={editor.saveName}
        onLangsChange={editor.persistLangs}
        onSwapLanguages={editor.swapLanguages}
      />

      <button
        type="button"
        className="accent-btn add-card-cta"
        onClick={() => onAddCard(editor.prepareForAddCard())}
      >
        <span className="btn-plus" aria-hidden>
          +
        </span>
        Добавить карточку
      </button>

      <CardsList
        cards={editor.cards}
        sourceName={editor.sourceName}
        targetName={editor.targetName}
        editingId={editor.editingId}
        editFront={editor.editFront}
        editBack={editor.editBack}
        canMove={Boolean(setId) && otherSetsCount > 0}
        canAssign={canManageSets && store.sets.length > 1}
        onEditFrontChange={editor.setEditFront}
        onEditBackChange={editor.setEditBack}
        onStartEdit={(card) => editor.startEditCard(card.id, card.front, card.back)}
        onCancelEdit={editor.cancelEditCard}
        onSaveEdit={editor.saveEditCard}
        onMove={(cardId) => setMoveCardId(cardId)}
        onAssign={(cardId) => setSetsCardId(cardId)}
        onDelete={editor.deleteCard}
      />

      {editor.canDeleteSet && (
        <DeleteSetPanel
          onDelete={() => {
            if (editor.deleteSet()) onBack()
          }}
        />
      )}

      {moveCard && setId && (
        <SetPickerSheet
          title={`Куда переместить «${moveCard.front}»?`}
          sets={store.sets}
          initialSelected={[]}
          mode="single"
          excludeSetId={setId}
          confirmLabel="Переместить"
          onClose={() => setMoveCardId(null)}
          onConfirm={(ids) => {
            const toId = ids[0]
            if (toId) store.moveCard(moveCard.id, setId, toId)
            setMoveCardId(null)
          }}
        />
      )}

      {setsCard && (
        <SetPickerSheet
          title={`Сеты для «${setsCard.front}»`}
          sets={store.sets}
          initialSelected={store.getSetsForCard(setsCard.id).map((s) => s.id)}
          mode="multi"
          confirmLabel="Сохранить"
          onClose={() => setSetsCardId(null)}
          onConfirm={(ids) => {
            store.setCardMembership(setsCard.id, ids)
            setSetsCardId(null)
          }}
        />
      )}
    </div>
  )
}
