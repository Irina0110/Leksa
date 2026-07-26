import type { AppStore } from '../../hooks/useAppStore'
import { AddCardForm } from './AddCardForm'
import { SetTopBar } from './SetTopBar'
import { useAddCard } from './useAddCard'

type Props = {
  store: AppStore
  setId: string
  onBack: () => void
}

export function AddCardScreen({ store, setId, onBack }: Props) {
  const form = useAddCard({ store, setId })

  if (!store.getSet(setId)) {
    return (
      <div className="screen">
        <SetTopBar title="Карточка" onBack={onBack} />
        <div className="empty-state">
          <p className="empty-title">Сет не найден</p>
          <button type="button" className="primary-btn" onClick={onBack}>
            Назад
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <SetTopBar title="Новая карточка" onBack={onBack} />

      <div className="context-chip">
        <span className="context-chip-name">{form.setName}</span>
        <span className="lang-chip">
          {form.sourceName} → {form.targetName}
        </span>
      </div>

      <AddCardForm
        sourceName={form.sourceName}
        targetName={form.targetName}
        sourceLang={form.sourceLang}
        targetLang={form.targetLang}
        front={form.front}
        back={form.back}
        translating={form.translating}
        translateError={form.translateError}
        onFrontChange={(value) => {
          form.setFront(value)
          form.clearTranslateError()
        }}
        onBackChange={(value) => {
          form.setBack(value)
          form.clearTranslateError()
        }}
        onTranslate={form.runTranslate}
        onSubmit={(e) => {
          if (form.submit(e)) onBack()
        }}
        submitLabel="Сохранить карточку"
      />
    </div>
  )
}
