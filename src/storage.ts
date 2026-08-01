import type { AppData, DayActivity, StudyStats, WordCard, WordSet } from './types'
import { DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG, EMPTY_STATS, cardKey } from './types'

const STORAGE_KEY = 'wordsapp-data-v1'
const MAX_DAY_HISTORY = 90

type LegacySet = Partial<WordSet> & {
  id: string
  name: string
  cards?: WordCard[]
  cardIds?: string[]
}

function normalizeStats(raw: Partial<StudyStats> | undefined): StudyStats {
  if (!raw) return { ...EMPTY_STATS, days: [] }
  return {
    sessions: Number(raw.sessions) || 0,
    reviews: Number(raw.reviews) || 0,
    easyMarks: Number(raw.easyMarks) || 0,
    hardMarks: Number(raw.hardMarks) || 0,
    totalMs: Number(raw.totalMs) || 0,
    days: Array.isArray(raw.days)
      ? raw.days
          .filter((d): d is DayActivity => Boolean(d?.date))
          .map((d) => ({
            date: d.date,
            reviews: Number(d.reviews) || 0,
            easy: Number(d.easy) || 0,
            hard: Number(d.hard) || 0,
          }))
          .slice(-MAX_DAY_HISTORY)
      : [],
  }
}

/** Миграция: встроенные cards → общая библиотека + cardIds, дедуп по front/back */
function migrateToLibrary(parsed: {
  sets?: LegacySet[]
  cards?: WordCard[]
}): { sets: WordSet[]; cards: WordCard[] } {
  const library: WordCard[] = []
  const keyToId = new Map<string, string>()

  const upsert = (card: Partial<WordCard> & { front: string; back: string }): string => {
    const front = card.front.trim()
    const back = card.back.trim()
    const key = cardKey(front, back)
    const existingId = keyToId.get(key)
    if (existingId) {
      const existing = library.find((c) => c.id === existingId)
      if (existing && typeof card.weight === 'number') {
        existing.weight = Math.max(existing.weight, card.weight)
      }
      return existingId
    }
    const id = card.id || crypto.randomUUID()
    keyToId.set(key, id)
    library.push({
      id,
      front,
      back,
      weight: typeof card.weight === 'number' ? card.weight : 2,
    })
    return id
  }

  // Сначала существующая библиотека (новый формат)
  if (Array.isArray(parsed.cards)) {
    for (const c of parsed.cards) {
      if (c?.front && c?.back) upsert(c)
    }
  }

  const sets: WordSet[] = (parsed.sets ?? []).map((raw) => {
    const cardIds: string[] = []
    const pushId = (id: string) => {
      if (!cardIds.includes(id)) cardIds.push(id)
    }

    if (Array.isArray(raw.cards)) {
      for (const c of raw.cards) {
        if (c?.front && c?.back) pushId(upsert(c))
      }
    }
    if (Array.isArray(raw.cardIds)) {
      for (const id of raw.cardIds) {
        if (typeof id === 'string' && library.some((c) => c.id === id)) pushId(id)
      }
    }

    return {
      id: raw.id,
      name: raw.name,
      sourceLang: raw.sourceLang || DEFAULT_SOURCE_LANG,
      targetLang: raw.targetLang || DEFAULT_TARGET_LANG,
      cardIds,
      createdAt: raw.createdAt ?? Date.now(),
      updatedAt: raw.updatedAt ?? Date.now(),
    }
  })

  // Библиотека хранит все слова, в том числе без сетов
  return { sets, cards: library }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sets: [], cards: [], stats: { ...EMPTY_STATS, days: [] } }
    const parsed = JSON.parse(raw) as Partial<AppData> & { sets?: LegacySet[] }
    if (!parsed || !Array.isArray(parsed.sets)) {
      return { sets: [], cards: [], stats: { ...EMPTY_STATS, days: [] } }
    }
    const { sets, cards } = migrateToLibrary(parsed)
    return {
      sets,
      cards,
      stats: normalizeStats(parsed.stats),
    }
  } catch {
    return { sets: [], cards: [], stats: { ...EMPTY_STATS, days: [] } }
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function upsertDay(
  days: DayActivity[],
  patch: Partial<Pick<DayActivity, 'reviews' | 'easy' | 'hard'>>,
): DayActivity[] {
  const key = todayKey()
  const next = [...days]
  const idx = next.findIndex((d) => d.date === key)
  if (idx === -1) {
    next.push({
      date: key,
      reviews: patch.reviews ?? 0,
      easy: patch.easy ?? 0,
      hard: patch.hard ?? 0,
    })
  } else {
    const cur = next[idx]
    next[idx] = {
      ...cur,
      reviews: cur.reviews + (patch.reviews ?? 0),
      easy: cur.easy + (patch.easy ?? 0),
      hard: cur.hard + (patch.hard ?? 0),
    }
  }
  return next.slice(-MAX_DAY_HISTORY)
}
