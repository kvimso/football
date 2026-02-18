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
 * Return the CSS custom property name for a player position.
 */
export function getPositionColor(position: string): string {
  const map: Record<string, string> = {
    GK: 'var(--pos-gk)',
    DEF: 'var(--pos-def)',
    MID: 'var(--pos-mid)',
    ATT: 'var(--pos-att)',
    WNG: 'var(--pos-wng)',
    ST: 'var(--pos-st)',
  }
  return map[position] ?? 'var(--accent)'
}
