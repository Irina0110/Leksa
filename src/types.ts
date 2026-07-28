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

export type DayActivity = {
  /** YYYY-MM-DD */
  date: string
  reviews: number
  easy: number
  hard: number
}

export type StudyStats = {
  sessions: number
  reviews: number
  easyMarks: number
  hardMarks: number
  /** Суммарное время обучения в мс */
  totalMs: number
  /** Дни с активностью */
  days: DayActivity[]
}

export type AppData = {
  sets: WordSet[]
  stats: StudyStats
}

export type View =
  | { name: 'home' }
  | { name: 'edit-set'; setId: string | null }
  | { name: 'add-card'; setId: string }
  | { name: 'study'; setIds: string[] }
  | { name: 'stats' }

export const DEFAULT_WEIGHT = 2
export const MIN_WEIGHT = 1
export const MAX_WEIGHT = 6
export const DEFAULT_SOURCE_LANG = 'en'
export const DEFAULT_TARGET_LANG = 'ru'

export const EMPTY_STATS: StudyStats = {
  sessions: 0,
  reviews: 0,
  easyMarks: 0,
  hardMarks: 0,
  totalMs: 0,
  days: [],
}
