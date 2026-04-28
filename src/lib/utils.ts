/**
 * Generate a URL-friendly slug from a name.
 * e.g. "Vakhtang Salia" → "vakhtang-salia"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Unwrap a Supabase relation join that may be returned as T, T[], or null.
 * Supabase returns joined relations as arrays when the relationship is ambiguous.
 */
export function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

/**
 * Get today's date as an ISO date string (YYYY-MM-DD).
 */
export function todayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Split a full name into first and last name parts.
 */
export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return { first: parts[0] ?? '', last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

/**
 * Escape special PostgREST filter characters to prevent filter injection.
 */
export function escapePostgrestValue(value: string): string {
  return value.replace(/[,.()"\\%_]/g, '')
}

/**
 * Format a date string as relative time (e.g. "2m ago", "3h ago", "5d ago").
 */
export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const seconds = Math.floor((now - then) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

/**
 * Normalize a Supabase relation join result to an array.
 * Handles the common pattern where a join may return T, T[], null, or undefined.
 */
export function normalizeToArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Get rating color class and tier label. Returns 'poor' for NaN/negative.
 */
import { RATING_THRESHOLDS } from '@/lib/constants'

type RatingTier = (typeof RATING_THRESHOLDS)[number]

const FALLBACK_TIER = RATING_THRESHOLDS[3] // 'poor' tier

export function getRatingColor(rating: number): RatingTier {
  const tier = Number.isFinite(rating)
    ? RATING_THRESHOLDS.find((threshold) => rating >= threshold.min)
    : undefined
  return tier ?? FALLBACK_TIER
}

/**
 * Calculate age from a date of birth string.
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

/**
 * Roster age groups used by /clubs/[slug] filter UI.
 * Narrower than the full POSITIONS/AGE_GROUPS in constants.ts, which model
 * every player in the system. Roster filters expose only the three youth
 * tiers scouts care about.
 */
export const ROSTER_AGE_GROUPS = ['U15', 'U17', 'U19'] as const
export type RosterAgeGroup = (typeof ROSTER_AGE_GROUPS)[number]

/**
 * FIFA convention: a player's age group for season N/N+1 is calculated
 * against August 1 of year N. Returns null for missing or malformed DOB,
 * or for players outside the U15-U19 youth range.
 */
export function computeAgeGroup(dateOfBirth: string | null): RosterAgeGroup | null {
  if (!dateOfBirth) return null
  const birth = new Date(dateOfBirth)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  const seasonYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
  const cutoff = new Date(Date.UTC(seasonYear, 7, 1))
  let age = cutoff.getUTCFullYear() - birth.getUTCFullYear()
  const m = cutoff.getUTCMonth() - birth.getUTCMonth()
  if (m < 0 || (m === 0 && cutoff.getUTCDate() < birth.getUTCDate())) age--
  if (age <= 14) return 'U15'
  if (age <= 16) return 'U17'
  if (age <= 18) return 'U19'
  return null
}
