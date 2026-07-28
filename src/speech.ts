import { toGoogleLang } from './translate'

let currentAudio: HTMLAudioElement | null = null

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined'
}

function stopCurrent(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

function playUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    currentAudio = audio
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null
      resolve()
    }
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null
      reject(new Error('playback failed'))
    }
    void audio.play().catch(reject)
  })
}

/** Озвучка через Google Translate TTS — корректнее для турецкого, чем системный Speech API */
async function speakWithGoogle(text: string, langCode: string): Promise<void> {
  const lang = toGoogleLang(langCode)
  // Лимит TTS ~200 символов на запрос
  const chunkSize = 180
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }

  for (const chunk of chunks) {
    const url = new URL('https://translate.google.com/translate_tts')
    url.searchParams.set('ie', 'UTF-8')
    url.searchParams.set('client', 'tw-ob')
    url.searchParams.set('tl', lang)
    url.searchParams.set('q', chunk)
    await playUrl(url.toString())
  }
}

function speakWithSystem(text: string, langCode: string): void {
  if (!('speechSynthesis' in window)) return

  const utter = new SpeechSynthesisUtterance(text)
  const map: Record<string, string> = {
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
  utter.lang = map[langCode] ?? langCode
  utter.rate = 0.92

  const voices = window.speechSynthesis.getVoices()
  const want = utter.lang.toLowerCase()
  const voice =
    voices.find((v) => v.lang.toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(want.slice(0, 2)))
  if (voice) utter.voice = voice

  window.speechSynthesis.speak(utter)
}

export async function speakText(text: string, langCode: string): Promise<void> {
  const value = text.trim()
  if (!value || !canSpeak()) return

  stopCurrent()

  try {
    await speakWithGoogle(value, langCode)
  } catch {
    // Если TTS недоступен (сеть / блокировка) — запасной вариант
    speakWithSystem(value, langCode)
  }
}
