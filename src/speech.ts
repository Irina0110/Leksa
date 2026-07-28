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
  return (
    typeof window !== 'undefined' &&
    (typeof Audio !== 'undefined' || 'speechSynthesis' in window)
  )
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
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

/** Разблокирует аудио/речь на iOS после первого жеста */
export function unlockSpeech(): void {
  if (unlocked || typeof window === 'undefined') return
  unlocked = true

  if ('speechSynthesis' in window) {
    const warm = new SpeechSynthesisUtterance('')
    warm.volume = 0
    window.speechSynthesis.speak(warm)
    window.speechSynthesis.cancel()
    window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      window.speechSynthesis.getVoices()
    })
  }

  try {
    const silent = new Audio(
      'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAA5TEFNRTMuMTAwAa8AAAAAAAAAABUgJAUHQQAB9gAAAYYzQctlAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    )
    silent.volume = 0.01
    void silent.play().then(() => {
      silent.pause()
    })
  } catch {
    // ignore
  }
}

function pickVoice(langTag: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const want = langTag.toLowerCase()
  const prefix = want.slice(0, 2)
  return (
    voices.find((v) => v.lang.toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix + '-')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  )
}

function speakWithSystem(text: string, langCode: string): void {
  if (!('speechSynthesis' in window)) return

  // iOS иногда «зависает» в paused
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

  // На iOS повторный speak после cancel надёжнее
  window.speechSynthesis.cancel()
  window.setTimeout(() => {
    window.speechSynthesis.speak(utter)
  }, isIOS() ? 40 : 0)
}

function buildGoogleTtsUrl(text: string, langCode: string): string {
  const lang = toGoogleLang(langCode)
  // client=gtx чаще проходит на мобильных
  const url = new URL('https://translate.googleapis.com/translate_tts')
  url.searchParams.set('ie', 'UTF-8')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('tl', lang)
  url.searchParams.set('q', text.slice(0, 180))
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
    document.body.appendChild(el)
  }
  return el
}

/**
 * Озвучка:
 * - сразу стартуем системный голос (обязательно синхронно для iPhone)
 * - параллельно пробуем Google TTS; если заиграл — глушим систему
 */
export function speakText(text: string, langCode: string): Promise<void> {
  const value = text.trim()
  if (!value || !canSpeak()) return Promise.resolve()

  unlockSpeech()
  stopCurrent()

  let googlePlaying = false

  // 1) Системная озвучка — сразу, в том же user gesture (критично для iOS)
  speakWithSystem(value, langCode)

  // 2) Google TTS поверх, если доступен
  const el = getSharedAudio()
  currentAudio = el
  el.src = buildGoogleTtsUrl(value, langCode)

  const onPlaying = () => {
    googlePlaying = true
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }
  el.addEventListener('playing', onPlaying, { once: true })

  const playPromise = el.play()

  return new Promise((resolve) => {
    const done = () => {
      el.removeEventListener('playing', onPlaying)
      if (currentAudio === el) currentAudio = null
      resolve()
    }

    el.onended = done
    el.onerror = () => {
      // Google недоступен — системный голос уже говорит
      done()
    }

    if (playPromise) {
      playPromise.catch(() => {
        // play() отклонён — оставляем speechSynthesis
        if (!googlePlaying) done()
      })
    }

    // Страховка: не держим Promise вечно
    window.setTimeout(done, 15000)
  })
}

/** Предзагрузка голосов (вызвать при старте приложения) */
export function initSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices()
  })
}
