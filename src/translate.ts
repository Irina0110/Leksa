export type Language = {
  code: string
  label: string
}

/** Популярные языки для селектора */
export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'pl', label: 'Polski' },
  { code: 'uk', label: 'Українська' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'ar', label: 'العربية' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'cs', label: 'Čeština' },
  { code: 'fi', label: 'Suomi' },
]

export function langLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase()
}

/** Коды для Google Translate / TTS */
export function toGoogleLang(code: string): string {
  if (code === 'zh-CN') return 'zh-CN'
  return code
}

export class TranslateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranslateError'
  }
}

type GoogleTranslatePayload = Array<Array<[string, ...unknown[]]> | unknown>

/**
 * Перевод через Google Translate (client=gtx).
 * Качество для турецкого и других языков заметно лучше MyMemory.
 */
export async function translateText(
  text: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) throw new TranslateError('Введите текст для перевода')
  if (from === to) throw new TranslateError('Выберите разные языки')

  const url = new URL('https://translate.googleapis.com/translate_a/single')
  url.searchParams.set('client', 'gtx')
  url.searchParams.set('sl', toGoogleLang(from))
  url.searchParams.set('tl', toGoogleLang(to))
  url.searchParams.set('dt', 't')
  url.searchParams.set('q', trimmed)

  let res: Response
  try {
    res = await fetch(url.toString(), { signal })
  } catch {
    throw new TranslateError('Нет сети. Проверьте подключение')
  }

  if (!res.ok) {
    throw new TranslateError('Сервис перевода недоступен')
  }

  let data: GoogleTranslatePayload
  try {
    data = (await res.json()) as GoogleTranslatePayload
  } catch {
    throw new TranslateError('Не удалось прочитать ответ переводчика')
  }

  const segments = data[0]
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new TranslateError('Не удалось перевести')
  }

  const translated = segments
    .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
    .join('')
    .trim()

  if (!translated) throw new TranslateError('Не удалось перевести')
  return translated
}
