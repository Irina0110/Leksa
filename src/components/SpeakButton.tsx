import { useState, type MouseEvent } from 'react'
import { canSpeak, speakText } from '../speech'

type Props = {
  text: string
  lang: string
  className?: string
  label?: string
}

export function SpeakButton({ text, lang, className = '', label = 'Произнести' }: Props) {
  const [busy, setBusy] = useState(false)

  if (!canSpeak()) return null

  const onClick = async (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      await speakText(text, lang)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={`speak-btn ${className}`.trim()}
      onClick={onClick}
      disabled={!text.trim() || busy}
      aria-label={label}
      title={label}
    >
      <span className="speak-icon" aria-hidden>
        {busy ? '…' : '♪'}
      </span>
    </button>
  )
}
