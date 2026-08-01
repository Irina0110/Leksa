import { useRef, useState, type PointerEvent, type MouseEvent } from 'react'
import { canSpeak, isIOSDevice, speakText, unlockSpeech } from '../speech'

type Props = {
  text: string
  lang: string
  className?: string
  label?: string
}

/**
 * iPhone PWA: play() только из pointerdown (иначе Safari блокирует звук).
 * Десктоп: только click — иначе pointerdown+click произносят дважды.
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

    unlockSpeech()
    setBusy(true)
    void speakText(text, lang).finally(() => setBusy(false))
  }

  const onPointerDown = (e: PointerEvent) => {
    // Блокируем свайп карточки
    e.stopPropagation()
    if (!isIOSDevice()) return
    // preventDefault сохраняет user gesture для audio.play()
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
