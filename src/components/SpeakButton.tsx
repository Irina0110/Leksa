import { useEffect, useState, type MouseEvent, type PointerEvent } from 'react'
import { canSpeak, speakText, unlockSpeech } from '../speech'

type Props = {
  text: string
  lang: string
  className?: string
  label?: string
}

export function SpeakButton({ text, lang, className = '', label = 'Произнести' }: Props) {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    unlockSpeech()
  }, [])

  if (!canSpeak()) return null

  const start = (e: MouseEvent | PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!text.trim() || busy) return

    unlockSpeech()
    setBusy(true)

    // speakText вызывает audio.play() синхронно — критично для iOS PWA
    void speakText(text, lang).finally(() => setBusy(false))
  }

  return (
    <button
      type="button"
      className={`speak-btn ${className}`.trim()}
      onPointerDown={(e) => {
        // Не даём свайпу обучения перехватить жест, но не стартуем звук здесь —
        // play() надёжнее на click (полный user gesture на iOS)
        e.stopPropagation()
      }}
      onClick={start}
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
