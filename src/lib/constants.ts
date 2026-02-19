export const POSITIONS = ['GK', 'DEF', 'MID', 'ATT', 'WNG', 'ST'] as const

export const PREFERRED_FEET = ['Left', 'Right', 'Both'] as const

export const POSITION_COLOR_CLASSES: Record<string, string> = {
  GK: 'bg-pos-gk/20 text-pos-gk',
  DEF: 'bg-pos-def/20 text-pos-def',
  MID: 'bg-pos-mid/20 text-pos-mid',
  ATT: 'bg-pos-att/20 text-pos-att',
  WNG: 'bg-pos-wng/20 text-pos-wng',
  ST: 'bg-pos-st/20 text-pos-st',
}

export const AGE_RANGES = [
  { value: 'u16', label: 'U16', min: 0, max: 15 },
  { value: 'u17', label: 'U17', min: 16, max: 16 },
  { value: 'u18', label: 'U18', min: 17, max: 17 },
  { value: 'u19', label: 'U19', min: 18, max: 18 },
  { value: '19+', label: '19+', min: 19, max: 99 },
] as const

export const AGE_RANGE_MAP: Record<string, { min: number; max: number }> =
  Object.fromEntries(AGE_RANGES.map((r) => [r.value, { min: r.min, max: r.max }]))

// Tiny dark placeholder for next/image blur
export const BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
