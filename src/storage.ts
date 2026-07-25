import type { AppData, WordSet } from './types'
import { DEFAULT_SOURCE_LANG, DEFAULT_TARGET_LANG } from './types'

const STORAGE_KEY = 'wordsapp-data-v1'

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

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { sets: [] }
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || !Array.isArray(parsed.sets)) return { sets: [] }
    return { sets: parsed.sets.map((s) => normalizeSet(s)) }
  } catch {
    return { sets: [] }
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
