import { todayKey } from './storage'
import type { DayActivity, StudyStats, WordCard, WordSet } from './types'
import { DEFAULT_WEIGHT, MAX_WEIGHT, MIN_WEIGHT } from './types'

export type DerivedStats = {
  setCount: number
  cardCount: number
  easyCards: number
  mediumCards: number
  hardCards: number
  masteredPercent: number
  sessions: number
  reviews: number
  easyMarks: number
  hardMarks: number
  totalMinutes: number
  streak: number
  week: { label: string; reviews: number; max: number }[]
}

function dayOffset(daysAgo: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - daysAgo)
  return todayKey(d)
}

function weekdayShort(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][date.getDay()]
}

export function computeStreak(days: DayActivity[]): number {
  if (days.length === 0) return 0
  const active = new Set(days.filter((d) => d.reviews > 0).map((d) => d.date))
  let streak = 0
  let cursor = 0
  // Если сегодня ещё нет активности — начинаем со вчера
  if (!active.has(todayKey())) cursor = 1
  while (active.has(dayOffset(cursor))) {
    streak += 1
    cursor += 1
  }
  return streak
}

export function deriveStats(
  sets: WordSet[],
  cards: WordCard[],
  stats: StudyStats,
): DerivedStats {
  const easyCards = cards.filter((c) => (c.weight ?? DEFAULT_WEIGHT) <= MIN_WEIGHT).length
  const hardCards = cards.filter((c) => (c.weight ?? DEFAULT_WEIGHT) >= MAX_WEIGHT - 1).length
  const mediumCards = Math.max(0, cards.length - easyCards - hardCards)
  const masteredPercent =
    cards.length === 0 ? 0 : Math.round((easyCards / cards.length) * 100)

  const byDate = new Map<string, number>(stats.days.map((d) => [d.date, d.reviews]))
  const week = Array.from({ length: 7 }, (_, i) => {
    const ago = 6 - i
    const key = dayOffset(ago)
    return {
      label: weekdayShort(key),
      reviews: byDate.get(key) ?? 0,
      max: 0,
    }
  })
  const max = Math.max(1, ...week.map((d) => d.reviews))
  for (const d of week) {
    d.max = max
  }

  return {
    setCount: sets.length,
    cardCount: cards.length,
    easyCards,
    mediumCards,
    hardCards,
    masteredPercent,
    sessions: stats.sessions,
    reviews: stats.reviews,
    easyMarks: stats.easyMarks,
    hardMarks: stats.hardMarks,
    totalMinutes: Math.round(stats.totalMs / 60000),
    streak: computeStreak(stats.days),
    week,
  }
}
