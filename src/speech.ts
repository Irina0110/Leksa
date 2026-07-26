/** Нормализация кода языка для Web Speech API */
export function toSpeechLang(code: string): string {
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
  return map[code] ?? code
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakText(text: string, langCode: string): void {
  const value = text.trim()
  if (!value || !canSpeak()) return

  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(value)
  utter.lang = toSpeechLang(langCode)
  utter.rate = 0.92

  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    const want = utter.lang.toLowerCase()
    return (
      voices.find((v) => v.lang.toLowerCase() === want) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(want.slice(0, 2)))
    )
  }

  const voice = pickVoice()
  if (voice) utter.voice = voice

  // На iOS голоса могут подгрузиться асинхронно
  if (!voice && window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        const late = pickVoice()
        if (late) utter.voice = late
        window.speechSynthesis.speak(utter)
      },
      { once: true },
    )
    return
  }

  window.speechSynthesis.speak(utter)
}
