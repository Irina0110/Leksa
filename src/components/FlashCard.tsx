import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import type { SwipeDirection } from '../hooks/useSwipe'
import { SpeakButton } from './SpeakButton'

type Props = {
  front: string
  back: string
  showFrontFirst: boolean
  flipped: boolean
  onFlip: () => void
  drag: { x: number; y: number }
  animating: SwipeDirection | null
  hint: SwipeDirection | null
  frontLabel?: string
  backLabel?: string
  sourceLang: string
  targetLang: string
}

const HINT_LABEL: Record<SwipeDirection, string> = {
  up: 'Проще · реже',
  down: 'Сложнее · чаще',
  left: 'Следующая',
  right: 'Предыдущая',
}

export function FlashCard({
  front,
  back,
  showFrontFirst,
  flipped,
  onFlip,
  drag,
  animating,
  hint,
  frontLabel = 'Изучаемый',
  backLabel = 'Известный',
  sourceLang,
  targetLang,
}: Props) {
  const faceA = showFrontFirst ? front : back
  const faceB = showFrontFirst ? back : front
  const labelA = showFrontFirst ? frontLabel : backLabel
  const labelB = showFrontFirst ? backLabel : frontLabel
  const langA = showFrontFirst ? sourceLang : targetLang
  const langB = showFrontFirst ? targetLang : sourceLang
  const showing = flipped ? faceB : faceA
  const label = flipped ? labelB : labelA
  const speakLang = flipped ? langB : langA

  const [pop, setPop] = useState(false)
  const prevFlip = useRef(flipped)

  useEffect(() => {
    if (prevFlip.current !== flipped) {
      setPop(true)
      const t = window.setTimeout(() => setPop(false), 280)
      prevFlip.current = flipped
      return () => window.clearTimeout(t)
    }
  }, [flipped])

  const distance = Math.hypot(drag.x, drag.y)
  const rotate = drag.x * 0.04
  const exit =
    animating === 'left'
      ? 'translateX(-120%) rotate(-12deg)'
      : animating === 'right'
        ? 'translateX(120%) rotate(12deg)'
        : animating === 'up'
          ? 'translateY(-120%) rotate(-4deg)'
          : animating === 'down'
            ? 'translateY(120%) rotate(4deg)'
            : null

  const style: CSSProperties = exit
    ? {
        transform: exit,
        opacity: 0,
        transition: 'transform 0.28s ease, opacity 0.28s ease',
      }
    : {
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg) scale(${pop ? 0.97 : 1})`,
        transition: distance > 0 ? 'none' : 'transform 0.25s ease',
      }

  const onCardClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.speak-btn')) return
    onFlip()
  }

  return (
    <div className="flash-stage">
      <div className={`swipe-hints ${hint ? `active-${hint}` : ''}`} aria-hidden>
        <span className="hint hint-up">{HINT_LABEL.up}</span>
        <span className="hint hint-down">{HINT_LABEL.down}</span>
        <span className="hint hint-left">{HINT_LABEL.left}</span>
        <span className="hint hint-right">{HINT_LABEL.right}</span>
      </div>

      <div
        role="button"
        tabIndex={0}
        className={`flash-card ${flipped ? 'is-flipped' : ''} ${pop ? 'is-pop' : ''}`}
        style={style}
        onClick={onCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onFlip()
          }
        }}
        aria-label="Перевернуть карточку"
      >
        <span className="flash-label">{label}</span>
        <span className="flash-word">{showing}</span>
        <span
          className="flash-actions"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <SpeakButton text={showing} lang={speakLang} className="speak-btn-lg" />
        </span>
        <span className="flash-tap">Нажмите, чтобы перевернуть</span>
      </div>
    </div>
  )
}
