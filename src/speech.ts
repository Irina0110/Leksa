import { toGoogleLang } from './translate'

/** Прод-прокси Google TTS (Cloudflare Worker). Не оставлять пустым в CI. */
const DEFAULT_TTS_PROXY = 'https://leksa-tts.octagonal-polish.workers.dev'

const SILENT_MP3 =
  'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwAa8AAAAAAAAAABUgJAUHQQAB9gAAAYYzQctlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

let sharedAudio: HTMLAudioElement | null = null
let unlocked = false
let speakGeneration = 0

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined'
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

function preferPlaybackSession(): void {
  try {
    const session = (
      navigator as Navigator & { audioSession?: { type: string } }
    ).audioSession
    if (session) session.type = 'playback'
  } catch {
    // ignore
  }
}

function getSharedAudio(): HTMLAudioElement {
  if (sharedAudio) return sharedAudio
  const el = document.createElement('audio')
  el.id = 'leksa-tts'
  el.setAttribute('playsinline', 'true')
  el.setAttribute('webkit-playsinline', 'true')
  el.preload = 'auto'
  document.body.appendChild(el)
  sharedAudio = el
  return el
}

function clearHandlers(el: HTMLAudioElement): void {
  el.onplaying = null
  el.onended = null
  el.onerror = null
}

/** Разблокировка аудио в том же user gesture (обязательно на iPhone). */
export function unlockSpeech(): void {
  if (typeof window === 'undefined') return
  preferPlaybackSession()
  const el = getSharedAudio()
  try {
    el.volume = 1
    // Не ставим src заново каждый раз — только если ещё не разблокировали
    if (!unlocked) {
      el.src = SILENT_MP3
      unlocked = true
    }
    void el.play().catch(() => {
      // ignore
    })
  } catch {
    // ignore
  }
}

export function getTtsProxyBase(): string {
  const fromEnv = (import.meta.env.VITE_TTS_PROXY_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  // В dev Vite проксирует /Leksa/api/tts; в prod — Cloudflare Worker
  if (import.meta.env.DEV) {
    const base = import.meta.env.BASE_URL || '/'
    const normalized = base.endsWith('/') ? base : `${base}/`
    return `${normalized}api/tts`
  }
  return DEFAULT_TTS_PROXY
}

function buildProxyUrl(text: string, langCode: string): string {
  const base = getTtsProxyBase()
  const url = new URL(base, window.location.origin)
  url.searchParams.set('q', text.slice(0, 180))
  url.searchParams.set('tl', toGoogleLang(langCode))
  // обход кэша Safari
  url.searchParams.set('_', String(Date.now()))
  return url.toString()
}

/**
 * Google Translate TTS через Cloudflare-прокси.
 * На iPhone play() вызывается синхронно в жесте с src=URL прокси (без await fetch),
 * иначе Safari теряет user gesture и молчит.
 */
export function speakText(text: string, langCode: string): Promise<void> {
  const value = text.trim()
  if (!value || !canSpeak()) return Promise.resolve()

  preferPlaybackSession()

  const gen = ++speakGeneration
  const el = getSharedAudio()
  clearHandlers(el)

  const src = buildProxyUrl(value, langCode)
  el.volume = 1
  el.src = src

  // КРИТИЧНО: play() сразу в том же синхронном стеке, что pointerdown/click
  const playPromise = el.play()
  unlocked = true

  return new Promise((resolve) => {
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      resolve()
    }

    el.onended = () => {
      if (gen !== speakGeneration) return
      done()
    }
    el.onerror = () => done()

    if (playPromise) {
      playPromise.catch(() => {
        // Иногда iOS отклоняет первый play до буфера — повторяем после canplay
        if (gen !== speakGeneration) {
          done()
          return
        }
        const retry = () => {
          void el.play().catch(() => done())
        }
        el.addEventListener('canplay', retry, { once: true })
        window.setTimeout(() => {
          el.removeEventListener('canplay', retry)
          done()
        }, 4000)
      })
    }

    window.setTimeout(done, 15000)
  })
}

export function initSpeech(): void {
  if (typeof window === 'undefined') return
  preferPlaybackSession()
}
