import { useRef, useState, type PointerEvent, type MouseEvent } from 'react'
import { canSpeak, isIOSDevice, speakText, unlockSpeech } from '../speech'

type Props = {
  text: string
  lang: string
  className?: string
  label?: string
}

/**
 * iPhone PWA: unlock + старт в pointerdown, затем Google TTS через proxy→blob.
 * Десктоп: только click.
 */
export function SpeakButton({ text, lang, className = '', label = 'Произнести' }: Props) {
  const [busy, setBusy] = useState(false)
  const lastAt = useRef(0)

  if (!canSpeak()) return null

  const fire = () => {
    if (!text.trim() || busy) return
    const now = Date.now()
    if (now - lastAt.current < 450) return
    lastAt.current = now

    // Важно: unlock синхронно в жесте, до await внутри speakText
    unlockSpeech()
    setBusy(true)
    void speakText(text, lang).finally(() => setBusy(false))
  }

  const onPointerDown = (e: PointerEvent) => {
    e.stopPropagation()
    if (!isIOSDevice()) return
    e.preventDefault()
    fire()
  }

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isIOSDevice()) return
    fire()
  }

  return (
    <button
      type="button"
      className={`speak-btn ${className}`.trim()}
      onPointerDown={onPointerDown}
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
