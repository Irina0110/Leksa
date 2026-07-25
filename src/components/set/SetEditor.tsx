import type { AppStore } from '../../hooks/useAppStore'
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
        onEditFrontChange={editor.setEditFront}
        onEditBackChange={editor.setEditBack}
        onStartEdit={(card) => editor.startEditCard(card.id, card.front, card.back)}
        onCancelEdit={editor.cancelEditCard}
        onSaveEdit={editor.saveEditCard}
        onDelete={editor.deleteCard}
      />

      {editor.canDeleteSet && (
        <DeleteSetPanel
          onDelete={() => {
            if (editor.deleteSet()) onBack()
          }}
        />
      )}
    </div>
  )
}
