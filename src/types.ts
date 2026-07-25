export type LangCode = string

export type WordCard = {
  id: string
  /** Изучаемый язык */
  front: string
  /** Известный язык */
  back: string
  /** Чем выше — тем чаще карточка в очереди (1–6) */
  weight: number
}

export type WordSet = {
  id: string
  name: string
  /** Код изучаемого языка (ISO 639-1) */
  sourceLang: LangCode
  /** Код известного языка (ISO 639-1) */
  targetLang: LangCode
  cards: WordCard[]
  createdAt: number
  updatedAt: number
}

export type AppData = {
  sets: WordSet[]
}

export type View =
  | { name: 'home' }
  | { name: 'edit-set'; setId: string | null }
  | { name: 'add-card'; setId: string }
  | { name: 'study'; setIds: string[] }

export const DEFAULT_WEIGHT = 2
export const MIN_WEIGHT = 1
export const MAX_WEIGHT = 6
export const DEFAULT_SOURCE_LANG = 'en'
export const DEFAULT_TARGET_LANG = 'ru'
