import type { FormEvent } from 'react'
import { SpeakButton } from '../SpeakButton'
import type { TranslateDir } from './useAddCard'

type Props = {
  sourceName: string
  targetName: string
  sourceLang: string
  targetLang: string
  front: string
  back: string
  translating: TranslateDir | null
  translateError: string | null
  statusMessage?: string | null
  onFrontChange: (value: string) => void
  onBackChange: (value: string) => void
  onTranslate: (dir: TranslateDir) => void
  onSubmit: (e: FormEvent) => void
  submitLabel?: string
}

export function AddCardForm({
  sourceName,
  targetName,
  sourceLang,
  targetLang,
  front,
  back,
  translating,
  translateError,
  statusMessage,
  onFrontChange,
  onBackChange,
  onTranslate,
  onSubmit,
  submitLabel = 'Добавить',
}: Props) {
  return (
    <form className="panel add-card-form" onSubmit={onSubmit}>
      <label className="field">
        <span>{sourceName}</span>
        <div className="input-with-actions">
          <input
            value={front}
            onChange={(e) => onFrontChange(e.target.value)}
            placeholder="слово"
            enterKeyHint="next"
            autoFocus
          />
          <SpeakButton text={front} lang={sourceLang} />
          <button
            type="button"
            className="translate-btn"
            disabled={!!translating || !front.trim()}
            onClick={() => onTranslate('to-known')}
          >
            {translating === 'to-known' ? '…' : 'Перевести'}
          </button>
        </div>
      </label>

      <label className="field">
        <span>{targetName}</span>
        <div className="input-with-actions">
          <input
            value={back}
            onChange={(e) => onBackChange(e.target.value)}
            placeholder="перевод"
            enterKeyHint="done"
          />
          <SpeakButton text={back} lang={targetLang} />
          <button
            type="button"
            className="translate-btn"
            disabled={!!translating || !back.trim()}
            onClick={() => onTranslate('to-learning')}
          >
            {translating === 'to-learning' ? '…' : 'Перевести'}
          </button>
        </div>
      </label>

      {translateError && <p className="form-error">{translateError}</p>}
      {statusMessage && !translateError && <p className="form-hint">{statusMessage}</p>}

      <button type="submit" className="accent-btn" disabled={!front.trim() || !back.trim()}>
        {submitLabel}
      </button>
    </form>
  )
}
