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
  return Array.isArray(value) ? value[0] ?? null : value
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