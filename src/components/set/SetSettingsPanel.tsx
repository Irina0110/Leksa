import { LANGUAGES } from '../../translate'

type Props = {
  name: string
  sourceLang: string
  targetLang: string
  onNameChange: (value: string) => void
  onNameBlur: () => void
  onLangsChange: (sourceLang: string, targetLang: string) => void
  onSwapLanguages: () => void
}

export function SetSettingsPanel({
  name,
  sourceLang,
  targetLang,
  onNameChange,
  onNameBlur,
  onLangsChange,
  onSwapLanguages,
}: Props) {
  return (
    <div className="panel">
      <label className="field">
        <span>Название</span>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={onNameBlur}
          placeholder="Например, Travel English"
          enterKeyHint="done"
        />
      </label>

      <div className="lang-row">
        <label className="field lang-field">
          <span>Изучаю</span>
          <select
            value={sourceLang}
            onChange={(e) => onLangsChange(e.target.value, targetLang)}
            aria-label="Изучаемый язык"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="swap-btn"
          onClick={onSwapLanguages}
          aria-label="Поменять языки местами"
          title="Поменять языки"
        >
          ⇄
        </button>

        <label className="field lang-field">
          <span>Знаю</span>
          <select
            value={targetLang}
            onChange={(e) => onLangsChange(sourceLang, e.target.value)}
            aria-label="Известный язык"
          >
            {LANGUAGES.map((l) => (
              <option key={`t-${l.code}`} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
