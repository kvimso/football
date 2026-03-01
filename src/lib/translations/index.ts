// Barrel file — merges domain-specific translation files into the original API.
// Import path '@/lib/translations' resolves here, keeping all existing imports working.

import * as core from './core'
import * as players from './players'
import * as chat from './chat'
import * as admin from './admin'
import * as landing from './landing'

export type Lang = 'en' | 'ka'

type NestedStrings = { [key: string]: string | NestedStrings }

export const translations: Record<Lang, NestedStrings> = {
  en: {
    ...core.en,
    ...players.en,
    ...chat.en,
    ...admin.en,
    ...landing.en,
  },
  ka: {
    ...core.ka,
    ...players.ka,
    ...chat.ka,
    ...admin.ka,
    ...landing.ka,
  },
}

export function getNestedValue(obj: NestedStrings, path: string): string {
  const keys = path.split('.')
  let current: string | NestedStrings = obj
  for (const key of keys) {
    if (typeof current === 'string') return path
    current = current[key]
    if (current === undefined) return path
  }
  return typeof current === 'string' ? current : path
}
