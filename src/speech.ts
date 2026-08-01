import { toGoogleLang } from './translate'

const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

let sharedAudio: HTMLAudioElement | null = null
let objectUrl: string | null = null
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

function revokeObjectUrl(): void {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
}

function clearHandlers(el: HTMLAudioElement): void {
  el.onplaying = null
  el.onended = null
  el.onerror = null
}

/**
 * Разблокирует аудио на iPhone: play() того же элемента, что потом озвучивает слова.
 * Вызывать в user gesture (pointerdown).
 */
export function unlockSpeech(): void {
  if (typeof window === 'undefined') return
  preferPlaybackSession()
  const el = getSharedAudio()
  if (unlocked) {
    // Повторный жест — «подогрев» play(), чтобы следующий async play не блокировался
    try {
      if (el.paused) {
        el.src = SILENT_WAV
        void el.play().then(() => {
          el.pause()
        })
      }
    } catch {
      // ignore
    }
    return
  }
  unlocked = true
  try {
    el.src = SILENT_WAV
    el.volume = 1
    void el.play().then(() => {
      el.pause()
    })
  } catch {
    // ignore
  }
}

/** База прокси Google TTS (same-origin в dev, Cloudflare Worker в prod). */
export function getTtsProxyBase(): string {
  const fromEnv = (import.meta.env.VITE_TTS_PROXY_URL as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return `${normalized}api/tts`
}

function buildProxyUrl(text: string, langCode: string): string {
  const base = getTtsProxyBase()
  const url = new URL(base, window.location.origin)
  url.searchParams.set('q', text.slice(0, 180))
  url.searchParams.set('tl', toGoogleLang(langCode))
  return url.toString()
}

function buildDirectGoogleUrl(text: string, langCode: string): string {
  const url = new URL('https://translate.googleapis.com/translate_tts')
  url.searchParams.set('ie', 'UTF-8')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('tl', toGoogleLang(langCode))
  url.searchParams.set('q', text.slice(0, 180))
  return url.toString()
}

async function fetchGoogleAudioBlob(text: string, langCode: string): Promise<Blob> {
  const proxyUrl = buildProxyUrl(text, langCode)
  const res = await fetch(proxyUrl, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'omit',
  })
  if (!res.ok) {
    throw new Error(`TTS proxy ${res.status}`)
  }
  const blob = await res.blob()
  if (!blob.size) throw new Error('Empty TTS')
  // Иногда proxy отдаёт JSON с ошибкой
  const type = blob.type || ''
  if (type.includes('json') || type.includes('text')) {
    throw new Error('TTS proxy returned non-audio')
  }
  return blob.type ? blob : new Blob([blob], { type: 'audio/mpeg' })
}

function playElement(el: HTMLAudioElement, gen: number): Promise<void> {
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

    const p = el.play()
    if (p) {
      p.catch(() => done())
    }
    window.setTimeout(done, 12000)
  })
}

/**
 * Google Translate TTS.
 * На iPhone: сначала unlock в жесте, затем fetch через proxy → blob URL (same-origin) → play.
 * Прямой URL Google в PWA не работает — ITP/Safari режет чужой audio.
 */
export function speakText(text: string, langCode: string): Promise<void> {
  const value = text.trim()
  if (!value || !canSpeak()) return Promise.resolve()

  preferPlaybackSession()
  unlockSpeech()

  const gen = ++speakGeneration
  const el = getSharedAudio()
  clearHandlers(el)
  revokeObjectUrl()

  try {
    el.pause()
  } catch {
    // ignore
  }

  el.volume = 1

  // Синхронно в жесте: держим элемент «живым»
  try {
    if (el.paused) {
      el.src = SILENT_WAV
      void el.play().then(() => {
        if (gen === speakGeneration) el.pause()
      })
    }
  } catch {
    // ignore
  }

  return (async () => {
    if (gen !== speakGeneration) return

    try {
      const blob = await fetchGoogleAudioBlob(value, langCode)
      if (gen !== speakGeneration) return

      revokeObjectUrl()
      objectUrl = URL.createObjectURL(blob)
      clearHandlers(el)
      el.src = objectUrl
      await playElement(el, gen)
      return
    } catch {
      // Proxy недоступен (часто на gh-pages без Worker) — пробуем прямой URL (desktop / Safari tab)
      if (gen !== speakGeneration) return
      try {
        clearHandlers(el)
        revokeObjectUrl()
        el.src = buildDirectGoogleUrl(value, langCode)
        await playElement(el, gen)
      } catch {
        // silence — без системного голоса, нужна именно Google-озвучка
      }
    }
  })()
}

export function initSpeech(): void {
  if (typeof window === 'undefined') return
  preferPlaybackSession()
}
