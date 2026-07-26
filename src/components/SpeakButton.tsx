import type { MouseEvent } from 'react'
import { canSpeak, speakText } from '../speech'

type Props = {
  text: string
  lang: string
  className?: string
  label?: string
}

export function SpeakButton({ text, lang, className = '', label = 'Произнести' }: Props) {
  if (!canSpeak()) return null

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    speakText(text, lang)
  }

  return (
    <button
      type="button"
      className={`speak-btn ${className}`.trim()}
      onClick={onClick}
      disabled={!text.trim()}
      aria-label={label}
      title={label}
    >
      <span className="speak-icon" aria-hidden>
        ♪
      </span>
    </button>
  )
}
