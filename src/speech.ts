import { toGoogleLang } from './translate'

const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='

let sharedAudio: HTMLAudioElement | null = null
let currentAudio: HTMLAudioElement | null = null
let unlocked = false
let speakGeneration = 0

const SPEECH_LANG: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
  pl: 'pl-PL',
  uk: 'uk-UA',
  tr: 'tr-TR',
  'zh-CN': 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar-SA',
  nl: 'nl-NL',
  sv: 'sv-SE',
  cs: 'cs-CZ',
  fi: 'fi-FI',
}

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
  el.playsInline = true
  el.preload = 'auto'
  document.body.appendChild(el)
  sharedAudio = el
  return el
}

function stopSynthesis(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

function clearAudioHandlers(el: HTMLAudioElement): void {
  el.onplaying = null
  el.onended = null
  el.onerror = null
}

/** Разблокирует тот же <audio>, которым потом говорим (критично для iPhone PWA) */
export function unlockSpeech(): void {
  if (typeof window === 'undefined') return
  preferPlaybackSession()
  const el = getSharedAudio()
  if (unlocked) return
  unlocked = true

  try {
    el.src = SILENT_WAV
    el.volume = 1
    void el.play().then(() => {
      el.pause()
      el.removeAttribute('src')
      el.load()
    })
  } catch {
    // ignore
  }
}

function pickVoice(langTag: string): SpeechSynthesisVoice | undefined {
  if (!('speechSynthesis' in window)) return undefined
  const voices = window.speechSynthesis.getVoices()
  const want = langTag.toLowerCase()
  const prefix = want.slice(0, 2)
  return (
    voices.find((v) => v.lang.toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(`${prefix}-`)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  )
}

function speakWithSystem(text: string, langCode: string): void {
  if (!('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.resume()
  } catch {
    // ignore
  }

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = SPEECH_LANG[langCode] ?? langCode
  utter.rate = isIOSDevice() ? 0.95 : 0.92
  utter.pitch = 1
  utter.volume = 1
  const voice = pickVoice(utter.lang)
  if (voice) utter.voice = voice

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utter)
}

function buildGoogleTtsUrl(text: string, langCode: string): string {
  const url = new URL('https://translate.googleapis.com/translate_tts')
  url.searchParams.set('ie', 'UTF-8')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('tl', toGoogleLang(langCode))
  url.searchParams.set('q', text.slice(0, 180))
  return url.toString()
}

/**
 * Озвучка Google Translate TTS.
 * Вызывать синхронно из user gesture (pointerdown на iPhone).
 * Системный голос — только если Google не заиграл (без параллельного дубля).
 */
export function speakText(text: string, langCode: string): Promise<void> {
  const value = text.trim()
  if (!value || !canSpeak()) return Promise.resolve()

  preferPlaybackSession()
  unlockSpeech()
  stopSynthesis()

  const gen = ++speakGeneration
  const el = getSharedAudio()

  try {
    el.pause()
  } catch {
    // ignore
  }
  clearAudioHandlers(el)
  currentAudio = el

  el.volume = 1
  el.src = buildGoogleTtsUrl(value, langCode)

  let googlePlaying = false
  let settled = false
  let usedFallback = false

  const fallbackOnce = () => {
    if (usedFallback || googlePlaying || gen !== speakGeneration) return
    usedFallback = true
    speakWithSystem(value, langCode)
  }

  return new Promise((resolve) => {
    const done = () => {
      if (settled) return
      settled = true
      if (currentAudio === el) currentAudio = null
      resolve()
    }

    el.onplaying = () => {
      if (gen !== speakGeneration) return
      googlePlaying = true
      stopSynthesis()
    }

    el.onended = () => done()

    el.onerror = () => {
      if (gen !== speakGeneration) return
      fallbackOnce()
      done()
    }

    const playPromise = el.play()
    if (playPromise) {
      playPromise.catch(() => {
        if (gen !== speakGeneration) return
        fallbackOnce()
        done()
      })
    }

    window.setTimeout(done, 12000)
  })
}

export function initSpeech(): void {
  if (typeof window === 'undefined') return
  preferPlaybackSession()
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}
