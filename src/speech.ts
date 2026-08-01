import { toGoogleLang } from './translate'

let currentAudio: HTMLAudioElement | null = null
let unlocked = false

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

function isIOS(): boolean {
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

function stopCurrent(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.removeAttribute('src')
    currentAudio.load()
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/** Разблокирует аудио на iOS после первого жеста */
export function unlockSpeech(): void {
  if (unlocked || typeof window === 'undefined') return
  unlocked = true
  preferPlaybackSession()

  try {
    const silent = new Audio(
      'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwAa8AAAAAAAAAABUgJAUHQQAB9gAAAYYzQctlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    )
    silent.setAttribute('playsinline', 'true')
    silent.volume = 0.01
    void silent.play().then(() => {
      silent.pause()
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
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix + '-')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  )
}

/** Запасной вариант, если Google TTS недоступен */
function speakWithSystem(text: string, langCode: string): void {
  if (!('speechSynthesis' in window)) return

  try {
    window.speechSynthesis.resume()
  } catch {
    // ignore
  }

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = SPEECH_LANG[langCode] ?? langCode
  utter.rate = isIOS() ? 0.95 : 0.92
  utter.pitch = 1
  utter.volume = 1

  const voice = pickVoice(utter.lang)
  if (voice) utter.voice = voice

  window.speechSynthesis.cancel()
  window.setTimeout(() => {
    window.speechSynthesis.speak(utter)
  }, isIOS() ? 40 : 0)
}

/**
 * URL озвучки Google Translate.
 * client=tw-ob — самый совместимый вариант для <audio> на мобильных.
 */
function buildGoogleTtsUrl(text: string, langCode: string): string {
  const lang = toGoogleLang(langCode)
  const url = new URL('https://translate.google.com/translate_tts')
  url.searchParams.set('ie', 'UTF-8')
  url.searchParams.set('client', 'tw-ob')
  url.searchParams.set('tl', lang)
  url.searchParams.set('q', text.slice(0, 180))
  // обход кэша Safari, иначе повтор иногда молчит
  url.searchParams.set('_', String(Date.now()))
  return url.toString()
}

function getSharedAudio(): HTMLAudioElement {
  let el = document.getElementById('leksa-tts') as HTMLAudioElement | null
  if (!el) {
    el = document.createElement('audio')
    el.id = 'leksa-tts'
    el.setAttribute('playsinline', 'true')
    el.setAttribute('webkit-playsinline', 'true')
    el.preload = 'auto'
    // Не ставить crossOrigin — у Google TTS нет CORS, а для <audio> он не нужен
    document.body.appendChild(el)
  }
  return el
}

/**
 * Озвучка через Google Translate TTS (как в переводчике Google).
 * Вызывать синхронно из user gesture (click/touch), иначе iOS заблокирует play().
 * Если Google не ответил — fallback на системный голос.
 */
export function speakText(text: string, langCode: string): Promise<void> {
  const value = text.trim()
  if (!value || !canSpeak()) return Promise.resolve()

  unlockSpeech()
  preferPlaybackSession()
  stopCurrent()

  const el = getSharedAudio()
  currentAudio = el
  el.src = buildGoogleTtsUrl(value, langCode)

  // play() обязательно в том же жесте пользователя
  const playPromise = el.play()

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      if (currentAudio === el) currentAudio = null
      resolve()
    }

    el.onended = finish
    el.onerror = () => {
      speakWithSystem(value, langCode)
      finish()
    }

    if (playPromise) {
      playPromise.catch(() => {
        speakWithSystem(value, langCode)
        finish()
      })
    }

    window.setTimeout(finish, 15000)
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
