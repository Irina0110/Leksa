import type { AppData, DayActivity, StudyStats, WordSet } from './types'
import { DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG, EMPTY_STATS } from './types'

const STORAGE_KEY = 'wordsapp-data-v1'
const MAX_DAY_HISTORY = 90

function normalizeSet(raw: Partial<WordSet> & { id: string; name: string }): WordSet {
  return {
    id: raw.id,
    name: raw.name,
    sourceLang: raw.sourceLang || DEFAULT_SOURCE_LANG,
    targetLang: raw.targetLang || DEFAULT_TARGET_LANG,
    cards: Array.isArray(raw.cards) ? raw.cards : [],
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
  }
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

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sets: [], stats: { ...EMPTY_STATS, days: [] } }
    const parsed = JSON.parse(raw) as Partial<AppData>
    if (!parsed || !Array.isArray(parsed.sets)) {
      return { sets: [], stats: { ...EMPTY_STATS, days: [] } }
    }
    return {
      sets: parsed.sets.map((s) => normalizeSet(s)),
      stats: normalizeStats(parsed.stats),
    }
  } catch {
    return { sets: [], stats: { ...EMPTY_STATS, days: [] } }
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
