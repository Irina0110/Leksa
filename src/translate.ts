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

export class TranslateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranslateError'
  }
}

type MyMemoryResponse = {
  responseStatus: number
  responseData?: {
    translatedText?: string
  }
  responseDetails?: string
}

/**
 * Перевод через MyMemory (бесплатно, без ключа).
 * @see https://mymemory.translated.net/doc/spec.php
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

  const url = new URL('https://api.mymemory.translated.net/get')
  url.searchParams.set('q', trimmed)
  url.searchParams.set('langpair', `${from}|${to}`)

  let res: Response
  try {
    res = await fetch(url.toString(), { signal })
  } catch {
    throw new TranslateError('Нет сети. Проверьте подключение')
  }

  if (!res.ok) {
    throw new TranslateError('Сервис перевода недоступен')
  }

  const data = (await res.json()) as MyMemoryResponse

  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    const detail = data.responseDetails || 'Не удалось перевести'
    throw new TranslateError(detail)
  }

  const translated = data.responseData.translatedText.trim()

  // MyMemory иногда возвращает предупреждение вместо перевода при лимитах
  if (/^MYMEMORY WARNING/i.test(translated)) {
    throw new TranslateError('Лимит бесплатного перевода на сегодня исчерпан')
  }

  return translated
}
