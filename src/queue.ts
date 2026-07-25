import type { WordCard } from './types'
import { DEFAULT_WEIGHT, MAX_WEIGHT, MIN_WEIGHT } from './types'

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Собирает раунд: сложные слова появляются чаще */
export function buildRound(cards: WordCard[]): WordCard[] {
  const pool: WordCard[] = []
  for (const card of cards) {
    const times = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, Math.round(card.weight)))
    for (let i = 0; i < times; i += 1) {
      pool.push(card)
    }
  }
  return shuffle(pool)
}

export function easeWeight(weight: number): number {
  return Math.max(MIN_WEIGHT, (weight || DEFAULT_WEIGHT) - 1)
}

export function hardenWeight(weight: number): number {
  return Math.min(MAX_WEIGHT, (weight || DEFAULT_WEIGHT) + 1)
}

export function randomShowFront(): boolean {
  return Math.random() < 0.5
}
